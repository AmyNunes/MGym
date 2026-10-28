import { nowIso } from '@/lib/dates';
import { parseJsonWith } from '@/lib/json';
import { emptyProfile, profileSchema, type Profile } from '@/profile/profile';

import { getDb } from './client';

/** Perfil (respostas do Guia): uma linha só, `id = 1` (seção 15). */
export type StoredProfile = { answers: Profile; completedAt: string | null; updatedAt: string };

export async function getProfile(): Promise<StoredProfile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ answers: string; completedAt: string | null; updatedAt: string }>(
    'SELECT answers, completedAt, updatedAt FROM profile WHERE id = 1',
  );
  if (!row) return null;
  return { answers: parseJsonWith(row.answers, profileSchema, emptyProfile()), completedAt: row.completedAt, updatedAt: row.updatedAt };
}

/** Salva as respostas (a cada pergunta do Guia: sair no meio não perde nada). */
export async function saveProfile(answers: Profile, completed?: boolean): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO profile (id, answers, completedAt, updatedAt) VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET answers = excluded.answers, updatedAt = excluded.updatedAt,
       completedAt = COALESCE(excluded.completedAt, profile.completedAt)`,
    JSON.stringify(answers),
    completed ? now : null,
    now,
  );
}
