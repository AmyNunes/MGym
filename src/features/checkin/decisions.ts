import type { CheckinAnswers, CheckinStats, DecisionKind } from './model';

/**
 * Decisões sugeridas no check-in (seção 11.5). Eu confirmo cada uma; "seguir" vem sempre.
 * - semana leve: pouca energia e sono ruim, dores fortes, ou já passou da hora (a cada 6 semanas);
 * - ajustar metas de comida: quando a adaptação (10.1) tem dados e algo a mudar;
 * - reduzir um dia de treino: treinei 2 ou mais dias a menos que o plano.
 */
export type DecisionInput = {
  stats: CheckinStats;
  ratings: CheckinAnswers['ratings'];
  /** Ajuste sugerido em kcal (null = nada a ajustar ou faltam dados). */
  adjustment: number | null;
  deloadDue: boolean;
  deloadActive: boolean;
  hasPlan: boolean;
  daysPerWeek: number;
};

export function suggestDecisions(input: DecisionInput): DecisionKind[] {
  const out: DecisionKind[] = ['keep'];
  const { ratings } = input;
  const tired = (ratings.energy ?? 3) <= 2 && (ratings.sleep ?? 3) <= 2;
  const hurting = (ratings.pain ?? 1) >= 4;
  if (input.hasPlan && !input.deloadActive && (tired || hurting || input.deloadDue)) out.push('deload');
  if (input.adjustment != null) out.push('adjustFood');
  if (input.hasPlan && input.daysPerWeek > 2 && input.stats.workouts <= input.stats.planned - 2) out.push('dropDay');
  return out;
}
