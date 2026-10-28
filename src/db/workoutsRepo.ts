import { appDayKey } from '@/lib/dates';
import {
  SET_KINDS,
  type Feeling,
  type Pain,
  type SetKind,
  type Workout,
  type WorkoutExercise,
  type WorkoutSet,
  type WorkoutStatus,
} from '@/training/workoutModel';

import { getDb } from './client';

/*
 * Treinos (seção 15): `workouts` → `workout_exercises` → `sets`.
 * O treino em andamento é salvo a cada toque, por operações pequenas.
 */

type WorkoutRow = Omit<Workout, 'exercises' | 'warmupDone'> & { warmupDone: number };

const fromWorkoutRow = (row: WorkoutRow): Omit<Workout, 'exercises'> => ({ ...row, warmupDone: row.warmupDone === 1 });
type ExerciseRow = Omit<WorkoutExercise, 'sets'>;
type SetRow = Omit<WorkoutSet, 'kind'> & { kind: string; workoutExerciseId: string };

const toKind = (kind: string): SetKind => (SET_KINDS as readonly string[]).includes(kind) ? (kind as SetKind) : 'normal';

function toSet(row: SetRow): WorkoutSet {
  return {
    id: row.id,
    position: row.position,
    kind: toKind(row.kind),
    weightKg: row.weightKg,
    reps: row.reps,
    rir: row.rir,
    completedAt: row.completedAt,
  };
}

async function loadExercises(workoutId: string): Promise<WorkoutExercise[]> {
  const db = await getDb();
  const exercises = await db.getAllAsync<ExerciseRow>(
    'SELECT * FROM workout_exercises WHERE workoutId = ? ORDER BY position',
    workoutId,
  );
  const sets = await db.getAllAsync<SetRow>(
    `SELECT s.* FROM sets s JOIN workout_exercises we ON we.id = s.workoutExerciseId
     WHERE we.workoutId = ? ORDER BY s.position`,
    workoutId,
  );
  return exercises.map((e) => ({
    ...e,
    sets: sets.filter((s) => s.workoutExerciseId === e.id).map(toSet),
  }));
}

export async function getWorkout(id: string): Promise<Workout | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<WorkoutRow>('SELECT * FROM workouts WHERE id = ?', id);
  return row ? { ...fromWorkoutRow(row), exercises: await loadExercises(id) } : null;
}

/** O treino em andamento, se houver (o mais recente). */
export async function getActiveWorkout(): Promise<Workout | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM workouts WHERE status = 'active' ORDER BY startedAt DESC LIMIT 1",
  );
  return row ? getWorkout(row.id) : null;
}

export async function insertWorkout(w: Omit<Workout, 'exercises'>): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO workouts (id, planDayId, routineId, name, startedAt, endedAt, status, notes, feeling, pain, warmupDone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    w.id,
    w.planDayId,
    w.routineId,
    w.name,
    w.startedAt,
    w.endedAt,
    w.status,
    w.notes,
    w.feeling,
    w.pain,
    w.warmupDone ? 1 : 0,
  );
}

export async function updateWorkout(
  id: string,
  patch: Partial<{
    name: string | null;
    status: WorkoutStatus;
    endedAt: string | null;
    notes: string | null;
    feeling: Feeling | null;
    pain: Pain | null;
    warmupDone: boolean;
  }>,
): Promise<void> {
  const entries = Object.entries(patch).map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 1 : 0) : v] as const);
  if (!entries.length) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE workouts SET ${entries.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`,
    ...entries.map(([, v]) => v as string | number | null),
    id,
  );
}

export async function insertWorkoutExercise(e: Omit<WorkoutExercise, 'sets'>): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO workout_exercises (id, workoutId, exerciseId, position, notes, restSec, repMin, repMax)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    e.id,
    e.workoutId,
    e.exerciseId,
    e.position,
    e.notes,
    e.restSec,
    e.repMin,
    e.repMax,
  );
}

export async function updateWorkoutExercise(
  id: string,
  patch: Partial<Pick<WorkoutExercise, 'exerciseId' | 'position' | 'notes' | 'restSec' | 'repMin' | 'repMax'>>,
): Promise<void> {
  const entries = Object.entries(patch);
  if (!entries.length) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE workout_exercises SET ${entries.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`,
    ...entries.map(([, v]) => v as string | number | null),
    id,
  );
}

export async function deleteWorkoutExercise(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM workout_exercises WHERE id = ?', id);
}

export async function insertSet(workoutExerciseId: string, s: WorkoutSet): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sets (id, workoutExerciseId, position, kind, weightKg, reps, rir, completedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    s.id,
    workoutExerciseId,
    s.position,
    s.kind,
    s.weightKg,
    s.reps,
    s.rir,
    s.completedAt,
  );
}

