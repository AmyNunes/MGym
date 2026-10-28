import { entriesForDate, slotsForDate, type MealEntry, type MealSlotRecord, type MenuTargets } from '@/db/mealsRepo';
import { localDateKey } from '@/lib/dates';
import { useLoader } from '@/lib/useLoader';
import { addMacros, sumMacros, ZERO, type Macros } from '@/nutrition/macros';
import { findFood } from '@/stores/foodsStore';

import { ensureWeek } from './menuService';

export type MealsDay =
  | { status: 'needsProfile' }
  | { status: 'ready'; date: string; targets: MenuTargets; slots: MealSlotRecord[]; entries: MealEntry[]; eaten: Macros };

/** O cardápio de um dia: refeições, o que já comi e o total (seção 12.5). Gera a semana se precisar. */
export async function loadMealsDay(date: Date): Promise<MealsDay> {
  const week = await ensureWeek(date);
  if (week.status !== 'ready') return { status: 'needsProfile' };
  const key = localDateKey(date);
  const [slots, entries] = await Promise.all([slotsForDate(key), entriesForDate(key)]);
  const eaten = entries.reduce((sum, e) => addMacros(sum, sumMacros(e.items, findFood)), ZERO);
  return { status: 'ready', date: key, targets: week.plan.targets, slots, entries, eaten };
}

export function useMealsDay(date: Date) {
  return useLoader(() => loadMealsDay(date), localDateKey(date));
}
