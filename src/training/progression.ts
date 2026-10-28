import type { Exercise } from './exerciseModel';
import { epley } from './records';
import { isDone, isHardSet, type WorkoutSet } from './workoutModel';

/**
 * Dupla progressão (seção 9.4):
 * - todas as séries no topo da faixa, sobrando ≤ 2 → sobe o menor incremento;
 * - repetições abaixo da faixa por 2 treinos → baixa ~7,5% (entre 5 e 10%);
 * - senão → mesma carga, tentando mais repetições.
 * "Travou": 3 treinos sem evoluir.
 */

export type PastSession = { sets: readonly Pick<WorkoutSet, 'kind' | 'weightKg' | 'reps' | 'rir' | 'completedAt'>[] };

export type Trend = 'up' | 'same' | 'down';

export type Suggestion = {
  /** Carga sugerida (só em exercícios com carga). */
  weightKg: number | null;
  /** Repetições para começar. */
  reps: number | null;
  trend: Trend;
  /** 3 treinos sem evoluir: sugerir conferir sono e comida, trocar a variação ou deload. */
  stalled: boolean;
};

/** Baixa ~7,5% quando as repetições ficam abaixo da faixa (seção 9.4: 5–10%). */
export const DOWN_FACTOR = 0.925;
/** "Sobrando ≤ 2" para subir a carga. */
export const RIR_TO_PROGRESS = 2;
/** Treinos sem evoluir para dizer que travou. */
export const STALL_SESSIONS = 3;

export function roundToStep(value: number, step: number): number {
  return Math.max(0, Math.round(value / step) * step);
}

const hardDone = (s: PastSession) => s.sets.filter((x) => isDone(x) && isHardSet(x) && x.reps != null);

/** O melhor 1RM estimado (ou, sem carga, o total de repetições) de um treino. */
function sessionScore(s: PastSession): number {
  return hardDone(s).reduce((best, x) => {
    const score = x.weightKg ? epley(x.weightKg, x.reps ?? 0) : (x.reps ?? 0);
    return Math.max(best, score);
  }, 0);
}

export function isStalled(sessions: readonly PastSession[]): boolean {
  if (sessions.length < STALL_SESSIONS + 1) return false;
  const before = sessions.slice(0, -STALL_SESSIONS).map(sessionScore);
  const recent = sessions.slice(-STALL_SESSIONS).map(sessionScore);
  return Math.max(...recent) <= Math.max(...before);
}

/**
 * A sugestão para a próxima vez, a partir dos treinos anteriores (do mais antigo ao mais novo).
 * `repMin`/`repMax`: a faixa do treino atual. `step`: o menor incremento do exercício.
 */
export function suggestNext(
  sessions: readonly PastSession[],
  exercise: Pick<Exercise, 'tracking'>,
  range: { repMin: number; repMax: number },
  step: number,
): Suggestion | null {
  const withSets = sessions.filter((s) => hardDone(s).length > 0);
  const last = withSets[withSets.length - 1];
  if (!last) return null;
  const sets = hardDone(last);
  const stalled = isStalled(withSets);
  const firstReps = sets[0].reps;

  if (exercise.tracking !== 'load') {
    return { weightKg: sets[0].weightKg, reps: firstReps, trend: 'same', stalled };
  }

  const work = Math.max(...sets.map((x) => x.weightKg ?? 0));
  const atTop = sets.every((x) => (x.reps ?? 0) >= range.repMax);
  const lastRir = sets[sets.length - 1].rir;
  if (atTop && (lastRir == null || lastRir <= RIR_TO_PROGRESS)) {
    return { weightKg: work + step, reps: range.repMin, trend: 'up', stalled: false };
  }

  const below = (s: PastSession) => hardDone(s).some((x) => (x.reps ?? 0) < range.repMin);
  const prev = withSets[withSets.length - 2];
  if (prev && below(last) && below(prev)) {
    return { weightKg: roundToStep(work * DOWN_FACTOR, step), reps: range.repMin, trend: 'down', stalled };
  }

  return { weightKg: work, reps: firstReps, trend: 'same', stalled };
}
