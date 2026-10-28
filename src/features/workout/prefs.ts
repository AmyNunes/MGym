import { useSettings } from '@/stores/settingsStore';
import type { Exercise } from '@/training/exerciseModel';
import { incrementFor } from '@/training/increments';
import type { RestOverride } from '@/training/planned';

/** Preferências de Configurações › Treino usadas ao montar e registrar treinos. */
export function trainingPrefs() {
  const w = useSettings.getState().workout;
  const restOverride: RestOverride | null = w.customRest
    ? { compound: w.restCompound, isolation: w.restIsolation, core: w.restCore }
    : null;
  return {
    increments: { upper: w.incrementUpper, lowerCompound: w.incrementLower },
    restOverride,
    askRir: w.askRir,
    autoWarmup: w.autoWarmup,
  };
}

/** Menor incremento de carga deste exercício, conforme as configurações. */
export const stepFor = (exercise: Pick<Exercise, 'group' | 'compound'>) => incrementFor(exercise, trainingPrefs().increments);
