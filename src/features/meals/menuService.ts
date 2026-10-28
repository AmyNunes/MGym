import { MEAL_TEMPLATES } from '@/data/meals';
import { touchFoods } from '@/db/foodsRepo';
import {
  deleteEntriesFor,
  getMealPlan,
  getSlot,
  insertEntry,
  replaceDay,
  saveMealPlan,
  saveShoppingList,
  slotsBetween,
  templateUsage,
  updateMealPlanTargets,
  updateSlot,
  type MealPlanRecord,
  type MealSlotRecord,
  type MenuTargets,
} from '@/db/mealsRepo';
import { loadSafetyState } from '@/features/body/safetyState';
import { mealSlots, profileTargets } from '@/features/nutrition/profileTargets';
import { addDays, localDateKey, parseDateKey } from '@/lib/dates';
import { generateDays, type GeneratedDay, type MenuPrefs } from '@/nutrition/menu';
import { buildShoppingList } from '@/nutrition/shopping';
import { splitTargets } from '@/nutrition/targets';
import type { Profile } from '@/profile/profile';
import { findFood, loadFoods, portionsOf, useFoods } from '@/stores/foodsStore';
import { patchProfile, useProfile } from '@/stores/profileStore';
import { weekKey } from '@/training/schedule';

/** Cardápio da semana (seção 10.3): gerado quando a semana começa (ou ao terminar o Guia) e guardado. */

const lookups = { find: findFood, portionsOf };

export function menuPrefs(p: Profile): MenuPrefs {
  return {
    restrictions: p.restrictions,
    dislikes: p.dislikes,
    likes: p.likes,
    cookingTime: p.cookingTime,
    lunchPlace: p.lunchPlace,
    limitPotassium: p.limitPotassium === true,
  };
}

const weekDates = (weekStart: string) => Array.from({ length: 7 }, (_, i) => localDateKey(addDays(parseDateKey(weekStart), i)));

/** Metas da semana. Com um sinal de alerta ou cintura/altura < 0,40, sem déficit (16.4). */
async function menuTargets(profile: Profile): Promise<MenuTargets | null> {
  const safety = await loadSafetyState(profile).catch(() => null);
  const day = profileTargets(profile, new Date(), safety?.blockDeficit ?? false);
  if (!day) return null;
  const slots = mealSlots(profile).map((s) => s.slot);
  return { day, slots: splitTargets(day, slots) };
}

function generate(profile: Profile, targets: MenuTargets, dates: string[], seed: string, usage?: Map<string, number>): GeneratedDay[] {
  const slots = mealSlots(profile);
  if (profile.nutritionistMode) {
    // Modo da nutri (10.8): o app não monta sozinho; as opções vêm do que eu montar.
    return dates.map((date) => ({ date, slots: slots.map((s) => ({ ...s, options: [] })) }));
  }
  return generateDays({ dates, slots, targets: targets.slots, templates: MEAL_TEMPLATES, prefs: menuPrefs(profile), lookups, seed, usage });
}

export type WeekResult = { status: 'ready'; plan: MealPlanRecord } | { status: 'needsProfile' };

/** A semana do dia pedido; gera e guarda se ainda não existe. */
export async function ensureWeek(date: Date): Promise<WeekResult> {
  await loadFoods();
  const weekStart = weekKey(date);
  const existing = await getMealPlan(weekStart);
  if (existing) return { status: 'ready', plan: existing };
  const profile = useProfile.getState().profile;
  const targets = await menuTargets(profile);
  if (!targets) return { status: 'needsProfile' };
  await saveMealPlan(weekStart, targets, generate(profile, targets, weekDates(weekStart), weekStart));
  const plan = await getMealPlan(weekStart);
  return plan ? { status: 'ready', plan } : { status: 'needsProfile' };
}

/** "Gerar de novo" a semana inteira (com as metas e preferências de agora). */
export async function regenerateWeek(date: Date): Promise<void> {
  await loadFoods();
  const profile = useProfile.getState().profile;
  const targets = await menuTargets(profile);
  if (!targets) return;
  const weekStart = weekKey(date);
  await saveMealPlan(weekStart, targets, generate(profile, targets, weekDates(weekStart), `${weekStart}|${Date.now()}`));
}

/** Metas novas na semana sem mexer nas refeições (usado quando digito as metas da nutri). */
export async function updateWeekTargets(date: Date): Promise<void> {
  const targets = await menuTargets(useProfile.getState().profile);
  if (targets) await updateMealPlanTargets(weekKey(date), targets);
}

