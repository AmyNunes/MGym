import { historySetsFor, lastSetsFor } from '@/db/workoutsRepo';
import { useLoader } from '@/lib/useLoader';
import type { Exercise } from '@/training/exerciseModel';
import { heaviestSet, historyChart } from '@/training/history';
import { bestsOf } from '@/training/records';
import { summarizeSets } from '@/training/setSummary';

/** Histórico de um exercício para o detalhe: última vez, recordes e o gráfico. */
export async function loadExerciseHistory(exercise: Exercise) {
  const [sets, last] = await Promise.all([historySetsFor(exercise.id), lastSetsFor(exercise.id)]);
  const tracksLoad = exercise.tracking === 'load';
  return {
    hasHistory: sets.length > 0,
    last: last ? { date: new Date(last.startedAt), summary: summarizeSets(last.sets, exercise.tracking) } : null,
    heaviest: tracksLoad ? heaviestSet(sets, exercise.repMin) : null,
    bestE1rm: tracksLoad ? bestsOf(sets, exercise.repMin).e1rm : null,
    chart: historyChart(sets, exercise.tracking),
  };
}

export type ExerciseHistory = Awaited<ReturnType<typeof loadExerciseHistory>>;

export function useExerciseHistory(exercise: Exercise | undefined) {
  return useLoader(async () => (exercise ? loadExerciseHistory(exercise) : null), exercise?.id ?? '');
}
