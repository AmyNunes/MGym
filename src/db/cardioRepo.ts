import { newId } from '@/lib/ids';

import { getDb } from './client';

/** Cardio (seção 9.7). */
export const CARDIO_KINDS = ['walk', 'inclineWalk', 'bike', 'elliptical', 'other'] as const;
export type CardioKind = (typeof CARDIO_KINDS)[number];

export type CardioEntry = { id: string; date: string; kind: CardioKind; minutes: number; notes: string | null };

const toKind = (k: string): CardioKind => ((CARDIO_KINDS as readonly string[]).includes(k) ? (k as CardioKind) : 'other');

export async function insertCardio(entry: Omit<CardioEntry, 'id'>): Promise<string> {
  const db = await getDb();
  const id = newId();
  await db.runAsync(
    'INSERT INTO cardio (id, date, kind, minutes, notes) VALUES (?, ?, ?, ?, ?)',
    id,
    entry.date,
    entry.kind,
    entry.minutes,
    entry.notes,
  );
  return id;
}

export async function deleteCardio(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cardio WHERE id = ?', id);
}

/** Registros de cardio desde `sinceIso` (data ISO), do mais antigo ao mais novo. */
export async function cardioSince(sinceIso: string): Promise<CardioEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Omit<CardioEntry, 'kind'> & { kind: string }>(
    'SELECT * FROM cardio WHERE date >= ? ORDER BY date',
    sinceIso,
  );
  return rows.map((r) => ({ ...r, kind: toKind(r.kind) }));
}