/** "Gerar de novo" um dia, sem repetir demais o que o resto da semana já tem. */
export async function regenerateDay(date: Date): Promise<void> {
  const result = await ensureWeek(date);
  if (result.status !== 'ready') return;
  const profile = useProfile.getState().profile;
  const day = localDateKey(date);
  const usage = await templateUsage(result.plan.id, day);
  const [generated] = generate(profile, result.plan.targets, [day], `${day}|${Date.now()}`, usage);
  await replaceDay(result.plan.id, generated);
}

export async function chooseOption(slot: MealSlotRecord, index: number | null): Promise<void> {
  await updateSlot(slot.id, { chosenIndex: index });
}

/** "Comi": registra o que comi (os números vêm da TACO); tocar de novo desmarca. */
export async function toggleAte(slot: MealSlotRecord, index: number): Promise<boolean> {
  if (slot.eatenAt) {
    await deleteEntriesFor(slot.date, slot.slot, 'plan');
    await updateSlot(slot.id, { eatenAt: null });
    return false;
  }
  const option = slot.options[index];
  if (!option) return false;
  await insertEntry({ date: slot.date, slot: slot.slot, items: option.items, source: 'plan' });
  await updateSlot(slot.id, { eatenAt: new Date().toISOString(), chosenIndex: index });
  await touchFoods(option.items.map((i) => i.foodId));
  return true;
}

/** Troca um alimento de uma opção pelo equivalente escolhido (seção 10.5). */
export async function swapItem(slotId: string, optionIndex: number, itemIndex: number, foodId: string, grams: number): Promise<void> {
  const slot = await getSlot(slotId);
  const option = slot?.options[optionIndex];
  if (!slot || !option) return;
  const items = option.items.map((it, i) => (i === itemIndex ? { foodId, grams } : it));
  const options = slot.options.map((o, i) => (i === optionIndex ? { ...o, items } : o));
  await updateSlot(slotId, { options });
}

/** "Não gosto disso": entra em "Não como" (o próximo cardápio respeita). */
export async function dislikeFood(foodId: string): Promise<void> {
  const p = useProfile.getState().profile;
  await patchProfile({ dislikes: [...new Set([...p.dislikes, foodId])] });
}

/** Lista de compras dos próximos dias, com a opção escolhida (ou a primeira) de cada refeição. */
export async function generateShopping(from: Date, days: 3 | 7): Promise<void> {
  await loadFoods();
  await ensureWeek(from);
  const to = addDays(from, days - 1);
  if (weekKey(to) !== weekKey(from)) await ensureWeek(to);
  const slots = await slotsBetween(localDateKey(from), localDateKey(to));
  const items = slots.flatMap((s) => s.options[s.chosenIndex ?? 0]?.items ?? []);
  const lines = buildShoppingList(items, findFood, [...useFoods.getState().foods.values()], portionsOf);
  await saveShoppingList(localDateKey(from), lines);
}

/** Modo da nutri (10.8): acrescenta um alimento a uma opção (ou cria a opção, se `optionIndex` for a próxima). */
export async function addItemToOption(slotId: string, optionIndex: number, foodId: string, grams: number, newName: string): Promise<void> {
  const slot = await getSlot(slotId);
  if (!slot) return;
  const options = [...slot.options];
  const current = options[optionIndex] ?? { name: newName, templateId: null, items: [] };
  options[optionIndex] = { ...current, items: [...current.items, { foodId, grams }] };
  await updateSlot(slotId, { options });
  await touchFoods([foodId]);
}

/** Modo da nutri: uma refeição-modelo vira opção, nas quantidades base (sem escalar). */
export async function addOptionFromTemplate(slotId: string, templateId: string): Promise<void> {
  const slot = await getSlot(slotId);
  const template = MEAL_TEMPLATES.find((t) => t.id === templateId);
  if (!slot || !template) return;
  const option = { name: template.name, templateId, items: template.items.map((i) => ({ foodId: `taco-${i.foodId}`, grams: i.grams })) };
  await updateSlot(slotId, { options: [...slot.options, option] });
}

/** Tira um alimento de uma opção (a opção some se ficar vazia). */
export async function removeItem(slotId: string, optionIndex: number, itemIndex: number): Promise<void> {
  const slot = await getSlot(slotId);
  const option = slot?.options[optionIndex];
  if (!slot || !option) return;
  const items = option.items.filter((_, i) => i !== itemIndex);
  const options = items.length
    ? slot.options.map((o, i) => (i === optionIndex ? { ...o, items } : o))
    : slot.options.filter((_, i) => i !== optionIndex);
  await updateSlot(slotId, { options, chosenIndex: null });
}
