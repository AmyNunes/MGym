import type { TemplateId } from './planModel';

/**
 * Modelos de dia (seção 9.2 e PESQUISA 2.3). Cada vaga ("slot") tem candidatos em ordem
 * de preferência; o gerador escolhe o primeiro que serve (nível, limitações, recuperação).
 * `priority` decide o que sai primeiro quando o treino não cabe no tempo (menor sai antes).
 */

export type Slot = {
  role: string;
  /** Candidatos para quem já treina com constância. */
  candidates: string[];
  /** Candidatos para iniciantes (se diferentes). */
  beginner?: string[];
  sets: number;
  priority: number;
};

export type DayKey =
  | 'fullA'
  | 'fullB'
  | 'lowerSquat'
  | 'upper'
  | 'lowerHinge'
  | 'upperGlute'
  | 'lowerGlute'
  | 'gluteCardio';

const HIP_THRUST = ['barbell-hip-thrust', 'machine-hip-thrust', 'glute-bridge'];
const ABDUCTION = ['hip-abduction-machine', 'cable-hip-abduction', 'clamshell'];
const HAM_CURL = ['seated-leg-curl', 'lying-leg-curl'];
const HINGE = ['romanian-deadlift', 'single-leg-rdl', 'back-extension-45'];
const V_PULL = ['lat-pulldown', 'assisted-pull-up', 'pull-up'];
const H_PULL = ['seated-cable-row', 'machine-row', 'one-arm-db-row'];
const REAR_DELT = ['face-pull', 'reverse-fly'];
const GLUTE_ISO = ['cable-kickback', 'quadruped-kickback', 'cable-hip-abduction'];

