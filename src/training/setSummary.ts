import { formatKgNumber } from '@/lib/format';

import type { Tracking } from './exerciseModel';
import { isHardSet, type WorkoutSet } from './workoutModel';

type SummarySet = Pick<WorkoutSet, 'kind' | 'weightKg' | 'reps'>;

/** Uma série curta: "60 × 10", "12", "30 s", "+5 × 10". */
export function formatSet(set: Pick<WorkoutSet, 'weightKg' | 'reps'>, tracking: Tracking): string {
  const reps = set.reps ?? 0;
  if (tracking === 'time') return `${reps} s`;
  if (tracking === 'bodyweight') return set.weightKg ? `+${formatKgNumber(set.weightKg)} × ${reps}` : `${reps}`;
  return `${formatKgNumber(set.weightKg ?? 0)} × ${reps}`;
}

/**
 * Resumo das séries difíceis de um exercício, como na linha "Última vez" (seção 9.5):
 * - todas iguais: "4 × 10 · 60 kg";
 * - mesma carga: "60 kg · 10, 9, 8";
 * - diferentes: "60 × 10 · 62,5 × 8".
 */
export function summarizeSets(sets: readonly SummarySet[], tracking: Tracking): string {
  const hard = sets.filter(isHardSet);
  if (!hard.length) return '';
  const reps = hard.map((s) => s.reps ?? 0);
  const weights = hard.map((s) => s.weightKg ?? 0);
  const sameReps = reps.every((r) => r === reps[0]);
  const sameWeight = weights.every((w) => w === weights[0]);

  if (tracking === 'time') {
    return sameReps ? `${hard.length} × ${reps[0]} s` : reps.map((r) => `${r} s`).join(', ');
  }
  if (tracking === 'bodyweight' && weights.every((w) => w === 0)) {
    return sameReps ? `${hard.length} × ${reps[0]}` : reps.join(', ');
  }
  const kg = `${formatKgNumber(weights[0])} kg`;
  if (sameReps && sameWeight) return `${hard.length} × ${reps[0]} · ${kg}`;
  if (sameWeight) return `${kg} · ${reps.join(', ')}`;
  return hard.map((s) => formatSet(s, tracking)).join(' · ');
}
