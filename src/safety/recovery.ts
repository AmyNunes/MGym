import type { SurgeryInfo } from '@/profile/profile';
import type { Restriction } from '@/training/exerciseModel';

/**
 * Modo recuperação (seção 16.5): até a data de liberação do cirurgião, o plano esconde
 * os padrões restritos. Sem data de liberação, o modo continua ligado.
 */
export type RecoveryState = {
  active: boolean;
  kind: SurgeryInfo['kind'] | null;
  /** Restrições do catálogo que saem do plano. */
  avoid: Restriction[];
  /** Esforço leve: menos séries, sobrando 3–4 (cirurgias genitais e de face). */
  lightOnly: boolean;
  /** Bicicleta fora do cardio (vaginoplastia/orquiectomia). */
  noBike: boolean;
  clearedOn: string | null;
};

const NONE: RecoveryState = { active: false, kind: null, avoid: [], lightOnly: false, noBike: false, clearedOn: null };

export function recoveryState(surgery: SurgeryInfo | null, todayKey: string): RecoveryState {
  if (!surgery) return NONE;
  const active = surgery.clearedOn == null || todayKey < surgery.clearedOn;
  if (!active) return { ...NONE, kind: surgery.kind, clearedOn: surgery.clearedOn };
  const genital = surgery.kind === 'vaginoplasty' || surgery.kind === 'orchiectomy';
  return {
    active,
    kind: surgery.kind,
    avoid: surgery.kind === 'breast' ? ['postBreast'] : genital ? ['postGenital'] : [],
    lightOnly: genital || surgery.kind === 'facial',
    noBike: genital,
    clearedOn: surgery.clearedOn,
  };
}
