import foodsFile from '@/data/foods-v1.json';
import portionsFile from '@/data/portions-v1.json';
import { normalizeSearch } from '@/lib/text';
import { portionsFileSchema } from '@/nutrition/models';

import type { Db, Migration } from '../types';

/** Linhas por INSERT (o SQLite aceita até 999 parâmetros por comando). */
const CHUNK = 50;

async function insertChunked(db: Db, sql: string, rows: (string | number | null)[][]) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const placeholders = chunk.map((r) => `(${r.map(() => '?').join(', ')})`).join(', ');
    await db.runAsync(`${sql} VALUES ${placeholders}`, ...chunk.flat());
  }
}

// Fase 4. Nunca edite esta migration: crie outra.
export const migration004: Migration = {
  version: 4,
  name: 'meals',
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE foods (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        searchName TEXT NOT NULL,
        category TEXT NOT NULL,
        kcal REAL,
        protein REAL,
        carbs REAL,
        fat REAL,
        fiber REAL,
        sodium REAL,
        potassium REAL,
        source TEXT NOT NULL,
        favorite INTEGER NOT NULL DEFAULT 0,
        lastUsedAt TEXT
      );
      CREATE INDEX idx_foods_name ON foods(searchName);

      CREATE TABLE food_portions (
        foodId TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        label TEXT NOT NULL,
        plural TEXT NOT NULL,
        grams REAL NOT NULL,
        PRIMARY KEY (foodId, position)
      );

      CREATE TABLE meal_plans (
        id TEXT PRIMARY KEY NOT NULL,
        weekStart TEXT NOT NULL,
        targets TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX idx_meal_plans_week ON meal_plans(weekStart);

      CREATE TABLE meal_slots (
        id TEXT PRIMARY KEY NOT NULL,
        mealPlanId TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        slot TEXT NOT NULL,
        time TEXT NOT NULL,
        options TEXT NOT NULL,
        chosenIndex INTEGER,
        eatenAt TEXT
      );
      CREATE INDEX idx_meal_slots_date ON meal_slots(date);

      CREATE TABLE meal_entries (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        slot TEXT NOT NULL,
        items TEXT NOT NULL,
        source TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX idx_meal_entries_date ON meal_entries(date);

      CREATE TABLE shopping_items (
        id TEXT PRIMARY KEY NOT NULL,
        listStart TEXT NOT NULL,
        label TEXT NOT NULL,
        quantity TEXT NOT NULL,
        section TEXT NOT NULL,
        checked INTEGER NOT NULL DEFAULT 0
      );
    `);

    // TACO 4ª ed. (seção 2.1): os 597 alimentos entram com o app.
    await insertChunked(
      db,
      'INSERT INTO foods (id, name, searchName, category, kcal, protein, carbs, fat, fiber, sodium, potassium, source)',
      foodsFile.rows.map((r) => [
        `taco-${r[0]}`,
        r[1] as string,
        normalizeSearch(r[1] as string),
        foodsFile.categories[r[2] as number],
        ...(r.slice(3) as (number | null)[]),
        'taco',
      ]),
    );

    // Medidas caseiras do IBGE (POF 2008–2009).
    await insertChunked(
      db,
      'INSERT INTO food_portions (foodId, position, label, plural, grams)',
      Object.entries(portionsFileSchema.parse(portionsFile).portions).flatMap(([taco, list]) =>
        list.map(([label, plural, grams], position) => [`taco-${taco}`, position, label, plural, grams]),
      ),
    );
  },
};
