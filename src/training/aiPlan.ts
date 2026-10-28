import type { Exercise } from './exerciseModel';
import type { Plan, PlanDay } from './planModel';
import type { PlannedExercise } from './workoutModel';

/**
 * Mudanças no plano sugeridas pela IA (`adjustPlan`, seção 14.3), validadas aqui: só dias do plano,
 * só exercícios do catálogo que respeitam limitações e modo recuperação. O resto é descartado.
 */

export type AiPlanChange = {
  action: 'replace' | 'remove' | 'add';
  dayId: string;
  exerciseId: string;
  replaceWithId?: string | null;
  reasonPt: string;
};

export type ResolvedChange =
  | { action: 'replace'; day: PlanDay; from: Exercise; to: Exercise; reasonPt: string }
  | { action: 'remove'; day: PlanDay; from: Exercise; reasonPt: string }
  | { action: 'add'; day: PlanDay; to: Exercise; reasonPt: string };

/** Mais que isso num dia não cabe no tempo do treino. */
export const MAX_EXERCISES_PER_DAY = 10;

export function resolveChanges(
  changes: readonly AiPlanChange[],
  plan: Plan,
  find: (id: string) => Exercise | undefined,
  allowed: (exercise: Exercise) => boolean,
): { changes: ResolvedChange[]; dropped: number } {
  const out: ResolvedChange[] = [];
  // O estado de cada dia vai mudando conforme as mudanças entram (para não repetir nem esvaziar).
  const dayIds = new Map(plan.days.map((d) => [d.id, d.exercises.map((e) => e.exerciseId)]));
  for (const c of changes) {
    const day = plan.days.find((d) => d.id === c.dayId);
    const ids = dayIds.get(c.dayId);
    if (!day || !ids) continue;
    const from = find(c.exerciseId);
    if (c.action === 'replace') {
      const to = c.replaceWithId ? find(c.replaceWithId) : undefined;
      if (!from || !to || !ids.includes(from.id) || ids.includes(to.id) || !allowed(to)) continue;
      ids[ids.indexOf(from.id)] = to.id;
      out.push({ action: 'replace', day, from, to, reasonPt: c.reasonPt });
    } else if (c.action === 'remove') {
      if (!from || !ids.includes(from.id) || ids.length <= 1) continue;
      ids.splice(ids.indexOf(from.id), 1);
      out.push({ action: 'remove', day, from, reasonPt: c.reasonPt });
    } else {
      const to = from;
      if (!to || ids.includes(to.id) || !allowed(to) || ids.length >= MAX_EXERCISES_PER_DAY) continue;
      ids.push(to.id);
      out.push({ action: 'add', day, to, reasonPt: c.reasonPt });
    }
  }
  return { changes: out, dropped: changes.length - out.length };
}

/** Aplica as mudanças: a troca mantém as séries; um exercício novo entra com `planned(to)`. */
export function applyChanges(
  plan: Plan,
  changes: readonly ResolvedChange[],
  planned: (exercise: Exercise, sets?: number) => PlannedExercise,
): Map<string, PlannedExercise[]> {
  const days = new Map(plan.days.map((d) => [d.id, [...d.exercises]]));
  for (const c of changes) {
    const list = days.get(c.day.id);
    if (!list) continue;
    if (c.action === 'replace') {
      const i = list.findIndex((e) => e.exerciseId === c.from.id);
      if (i >= 0) list[i] = planned(c.to, list[i].sets);
    } else if (c.action === 'remove') {
      const i = list.findIndex((e) => e.exerciseId === c.from.id);
      if (i >= 0) list.splice(i, 1);
    } else {
      list.push(planned(c.to));
    }
  }
  const changed = new Set(changes.map((c) => c.day.id));
  return new Map([...days].filter(([id]) => changed.has(id)));
}
