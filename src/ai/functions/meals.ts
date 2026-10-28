import { scaleItems, type Lookups, type MenuOption } from '@/nutrition/menu';
import type { Food, Role } from '@/nutrition/models';
import { roleOf } from '@/nutrition/swaps';

import { callAI } from '../client';
import { describeMealPrompt, mealOptionsPrompt, type FoodCandidate } from '../prompts/meals';
import { describedMealSchema, mealOptionsSchema } from '../schemas';

/**
 * `mealOptions` (seção 14.3). Regra de ouro: a IA só escolhe alimentos do banco (ids validados);
 * as quantidades finais e os números saem da escala do app, pela TACO.
 */
export async function suggestMealOptions(
  input: Parameters<typeof mealOptionsPrompt>[0],
  lookups: Lookups,
): Promise<MenuOption[]> {
  const { data } = await callAI('mealOptions', mealOptionsPrompt(input), mealOptionsSchema, { temperature: 0.7 });
  const allowed = new Set(input.foods.map((f) => f.id));
  return data.options.flatMap((option) => {
    const items = option.items.flatMap((item) => {
      const food = allowed.has(item.foodId) ? lookups.find(item.foodId) : undefined;
      const role: Role | null = food ? roleOf(food) : null;
      return food ? [{ id: item.foodId, grams: item.grams, role: role ?? 'vegetable' }] : [];
    });
    if (!items.some((i) => i.role === 'protein' || i.role === 'carb')) return [];
    return [scaleItems(option.namePt.trim(), items, input.target, lookups)];
  });
}

export type DescribedItem = { foodId: string; grams: number; confidence: number };

const MIN_GRAMS = 5;
const MAX_GRAMS = 1000;

/** `describeMeal` (seção 14.3): só ids da lista; gramas arredondadas a 5 g. */
export async function describeMeal(text: string, foods: readonly FoodCandidate[]): Promise<DescribedItem[]> {
  const { data } = await callAI('describeMeal', describeMealPrompt(text, foods), describedMealSchema, { temperature: 0.2 });
  const allowed = new Set(foods.map((f) => f.id));
  const seen = new Set<string>();
  return data.items.flatMap((item) => {
    if (!allowed.has(item.foodId) || seen.has(item.foodId)) return [];
    seen.add(item.foodId);
    const grams = Math.min(MAX_GRAMS, Math.max(MIN_GRAMS, Math.round(item.grams / 5) * 5));
    return [{ foodId: item.foodId, grams, confidence: item.confidence }];
  });
}

export type { FoodCandidate };

/** Ajuda para montar a lista: id, nome curto e papel. */
export function toCandidate(food: Food, name: string): FoodCandidate {
  return { id: food.id, name, role: roleOf(food) ?? 'other' };
}
