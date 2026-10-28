import { getDb } from './client';

/**
 * Tabelas do backup (seção 15), em ordem de dependência (pais antes dos filhos).
 * Ficam de fora o cache da IA e os alimentos da TACO (vêm com o app); os meus alimentos entram.
 */
export const BACKUP_TABLES = [
  'settings',
  'profile',
  'routines',
  'plans',
  'plan_days',
  'workouts',
  'workout_exercises',
  'sets',
  'personal_records',
  'cardio',
  'meal_plans',
  'meal_slots',
  'meal_entries',
  'shopping_items',
  'weights',
  'measurements',
  'checkins',
  'coach_conversations',
  'notification_log',
  'ai_usage',
] as const;

/** Alimentos que eu criei (a TACO fica de fora). */
const CUSTOM_FOODS = 'foods';
/** Favoritos e "usados por último" dos alimentos da TACO. */
const FOOD_FLAGS = 'food_flags';

export type TableRows = Record<string, Record<string, unknown>[]>;

async function existingTables(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'");
  return new Set(rows.map((r) => r.name));
}

async function columnsOf(table: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.map((r) => r.name);
}

export async function schemaVersion(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

/** Lê tudo o que entra no backup. */
export async function dumpTables(): Promise<TableRows> {
  const db = await getDb();
  const existing = await existingTables();
  const out: TableRows = {};
  for (const table of BACKUP_TABLES) {
    if (existing.has(table)) out[table] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`);
  }
  out[CUSTOM_FOODS] = await db.getAllAsync<Record<string, unknown>>("SELECT * FROM foods WHERE source = 'custom'");
  out[FOOD_FLAGS] = await db.getAllAsync<Record<string, unknown>>(
    "SELECT id, favorite, lastUsedAt FROM foods WHERE source = 'taco' AND (favorite = 1 OR lastUsedAt IS NOT NULL)",
  );
  return out;
}

type SqlValue = string | number | null;
const toSql = (v: unknown): SqlValue => (v == null ? null : typeof v === 'number' || typeof v === 'string' ? v : JSON.stringify(v));

async function insertRows(table: string, rows: readonly Record<string, unknown>[], cols: readonly string[]) {
  const db = await getDb();
  for (const row of rows) {
    const keys = Object.keys(row).filter((k) => cols.includes(k));
    if (!keys.length) continue;
    await db.runAsync(
      // Nomes entre aspas: "values" (medidas) é palavra reservada do SQL.
      `INSERT OR REPLACE INTO ${table} (${keys.map((k) => `"${k}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
      ...keys.map((k) => toSql(row[k])),
    );
  }
}

async function clearAll() {
  const db = await getDb();
  const existing = await existingTables();
  // Filhos antes dos pais.
  for (const table of [...BACKUP_TABLES].reverse()) if (existing.has(table)) await db.runAsync(`DELETE FROM ${table}`);
  await db.runAsync('DELETE FROM ai_cache');
  await db.runAsync("DELETE FROM foods WHERE source = 'custom'");
  await db.runAsync("UPDATE foods SET favorite = 0, lastUsedAt = NULL WHERE source = 'taco'");
}

/** "Substituir tudo": apaga e regrava numa transação (se algo falhar, nada muda). */
export async function replaceTables(data: TableRows): Promise<void> {
  const db = await getDb();
  const existing = await existingTables();
  const columns = new Map<string, string[]>();
  for (const table of [...BACKUP_TABLES, 'foods']) if (existing.has(table)) columns.set(table, await columnsOf(table));

  await db.withTransactionAsync(async () => {
    await clearAll();
    for (const table of BACKUP_TABLES) {
      const cols = columns.get(table);
      if (cols) await insertRows(table, data[table] ?? [], cols);
    }
    const foodCols = columns.get('foods') ?? [];
    await insertRows('foods', (data[CUSTOM_FOODS] ?? []).filter((r) => r.source === 'custom'), foodCols);
    for (const flag of data[FOOD_FLAGS] ?? []) {
      await db.runAsync(
        "UPDATE foods SET favorite = ?, lastUsedAt = ? WHERE id = ? AND source = 'taco'",
        toSql(flag.favorite) ?? 0,
        toSql(flag.lastUsedAt),
        toSql(flag.id),
      );
    }
  });
}

/** "Apagar tudo": todas as tabelas, o cache da IA e os meus alimentos. */
export async function wipeAllTables(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(clearAll);
}
