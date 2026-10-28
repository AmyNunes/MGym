import { z } from 'zod';

import { MEASURE_SITES, type MeasureValues } from '@/body/measurements';
import { nowIso } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { parseJsonWith } from '@/lib/json';

import { getDb } from './client';
import { readSetting, writeSetting } from './settingsRepo';

/** Peso e medidas (seção 11). */

export type WeightRecord = { id: string; measuredAt: string; kg: number };
export type MeasurementRecord = { id: string; measuredAt: string; values: MeasureValues };

const valuesSchema = z.partialRecord(z.enum(MEASURE_SITES), z.number().positive());

// ——— Peso ———

export async function insertWeight(kg: number, measuredAt = nowIso()): Promise<string> {
  const db = await getDb();
  const id = newId();
  await db.runAsync('INSERT INTO weights (id, measuredAt, kg) VALUES (?, ?, ?)', id, measuredAt, kg);
  return id;
}

export async function listWeights(): Promise<WeightRecord[]> {
  const db = await getDb();
  return db.getAllAsync<WeightRecord>('SELECT * FROM weights ORDER BY measuredAt');
}

export async function countWeights(): Promise<number> {
  const db = await getDb();
  return (await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM weights'))?.n ?? 0;
}

export async function deleteWeight(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM weights WHERE id = ?', id);
  await logDeletion();
}

/** Volta um registro apagado (o "Desfazer"); não conta como exclusão. */
export async function restoreWeight(w: WeightRecord): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO weights (id, measuredAt, kg) VALUES (?, ?, ?)', w.id, w.measuredAt, w.kg);
  await unlogDeletion();
}

/** "Apagar histórico de peso" (seção 15). */
export async function deleteAllWeights(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM weights');
}

// ——— Medidas ———

export async function insertMeasurement(values: MeasureValues, measuredAt = nowIso()): Promise<string> {
  const db = await getDb();
  const id = newId();
  await db.runAsync('INSERT INTO measurements (id, measuredAt, "values") VALUES (?, ?, ?)', id, measuredAt, JSON.stringify(values));
  return id;
}

export async function listMeasurements(): Promise<MeasurementRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; measuredAt: string; values: string }>('SELECT * FROM measurements ORDER BY measuredAt');
  return rows.map((r) => ({ ...r, values: parseJsonWith<MeasureValues>(r.values, valuesSchema, {}) }));
}

export async function deleteMeasurement(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM measurements WHERE id = ?', id);
  await logDeletion();
}

export async function restoreMeasurement(m: MeasurementRecord): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO measurements (id, measuredAt, "values") VALUES (?, ?, ?)',
    m.id,
    m.measuredAt,
    JSON.stringify(m.values),
  );
  await unlogDeletion();
}

// ——— Exclusões (sinal de alerta 16.4: "apagar registros repetidamente") ———

const DELETIONS_KEY = 'bodyDeletions';
const MAX_LOG = 30;

async function readDeletions(): Promise<string[]> {
  return parseJsonWith<string[]>(await readSetting(DELETIONS_KEY), z.array(z.string()), []);
}

async function logDeletion() {
  await writeSetting(DELETIONS_KEY, [...(await readDeletions()), nowIso()].slice(-MAX_LOG));
}

async function unlogDeletion() {
  await writeSetting(DELETIONS_KEY, (await readDeletions()).slice(0, -1));
}

/** Quantas exclusões desde `sinceIso`. */
export async function deletionsSince(sinceIso: string): Promise<number> {
  return (await readDeletions()).filter((d) => d >= sinceIso).length;
}
