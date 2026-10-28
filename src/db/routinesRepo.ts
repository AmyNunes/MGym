import { z } from 'zod';

import { nowIso } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { parseJsonWith } from '@/lib/json';
import { plannedExerciseSchema, type PlannedExercise } from '@/training/workoutModel';

import { getDb } from './client';

/** Treinos montados à mão ("Meus treinos", seção 15). */
export type Routine = {
  id: string;
  name: string;
  items: PlannedExercise[];
  createdAt: string;
  updatedAt: string;
};

type Row = Omit<Routine, 'items'> & { items: string };

const itemsSchema = z.array(plannedExerciseSchema);

function fromRow(row: Row): Routine {
  return { ...row, items: parseJsonWith(row.items, itemsSchema, []) };
}

export async function listRoutines(): Promise<Routine[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM routines ORDER BY createdAt');
  return rows.map(fromRow);
}

export async function getRoutine(id: string): Promise<Routine | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>('SELECT * FROM routines WHERE id = ?', id);
  return row ? fromRow(row) : null;
}

/** Cria um treino e devolve o id. */
export async function insertRoutine(input: { name: string; items: PlannedExercise[] }): Promise<string> {
  const db = await getDb();
  const id = newId();
  const now = nowIso();
  await db.runAsync(
    'INSERT INTO routines (id, name, items, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    id,
    input.name,
    JSON.stringify(input.items),
    now,
    now,
  );
  return id;
}

export async function updateRoutine(id: string, patch: { name: string; items: PlannedExercise[] }): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE routines SET name = ?, items = ?, updatedAt = ? WHERE id = ?',
    patch.name,
    JSON.stringify(patch.items),
    nowIso(),
    id,
  );
}

export async function deleteRoutine(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM routines WHERE id = ?', id);
}

/** Volta um treino apagado (o "Desfazer" do Snackbar), com o mesmo id e datas. */
export async function restoreRoutine(routine: Routine): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO routines (id, name, items, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    routine.id,
    routine.name,
    JSON.stringify(routine.items),
    routine.createdAt,
    routine.updatedAt,
  );
}
