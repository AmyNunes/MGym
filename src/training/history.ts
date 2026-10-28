import type { ChartPoint } from '@/lib/chart';

import type { Tracking } from './exerciseModel';
import { E1RM_MAX_REPS, epley } from './records';
import { isDone, isHardSet, type WorkoutSet } from './workoutModel';

type HistorySet = Pick<WorkoutSet, 'kind' | 'weightKg' | 'reps' | 'completedAt'> & {
  workoutId: string;
  startedAt: string;
};

/**
 * Um ponto por treino para o gráfico do exercício:
 * - com carga: o melhor 1RM estimado do treino (séries até 12 repetições);
 * - peso do corpo e tempo: a melhor série (repetições ou segundos);
 * - com ajuda: não há gráfico (menos ajuda é melhor, e isso confunde).
 */
export function historyChart(sets: readonly HistorySet[], tracking: Tracking): ChartPoint[] {
  if (tracking === 'assisted') return [];
  const best = new Map<string, ChartPoint>();
  for (const s of sets) {
    if (!isDone(s) || !isHardSet(s) || !s.reps) continue;
    let value: number | null = null;
    if (tracking === 'load') {
      if (s.weightKg && s.reps <= E1RM_MAX_REPS) value = epley(s.weightKg, s.reps);
    } else {
      value = s.reps;
    }
    if (value == null) continue;
    const current = best.get(s.workoutId);
    if (!current || value > current.v) best.set(s.workoutId, { t: Date.parse(s.startedAt), v: value });
  }
  return [...best.values()].sort((a, b) => a.t - b.t);
}

/** A série de maior carga (com pelo menos `repMin` repetições), para "Maior carga: 62,5 × 10". */
export function heaviestSet(
  sets: readonly Pick<WorkoutSet, 'kind' | 'weightKg' | 'reps' | 'completedAt'>[],
  repMin: number,
): { weightKg: number; reps: number } | null {
  let best: { weightKg: number; reps: number } | null = null;
  for (const s of sets) {
    if (!isDone(s) || !isHardSet(s) || !s.weightKg || !s.reps || s.reps < repMin) continue;
    if (!best || s.weightKg > best.weightKg || (s.weightKg === best.weightKg && s.reps > best.reps)) {
      best = { weightKg: s.weightKg, reps: s.reps };
    }
  }
  return best;
}
