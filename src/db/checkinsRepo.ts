import {
  checkinAnswersSchema,
  checkinStatsSchema,
  decisionsSchema,
  type CheckinAnswers,
  type CheckinStats,
  type Decision,
} from '@/features/checkin/model';
import { nowIso } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { parseJsonWith } from '@/lib/json';

import { getDb } from './client';

/** Check-ins da semana (seção 11.5). */

export type CheckinRecord = {
  id: string;
  weekStart: string;
  stats: CheckinStats | null;
  answers: CheckinAnswers;
  decisions: Decision[];
  summaryPt: string | null;
  createdAt: string;
};

type Row = { id: string; weekStart: string; stats: string; answers: string; decisions: string; summaryPt: string | null; createdAt: string };

const toRecord = (r: Row): CheckinRecord => ({
  ...r,
  stats: parseJsonWith<CheckinStats | null>(r.stats, checkinStatsSchema, null),
  answers: parseJsonWith<CheckinAnswers>(r.answers, checkinAnswersSchema, { ratings: {} }),
  decisions: parseJsonWith<Decision[]>(r.decisions, decisionsSchema, []),
});

export async function insertCheckin(c: Omit<CheckinRecord, 'id' | 'createdAt'>): Promise<string> {
  const db = await getDb();
  const id = newId();
  await db.runAsync(
    'INSERT INTO checkins (id, weekStart, stats, answers, decisions, summaryPt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id,
    c.weekStart,
    JSON.stringify(c.stats),
    JSON.stringify(c.answers),
    JSON.stringify(c.decisions),
    c.summaryPt,
    nowIso(),
  );
  return id;
}

export async function checkinForWeek(weekStart: string): Promise<CheckinRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>('SELECT * FROM checkins WHERE weekStart = ? ORDER BY createdAt DESC LIMIT 1', weekStart);
  return row ? toRecord(row) : null;
}

export async function listCheckins(limit = 12): Promise<CheckinRecord[]> {
  const db = await getDb();
  return (await db.getAllAsync<Row>('SELECT * FROM checkins ORDER BY createdAt DESC LIMIT ?', limit)).map(toRecord);
}
