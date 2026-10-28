import { strings } from '@/i18n/strings';
import { addDays, localDateKey, parseTimeOfDay } from '@/lib/dates';
import { weekKey } from '@/training/schedule';

import { normalizedOrder, urlFor, type NotificationSettings, type NotificationType } from './types';

/**
 * O que agendar nos próximos 7 dias (seção 13). Função pura: recebe tudo pronto
 * (plano, cardápio, últimas medidas) e devolve a lista em ordem de horário.
 */

export type PlannedNotification = { type: NotificationType; at: Date; title: string; body: string; url: string };

export type PlanInput = {
  now: Date;
  settings: NotificationSettings;
  /** Horário preferido de treino (pergunta 10). Sem ele, não há lembrete de treino. */
  preferredTime: string | null;
  /** Dias da semana de treino (0 = domingo). */
  trainingWeekdays: readonly number[];
  /** O próximo dia do plano e os seguintes, em rodízio (nome, minutos, id). */
  planDays: readonly { id: string; name: string; minutes: number }[];
  nextPlanIndex: number;
  /** Já treinou hoje? (o lembrete de hoje some) */
  trainedToday: boolean;
  /** Refeições por dia ("AAAA-MM-DD"): horário e os nomes das 2 primeiras opções. */
  meals: Record<string, { slotName: string; time: string; options: string[]; eaten: boolean }[]>;
  /** Última medida (ISO), para "a cada N dias". */
  lastMeasurementAt: string | null;
  /** Números da semana para o texto do check-in. */
  week: { workouts: number; record: string | null };
};

export const HORIZON_DAYS = 7;
const MIN_LEAD_MS = 60_000;

const atTime = (day: Date, hhmm: string) => {
  const m = parseTimeOfDay(hhmm);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60);
};

/** O horário cai no silêncio? (a janela pode atravessar a meia-noite, ex.: 22:00–07:00) */
export function isInQuietHours(at: Date, quiet: NotificationSettings['quiet']): boolean {
  if (!quiet.enabled) return false;
  const m = at.getHours() * 60 + at.getMinutes();
  const start = parseTimeOfDay(quiet.start);
  const end = parseTimeOfDay(quiet.end);
  if (start === end) return false;
  return start < end ? m >= start && m < end : m >= start || m < end;
}

const c = strings.notifications.content;

type Candidate = { type: NotificationType; at: Date; title: string; body: string; url: string };

export function planNotifications(input: PlanInput): PlannedNotification[] {
  const { now, settings: s } = input;
  if (!s.enabled || s.pausedForever) return [];
  const pausedUntil = s.pausedUntil ? new Date(s.pausedUntil) : null;
  const priority = normalizedOrder(s.order);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: PlannedNotification[] = [];
  let planCursor = input.nextPlanIndex;

  // Medidas: o próximo dia devido (última + N dias; sem nenhuma, amanhã).
  const lastMeasure = input.lastMeasurementAt ? new Date(input.lastMeasurementAt) : null;
  const measureDue = lastMeasure ? addDays(new Date(lastMeasure.getFullYear(), lastMeasure.getMonth(), lastMeasure.getDate()), s.measurements.everyDays) : addDays(today, 1);

  for (let i = 0; i < HORIZON_DAYS; i++) {
    const day = addDays(today, i);
    const key = localDateKey(day);
    const weekday = day.getDay();
    const candidates: Candidate[] = [];

    if (input.trainingWeekdays.includes(weekday) && input.planDays.length) {
      const planDay = input.planDays[planCursor % input.planDays.length];
      planCursor += 1;
      const skip = i === 0 && input.trainedToday;
      if (s.training.enabled && input.preferredTime && !skip) {
        const at = new Date(atTime(day, input.preferredTime).getTime() - s.training.leadMinutes * 60_000);
        candidates.push({ type: 'training', at, ...c.training(planDay.name, planDay.minutes), url: urlFor('training', planDay.id) });
      }
    }

    if (s.meals.enabled) {
      for (const meal of input.meals[key] ?? []) {
        if (meal.eaten) continue;
        const text = meal.options.length ? c.meals(meal.slotName, meal.options[0], meal.options[1] ?? null) : c.mealsGeneric(meal.slotName);
        candidates.push({ type: 'meals', at: atTime(day, meal.time), ...text, url: urlFor('meals') });
      }
    }

    if (s.weighIn.enabled && (s.weighIn.frequency === 'daily' || s.weighIn.weekday === weekday)) {
      candidates.push({ type: 'weighIn', at: atTime(day, s.weighIn.time), ...c.weighIn, url: urlFor('weighIn') });
    }

    if (s.measurements.enabled && (localDateKey(measureDue) === key || (i === 0 && measureDue < today))) {
      candidates.push({ type: 'measurements', at: atTime(day, s.measurements.time), ...c.measurements, url: urlFor('measurements') });
    }

    if (s.checkin.enabled && s.checkin.weekday === weekday) {
      // Os números só valem se o check-in é desta semana e está perto (o texto é montado agora).
      const fresh = i <= 1 && weekKey(day) === weekKey(today);
      const text = fresh ? c.checkin(input.week.workouts, input.week.record) : c.checkinGeneric;
      candidates.push({ type: 'checkin', at: atTime(day, s.checkin.time), ...text, url: urlFor('checkin') });
    }

    const allowed = candidates
      .filter((x) => x.at.getTime() > now.getTime() + MIN_LEAD_MS)
      .filter((x) => !pausedUntil || x.at.getTime() >= pausedUntil.getTime())
      .filter((x) => !isInQuietHours(x.at, s.quiet))
      .sort((a, b) => priority.indexOf(a.type) - priority.indexOf(b.type) || a.at.getTime() - b.at.getTime())
      .slice(0, s.maxPerDay)
      .sort((a, b) => a.at.getTime() - b.at.getTime());

    for (const x of allowed) out.push(s.discreet ? { ...x, ...c.discreet } : x);
  }
  return out;
}