export async function updateSet(id: string, patch: Partial<Omit<WorkoutSet, 'id'>>): Promise<void> {
  const entries = Object.entries(patch);
  if (!entries.length) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE sets SET ${entries.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`,
    ...entries.map(([, v]) => v as string | number | null),
    id,
  );
}

export async function deleteSet(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sets WHERE id = ?', id);
}

/** Apaga um treino do histórico (os exercícios, séries e recordes dele vão junto). */
export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
}

/** Grava um treino inteiro (exercícios e séries): ao começar e no "Desfazer" de um treino apagado. */
export async function insertWorkoutTree(w: Workout): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await insertWorkout(w);
    for (const e of w.exercises) {
      await insertWorkoutExercise(e);
      for (const s of e.sets) await insertSet(e.id, s);
    }
  });
}

export type WorkoutSummaryRow = {
  id: string;
  name: string | null;
  startedAt: string;
  endedAt: string | null;
  exerciseCount: number;
  setCount: number;
  tonnage: number;
};

/** Treinos feitos, do mais recente para o mais antigo. */
export async function listDoneWorkouts(limit = 200): Promise<WorkoutSummaryRow[]> {
  const db = await getDb();
  return db.getAllAsync<WorkoutSummaryRow>(
    `SELECT w.id, w.name, w.startedAt, w.endedAt,
            (SELECT COUNT(*) FROM workout_exercises we WHERE we.workoutId = w.id) AS exerciseCount,
            (SELECT COUNT(*) FROM sets s JOIN workout_exercises we ON we.id = s.workoutExerciseId
              WHERE we.workoutId = w.id AND s.completedAt IS NOT NULL AND s.kind != 'warmup') AS setCount,
            (SELECT COALESCE(SUM(s.weightKg * s.reps), 0) FROM sets s JOIN workout_exercises we ON we.id = s.workoutExerciseId
              WHERE we.workoutId = w.id AND s.completedAt IS NOT NULL AND s.kind != 'warmup') AS tonnage
     FROM workouts w WHERE w.status = 'done'
     ORDER BY w.startedAt DESC LIMIT ?`,
    limit,
  );
}

/**
 * As séries da última vez que fiz este exercício (num treino concluído, fora `exceptWorkoutId`),
 * em ordem. Base do "Anterior" e da "Última vez" (seção 9.5).
 */
export async function lastSetsFor(
  exerciseId: string,
  exceptWorkoutId: string | null = null,
): Promise<{ workoutId: string; startedAt: string; sets: WorkoutSet[] } | null> {
  const db = await getDb();
  const last = await db.getFirstAsync<{ weId: string; workoutId: string; startedAt: string }>(
    `SELECT we.id AS weId, w.id AS workoutId, w.startedAt FROM workout_exercises we
     JOIN workouts w ON w.id = we.workoutId
     WHERE we.exerciseId = ? AND w.status = 'done' AND w.id IS NOT ?
       AND EXISTS (SELECT 1 FROM sets s WHERE s.workoutExerciseId = we.id AND s.completedAt IS NOT NULL)
     ORDER BY w.startedAt DESC, we.position DESC LIMIT 1`,
    exerciseId,
    exceptWorkoutId,
  );
  if (!last) return null;
  const rows = await db.getAllAsync<SetRow>(
    'SELECT * FROM sets WHERE workoutExerciseId = ? AND completedAt IS NOT NULL ORDER BY position',
    last.weId,
  );
  return { workoutId: last.workoutId, startedAt: last.startedAt, sets: rows.map(toSet) };
}

export type HistorySet = WorkoutSet & { workoutId: string; startedAt: string };

/** Todas as séries concluídas de um exercício em treinos feitos (fora `exceptWorkoutId`), da mais antiga à mais nova. */
export async function historySetsFor(exerciseId: string, exceptWorkoutId: string | null = null): Promise<HistorySet[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SetRow & { workoutId: string; startedAt: string }>(
    `SELECT s.*, w.id AS workoutId, w.startedAt FROM sets s
     JOIN workout_exercises we ON we.id = s.workoutExerciseId
     JOIN workouts w ON w.id = we.workoutId
     WHERE we.exerciseId = ? AND w.status = 'done' AND w.id IS NOT ? AND s.completedAt IS NOT NULL
     ORDER BY w.startedAt, we.position, s.position`,
    exerciseId,
    exceptWorkoutId,
  );
  return rows.map((r) => ({ ...toSet(r), workoutId: r.workoutId, startedAt: r.startedAt }));
}

/** Séries difíceis concluídas por exercício em treinos feitos desde `sinceIso` (volume da semana). */
export async function hardSetsSince(sinceIso: string): Promise<{ exerciseId: string; sets: number }[]> {
  const db = await getDb();
  return db.getAllAsync<{ exerciseId: string; sets: number }>(
    `SELECT we.exerciseId, COUNT(*) AS sets FROM sets s
     JOIN workout_exercises we ON we.id = s.workoutExerciseId
     JOIN workouts w ON w.id = we.workoutId
     WHERE w.status = 'done' AND w.startedAt >= ? AND s.completedAt IS NOT NULL AND s.kind != 'warmup'
     GROUP BY we.exerciseId`,
    sinceIso,
  );
}

/** Dias (chave local "AAAA-MM-DD", virando às 04:00) com treino feito desde `sinceIso`. */
export async function doneWorkoutDaysSince(sinceIso: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ startedAt: string }>(
    "SELECT startedAt FROM workouts WHERE status = 'done' AND startedAt >= ? ORDER BY startedAt",
    sinceIso,
  );
  return [...new Set(rows.map((r) => appDayKey(new Date(r.startedAt))))];
}

/** O último dia do plano que foi treinado (entre estes ids), para o rodízio. */
export async function lastDonePlanDayId(dayIds: readonly string[]): Promise<string | null> {
  if (!dayIds.length) return null;
  const db = await getDb();
  const row = await db.getFirstAsync<{ planDayId: string }>(
    `SELECT planDayId FROM workouts WHERE status = 'done' AND planDayId IN (${dayIds.map(() => '?').join(', ')})
     ORDER BY startedAt DESC LIMIT 1`,
    ...dayIds,
  );
  return row?.planDayId ?? null;
}

/** Treinos feitos desde `sinceIso`, com duração e dor (para os sinais de alerta e a constância). */
export async function doneWorkoutsSince(sinceIso: string): Promise<{ startedAt: string; endedAt: string | null; pain: string | null }[]> {
  const db = await getDb();
  return db.getAllAsync<{ startedAt: string; endedAt: string | null; pain: string | null }>(
    "SELECT startedAt, endedAt, pain FROM workouts WHERE status = 'done' AND startedAt >= ? ORDER BY startedAt",
    sinceIso,
  );
}
