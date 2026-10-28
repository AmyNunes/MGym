import { isDone, isHardSet, type WorkoutSet } from './workoutModel';

/**
 * Recordes pessoais (seção 9.6):
 * - maior carga, numa série com pelo menos o mínimo da faixa de repetições;
 * - maior 1RM estimado (Epley), só com até 12 repetições.
 * Séries de aquecimento não contam.
 */

export type RecordKind = 'weight' | 'e1rm';

export const E1RM_MAX_REPS = 12;

/** 1RM estimado pela fórmula de Epley: carga × (1 + reps/30), com uma casa decimal. */
export function epley(weightKg: number, reps: number): number {
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export type Bests = { weight: number | null; e1rm: number | null };

type RecordSet = Pick<WorkoutSet, 'kind' | 'weightKg' | 'reps' | 'completedAt'>;

function usable(set: RecordSet): set is RecordSet & { weightKg: number; reps: number } {
  return isDone(set) && isHardSet(set) && set.weightKg != null && set.weightKg > 0 && set.reps != null && set.reps > 0;
}

/** O valor de cada recorde que uma série alcança (ou nulo, se ela não vale para aquele recorde). */
export function recordValues(set: RecordSet, repMin: number): Bests {
  if (!usable(set)) return { weight: null, e1rm: null };
  return {
    weight: set.reps >= repMin ? set.weightKg : null,
    e1rm: set.reps <= E1RM_MAX_REPS ? epley(set.weightKg, set.reps) : null,
  };
}

const maxOf = (a: number | null, b: number | null) => (a == null ? b : b == null ? a : Math.max(a, b));

/** Os melhores valores entre várias séries. */
export function bestsOf(sets: readonly RecordSet[], repMin: number): Bests {
  return sets.reduce<Bests>(
    (best, set) => {
      const v = recordValues(set, repMin);
      return { weight: maxOf(best.weight, v.weight), e1rm: maxOf(best.e1rm, v.e1rm) };
    },
    { weight: null, e1rm: null },
  );
}

/**
 * Que recordes esta série bate, comparando com os melhores de antes.
 * Sem histórico (primeira vez no exercício), não há recorde: a primeira vez vira a referência.
 */
export function recordsBeaten(set: RecordSet, before: Bests, repMin: number): RecordKind[] {
  const v = recordValues(set, repMin);
  const beaten: RecordKind[] = [];
  if (v.weight != null && before.weight != null && v.weight > before.weight) beaten.push('weight');
  if (v.e1rm != null && before.e1rm != null && v.e1rm > before.e1rm) beaten.push('e1rm');
  return beaten;
}

/**
 * Recordes de um exercício ao longo de um treino, série a série: cada série é comparada
 * com o histórico e com as séries anteriores do mesmo treino.
 * Devolve, por id da série, os recordes batidos.
 */
export function recordsInWorkout(
  sets: readonly (RecordSet & { id: string })[],
  history: Bests,
  repMin: number,
): Map<string, RecordKind[]> {
  const result = new Map<string, RecordKind[]>();
  if (history.weight == null && history.e1rm == null) return result;
  let best = history;
  for (const set of sets) {
    const beaten = recordsBeaten(set, best, repMin);
    if (beaten.length) result.set(set.id, beaten);
    const v = recordValues(set, repMin);
    best = { weight: maxOf(best.weight, v.weight), e1rm: maxOf(best.e1rm, v.e1rm) };
  }
  return result;
}
