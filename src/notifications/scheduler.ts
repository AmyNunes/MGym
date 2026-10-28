import * as Notifications from 'expo-notifications';

import { listMeasurements } from '@/db/bodyRepo';
import { slotsBetween } from '@/db/mealsRepo';
import { deleteFutureNotificationLogs, insertNotificationLog } from '@/db/notificationLogRepo';
import { getActivePlan } from '@/db/plansRepo';
import { recentRecords } from '@/db/recordsRepo';
import { doneWorkoutDaysSince, lastDonePlanDayId } from '@/db/workoutsRepo';
import { mealSlots } from '@/features/nutrition/profileTargets';
import { strings } from '@/i18n/strings';
import { addDays, appDayKey, localDateKey, startOfWeek } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { trainingWeekdays } from '@/profile/profile';
import { useProfile } from '@/stores/profileStore';
import { useSettings } from '@/stores/settingsStore';
import { findExercise } from '@/training/catalog';
import { estimateMinutes } from '@/training/duration';
import { nextPlanDayIndex } from '@/training/schedule';

import { categoryId, CHANNELS, ensureChannels } from './channels';
import { HORIZON_DAYS, planNotifications, type PlanInput, type PlannedNotification } from './plan';
import type { NotificationType } from './types';

/** Junta o que o planejador precisa (plano, cardápio, medidas, semana). */
async function gatherInput(now: Date): Promise<PlanInput> {
  const profile = useProfile.getState().profile;
  const settings = useSettings.getState().notifications;
  const weekIso = startOfWeek(now).toISOString();
  const [plan, trainedDays, measurements, slots, records] = await Promise.all([
    getActivePlan(),
    doneWorkoutDaysSince(weekIso),
    listMeasurements(),
    settings.meals.enabled ? slotsBetween(localDateKey(now), localDateKey(addDays(now, HORIZON_DAYS))) : Promise.resolve([]),
    recentRecords(20),
  ]);
  const dayIds = plan?.days.map((d) => d.id) ?? [];
  const meals: PlanInput['meals'] = {};
  const times = new Map(mealSlots(profile).map((m) => [m.slot, m.time]));
  for (const s of slots) {
    (meals[s.date] ??= []).push({
      slotName: strings.meals.slots[s.slot],
      time: times.get(s.slot) ?? s.time,
      options: s.options.slice(0, 2).map((o) => o.name),
      eaten: s.eatenAt != null,
    });
  }
  const weekRecord = records.find((r) => r.achievedAt >= weekIso);
  return {
    now,
    settings,
    preferredTime: profile.preferredTime,
    trainingWeekdays: trainingWeekdays(profile),
    planDays: (plan?.days ?? []).map((d) => ({ id: d.id, name: d.name, minutes: estimateMinutes(d.exercises, findExercise) })),
    nextPlanIndex: nextPlanDayIndex(dayIds, await lastDonePlanDayId(dayIds)),
    trainedToday: trainedDays.includes(appDayKey(now)),
    meals,
    lastMeasurementAt: measurements.at(-1)?.measuredAt ?? null,
    week: { workouts: trainedDays.length, record: weekRecord ? (findExercise(weekRecord.exerciseId)?.name ?? null) : null },
  };
}

async function schedule(p: PlannedNotification): Promise<void> {
  const logId = newId();
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: { title: p.title, body: p.body, data: { url: p.url, type: p.type, logId }, categoryIdentifier: categoryId(p.type) },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.at, channelId: CHANNELS[p.type] },
  });
  await insertNotificationLog({ id: logId, type: p.type, scheduledFor: p.at.toISOString(), notificationId, openedAt: null });
}

/** Cancela os lembretes (nunca o fim do descanso em andamento). */
async function cancelReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type !== 'rest') await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}

/** Cancela e reagenda os próximos 7 dias (seção 13). Devolve quantos agendou. */
export async function rescheduleAll(): Promise<number> {
  const now = new Date();
  const permission = await Notifications.getPermissionsAsync();
  await cancelReminders();
  await deleteFutureNotificationLogs(now.toISOString());
  if (!permission.granted || !useSettings.getState().notifications.enabled) return 0;
  await ensureChannels();
  const plan = planNotifications(await gatherInput(now));
  for (const p of plan) await schedule(p);
  return plan.length;
}

let timer: ReturnType<typeof setTimeout> | null = null;
let running: Promise<unknown> = Promise.resolve();
const DEBOUNCE_MS = 800;

/** Pede um reagendamento (agrupa vários pedidos seguidos num só). */
export function requestReschedule(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    running = running.then(() => rescheduleAll()).catch(() => 0);
  }, DEBOUNCE_MS);
}

/** "Enviar um teste agora": aparece em 2 segundos (sem entrar no histórico). */
export async function sendTestNotification(type: NotificationType, title: string, body: string, url: string): Promise<void> {
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { url, type }, categoryIdentifier: categoryId(type) },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, channelId: CHANNELS[type] },
  });
}

/** "Mais tarde": agenda de novo o mesmo aviso daqui a 1 h. Funciona também em segundo plano. */
export async function snooze(content: { title?: string | null; body?: string | null; data?: Record<string, unknown> }, minutes = 60): Promise<void> {
  const type = (content.data?.type as NotificationType | undefined) ?? 'training';
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    content: { title: content.title ?? '', body: content.body ?? '', data: { ...content.data, logId: undefined }, categoryIdentifier: categoryId(type) },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: Date.now() + minutes * 60_000, channelId: CHANNELS[type] },
  });
}
