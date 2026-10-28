import { z } from 'zod';

import { nowIso } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { parseJsonWith } from '@/lib/json';

import { getDb } from './client';

/** Conversas do "Perguntar à IA" (seção 15, tabela `coach_conversations`). */

export const coachMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string(),
  suggestedExerciseIds: z.array(z.string()).optional(),
  safetyFlag: z.boolean().optional(),
  at: z.string(),
});
export type CoachMessage = z.infer<typeof coachMessageSchema>;
export type Conversation = { id: string; messages: CoachMessage[]; createdAt: string };

const messagesSchema = z.array(coachMessageSchema);

export async function latestConversation(): Promise<Conversation | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: string; messages: string; createdAt: string }>(
    'SELECT * FROM coach_conversations ORDER BY createdAt DESC LIMIT 1',
  );
  return row ? { ...row, messages: parseJsonWith<CoachMessage[]>(row.messages, messagesSchema, []) } : null;
}

export async function createConversation(): Promise<Conversation> {
  const db = await getDb();
  const conversation = { id: newId(), messages: [], createdAt: nowIso() };
  await db.runAsync('INSERT INTO coach_conversations (id, messages, createdAt) VALUES (?, ?, ?)', conversation.id, '[]', conversation.createdAt);
  return conversation;
}

export async function saveMessages(id: string, messages: readonly CoachMessage[]): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE coach_conversations SET messages = ? WHERE id = ?', JSON.stringify(messages), id);
}
