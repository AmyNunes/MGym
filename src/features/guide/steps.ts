import type { Profile } from '@/profile/profile';

/** Perguntas do Guia nas partes "Sobre você", "Treino" e "Corpo" (seção 8.1), em ordem. */
export const STEP_IDS = [
  'address',
  'goal',
  'priorities',
  'context',
  'hrt',
  'followUp',
  'surgery',
  'screening',
  'experience',
  'schedule',
  'limitations',
  'body',
  'measurements',
  'numbers',
  'weightGoal',
  'meals',
  'dietRestrictions',
  'routine',
  'potassium',
] as const;
export type StepId = (typeof STEP_IDS)[number];
export type GuidePart = 'about' | 'training' | 'body' | 'food';

type StepMeta = {
  part: GuidePart;
  /** Opcional: mostra "Pular". */
  optional: boolean;
  /** Já dá para continuar? */
  ready: (p: Profile) => boolean;
};

export const STEP_META: Record<StepId, StepMeta> = {
  address: { part: 'about', optional: false, ready: (p) => p.address != null },
  goal: { part: 'about', optional: false, ready: (p) => p.goal != null },
  priorities: { part: 'about', optional: false, ready: () => true },
  context: { part: 'about', optional: true, ready: () => true },
  hrt: { part: 'about', optional: true, ready: () => true },
  followUp: { part: 'about', optional: true, ready: () => true },
  surgery: { part: 'about', optional: true, ready: () => true },
  screening: { part: 'about', optional: false, ready: () => true },
  experience: { part: 'training', optional: false, ready: (p) => p.experience != null },
  schedule: { part: 'training', optional: false, ready: (p) => p.daysPerWeek != null && p.sessionMinutes != null },
  limitations: { part: 'training', optional: false, ready: () => true },
  body: { part: 'body', optional: true, ready: (p) => p.heightCm != null && p.birthDate != null && p.weightKg != null },
  measurements: { part: 'body', optional: true, ready: () => true },
  numbers: { part: 'food', optional: false, ready: () => true },
  weightGoal: { part: 'food', optional: false, ready: (p) => p.weightGoal != null },
  meals: { part: 'food', optional: false, ready: (p) => p.mealsPerDay != null },
  dietRestrictions: { part: 'food', optional: false, ready: () => true },
  routine: { part: 'food', optional: false, ready: (p) => p.cookingTime != null && p.lunchPlace != null },
  potassium: { part: 'food', optional: true, ready: () => true },
};

export const isStepId = (id: string): id is StepId => (STEP_IDS as readonly string[]).includes(id);
export const stepIndex = (id: StepId) => STEP_IDS.indexOf(id);
export const nextStepId = (id: StepId): StepId | null => STEP_IDS[stepIndex(id) + 1] ?? null;

/** Respostas que mudam o plano de treino (editar uma delas pede para atualizar o plano). */
export const PLAN_STEPS: readonly StepId[] = ['goal', 'priorities', 'surgery', 'screening', 'experience', 'schedule', 'limitations'];

/** Respostas que mudam o cardápio (editar uma delas pede para gerar de novo). */
export const MENU_STEPS: readonly StepId[] = ['body', 'weightGoal', 'meals', 'dietRestrictions', 'routine', 'potassium', 'schedule'];
