import { z } from 'zod';

import { DEFAULT_SITES, MEASURE_SITES } from '@/body/measurements';

/**
 * Respostas do Guia (seção 8.1), guardadas numa linha única da tabela `profile`.
 * Todo campo tem padrão: um perfil antigo (ou incompleto) continua válido quando
 * fases novas acrescentam perguntas.
 */

export const ADDRESS_FORMS = ['feminine', 'masculine', 'neutral'] as const;
export const GOALS = ['feminineShape', 'strengthHealth', 'loseFat', 'gainMass'] as const;
export const PRIORITIES = ['glutes', 'legs', 'waist', 'posture', 'firmArms', 'narrowShoulders'] as const;
export const CONTEXTS = ['cisWoman', 'cisMan', 'transWoman', 'transMan', 'nonBinary', 'other', 'preferNot'] as const;
export const HRT = ['none', 'estrogen', 'estrogenSpiro', 'estrogenCpa', 'other', 'preferNot'] as const;
export const SURGERIES = ['breast', 'orchiectomy', 'vaginoplasty', 'facial', 'other'] as const;
export const SCREENING = ['chestPain', 'fainting', 'heart', 'joint', 'other'] as const;
export const EXPERIENCE = ['beginner', 'experienced'] as const;
export const DAYS_PER_WEEK = [2, 3, 4, 5] as const;
export const SESSION_MINUTES = [45, 60, 75] as const;
export const LIMITATIONS = ['knee', 'lowerBack', 'shoulder', 'wrist', 'other'] as const;

export const NUMBERS_MODES = ['proteinCarbs', 'all', 'none'] as const;
export const WEIGHT_GOALS = ['maintain', 'lose', 'gain'] as const;
export const MEALS_PER_DAY = [3, 4, 5, 6] as const;
export const DIET_RESTRICTIONS = ['vegetarian', 'vegan', 'lactoseFree', 'glutenFree', 'other'] as const;
export const COOKING_TIME = ['little', 'medium', 'likes'] as const;
export const LUNCH_PLACES = ['home', 'lunchbox', 'restaurant'] as const;
export const WEIGHT_VISIBILITY = ['show', 'direction', 'hide'] as const;
export type WeightVisibility = (typeof WEIGHT_VISIBILITY)[number];

export type NumbersMode = (typeof NUMBERS_MODES)[number];
export type DietRestriction = (typeof DIET_RESTRICTIONS)[number];
export type CookingTime = (typeof COOKING_TIME)[number];
export type LunchPlace = (typeof LUNCH_PLACES)[number];

export type AddressForm = (typeof ADDRESS_FORMS)[number];
export type Goal = (typeof GOALS)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Hrt = (typeof HRT)[number];
export type Surgery = (typeof SURGERIES)[number];
export type ScreeningItem = (typeof SCREENING)[number];
export type Experience = (typeof EXPERIENCE)[number];
export type Limitation = (typeof LIMITATIONS)[number];

/** Dias da semana (0 = domingo) em que costumo treinar, a partir de quantos dias escolhi. */
export const DEFAULT_WEEKDAYS: Record<number, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 5, 6],
};

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const surgerySchema = z.object({
  kind: z.enum(SURGERIES),
  /** Data da cirurgia ("AAAA-MM-DD"). */
  date: dateKey.nullable().catch(null),
  /** "Liberação do cirurgião em" ("AAAA-MM-DD"); sem data = ainda em recuperação. */
  clearedOn: dateKey.nullable().catch(null),
});
export type SurgeryInfo = z.infer<typeof surgerySchema>;

