import { z } from 'zod';

import { nowIso } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { parseJsonWith } from '@/lib/json';
import type { GeneratedDay, MenuOption } from '@/nutrition/menu';
import { MEAL_SLOTS, type MealItem, type MealSlot } from '@/nutrition/models';
import type { ShoppingLine } from '@/nutrition/shopping';
import type { MacroTargets } from '@/nutrition/targets';

import { getDb } from './client';

/** Cardápio (seção 15): semana (`meal_plans`), refeições do dia (`meal_slots`), o que comi (`meal_entries`). */

const itemsSchema = z.array(z.object({ foodId: z.string(), grams: z.number().positive() }));
const optionsSchema = z.array(z.object({ name: z.string(), templateId: z.string().nullable(), items: itemsSchema }));
const targetsSchema = z.object({
  day: z.object({ kcal: z.number(), protein: z.number(), carbs: z.number(), fat: z.number() }),
  slots: z.record(z.string(), z.object({ kcal: z.number(), protein: z.number(), carbs: z.number(), fat: z.number() })),
});

export type MenuTargets = { day: MacroTargets; slots: Record<string, MacroTargets> };

export type MealPlanRecord = { id: string; weekStart: string; targets: MenuTargets; createdAt: string };

export type MealSlotRecord = {
  id: string;
  mealPlanId: string;
  date: string;
  slot: MealSlot;
  time: string;
  options: MenuOption[];
  chosenIndex: number | null;
  eatenAt: string | null;
};

export type EntrySource = 'plan' | 'search' | 'ai';
export type MealEntry = { id: string; date: string; slot: MealSlot; items: MealItem[]; source: EntrySource; createdAt: string };

type SlotRow = Omit<MealSlotRecord, 'options' | 'slot'> & { options: string; slot: string };
type EntryRow = Omit<MealEntry, 'items' | 'slot' | 'source'> & { items: string; slot: string; source: string };

const toSlotKey = (s: string): MealSlot => ((MEAL_SLOTS as readonly string[]).includes(s) ? (s as MealSlot) : 'lunch');
const toSlot = (r: SlotRow): MealSlotRecord => ({ ...r, slot: toSlotKey(r.slot), options: parseJsonWith(r.options, optionsSchema, []) });
const toEntry = (r: EntryRow): MealEntry => ({
  ...r,
  slot: toSlotKey(r.slot),
  source: r.source === 'search' || r.source === 'ai' ? r.source : 'plan',
  items: parseJsonWith(r.items, itemsSchema, []),
});

export async function getMealPlan(weekStart: string): Promise<MealPlanRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: string; weekStart: string; targets: string; createdAt: string }>(
    'SELECT * FROM meal_plans WHERE weekStart = ? ORDER BY createdAt DESC LIMIT 1',
    weekStart,
  );
  if (!row) return null;
  const targets = parseJsonWith<MenuTargets | null>(row.targets, targetsSchema, null);
  return targets ? { ...row, targets } : null;
}

async function insertSlots(planId: string, days: readonly GeneratedDay[]) {
  const db = await getDb();
  for (const day of days) {
    for (const s of day.slots) {
      await db.runAsync(
        'INSERT INTO meal_slots (id, mealPlanId, date, slot, time, options, chosenIndex, eatenAt) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)',
        newId(),
        planId,
        day.date,
        s.slot,
        s.time,
        JSON.stringify(s.options),
      );
    }
  }
}

/** Grava a semana gerada (substitui a anterior da mesma semana). Devolve o id. */
export async function saveMealPlan(weekStart: string, targets: MenuTargets, days: readonly GeneratedDay[]): Promise<string> {
  const db = await getDb();
  const id = newId();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM meal_plans WHERE weekStart = ?', weekStart);
    await db.runAsync(
      'INSERT INTO meal_plans (id, weekStart, targets, createdAt) VALUES (?, ?, ?, ?)',
      id,
      weekStart,
      JSON.stringify(targets),
      nowIso(),
    );
    await insertSlots(id, days);
  });
  return id;
}

/** Troca só as metas da semana (modo da nutri: as opções montadas à mão continuam). */
export async function updateMealPlanTargets(weekStart: string, targets: MenuTargets): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE meal_plans SET targets = ? WHERE weekStart = ?', JSON.stringify(targets), weekStart);
}

/** "Gerar de novo" um dia: troca as refeições do dia (o que já comi continua registrado). */
export async function replaceDay(planId: string, day: GeneratedDay): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM meal_slots WHERE mealPlanId = ? AND date = ?', planId, day.date);
    await insertSlots(planId, [day]);
  });
}

