import { z } from 'zod';

/**
 * Modelo de um exercício do catálogo (seção 9.1 da spec).
 * Os textos ficam no próprio catálogo (`src/data/exercises.ts`), em PT-BR.
 */

/** Grupos do catálogo (filtro e organização). */
export const EXERCISE_GROUPS = [
  'glutes',
  'quads',
  'hamstrings',
  'adductorsCalves',
  'back',
  'chest',
  'shoulders',
  'arms',
  'core',
] as const;
export type ExerciseGroup = (typeof EXERCISE_GROUPS)[number];

/** Músculos do mapa muscular e da contagem de volume. */
export const MUSCLES = [
  'gluteMax',
  'gluteMed',
  'quads',
  'hamstrings',
  'adductors',
  'calves',
  'lats',
  'upperBack',
  'lowerBack',
  'chest',
  'frontDelts',
  'sideDelts',
  'rearDelts',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const PATTERNS = [
  'squat',
  'lunge',
  'hinge',
  'hipThrust',
  'abduction',
  'push',
  'pull',
  'isolation',
  'core',
] as const;
export type Pattern = (typeof PATTERNS)[number];

export const EQUIPMENT = ['machine', 'barbell', 'dumbbell', 'cable', 'bodyweight', 'kettlebell', 'smith'] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];

/**
 * Limitações e cirurgias que tiram um exercício do plano (seção 9.2 e 16.5).
 * J joelho · L lombar · O ombro · P punho · M pós-mama · V pós-vaginoplastia/orquiectomia.
 */
export const RESTRICTIONS = ['knee', 'lowerBack', 'shoulder', 'wrist', 'postBreast', 'postGenital'] as const;
export type Restriction = (typeof RESTRICTIONS)[number];

/**
 * Como a série é registrada:
 * - `load`: kg × repetições (conta recordes de carga e 1RM estimado);
 * - `bodyweight`: repetições, com kg extra opcional;
 * - `assisted`: kg de ajuda × repetições (menos ajuda = mais difícil; sem recorde de carga);
 * - `time`: segundos (prancha).
 */
export const TRACKING = ['load', 'bodyweight', 'assisted', 'time'] as const;
export type Tracking = (typeof TRACKING)[number];

export const EVIDENCE = ['S', 'M', 'P'] as const;
export type Evidence = (typeof EVIDENCE)[number];

const text = z.string().min(3);

export const exerciseSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: text,
    nameEn: text,
    group: z.enum(EXERCISE_GROUPS),
    primary: z.array(z.enum(MUSCLES)).min(1),
    secondary: z.array(z.enum(MUSCLES)),
    pattern: z.enum(PATTERNS),
    equipment: z.array(z.enum(EQUIPMENT)).min(1),
    level: z.enum(LEVELS),
    /** Ênfase em glúteos, 0–3 (★ da tabela). */
    glute: z.number().int().min(0).max(3),
    /** Composto (vários músculos e articulações): recebe séries de aproximação e incremento maior se for de pernas. */
    compound: z.boolean(),
    tracking: z.enum(TRACKING),
    /** Faixa sugerida. Em `time`, em segundos. */
    repMin: z.number().int().positive(),
    repMax: z.number().int().positive(),
    /** Repetições contadas por perna/lado. */
    perSide: z.boolean(),
    restSec: z.number().int().min(30).max(300),
    cues: z.array(text).min(1),
    mistakes: z.array(text),
    safety: z.array(text),
    restrictions: z.array(z.enum(RESTRICTIONS)),
    /** Trocas equivalentes, em ordem de preferência. */
    substitutes: z.array(z.string()).min(1),
    evidence: z.array(z.enum(EVIDENCE)).min(1),
  })
  .refine((e) => e.repMin <= e.repMax, { message: 'repMin maior que repMax' })
  .refine((e) => !e.secondary.some((m) => e.primary.includes(m)), {
    message: 'músculo repetido em principal e secundário',
  });

export type Exercise = z.infer<typeof exerciseSchema>;

/** Grupos de volume semanal (seção 9.2): cada músculo conta para um grupo, ou nenhum. */
export const VOLUME_GROUPS = ['glutes', 'quads', 'hamstrings', 'back', 'chest', 'shoulders', 'arms', 'core'] as const;
export type VolumeGroup = (typeof VOLUME_GROUPS)[number];

export const MUSCLE_VOLUME_GROUP: Record<Muscle, VolumeGroup | null> = {
  gluteMax: 'glutes',
  gluteMed: 'glutes',
  quads: 'quads',
  hamstrings: 'hamstrings',
  adductors: null,
  calves: null,
  lats: 'back',
  upperBack: 'back',
  lowerBack: null,
  chest: 'chest',
  frontDelts: 'shoulders',
  sideDelts: 'shoulders',
  rearDelts: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: null,
  abs: 'core',
  obliques: 'core',
};

/** Grupos de pernas: os compostos deles sobem 5 kg por vez (seção 9.4). */
export const LOWER_GROUPS: readonly ExerciseGroup[] = ['glutes', 'quads', 'hamstrings', 'adductorsCalves'];