export const DAY_TEMPLATES: Record<DayKey, Slot[]> = {
  fullA: [
    { role: 'squat', candidates: ['leg-press-45', 'goblet-squat', 'hack-squat', 'smith-squat'], sets: 3, priority: 9 },
    { role: 'hipThrust', candidates: HIP_THRUST, sets: 3, priority: 10 },
    { role: 'hamCurl', candidates: HAM_CURL, sets: 2, priority: 6 },
    { role: 'vPull', candidates: V_PULL, sets: 3, priority: 7 },
    { role: 'hPush', candidates: ['machine-chest-press', 'db-bench-press', 'push-up'], sets: 3, priority: 5 },
    { role: 'abduction', candidates: ABDUCTION, sets: 2, priority: 8 },
    { role: 'core', candidates: ['plank', 'dead-bug', 'pallof-press'], sets: 2, priority: 3 },
  ],
  fullB: [
    { role: 'hinge', candidates: HINGE, sets: 3, priority: 9 },
    {
      role: 'lunge',
      candidates: ['bulgarian-split-squat', 'reverse-lunge', 'split-squat', 'step-up'],
      beginner: ['reverse-lunge', 'split-squat', 'step-up', 'bulgarian-split-squat'],
      sets: 3,
      priority: 8,
    },
    { role: 'quadIso', candidates: ['leg-extension'], sets: 2, priority: 5 },
    { role: 'hPull', candidates: H_PULL, sets: 3, priority: 7 },
    { role: 'vPush', candidates: ['machine-shoulder-press', 'db-shoulder-press'], sets: 2, priority: 4 },
    { role: 'gluteIso', candidates: GLUTE_ISO, sets: 2, priority: 6 },
    { role: 'core', candidates: ['dead-bug', 'pallof-press', 'side-plank'], sets: 2, priority: 3 },
  ],
  lowerSquat: [
    {
      role: 'squat',
      candidates: ['back-squat', 'hack-squat', 'leg-press-45', 'smith-squat'],
      beginner: ['hack-squat', 'leg-press-45', 'goblet-squat', 'smith-squat'],
      sets: 3,
      priority: 9,
    },
    { role: 'hipThrust', candidates: HIP_THRUST, sets: 3, priority: 10 },
    {
      role: 'lunge',
      candidates: ['bulgarian-split-squat', 'walking-lunge', 'reverse-lunge', 'step-up'],
      beginner: ['reverse-lunge', 'step-up', 'split-squat', 'bulgarian-split-squat'],
      sets: 3,
      priority: 8,
    },
    { role: 'hamCurl', candidates: HAM_CURL, sets: 3, priority: 6 },
    { role: 'abduction', candidates: ABDUCTION, sets: 3, priority: 7 },
    { role: 'calves', candidates: ['standing-calf-raise', 'seated-calf-raise'], sets: 2, priority: 1 },
  ],
  upper: [
    { role: 'vPull', candidates: V_PULL, sets: 3, priority: 9 },
    { role: 'hPush', candidates: ['db-bench-press', 'machine-chest-press', 'incline-db-press', 'push-up'], sets: 3, priority: 8 },
    { role: 'hPull', candidates: H_PULL, sets: 3, priority: 8 },
    { role: 'vPush', candidates: ['db-shoulder-press', 'machine-shoulder-press'], sets: 2, priority: 5 },
    { role: 'lateral', candidates: ['lateral-raise'], sets: 2, priority: 4 },
    { role: 'rearDelt', candidates: REAR_DELT, sets: 2, priority: 5 },
    { role: 'biceps', candidates: ['biceps-curl', 'hammer-curl', 'preacher-curl'], sets: 2, priority: 3 },
    { role: 'triceps', candidates: ['overhead-triceps-extension', 'triceps-pushdown'], sets: 2, priority: 3 },
  ],
  lowerHinge: [
    { role: 'hinge', candidates: HINGE, sets: 3, priority: 9 },
    { role: 'hipThrust', candidates: HIP_THRUST, sets: 4, priority: 10 },
    { role: 'squat', candidates: ['leg-press-45', 'hack-squat', 'goblet-squat', 'step-up'], sets: 3, priority: 7 },
    { role: 'backExt', candidates: ['back-extension-45', 'cable-kickback'], sets: 2, priority: 6 },
    { role: 'abduction', candidates: ['cable-hip-abduction', 'hip-abduction-machine', 'clamshell'], sets: 2, priority: 6 },
    { role: 'core', candidates: ['pallof-press', 'dead-bug', 'plank'], sets: 2, priority: 3 },
  ],
  upperGlute: [
    { role: 'hPull', candidates: ['machine-row', 'seated-cable-row', 'one-arm-db-row'], sets: 3, priority: 8 },
    { role: 'hPush', candidates: ['incline-db-press', 'machine-chest-press', 'db-bench-press', 'push-up'], sets: 3, priority: 7 },
    { role: 'vPull', candidates: ['lat-pulldown', 'assisted-pull-up'], sets: 2, priority: 6 },
    {
      role: 'hipThrust',
      candidates: ['machine-hip-thrust', 'single-leg-hip-thrust', 'glute-bridge', 'barbell-hip-thrust'],
      sets: 3,
      priority: 10,
    },
    { role: 'gluteIso', candidates: GLUTE_ISO, sets: 3, priority: 9 },
    { role: 'rearDelt', candidates: REAR_DELT, sets: 2, priority: 4 },
    { role: 'core', candidates: ['dead-bug', 'side-plank', 'pallof-press'], sets: 2, priority: 3 },
  ],
  lowerGlute: [
    { role: 'hipThrust', candidates: HIP_THRUST, sets: 4, priority: 10 },
    {
      role: 'lunge',
      candidates: ['bulgarian-split-squat', 'reverse-lunge', 'step-up'],
      beginner: ['reverse-lunge', 'step-up', 'bulgarian-split-squat'],
      sets: 3,
      priority: 9,
    },
    { role: 'hinge', candidates: HINGE, sets: 3, priority: 8 },
    { role: 'abduction', candidates: ABDUCTION, sets: 3, priority: 7 },
    { role: 'gluteIso', candidates: ['cable-kickback', 'quadruped-kickback'], sets: 2, priority: 6 },
    { role: 'core', candidates: ['pallof-press', 'dead-bug'], sets: 2, priority: 3 },
  ],
  gluteCardio: [
    { role: 'hipThrust', candidates: ['glute-bridge', 'single-leg-hip-thrust', 'machine-hip-thrust'], sets: 3, priority: 10 },
    { role: 'abduction', candidates: ['cable-hip-abduction', 'hip-abduction-machine', 'clamshell'], sets: 3, priority: 9 },
    { role: 'gluteIso', candidates: ['cable-kickback', 'quadruped-kickback'], sets: 3, priority: 8 },
    { role: 'backExt', candidates: ['back-extension-45', 'single-leg-rdl'], sets: 2, priority: 7 },
    { role: 'core', candidates: ['side-plank', 'dead-bug'], sets: 2, priority: 3 },
  ],
};

/** Dias de cada modelo, na ordem do rodízio (seção 9.2). */
export const TEMPLATE_DAYS: Record<TemplateId, DayKey[]> = {
  fullBodyLean: ['fullA', 'fullB'],
  fullBodyAB: ['fullA', 'fullB'],
  lowerUpperLower: ['lowerSquat', 'upper', 'lowerGlute'],
  upperLower4: ['lowerSquat', 'upper', 'lowerHinge', 'upperGlute'],
  upperLower5: ['lowerSquat', 'upper', 'lowerHinge', 'upperGlute', 'gluteCardio'],
};

/** Tabela de modelos (seção 9.2): dias por semana × experiência. */
export function chooseTemplate(daysPerWeek: number, beginner: boolean): TemplateId {
  if (daysPerWeek <= 2) return 'fullBodyLean';
  if (daysPerWeek === 3) return beginner ? 'fullBodyAB' : 'lowerUpperLower';
  if (daysPerWeek === 4) return 'upperLower4';
  return 'upperLower5';
}
