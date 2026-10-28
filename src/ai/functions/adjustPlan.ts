import type { Exercise } from '@/training/exerciseModel';
import { resolveChanges, type ResolvedChange } from '@/training/aiPlan';
import type { Plan } from '@/training/planModel';

import { callAI } from '../client';
import { adjustPlanPrompt } from '../prompts/plan';
import { planChangesSchema } from '../schemas';

export type PlanSuggestion = { explanationPt: string; changes: ResolvedChange[]; dropped: number };

/**
 * `adjustPlan` (seção 14.3): a IA sugere; o app valida contra o plano e o catálogo permitido
 * (limitações e modo recuperação). Nada é salvo aqui: eu confirmo antes.
 */
export async function adjustPlan(input: {
  plan: Plan;
  request: string;
  context: string;
  catalog: readonly Exercise[];
  find: (id: string) => Exercise | undefined;
}): Promise<PlanSuggestion> {
  const allowedIds = new Set(input.catalog.map((e) => e.id));
  const { data } = await callAI(
    'adjustPlan',
    adjustPlanPrompt({ ...input, nameOf: (id) => input.find(id)?.name ?? id }),
    planChangesSchema,
    { temperature: 0.3 },
  );
  const resolved = resolveChanges(data.changes, input.plan, input.find, (e) => allowedIds.has(e.id));
  return { explanationPt: data.explanationPt, ...resolved };
}
