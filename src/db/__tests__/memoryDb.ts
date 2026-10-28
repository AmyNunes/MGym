/// <reference types="node" />
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import { runMigrations } from '../migrate';
import { migrations } from '../migrations';
import type { Db } from '../types';

/**
 * Banco SQLite de verdade, em memória (o `node:sqlite` do Node 24), com as migrations do app.
 * Testa o SQL dos repositórios sem precisar do celular.
 * Uso: `jest.mock('../client', () => ({ getDb: () => memoryDb.get() }))`.
 */
export function createMemoryDb(): Db {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');

  const args = (params: unknown[]): SQLInputValue[] =>
    (params.length === 1 && Array.isArray(params[0]) ? params[0] : params) as SQLInputValue[];

  const db = {
    execAsync: async (sql: string) => {
      sqlite.exec(sql);
    },
    runAsync: async (sql: string, ...params: unknown[]) => {
      const r = sqlite.prepare(sql).run(...args(params));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    getFirstAsync: async (sql: string, ...params: unknown[]) => {
      const row = sqlite.prepare(sql).get(...args(params));
      return row ? { ...row } : null;
    },
    getAllAsync: async (sql: string, ...params: unknown[]) =>
      sqlite.prepare(sql).all(...args(params)).map((r) => ({ ...r })),
    withTransactionAsync: async (task: () => Promise<void>) => {
      sqlite.exec('BEGIN');
      try {
        await task();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return db as unknown as Db;
}

/** Um banco novo e migrado por teste. */
export function memoryDbHolder() {
  let current: Promise<Db> | null = null;
  return {
    get: (): Promise<Db> => {
      if (!current) {
        const db = createMemoryDb();
        current = runMigrations(db, migrations).then(() => db);
      }
      return current;
    },
    reset: () => {
      current = null;
    },
  };
}
