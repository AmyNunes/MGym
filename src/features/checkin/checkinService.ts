import { weekFacts, weeklySummary } from '@/ai/functions/weeklySummary';
import { profileContext } from '@/ai/prompts/common';
import { trendOn } from '@/body/trend';
import { listWeights } from '@/db/bodyRepo';
import { cardioSince } from '@/db/cardioRepo';
import { checkinForWeek, insertCheckin } from '@/db/checkinsRepo';
import { slotsBetween } from '@/db/mealsRepo';
import { getActivePlan, setDeloadWeek } from '@/db/plansRepo';
import { recentRecords } from '@/db/recordsRepo';
import { doneWorkoutDaysSince } from '@/db/workoutsRepo';
import { completeDayIntakes, loadSafetyState, type SafetyState } from '@/features/body/safetyState';
import { weightView } from '@/features/body/weightService';
import { createPlanFromProfile } from '@/features/plan/fromProfile';
import { loadWeekVolume } from '@/features/plan/useTrainingOverview';
import { profileTargets } from '@/features/nutrition/profileTargets';
import { addDays, appDayKey, daysBetweenKeys, localDateKey, startOfWeek } from '@/lib/dates';
import { adaptTargets, ADJUST_EVERY_DAYS } from '@/nutrition/adaptation';
import { kcalFloor } from '@/nutrition/targets';
import { trainingWeekdays, type Profile } from '@/profile/profile';
import { patchProfile, useProfile } from '@/stores/profileStore';
import { useSettings } from '@/stores/settingsStore';
import { gluteAim } from '@/training/plan';
import { deloadDue, isDeloadWeek, weekKey } from '@/training/schedule';

import { suggestDecisions } from './decisions';
import type { CheckinAnswers, CheckinStats, Decision, DecisionKind } from './model';

/** Check-in semanal (seção 11.5). */

/** Janela da adaptação das metas (10.1: a cada 2–3 semanas). */
const ADAPT_WINDOW_DAYS = 21;

/** O check-in desta semana está pendente? (Hoje mostra o cartão no dia do check-in.) */
export async function checkinPending(now = new Date()): Promise<boolean> {
  // O dia do check-in é o do lembrete (Central de Notificações; padrão: domingo).
  const day = new Date(`${appDayKey(now)}T12:00:00`).getDay();
  if (day !== useSettings.getState().notifications.checkin.weekday) return false;
  return (await checkinForWeek(weekKey(now))) == null;
}

/** O ajuste de metas sugerido agora (kcal), ou null. */
export async function suggestedAdjustment(profile: Profile, blockDeficit: boolean, now = new Date()): Promise<number | null> {
  if (profile.nutritionistMode) return null;
  const today = appDayKey(now);
  if (profile.kcalAdjustedOn && daysBetweenKeys(profile.kcalAdjustedOn, today) < ADJUST_EVERY_DAYS) return null;
  const targets = profileTargets(profile, now, blockDeficit);
  if (!targets) return null;
  const start = localDateKey(addDays(now, -ADAPT_WINDOW_DAYS));
  const points = weightView(await listWeights(), now).points;
  const from = trendOn(points, start);
  const to = trendOn(points, today);
  if (from == null || to == null) return null;
  const intakes = await completeDayIntakes(localDateKey(addDays(now, -ADAPT_WINDOW_DAYS + 1)), today);
  const result = adaptTargets({
    goal: targets.goal,
    currentKcal: targets.kcal,
    floor: kcalFloor(targets),
    intakeDays: intakes.map((i) => i.kcal),
    trendDeltaKg: to - from,
    windowDays: ADAPT_WINDOW_DAYS,
    blockDeficit,
  });
  return result?.delta ?? null;
}

export type CheckinDraft = {
  weekStart: string;
  stats: CheckinStats;
  safety: SafetyState;
  adjustment: number | null;
  deloadDue: boolean;
  deloadActive: boolean;
  hasPlan: boolean;
  done: boolean;
};

