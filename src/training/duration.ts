import type { Exercise } from './exerciseModel';
import type { PlannedExercise } from './workoutModel';

/** Tempo médio de uma repetição (seção 9.2). */
export const SECONDS_PER_REP = 3;

/** Segundos de um exercício: séries × (repetições × 3 s + descanso). Em exercícios de tempo, os próprios segundos. */
export function exerciseSeconds(item: PlannedExercise, exercise: Pick<Exercise, 'tracking' | 'perSide'> | undefined): number {
  const avg = (item.repMin + item.repMax) / 2;
  const work = exercise?.tracking === 'time' ? avg : avg * SECONDS_PER_REP;
  const sides = exercise?.perSide ? 2 : 1;
  return item.sets * (work * sides + item.restSec);
}

/** Duração estimada de um dia, em minutos inteiros. */
export function estimateMinutes(items: readonly PlannedExercise[], find: (id: string) => Exercise | undefined): number {
  const seconds = items.reduce((sum, it) => sum + exerciseSeconds(it, find(it.exerciseId)), 0);
  return Math.round(seconds / 60);
}
