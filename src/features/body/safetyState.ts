import { latestValue } from '@/body/measurements';
import { waistHeight } from '@/body/ratios';
import { weeklyRate } from '@/body/trend';
import { deletionsSince, listMeasurements, listWeights } from '@/db/bodyRepo';
import { entriesBetween, slotsBetween } from '@/db/mealsRepo';
import { doneWorkoutsSince } from '@/db/workoutsRepo';
import { profileTargets } from '@/features/nutrition/profileTargets';
import { addDays, appDayKey, DAY, localDateKey } from '@/lib/dates';
import { sumMacros } from '@/nutrition/macros';
import { kcalFloor, KCAL_FLOOR } from '@/nutrition/targets';
import type { Profile } from '@/profile/profile';
import { deficitBlocked, detectSignals, type WarningSignal } from '@/safety/warnings';
import { findFood, loadFoods } from '@/stores/foodsStore';

import { weightView } from './weightService';

/** Energia de cada dia completo (todas as refeições do cardápio marcadas) entre duas datas. */
export async function completeDayIntakes(from: string, to: string): Promise<{ date: string; kcal: number }[]> {
  await loadFoods();
  const [slots, entries] = await Promise.all([slotsBetween(from, to), entriesBetween(from, to)]);
  const dates = [...new Set(slots.map((s) => s.date))].sort();
  return dates
    .filter((date) => {
      const day = slots.filter((s) => s.date === date);
      return day.length > 0 && day.every((s) => s.eatenAt != null);
    })
    .map((date) => ({
      date,
      kcal: Math.round(entries.filter((e) => e.date === date).reduce((sum, e) => sum + sumMacros(e.items, findFood).kcal, 0)),
    }));
}

export type SafetyState = { signals: WarningSignal[]; blockDeficit: boolean; waistHeight: number | null };

/** Os sinais de alerta (16.4) calculados com os dados do aparelho. */
export async function loadSafetyState(profile: Profile, now = new Date()): Promise<SafetyState> {
  const today = appDayKey(now);
  const weekAgo = localDateKey(addDays(now, -6));
  const sinceIso = new Date(now.getTime() - 14 * DAY).toISOString();
  const [weights, measurements, intakes, workouts, deletions] = await Promise.all([
    listWeights(),
    listMeasurements(),
    completeDayIntakes(weekAgo, today),
    doneWorkoutsSince(sinceIso),
    deletionsSince(sinceIso),
  ]);
  const view = weightView(weights, now);
  const weekStartMs = now.getTime() - 7 * DAY;

  const minutesByDay = new Map<string, number>();
  for (const w of workouts) {
    if (!w.endedAt || Date.parse(w.startedAt) < weekStartMs) continue;
    const day = appDayKey(new Date(w.startedAt));
    minutesByDay.set(day, (minutesByDay.get(day) ?? 0) + (Date.parse(w.endedAt) - Date.parse(w.startedAt)) / 60000);
  }
  const weighIns = new Map<string, number>();
  for (const w of weights) {
    if (Date.parse(w.measuredAt) < weekStartMs) continue;
    const day = appDayKey(new Date(w.measuredAt));
    weighIns.set(day, (weighIns.get(day) ?? 0) + 1);
  }
  const targets = profileTargets(profile, now);
  const signals = detectSignals({
    weeklyRates: [0, 1, 2].map((w) => weeklyRate(view.points, today, w)),
    completeDayIntakes: intakes.map((i) => i.kcal),
    floor: targets ? kcalFloor(targets) : KCAL_FLOOR,
    trainingMinutesByDay: [...minutesByDay.values()],
    hurtWorkouts: workouts.filter((w) => w.pain === 'joint').length,
    weighInsByDay: [...weighIns.values()],
    deletions,
  });
  const waist = latestValue(measurements, 'waist');
  const ratio = waist != null && profile.heightCm ? waistHeight(waist, profile.heightCm) : null;
  return { signals, blockDeficit: deficitBlocked(signals, ratio), waistHeight: ratio };
}
