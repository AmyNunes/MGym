import { DAY, localDateKey, startOfWeek } from '@/lib/dates';

import type { Exercise, ExerciseGroup } from './exerciseModel';
import type { PlannedExercise, Workout } from './workoutModel';

/**
 * Rodízio do plano e as semanas especiais (seções 9.2, 9.3 e 9.4).
 * O próximo dia do plano é o seguinte ao último feito; os dias da semana dizem
 * quando é dia de treino e quando é descanso.
 */

export function nextPlanDayIndex(dayIds: readonly string[], lastDoneDayId: string | null): number {
  if (!dayIds.length) return 0;
  const last = lastDoneDayId ? dayIds.indexOf(lastDoneDayId) : -1;
  return last < 0 ? 0 : (last + 1) % dayIds.length;
}

export const isTrainingWeekday = (weekdays: readonly number[], date: Date) => weekdays.includes(date.getDay());

/** Iniciante (e triagem com algum "sim"): semanas 1–2 com 2 séries, sobrando 3–4 (seção 9.2). */
export const EASY_START_WEEKS = 2;
export const EASY_START_SETS = 2;
/** Deload sugerido a cada 6–8 semanas (seção 9.4). */
export const DELOAD_EVERY_WEEKS = 6;

export function inEasyStart(planCreatedAt: string, now: Date): boolean {
  return now.getTime() - Date.parse(planCreatedAt) < EASY_START_WEEKS * 7 * DAY;
}

export const weekKey = (date: Date) => localDateKey(startOfWeek(date));

export const isDeloadWeek = (deloadWeek: string | null, now: Date) => deloadWeek != null && deloadWeek === weekKey(now);

/** Já passou da hora de sugerir uma semana leve? */
export function deloadDue(planCreatedAt: string, lastDeloadWeek: string | null, now: Date): boolean {
  const since = lastDeloadWeek ? Date.parse(`${lastDeloadWeek}T12:00:00`) : Date.parse(planCreatedAt);
  return now.getTime() - since >= DELOAD_EVERY_WEEKS * 7 * DAY && !isDeloadWeek(lastDeloadWeek, now);
}

export type StartMode = {
  /** Semanas 1–2 de iniciante ou depois de triagem com "sim". */
  easyStart: boolean;
  /** Semana leve: metade das séries, mantendo as cargas. */
  deload: boolean;
  /** "Dia leve" (pouca energia) ou modo recuperação leve. */
  light: boolean;
};

/** As séries de cada exercício ao começar um dia do plano, conforme o modo. */
export function effectiveItems(items: readonly PlannedExercise[], mode: StartMode): PlannedExercise[] {
  return items.map((item) => {
    let sets = item.sets;
    if (mode.easyStart) sets = Math.min(sets, EASY_START_SETS);
    if (mode.deload || mode.light) sets = Math.ceil(sets / 2);
    return { ...item, sets: Math.max(1, sets) };
  });
}

/** Séries de aproximação (seção 9.3): 50% × 8, 70% × 4, 85% × 2 da carga de trabalho. */
export const WARMUP_STEPS = [
  { pct: 0.5, reps: 8 },
  { pct: 0.7, reps: 4 },
  { pct: 0.85, reps: 2 },
] as const;

export function warmupLoads(workKg: number, step: number): { weightKg: number; reps: number }[] {
  return WARMUP_STEPS.map(({ pct, reps }) => ({ weightKg: Math.max(0, Math.round((workKg * pct) / step) * step), reps }));
}

/** O exercício é o primeiro composto do seu grupo neste treino? (é nele que vão as aproximações) */
export function isFirstCompoundOfGroup(
  workout: Pick<Workout, 'exercises'>,
  index: number,
  find: (id: string) => Exercise | undefined,
): boolean {
  const target = find(workout.exercises[index]?.exerciseId ?? '');
  if (!target?.compound || target.tracking !== 'load') return false;
  const group: ExerciseGroup = target.group;
  return !workout.exercises.slice(0, index).some((e) => {
    const ex = find(e.exerciseId);
    return ex?.compound && ex.group === group;
  });
}
