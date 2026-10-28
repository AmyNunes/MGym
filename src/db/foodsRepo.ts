import { nowIso } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { normalizeSearch } from '@/lib/text';
import type { Food, Portion } from '@/nutrition/models';

import { getDb } from './client';

/** Alimentos (seção 10.2): TACO + os que eu criar, com porções caseiras do IBGE. */

type FoodRow = Omit<Food, 'favorite'> & { favorite: number };

const toFood = (r: FoodRow): Food => ({ ...r, favorite: r.favorite === 1 });

const COLUMNS = 'id, name, category, kcal, protein, carbs, fat, fiber, sodium, potassium, source, favorite';

/** Todos os alimentos (são ~600): o cache na memória usa isto para as contas. */
export async function listAllFoods(): Promise<Food[]> {
  const db = await getDb();
  return (await db.getAllAsync<FoodRow>(`SELECT ${COLUMNS} FROM foods ORDER BY name`)).map(toFood);
}

export async function listAllPortions(): Promise<{ foodId: string; label: string; plural: string; grams: number }[]> {
  const db = await getDb();
  return db.getAllAsync('SELECT foodId, label, plural, grams FROM food_portions ORDER BY foodId, position');
}

/**
 * Busca sem acento ("acai" acha "Açaí"): todas as palavras precisam aparecer.
 * Favoritos primeiro, depois os usados há pouco, depois por nome.
 */
export async function searchFoods(query: string, options: { category?: string; limit?: number } = {}): Promise<Food[]> {
  const db = await getDb();
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const where = words.map(() => 'searchName LIKE ?');
  const params: (string | number)[] = words.map((w) => `%${w}%`);
  if (options.category) {
    where.push('category = ?');
    params.push(options.category);
  }
  const rows = await db.getAllAsync<FoodRow>(
    `SELECT ${COLUMNS} FROM foods ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY favorite DESC, (lastUsedAt IS NULL), lastUsedAt DESC, name LIMIT ?`,
    ...params,
    options.limit ?? 80,
  );
  return rows.map(toFood);
}

export async function recentFoods(limit = 12): Promise<Food[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<FoodRow>(
    `SELECT ${COLUMNS} FROM foods WHERE lastUsedAt IS NOT NULL ORDER BY lastUsedAt DESC LIMIT ?`,
    limit,
  );
  return rows.map(toFood);
}

export async function favoriteFoods(): Promise<Food[]> {
  const db = await getDb();
  return (await db.getAllAsync<FoodRow>(`SELECT ${COLUMNS} FROM foods WHERE favorite = 1 ORDER BY name`)).map(toFood);
}

export async function categories(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ category: string }>('SELECT DISTINCT category FROM foods ORDER BY category');
  return rows.map((r) => r.category);
}

export async function setFavorite(id: string, favorite: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE foods SET favorite = ? WHERE id = ?', favorite ? 1 : 0, id);
}

/** Marca como usados agora (os "recentes"). */
export async function touchFoods(ids: readonly string[]): Promise<void> {
  if (!ids.length) return;
  const db = await getDb();
  await db.runAsync(`UPDATE foods SET lastUsedAt = ? WHERE id IN (${ids.map(() => '?').join(', ')})`, nowIso(), ...ids);
}

export type CustomFoodInput = Pick<Food, 'name' | 'kcal' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sodium' | 'potassium'> & {
  portion?: Portion | null;
};

/** Categoria dos alimentos que eu crio (com os valores do rótulo). */
export const CUSTOM_CATEGORY = 'Meus alimentos';

export async function insertCustomFood(input: CustomFoodInput): Promise<string> {
  const db = await getDb();
  const id = `custom-${newId()}`;
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO foods (id, name, searchName, category, kcal, protein, carbs, fat, fiber, sodium, potassium, source, favorite)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'custom', 0)`,
      id,
      input.name,
      normalizeSearch(input.name),
      CUSTOM_CATEGORY,
      input.kcal,
      input.protein,
      input.carbs,
      input.fat,
      input.fiber,
      input.sodium,
      input.potassium,
    );
    if (input.portion) {
      await db.runAsync(
        'INSERT INTO food_portions (foodId, position, label, plural, grams) VALUES (?, 0, ?, ?, ?)',
        id,
        input.portion.label,
        input.portion.plural,
        input.portion.grams,
      );
    }
  });
  return id;
}

/** Só alimentos meus podem ser apagados (os da TACO vêm com o app). */
export async function deleteCustomFood(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM foods WHERE id = ? AND source = 'custom'", id);
}
