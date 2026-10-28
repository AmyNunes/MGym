import type { Migration } from '../types';

// Fase 5. Nunca edite esta migration: crie outra.
export const migration005: Migration = {
  version: 5,
  name: 'body',
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE weights (
        id TEXT PRIMARY KEY NOT NULL,
        measuredAt TEXT NOT NULL,
        kg REAL NOT NULL
      );
      CREATE INDEX idx_weights_measured ON weights(measuredAt);

      CREATE TABLE measurements (
        id TEXT PRIMARY KEY NOT NULL,
        measuredAt TEXT NOT NULL,
        "values" TEXT NOT NULL
      );
      CREATE INDEX idx_measurements_measured ON measurements(measuredAt);

      CREATE TABLE checkins (
        id TEXT PRIMARY KEY NOT NULL,
        weekStart TEXT NOT NULL,
        stats TEXT NOT NULL,
        answers TEXT NOT NULL,
        decisions TEXT NOT NULL,
        summaryPt TEXT,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX idx_checkins_week ON checkins(weekStart);
    `);
  },
};
