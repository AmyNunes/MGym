import { z } from 'zod';

/**
 * Modelos do Cardápio (seção 10): alimentos (TACO + os meus), porções caseiras (IBGE)
 * e refeições-modelo escritas por nós.
 */

export type FoodSource = 'taco' | 'custom';

/** Valores por 100 g. Nulo = sem dado na TACO. */
export type Food = {
  id: string;
  name: string;
  category: string;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sodium: number | null;
  potassium: number | null;
  source: FoodSource;
  favorite: boolean;
};

/** Id estável de um alimento da TACO no app ("taco-3" = Arroz, tipo 1, cozido). */
export const tacoId = (n: number) => `taco-${n}`;

/** Uma medida caseira (IBGE POF 2008–2009): "colher de sopa cheia" = 25 g. */
export type Portion = { label: string; plural: string; grams: number };

/** `src/data/portions-v1.json`: medidas por número da TACO. */
export const portionsFileSchema = z.object({
  source: z.string(),
  portions: z.record(
    z.string().regex(/^\d+$/),
    z.array(z.tuple([z.string().min(2), z.string().min(2), z.number().positive().max(2000)])).min(1),
  ),
});

/** Refeições do dia (seção 8.1, pergunta 16). */
export const MEAL_SLOTS = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'supper'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

/** Onde uma refeição-modelo cabe (seção 10.3): café · almoço · jantar · lanche · ceia. */
export const MEAL_KINDS = ['breakfast', 'lunch', 'dinner', 'snack', 'supper'] as const;
export type MealKind = (typeof MEAL_KINDS)[number];

export const SLOT_KIND: Record<MealSlot, MealKind> = {
  breakfast: 'breakfast',
  morningSnack: 'snack',
  lunch: 'lunch',
  afternoonSnack: 'snack',
  dinner: 'dinner',
  supper: 'supper',
};

/** Papel de cada item na refeição: a escala mexe por papel (seção 10.3). */
export const ROLES = ['protein', 'carb', 'fat', 'vegetable', 'fruit'] as const;
export type Role = (typeof ROLES)[number];

export const MEAL_TAGS = ['vegetarian', 'vegan', 'lactoseFree', 'glutenFree', 'lunchbox', 'restaurant'] as const;
export type MealTag = (typeof MEAL_TAGS)[number];

export const mealTemplateSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(3),
  kinds: z.array(z.enum(MEAL_KINDS)).min(1),
  /** Tempo de preparo em minutos. */
  prepMinutes: z.number().int().min(0).max(120),
  tags: z.array(z.enum(MEAL_TAGS)),
  items: z
    .array(
      z.object({
        /** Número do alimento na TACO. */
        foodId: z.number().int().min(1).max(597),
        /** Quantidade base (uma refeição média), em gramas. */
        grams: z.number().positive().max(600),
        role: z.enum(ROLES),
      }),
    )
    .min(1),
});

export type MealTemplate = z.infer<typeof mealTemplateSchema>;
export type MealItem = { foodId: string; grams: number };
