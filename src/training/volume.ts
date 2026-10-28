import {
  MUSCLE_VOLUME_GROUP,
  VOLUME_GROUPS,
  type Exercise,
  type Muscle,
  type VolumeGroup,
} from './exerciseModel';
import { isDone, isHardSet, type WorkoutSet } from './workoutModel';

/**
 * Volume semanal em séries difíceis por grupo (seção 9.2):
 * músculo principal conta 1, secundário conta 0,5. Cada série conta no máximo 1 por grupo
 * (glúteo máximo e médio no mesmo exercício não viram 2 séries de glúteo).
 */

export type GroupVolume = Record<VolumeGroup, number>;

export const emptyVolume = (): GroupVolume =>
  Object.fromEntries(VOLUME_GROUPS.map((g) => [g, 0])) as GroupVolume;

const groupsOf = (muscles: readonly Muscle[]) =>
  new Set(muscles.map((m) => MUSCLE_VOLUME_GROUP[m]).filter((g): g is VolumeGroup => g != null));

/** Quanto uma série de um exercício vale para cada grupo (1, 0,5 ou nada). */
export function setWeights(exercise: Pick<Exercise, 'primary' | 'secondary'>): Partial<GroupVolume> {
  const weights: Partial<GroupVolume> = {};
  for (const g of groupsOf(exercise.secondary)) weights[g] = 0.5;
  for (const g of groupsOf(exercise.primary)) weights[g] = 1;
  return weights;
}

/** Soma o volume de várias entradas (exercício + número de séries difíceis). */
export function volumeByGroup(
  entries: readonly { exercise: Pick<Exercise, 'primary' | 'secondary'>; sets: number }[],
): GroupVolume {
  const total = emptyVolume();
  for (const { exercise, sets } of entries) {
    for (const [group, weight] of Object.entries(setWeights(exercise)) as [VolumeGroup, number][]) {
      total[group] += weight * sets;
    }
  }
  return total;
}

/** Quantas séries feitas contam (difíceis e concluídas). */
export const countHardSets = (sets: readonly Pick<WorkoutSet, 'kind' | 'completedAt'>[]) =>
  sets.filter((s) => isHardSet(s) && isDone(s)).length;

/** Volume total do treino em kg (carga × repetições das séries difíceis concluídas). */
export function tonnage(sets: readonly Pick<WorkoutSet, 'kind' | 'completedAt' | 'weightKg' | 'reps'>[]): number {
  const kg = sets
    .filter((s) => isHardSet(s) && isDone(s))
    .reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
  return Math.round(kg);
}
