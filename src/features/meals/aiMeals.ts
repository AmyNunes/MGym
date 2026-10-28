import { describeMeal, suggestMealOptions, toCandidate, type DescribedItem, type FoodCandidate } from '@/ai/functions/meals';
import { profileContext } from '@/ai/prompts/common';
import { touchFoods } from '@/db/foodsRepo';
import { getMealPlan, getSlot, insertEntry, updateSlot } from '@/db/mealsRepo';
import { strings } from '@/i18n/strings';
import { normalizeSearch } from '@/lib/text';
import { friendlyName } from '@/nutrition/display';
import type { MealSlot } from '@/nutrition/models';
import { fitsRestrictions } from '@/nutrition/restrictions';
import { roleOf } from '@/nutrition/swaps';
import type { Profile } from '@/profile/profile';
import { findFood, loadFoods, portionsOf, useFoods } from '@/stores/foodsStore';
import { useProfile } from '@/stores/profileStore';
import { weekKey } from '@/training/schedule';

/** Cardápio com IA (seção 14.3): a IA escolhe entre os alimentos do banco; o app faz as contas. */

const lookups = { find: findFood, portionsOf };

/** Os alimentos que a IA pode usar numa opção: com medida caseira (ou meus), sem "não como" e nas restrições. */
export function optionCandidates(profile: Profile): FoodCandidate[] {
  const { foods, portions } = useFoods.getState();
  return [...foods.values()]
    .filter((f) => (portions.has(f.id) || f.source === 'custom') && f.kcal != null && roleOf(f) != null)
    .filter((f) => !profile.dislikes.includes(f.id) && fitsRestrictions(f, profile.restrictions))
    .map((f) => toCandidate(f, friendlyName(f.name)));
}

const MAX_TEXT_MATCHES = 60;

/** Para "Descrever com IA": os alimentos comuns e os que batem com as palavras da descrição. */
export function describeCandidates(text: string): FoodCandidate[] {
  const { foods, portions } = useFoods.getState();
  const words = normalizeSearch(text)
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  const matches = [...foods.values()]
    .filter((f) => words.some((w) => normalizeSearch(f.name).includes(w)))
    .slice(0, MAX_TEXT_MATCHES);
  const common = [...foods.values()].filter((f) => portions.has(f.id) || f.source === 'custom');
  const byId = new Map([...common, ...matches].map((f) => [f.id, f]));
  return [...byId.values()].map((f) => toCandidate(f, friendlyName(f.name)));
}

/** "Novas opções com IA" numa refeição: troca as opções (se ainda não comi). Devolve quantas vieram. */
export async function aiOptionsForSlot(slotId: string): Promise<number> {
  await loadFoods();
  const profile = useProfile.getState().profile;
  const slot = await getSlot(slotId);
  if (!slot || slot.eatenAt) return 0;
  const plan = await getMealPlan(weekKey(new Date(`${slot.date}T12:00:00`)));
  const target = plan?.targets.slots[slot.slot];
  if (!target) return 0;
  const options = await suggestMealOptions(
    {
      slotName: strings.meals.slots[slot.slot],
      target,
      context: profileContext(profile),
      likes: profile.likes.map((id) => friendlyName(findFood(id)?.name ?? '')).filter(Boolean),
      current: slot.options.map((o) => o.name),
      foods: optionCandidates(profile),
    },
    lookups,
  );
  if (!options.length) return 0;
  await updateSlot(slot.id, { options, chosenIndex: null });
  return options.length;
}

/** "Descrever com IA": texto → alimentos do banco, para eu conferir antes de salvar. */
export async function describeMealText(text: string): Promise<DescribedItem[]> {
  await loadFoods();
  return describeMeal(text.trim(), describeCandidates(text));
}

/** Salva o que conferi como "o que comi" (origem `ai`). */
export async function saveDescribed(date: string, slot: MealSlot, items: readonly DescribedItem[]): Promise<void> {
  if (!items.length) return;
  await insertEntry({ date, slot, items: items.map(({ foodId, grams }) => ({ foodId, grams })), source: 'ai' });
  await touchFoods(items.map((i) => i.foodId));
}
