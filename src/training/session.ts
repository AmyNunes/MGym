import type { Exercise, Muscle } from './exerciseModel';
import {
  isDone,
  isHardSet,
  type PlannedExercise,
  type Workout,
  type WorkoutExercise,
  type WorkoutSet,
} from './workoutModel';

/**
 * Regras do treino em andamento (seção 9.5), sem React nem banco.
 * "Nunca digitar o que o app já sabe": as séries vêm preenchidas com a última vez.
 */

/** A série "anterior" da posição `index` (entre as séries difíceis da última vez); se faltar, a última delas. */
export function previousAt(previousHard: readonly WorkoutSet[], index: number): WorkoutSet | null {
  if (!previousHard.length) return null;
  return previousHard[Math.min(index, previousHard.length - 1)];
}

/** Séries novas, preenchidas com a carga e as repetições da última vez. */
export function prefillSets(count: number, previousHard: readonly WorkoutSet[], makeId: () => string): WorkoutSet[] {
  return Array.from({ length: count }, (_, i) => {
    const prev = previousAt(previousHard, i);
    return {
      id: makeId(),
      position: i,
      kind: 'normal' as const,
      weightKg: prev?.weightKg ?? null,
      reps: prev?.reps ?? null,
      rir: null,
      completedAt: null,
    };
  });
}

/** Uma série a mais, copiando a última do exercício. */
export function nextSet(sets: readonly WorkoutSet[], makeId: () => string): WorkoutSet {
  const last = sets[sets.length - 1];
  return {
    id: makeId(),
    position: last ? last.position + 1 : 0,
    kind: 'normal',
    weightKg: last?.weightKg ?? null,
    reps: last?.reps ?? null,
    rir: null,
    completedAt: null,
  };
}

/** Exercício feito = tem séries e todas estão marcadas. */
export const isExerciseDone = (e: Pick<WorkoutExercise, 'sets'>) => e.sets.length > 0 && e.sets.every(isDone);

/** "3 de 7": exercícios feitos e total. */
export function workoutProgress(workout: Pick<Workout, 'exercises'>): { done: number; total: number } {
  return { done: workout.exercises.filter(isExerciseDone).length, total: workout.exercises.length };
}

/** O próximo exercício com séries por fazer, depois de `from` (dá a volta na lista). */
export function nextIncompleteIndex(workout: Pick<Workout, 'exercises'>, from = -1): number | null {
  const n = workout.exercises.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k + n) % n;
    if (!isExerciseDone(workout.exercises[i])) return i;
  }
  return null;
}

/** Séries ainda não marcadas (no "Terminar", elas não contam). */
export const pendingSets = (workout: Pick<Workout, 'exercises'>) =>
  workout.exercises.reduce((n, e) => n + e.sets.filter((s) => !isDone(s)).length, 0);

/** Séries já marcadas. */
export const doneSets = (workout: Pick<Workout, 'exercises'>) =>
  workout.exercises.reduce((n, e) => n + e.sets.filter(isDone).length, 0);

/**
 * Começar um treino com outro em andamento:
 * - `open`: é o mesmo (mesmo dia do plano, mesmo treino montado, ou os dois livres) → continua ele;
 * - `replace`: o outro não tem nenhuma série feita → é descartado sem perguntar;
 * - `ask`: o outro tem séries feitas → pergunta "Continuar esse" ou "Salvar esse e começar o novo".
 */
export type StartDecision = 'start' | 'open' | 'replace' | 'ask';

type StartTarget = { planDayId?: string | null; routineId?: string | null };

export function startDecision(active: (Pick<Workout, 'exercises'> & Required<StartTarget>) | null, target: StartTarget): StartDecision {
  if (!active) return 'start';
  const planDayId = target.planDayId ?? null;
  const routineId = target.routineId ?? null;
  const same =
    (planDayId != null && planDayId === active.planDayId) ||
    (routineId != null && routineId === active.routineId) ||
    (planDayId == null && routineId == null && active.planDayId == null && active.routineId == null);
  if (same) return 'open';
  return doneSets(active) === 0 ? 'replace' : 'ask';
}

/** Músculos trabalhados no treino (exercícios com pelo menos uma série difícil feita). */
export function workedMuscles(
  workout: Pick<Workout, 'exercises'>,
  find: (id: string) => Exercise | undefined,
): { primary: Muscle[]; secondary: Muscle[] } {
  const primary = new Set<Muscle>();
  const secondary = new Set<Muscle>();
  for (const e of workout.exercises) {
    if (!e.sets.some((s) => isDone(s) && isHardSet(s))) continue;
    const ex = find(e.exerciseId);
    ex?.primary.forEach((m) => primary.add(m));
    ex?.secondary.forEach((m) => secondary.add(m));
  }
  return { primary: [...primary], secondary: [...secondary].filter((m) => !primary.has(m)) };
}

/** O treino feito virando treino montado: exercícios na ordem, com as séries difíceis feitas. */
export function planFromWorkout(workout: Pick<Workout, 'exercises'>, find: (id: string) => Exercise | undefined): PlannedExercise[] {
  return workout.exercises.flatMap((e) => {
    const ex = find(e.exerciseId);
    const sets = e.sets.filter((s) => isDone(s) && isHardSet(s)).length;
    if (!ex || sets === 0) return [];
    return [{ exerciseId: e.exerciseId, sets, repMin: e.repMin ?? ex.repMin, repMax: e.repMax ?? ex.repMax, restSec: e.restSec }];
  });
}

/** Mudei exercícios, ordem ou número de séries em relação ao treino montado? */
export function differsFromPlan(items: readonly PlannedExercise[], done: readonly PlannedExercise[]): boolean {
  if (items.length !== done.length) return true;
  return items.some((it, i) => it.exerciseId !== done[i].exerciseId || it.sets !== done[i].sets);
}

/**
 * A próxima série por fazer depois de concluir uma série de `weId`: primeiro no mesmo
 * exercício, depois no próximo exercício com séries por fazer. Base do texto do descanso.
 */
export function nextPendingSet(
  workout: Pick<Workout, 'exercises'>,
  weId: string,
): { exerciseIndex: number; setNumber: number } | null {
  const from = workout.exercises.findIndex((e) => e.id === weId);
  if (from < 0) return null;
  const n = workout.exercises.length;
  for (let k = 0; k < n; k++) {
    const exerciseIndex = (from + k) % n;
    const sets = workout.exercises[exerciseIndex].sets;
    const i = sets.findIndex((s) => !isDone(s));
    if (i >= 0) return { exerciseIndex, setNumber: i + 1 };
  }
  return null;
}

/**
 * Para um dia do plano: mudou exercício, ordem ou fiz séries a mais? (Séries a menos não contam:
 * podem ser das semanas 1–2, da semana leve ou de um dia leve.)
 */
export function changedForPlan(items: readonly PlannedExercise[], done: readonly PlannedExercise[]): boolean {
  if (items.length !== done.length) return true;
  return items.some((it, i) => it.exerciseId !== done[i].exerciseId || done[i].sets > it.sets);
}

/** O dia do plano atualizado com o treino feito, sem diminuir as séries que já existiam. */
export function mergeIntoPlan(items: readonly PlannedExercise[], done: readonly PlannedExercise[]): PlannedExercise[] {
  return done.map((d) => {
    const before = items.find((it) => it.exerciseId === d.exerciseId);
    return before ? { ...before, sets: Math.max(before.sets, d.sets) } : d;
  });
}
