import { newId } from '@/lib/ids';
import type { RecordKind } from '@/training/records';

import { getDb } from './client';

/** Um recorde batido (seção 9.6). Fica guardado como acontecimento: dá para listar os recentes. */
export type PersonalRecord = {
  id: string;
  exerciseId: string;
  kind: RecordKind;
  /** kg (carga) ou kg estimados (1RM). */
  value: number;
  weightKg: number;
  reps: number;
  setId: string;
  workoutId: string;
  achievedAt: string;
};

export async function insertRecords(records: Omit<PersonalRecord, 'id'>[]): Promise<void> {
  if (!records.length) return;
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const r of records) {
      await db.runAsync(
        `INSERT INTO personal_records (id, exerciseId, kind, value, weightKg, reps, setId, workoutId, achievedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        newId(),
        r.exerciseId,
        r.kind,
        r.value,
        r.weightKg,
        r.reps,
        r.setId,
        r.workoutId,
        r.achievedAt,
      );
    }
  });
}

export async function recordsOfWorkout(workoutId: string): Promise<PersonalRecord[]> {
  const db = await getDb();
  return db.getAllAsync<PersonalRecord>(
    'SELECT * FROM personal_records WHERE workoutId = ? ORDER BY achievedAt',
    workoutId,
  );
}

export async function recordsOfExercise(exerciseId: string): Promise<PersonalRecord[]> {
  const db = await getDb();
  return db.getAllAsync<PersonalRecord>(
    'SELECT * FROM personal_records WHERE exerciseId = ? ORDER BY achievedAt DESC',
    exerciseId,
  );
}

export async function recentRecords(limit = 20): Promise<PersonalRecord[]> {
  const db = await getDb();
  return db.getAllAsync<PersonalRecord>('SELECT * FROM personal_records ORDER BY achievedAt DESC LIMIT ?', limit);
}
