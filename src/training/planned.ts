import type { Exercise } from './exerciseModel';
import type { PlannedExercise } from './workoutModel';

/** Séries por exercício quando ele entra num treino montado à mão. */
export const DEFAULT_SETS = 3;

/** Descanso escolhido em Configurações › Treino (quando não usa o do catálogo). */
export type RestOverride = { compound: number; isolation: number; core: number };

/** O descanso de um exercício: o do catálogo ou o padrão por tipo escolhido (seção 12.7). */
export function restFor(exercise: Pick<Exercise, 'restSec' | 'compound' | 'pattern'>, override?: RestOverride | null): number {
  if (!override) return exercise.restSec;
  if (exercise.pattern === 'core') return override.core;
  return exercise.compound ? override.compound : override.isolation;
}

/** Um exercício novo no treino, com a faixa e o descanso do catálogo (ou o escolhido). */
export function plannedFrom(exercise: Exercise, sets = DEFAULT_SETS, override?: RestOverride | null): PlannedExercise {
  return {
    exerciseId: exercise.id,
    sets,
    repMin: exercise.repMin,
    repMax: exercise.repMax,
    restSec: restFor(exercise, override),
  };
}

/** Limites do que dá para escolher ao montar um treino (os mesmos do schema). */
export const PLANNED_LIMITS = {
  setsMax: 10,
  repsMax: 50,
  secondsMax: 300,
  secondsStep: 5,
  restMin: 15,
  restMax: 600,
  restStep: 15,
} as const;
