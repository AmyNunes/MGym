import { newId } from '@/lib/ids';
import { parseJsonWith } from '@/lib/json';
import { planExercisesSchema, targetsSchema, TEMPLATES, type Plan, type PlanDay, type PlanTargets, type TemplateId } from '@/training/planModel';
import type { PlannedExercise } from '@/training/workoutModel';

import { getDb } from './client';

type PlanRow = { id: string; template: string; createdAt: string; active: number; deloadWeek: string | null; targets: string };
type DayRow = Omit<PlanDay, 'exercises'> & { exercises: string };

const toTemplate = (t: string): TemplateId => ((TEMPLATES as readonly string[]).includes(t) ? (t as TemplateId) : 'fullBodyAB');

const toDay = (row: DayRow): PlanDay => ({ ...row, exercises: parseJsonWith(row.exercises, planExercisesSchema, []) });

/** O plano ativo (o mais recente), com os dias em ordem. */
export async function getActivePlan(): Promise<Plan | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<PlanRow>('SELECT * FROM plans WHERE active = 1 ORDER BY createdAt DESC LIMIT 1');
  if (!row) return null;
  const days = await db.getAllAsync<DayRow>('SELECT * FROM plan_days WHERE planId = ? ORDER BY position', row.id);
  return {
    id: row.id,
    template: toTemplate(row.template),
    createdAt: row.createdAt,
    active: row.active === 1,
    deloadWeek: row.deloadWeek,
    targets: parseJsonWith<PlanTargets>(row.targets, targetsSchema, {}),
    days: days.map(toDay),
  };
}

export async function getPlanDay(id: string): Promise<PlanDay | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DayRow>('SELECT * FROM plan_days WHERE id = ?', id);
  return row ? toDay(row) : null;
}

export type NewPlan = {
  template: TemplateId;
  createdAt: string;
  targets: PlanTargets;
  days: { name: string; exercises: PlannedExercise[]; note: string | null }[];
};

/** Grava um plano novo e desativa os anteriores (o histórico de treinos continua). Devolve o id. */
export async function savePlan(plan: NewPlan): Promise<string> {
  const db = await getDb();
  const id = newId();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE plans SET active = 0 WHERE active = 1');
    await db.runAsync(
      'INSERT INTO plans (id, template, createdAt, active, deloadWeek, targets) VALUES (?, ?, ?, 1, NULL, ?)',
      id,
      plan.template,
      plan.createdAt,
      JSON.stringify(plan.targets),
    );
    for (const [position, day] of plan.days.entries()) {
      await db.runAsync(
        'INSERT INTO plan_days (id, planId, position, name, exercises, note) VALUES (?, ?, ?, ?, ?, ?)',
        newId(),
        id,
        position,
        day.name,
        JSON.stringify(day.exercises),
        day.note,
      );
    }
  });
  return id;
}

export async function updatePlanDay(id: string, patch: { name: string; exercises: PlannedExercise[] }): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE plan_days SET name = ?, exercises = ? WHERE id = ?', patch.name, JSON.stringify(patch.exercises), id);
}

/** Marca (ou desmarca) a semana leve (deload, seção 9.4). */
export async function setDeloadWeek(planId: string, weekStart: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE plans SET deloadWeek = ? WHERE id = ?', weekStart, planId);
}