export const profileSchema = z.object({
  address: z.enum(ADDRESS_FORMS).nullable().catch(null),
  goal: z.enum(GOALS).nullable().catch(null),
  priorities: z.array(z.enum(PRIORITIES)).catch([]),
  context: z.enum(CONTEXTS).nullable().catch(null),
  hrt: z.enum(HRT).nullable().catch(null),
  /** Há quanto tempo faz terapia hormonal (meses). O app nunca pergunta doses. */
  hrtMonths: z.number().int().min(0).max(600).nullable().catch(null),
  endocrinologist: z.boolean().nullable().catch(null),
  nutritionist: z.boolean().nullable().catch(null),
  surgery: surgerySchema.nullable().catch(null),
  screening: z.array(z.enum(SCREENING)).catch([]),
  /** A triagem foi respondida (mesmo com tudo "não")? */
  screeningAnswered: z.boolean().catch(false),
  experience: z.enum(EXPERIENCE).nullable().catch(null),
  daysPerWeek: z.number().int().min(2).max(5).nullable().catch(null),
  sessionMinutes: z.number().int().min(30).max(120).nullable().catch(null),
  /** Horário preferido para treinar (pergunta 10), para o lembrete. */
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().catch(null),
  limitations: z.array(z.enum(LIMITATIONS)).catch([]),
  /** Dias da semana de treino (0 = domingo). Vazio = usar o padrão de `daysPerWeek`. */
  weekdays: z.array(z.number().int().min(0).max(6)).catch([]),
  heightCm: z.number().min(100).max(250).nullable().catch(null),
  birthDate: dateKey.nullable().catch(null),
  weightKg: z.number().min(25).max(350).nullable().catch(null),
  /** Configurações › Perfil: incluir identidade, hormônios, cirurgias, peso e medidas nas perguntas à IA (seção 14.4). */
  includeContextInAi: z.boolean().catch(false),

  // ——— Alimentação (seção 8.1, perguntas 14–19) ———
  numbersMode: z.enum(NUMBERS_MODES).catch('proteinCarbs'),
  weightGoal: z.enum(WEIGHT_GOALS).nullable().catch(null),
  mealsPerDay: z.number().int().min(3).max(6).nullable().catch(null),
  /** Horário de cada refeição ("HH:MM"), por refeição. */
  mealTimes: z.record(z.string(), z.string().regex(/^\d{2}:\d{2}$/)).catch({}),
  restrictions: z.array(z.enum(DIET_RESTRICTIONS)).catch([]),
  /** "Não como": ids de alimentos. */
  dislikes: z.array(z.string()).catch([]),
  /** "Amo": ids de alimentos (aparecem mais). */
  likes: z.array(z.string()).catch([]),
  cookingTime: z.enum(COOKING_TIME).nullable().catch(null),
  lunchPlace: z.enum(LUNCH_PLACES).nullable().catch(null),
  /** "Meu médico pediu para limitar potássio" (seção 10.9). */
  limitPotassium: z.boolean().nullable().catch(null),
  /** Modo cardápio da nutri (seção 10.8): metas digitadas, sem gerar nem ajustar. */
  nutritionistMode: z.boolean().catch(false),
  nutriTargets: z
    .object({ kcal: z.number().min(0), protein: z.number().min(0), carbs: z.number().min(0), fat: z.number().min(0) })
    .nullable()
    .catch(null),

  // ——— Evolução (seção 11) ———
  /** "Esconder meu peso" (10.6): mostrar, só a direção, ou nada. */
  weightVisibility: z.enum(WEIGHT_VISIBILITY).catch('show'),
  /** Locais de medida que eu uso (11.2). */
  measureSites: z.array(z.enum(MEASURE_SITES)).catch([...DEFAULT_SITES]),
  /** Ajuste das metas de energia confirmado no check-in (10.1), em kcal. */
  kcalAdjustment: z.number().int().min(-1000).max(1000).catch(0),
  kcalAdjustedOn: dateKey.nullable().catch(null),
});

export type Profile = z.infer<typeof profileSchema>;

export const emptyProfile = (): Profile => profileSchema.parse({});

/** Os dias da semana de treino (os escolhidos ou o padrão para `daysPerWeek`). */
export function trainingWeekdays(profile: Pick<Profile, 'weekdays' | 'daysPerWeek'>): number[] {
  if (profile.weekdays.length) return [...profile.weekdays].sort((a, b) => a - b);
  return DEFAULT_WEEKDAYS[profile.daysPerWeek ?? 3] ?? DEFAULT_WEEKDAYS[3];
}

/** Idade completa em anos numa data. */
export function ageOn(birthDate: string, on: Date): number {
  const [y, m, d] = birthDate.split('-').map(Number);
  let age = on.getFullYear() - y;
  if (on.getMonth() + 1 < m || (on.getMonth() + 1 === m && on.getDate() < d)) age--;
  return age;
}

export const usesSpironolactone = (p: Pick<Profile, 'hrt'>) => p.hrt === 'estrogenSpiro';
export const usesCyproterone = (p: Pick<Profile, 'hrt'>) => p.hrt === 'estrogenCpa';
export const usesEstrogen = (p: Pick<Profile, 'hrt'>) =>
  p.hrt === 'estrogen' || p.hrt === 'estrogenSpiro' || p.hrt === 'estrogenCpa';
