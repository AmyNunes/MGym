import { z } from 'zod';

import { PROVIDER_IDS, PROVIDERS } from '@/ai/providers';
import { notificationSettingsSchema } from '@/notifications/types';

/*
 * Cada grupo de configurações é salvo numa chave da tabela `settings`.
 * Todo campo tem `.catch(padrão)`: se faltar ou vier inválido, usa o padrão
 * sem perder os outros campos.
 */

export const appearanceSchema = z
  .object({
    themePreference: z.enum(['system', 'light', 'dark']).catch('system'),
  })
  .catch({ themePreference: 'system' as const });

const aiDefaults = {
  provider: 'gemini' as const,
  baseUrl: PROVIDERS.gemini.baseUrl,
  model: '',
  inputPricePerMillion: null,
  outputPricePerMillion: null,
  monthlyLimit: null,
  jsonModeUnsupported: [],
};

export const aiSettingsSchema = z
  .object({
    provider: z.enum(PROVIDER_IDS).catch(aiDefaults.provider),
    baseUrl: z.string().catch(aiDefaults.baseUrl),
    model: z.string().catch(aiDefaults.model),
    /** US$ por milhão de tokens (opcional, só para estimar o gasto). */
    inputPricePerMillion: z.number().nonnegative().nullable().catch(null),
    outputPricePerMillion: z.number().nonnegative().nullable().catch(null),
    /** Limite mensal em US$. Ao chegar a 100%, as funções de IA pausam. */
    monthlyLimit: z.number().positive().nullable().catch(null),
    /** "url|modelo" que recusaram `response_format: json_object`. */
    jsonModeUnsupported: z.array(z.string()).catch([]),
  })
  .catch(aiDefaults);

export const INCREMENT_OPTIONS = [1, 2, 2.5, 5] as const;

const workoutDefaults = {
  keepAwake: true,
  incrementUpper: 2.5,
  incrementLower: 5,
  askRir: true,
  autoWarmup: false,
  customRest: false,
  restCompound: 150,
  restIsolation: 75,
  restCore: 45,
  barKg: 20,
};

const increment = (fallback: number) =>
  z
    .number()
    .refine((v) => (INCREMENT_OPTIONS as readonly number[]).includes(v))
    .catch(fallback);
const rest = (fallback: number) => z.number().int().min(15).max(600).catch(fallback);

/** Treino (seção 12.7, item 2). */
export const workoutSettingsSchema = z
  .object({
    /** Tela acesa durante o treino em andamento. */
    keepAwake: z.boolean().catch(workoutDefaults.keepAwake),
    /** Menor incremento de carga: superiores e isoladores / compostos de pernas (seção 9.4). */
    incrementUpper: increment(workoutDefaults.incrementUpper),
    incrementLower: increment(workoutDefaults.incrementLower),
    /** Perguntar "Quantas ainda sobravam?" na última série. */
    askRir: z.boolean().catch(workoutDefaults.askRir),
    /** Pôr as séries de aproximação sozinhas no primeiro composto de cada grupo. */
    autoWarmup: z.boolean().catch(workoutDefaults.autoWarmup),
    /** Usar o descanso abaixo em vez do sugerido de cada exercício. */
    customRest: z.boolean().catch(workoutDefaults.customRest),
    restCompound: rest(workoutDefaults.restCompound),
    restIsolation: rest(workoutDefaults.restIsolation),
    restCore: rest(workoutDefaults.restCore),
    /** Barra da calculadora de anilhas (seção 9.8). */
    barKg: z.number().min(0).max(30).catch(workoutDefaults.barKg),
  })
  .catch(workoutDefaults);

const celebrationsDefaults = { recordGlow: true, haptics: true };

/** Celebrações (seção 12.7, item 4) e a vibração sutil (seção 4.3). Tudo desligável. */
export const celebrationsSchema = z
  .object({
    recordGlow: z.boolean().catch(celebrationsDefaults.recordGlow),
    haptics: z.boolean().catch(celebrationsDefaults.haptics),
  })
  .catch(celebrationsDefaults);

const tipsDefaults = { seen: [] as string[] };

/** Dicas de gesto (CoachMark) que já apareceram uma vez (seção 7). */
export const tipsSchema = z.object({ seen: z.array(z.string()).catch([]) }).catch(tipsDefaults);

export const settingsGroups = {
  appearance: appearanceSchema,
  ai: aiSettingsSchema,
  workout: workoutSettingsSchema,
  celebrations: celebrationsSchema,
  tips: tipsSchema,
  notifications: notificationSettingsSchema,
};

export type SettingsGroups = typeof settingsGroups;
export type SettingsGroup = keyof SettingsGroups;
export type Settings = { [K in SettingsGroup]: z.output<SettingsGroups[K]> };
export type AppearanceSettings = Settings['appearance'];
export type AISettings = Settings['ai'];
export type WorkoutSettings = Settings['workout'];
export type CelebrationSettings = Settings['celebrations'];
export type { NotificationSettings } from '@/notifications/types';
