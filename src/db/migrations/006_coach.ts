import type { Migration } from '../types';

// Fase 6. Nunca edite esta migration: crie outra.
export const migration006: Migration = {
  version: 6,
  name: 'coach',
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE coach_conversations (
        id TEXT PRIMARY KEY NOT NULL,
        messages TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX idx_coach_created ON coach_conversations(createdAt);
    `);
  },
};
