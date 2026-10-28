import type { Migration } from '../types';

// Fase 3. Nunca edite esta migration: crie outra.
export const migration003: Migration = {
  version: 3,
  name: 'plan',
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE profile (
        id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
        answers TEXT NOT NULL,
        completedAt TEXT,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE plans (
        id TEXT PRIMARY KEY NOT NULL,
        template TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        deloadWeek TEXT,
        targets TEXT NOT NULL DEFAULT '{}'
      );

      CREATE TABLE plan_days (
        id TEXT PRIMARY KEY NOT NULL,
        planId TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        name TEXT NOT NULL,
        exercises TEXT NOT NULL,
        note TEXT
      );
      CREATE INDEX idx_plan_days_plan ON plan_days(planId);

      CREATE TABLE cardio (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        kind TEXT NOT NULL,
        minutes INTEGER NOT NULL,
        notes TEXT
      );
      CREATE INDEX idx_cardio_date ON cardio(date);

      ALTER TABLE workouts ADD COLUMN warmupDone INTEGER NOT NULL DEFAULT 0;
    `);
  },
};
