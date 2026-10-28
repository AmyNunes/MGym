import type { Migration } from '../types';

// Fase 2. Nunca edite esta migration: crie outra.
export const migration002: Migration = {
  version: 2,
  name: 'workouts',
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE workouts (
        id TEXT PRIMARY KEY NOT NULL,
        planDayId TEXT,
        routineId TEXT,
        name TEXT,
        startedAt TEXT NOT NULL,
        endedAt TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        feeling TEXT,
        pain TEXT
      );
      CREATE INDEX idx_workouts_startedAt ON workouts(startedAt);
      CREATE INDEX idx_workouts_status ON workouts(status);

      CREATE TABLE workout_exercises (
        id TEXT PRIMARY KEY NOT NULL,
        workoutId TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        exerciseId TEXT NOT NULL,
        position INTEGER NOT NULL,
        notes TEXT,
        restSec INTEGER NOT NULL,
        repMin INTEGER,
        repMax INTEGER
      );
      CREATE INDEX idx_workout_exercises_exerciseId ON workout_exercises(exerciseId);
      CREATE INDEX idx_workout_exercises_workoutId ON workout_exercises(workoutId);

      CREATE TABLE sets (
        id TEXT PRIMARY KEY NOT NULL,
        workoutExerciseId TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        kind TEXT NOT NULL DEFAULT 'normal',
        weightKg REAL,
        reps INTEGER,
        rir INTEGER,
        completedAt TEXT
      );
      CREATE INDEX idx_sets_workoutExerciseId ON sets(workoutExerciseId);

      CREATE TABLE personal_records (
        id TEXT PRIMARY KEY NOT NULL,
        exerciseId TEXT NOT NULL,
        kind TEXT NOT NULL,
        value REAL NOT NULL,
        weightKg REAL NOT NULL,
        reps INTEGER NOT NULL,
        setId TEXT NOT NULL,
        workoutId TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        achievedAt TEXT NOT NULL
      );
      CREATE INDEX idx_personal_records_exercise ON personal_records(exerciseId, kind);
      CREATE INDEX idx_personal_records_achievedAt ON personal_records(achievedAt);

      CREATE TABLE routines (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        items TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
  },
};
