import type { Food, MealItem, Portion } from './models';

/** Macros de uma quantidade. O app sempre calcula pela TACO (a IA nunca é a fonte, seção 14.2). */
export type Macros = { kcal: number; protein: number; carbs: number; fat: number };

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export function itemMacros(food: Pick<Food, 'kcal' | 'protein' | 'carbs' | 'fat'>, grams: number): Macros {
  const f = grams / 100;
  return { kcal: (food.kcal ?? 0) * f, protein: (food.protein ?? 0) * f, carbs: (food.carbs ?? 0) * f, fat: (food.fat ?? 0) * f };
}

export const addMacros = (a: Macros, b: Macros): Macros => ({
  kcal: a.kcal + b.kcal,
  protein: a.protein + b.protein,
  carbs: a.carbs + b.carbs,
  fat: a.fat + b.fat,
});

export function sumMacros(items: readonly MealItem[], find: (id: string) => Food | undefined): Macros {
  return items.reduce((sum, it) => {
    const food = find(it.foodId);
    return food ? addMacros(sum, itemMacros(food, it.grams)) : sum;
  }, ZERO);
}

/** Arredonda para mostrar: kcal e gramas inteiras. */
export const roundMacros = (m: Macros): Macros => ({
  kcal: Math.round(m.kcal),
  protein: Math.round(m.protein),
  carbs: Math.round(m.carbs),
  fat: Math.round(m.fat),
});

/** Quantidade em medida caseira: "4 colheres de sopa cheias". */
export type Household = { count: number; portion: Portion | null; grams: number };

/** Medidas em "unidade" ficam em meias unidades; colheres e conchas também (dá para medir meia). */
const STEP = 0.5;
/** Sem medida caseira, as gramas são arredondadas de 5 em 5. */
const GRAM_STEP = 5;

/**
 * Arredonda uma quantidade para a medida caseira mais prática (a primeira da lista do IBGE),
 * e devolve as gramas que isso dá de verdade.
 */
export function toHousehold(grams: number, portions: readonly Portion[] | undefined): Household {
  const portion = portions?.[0];
  if (!portion) {
    const g = Math.max(GRAM_STEP, Math.round(grams / GRAM_STEP) * GRAM_STEP);
    return { count: g, portion: null, grams: g };
  }
  const count = Math.max(STEP, Math.round(grams / portion.grams / STEP) * STEP);
  return { count, portion, grams: Math.round(count * portion.grams) };
}

/** "1½", "2", "½". */
export function formatCount(count: number): string {
  const whole = Math.floor(count);
  const half = count - whole >= 0.5;
  if (whole === 0) return half ? '½' : '0';
  return half ? `${whole}½` : String(whole);
}

/** "4 colheres de sopa cheias" / "1 unidade" / "120 g". */
export function householdLabel(h: Household): string {
  if (!h.portion) return `${h.grams} g`;
  const label = h.count > 1 ? h.portion.plural : h.portion.label;
  return `${formatCount(h.count)} ${label}`;
}

/**
 * Porções com a mão para o modo "Sem números" (seção 10.6; proposta): palma de proteína (~22 g),
 * punho de carboidrato (~25 g), mão em concha de fruta (~20 g de carboidrato) e polegar de gordura (~8 g).
 */
export type HandUnit = 'palm' | 'fist' | 'cupped' | 'thumb' | 'veggies';

export const HAND_GRAMS = { palm: 22, fist: 25, cupped: 20, thumb: 8 } as const;

export function handPortion(role: 'protein' | 'carb' | 'fruit' | 'fat' | 'vegetable', m: Macros): { unit: HandUnit; count: number } {
  const half = (v: number) => Math.max(0.5, Math.round(v * 2) / 2);
  switch (role) {
    case 'protein':
      return { unit: 'palm', count: half(m.protein / HAND_GRAMS.palm) };
    case 'carb':
      return { unit: 'fist', count: half(m.carbs / HAND_GRAMS.fist) };
    case 'fruit':
      return { unit: 'cupped', count: half(m.carbs / HAND_GRAMS.cupped) };
    case 'fat':
      return { unit: 'thumb', count: half(m.fat / HAND_GRAMS.thumb) };
    case 'vegetable':
      return { unit: 'veggies', count: 1 };
  }
}
