import { LOWER_GROUPS, type Exercise } from './exerciseModel';

/**
 * Menor incremento de carga (seção 9.4): 5 kg nos compostos de pernas,
 * 2,5 kg nos superiores e isoladores. (Configurável na Fase 3.)
 */
export const DEFAULT_INCREMENTS = { upper: 2.5, lowerCompound: 5 } as const;

export function incrementFor(
  exercise: Pick<Exercise, 'group' | 'compound'>,
  increments: { upper: number; lowerCompound: number } = DEFAULT_INCREMENTS,
): number {
  return exercise.compound && LOWER_GROUPS.includes(exercise.group) ? increments.lowerCompound : increments.upper;
}