export async function slotsForDate(date: string): Promise<MealSlotRecord[]> {
  const db = await getDb();
  return (await db.getAllAsync<SlotRow>('SELECT * FROM meal_slots WHERE date = ? ORDER BY time', date)).map(toSlot);
}

export async function slotsBetween(from: string, to: string): Promise<MealSlotRecord[]> {
  const db = await getDb();
  return (await db.getAllAsync<SlotRow>('SELECT * FROM meal_slots WHERE date >= ? AND date <= ? ORDER BY date, time', from, to)).map(
    toSlot,
  );
}

export async function getSlot(id: string): Promise<MealSlotRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SlotRow>('SELECT * FROM meal_slots WHERE id = ?', id);
  return row ? toSlot(row) : null;
}

export async function updateSlot(id: string, patch: Partial<Pick<MealSlotRecord, 'options' | 'chosenIndex' | 'eatenAt'>>): Promise<void> {
  const entries = Object.entries(patch).map(([k, v]) => [k, k === 'options' ? JSON.stringify(v) : v] as const);
  if (!entries.length) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE meal_slots SET ${entries.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`,
    ...entries.map(([, v]) => v as string | number | null),
    id,
  );
}

/** Uso de cada refeição-modelo na semana (para não repetir mais de 2×). */
export async function templateUsage(planId: string, exceptDate?: string): Promise<Map<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<SlotRow>('SELECT * FROM meal_slots WHERE mealPlanId = ? AND date IS NOT ?', planId, exceptDate ?? null);
  const usage = new Map<string, number>();
  for (const s of rows.map(toSlot)) {
    for (const o of s.options) if (o.templateId) usage.set(o.templateId, (usage.get(o.templateId) ?? 0) + 1);
  }
  return usage;
}

// ——— O que comi ———

export async function insertEntry(entry: Omit<MealEntry, 'id' | 'createdAt'>): Promise<string> {
  const db = await getDb();
  const id = newId();
  await db.runAsync(
    'INSERT INTO meal_entries (id, date, slot, items, source, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    entry.date,
    entry.slot,
    JSON.stringify(entry.items),
    entry.source,
    nowIso(),
  );
  return id;
}

export async function entriesForDate(date: string): Promise<MealEntry[]> {
  const db = await getDb();
  return (await db.getAllAsync<EntryRow>('SELECT * FROM meal_entries WHERE date = ? ORDER BY createdAt', date)).map(toEntry);
}

export async function entriesBetween(from: string, to: string): Promise<MealEntry[]> {
  const db = await getDb();
  return (await db.getAllAsync<EntryRow>('SELECT * FROM meal_entries WHERE date >= ? AND date <= ? ORDER BY date', from, to)).map(toEntry);
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM meal_entries WHERE id = ?', id);
}

export async function deleteEntriesFor(date: string, slot: MealSlot, source: EntrySource): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM meal_entries WHERE date = ? AND slot = ? AND source = ?', date, slot, source);
}

// ——— Lista de compras ———

export type ShoppingItem = { id: string; listStart: string; label: string; quantity: string; section: string; checked: boolean };

export async function saveShoppingList(listStart: string, lines: readonly ShoppingLine[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM shopping_items');
    for (const l of lines) {
      await db.runAsync(
        'INSERT INTO shopping_items (id, listStart, label, quantity, section, checked) VALUES (?, ?, ?, ?, ?, 0)',
        newId(),
        listStart,
        l.label,
        l.quantity,
        l.section,
      );
    }
  });
}

export async function shoppingList(): Promise<ShoppingItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Omit<ShoppingItem, 'checked'> & { checked: number }>('SELECT * FROM shopping_items');
  return rows.map((r) => ({ ...r, checked: r.checked === 1 }));
}

export async function setShoppingChecked(id: string, checked: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE shopping_items SET checked = ? WHERE id = ?', checked ? 1 : 0, id);
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM shopping_items WHERE id = ?', id);
}

/** Volta um item apagado da lista (o "Desfazer"). */
export async function restoreShoppingItem(item: ShoppingItem): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO shopping_items (id, listStart, label, quantity, section, checked) VALUES (?, ?, ?, ?, ?, ?)',
    item.id,
    item.listStart,
    item.label,
    item.quantity,
    item.section,
    item.checked ? 1 : 0,
  );
}