export async function loadCheckinDraft(profile: Profile, now = new Date()): Promise<CheckinDraft> {
  const weekStart = weekKey(now);
  const weekIso = startOfWeek(now).toISOString();
  const today = appDayKey(now);
  const [plan, trainedDays, volume, records, cardio, slots, weights, safety, existing] = await Promise.all([
    getActivePlan(),
    doneWorkoutDaysSince(weekIso),
    loadWeekVolume(now),
    recentRecords(100),
    cardioSince(weekIso),
    slotsBetween(weekStart, today),
    listWeights(),
    loadSafetyState(profile, now),
    checkinForWeek(weekStart),
  ]);
  const view = weightView(weights, now);
  const stats: CheckinStats = {
    workouts: trainedDays.length,
    planned: profile.daysPerWeek ?? trainingWeekdays(profile).length,
    glutes: volume.glutes,
    glutesGoal: gluteAim({ experience: profile.experience ?? 'beginner', goal: profile.goal, priorities: profile.priorities }),
    records: records.filter((r) => r.achievedAt >= weekIso).length,
    cardioMinutes: cardio.reduce((sum, c) => sum + c.minutes, 0),
    mealsMarkedPct: slots.length ? Math.round((slots.filter((s) => s.eatenAt).length / slots.length) * 100) : null,
    weightRate: profile.weightVisibility === 'show' ? view.rate : null,
    signals: safety.signals,
  };
  return {
    weekStart,
    stats,
    safety,
    adjustment: await suggestedAdjustment(profile, safety.blockDeficit, now),
    deloadDue: plan ? deloadDue(plan.createdAt, plan.deloadWeek, now) : false,
    deloadActive: plan ? isDeloadWeek(plan.deloadWeek, now) || isDeloadWeek(plan.deloadWeek, addDays(now, 7)) : false,
    hasPlan: plan != null,
    done: existing != null,
  };
}

export function decisionsFor(draft: CheckinDraft, answers: CheckinAnswers, profile: Profile): DecisionKind[] {
  return suggestDecisions({
    stats: draft.stats,
    ratings: answers.ratings,
    adjustment: draft.adjustment,
    deloadDue: draft.deloadDue,
    deloadActive: draft.deloadActive,
    hasPlan: draft.hasPlan,
    daysPerWeek: profile.daysPerWeek ?? 3,
  });
}

/** Aplica o que confirmei e guarda o check-in (com o resumo da IA, se pedi). */
export async function saveCheckin(
  draft: CheckinDraft,
  answers: CheckinAnswers,
  offered: DecisionKind[],
  accepted: DecisionKind[],
  now = new Date(),
  summaryPt: string | null = null,
) {
  const profile = useProfile.getState().profile;
  const decisions: Decision[] = offered.map((kind) => ({
    kind,
    accepted: accepted.includes(kind),
    ...(kind === 'adjustFood' && draft.adjustment != null ? { delta: draft.adjustment } : {}),
  }));

  if (accepted.includes('adjustFood') && draft.adjustment != null) {
    const total = Math.max(-1000, Math.min(1000, profile.kcalAdjustment + draft.adjustment));
    await patchProfile({ kcalAdjustment: total, kcalAdjustedOn: appDayKey(now) });
  }
  if (accepted.includes('dropDay') && (profile.daysPerWeek ?? 3) > 2) {
    const daysPerWeek = (profile.daysPerWeek ?? 3) - 1;
    await patchProfile({ daysPerWeek, weekdays: profile.weekdays.length ? profile.weekdays.slice(0, daysPerWeek) : [] });
    await createPlanFromProfile(useProfile.getState().profile, now);
  }
  // Depois de refazer o plano (reduzir um dia), para a semana leve ficar no plano novo.
  if (accepted.includes('deload')) {
    const plan = await getActivePlan();
    if (plan) await setDeloadWeek(plan.id, weekKey(addDays(now, 7)));
  }
  await insertCheckin({ weekStart: draft.weekStart, stats: draft.stats, answers, decisions, summaryPt });
}

/** Resumo da IA (11.5, item 5): só os números calculados aqui; peso só com permissão e visível. */
export async function aiWeekSummary({ draft, answers }: { draft: CheckinDraft; answers: CheckinAnswers }) {
  const profile = useProfile.getState().profile;
  const facts = weekFacts(draft.stats, answers, profile.includeContextInAi && profile.weightVisibility === 'show');
  return weeklySummary(facts, profileContext(profile));
}
