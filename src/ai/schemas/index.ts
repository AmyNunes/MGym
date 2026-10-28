import { z } from 'zod';

/**
 * Saídas das funções de IA (seção 14.3), sempre validadas por zod.
 * Limites de tamanho para a resposta não crescer sem fim; campos a mais são ignorados.
 */

const text = z.string().min(1).max(1200);

export const explanationSchema = z.object({
  overviewPt: text,
  steps: z.array(z.object({ titlePt: text, instructionPt: text, feelPt: text })).min(1).max(8),
  mistakes: z.array(z.object({ mistakePt: text, fixPt: text })).max(6),
  focusTipsPt: z.array(text).max(6),
  safetyPt: text,
});
export type Explanation = z.infer<typeof explanationSchema>;

const aiItem = z.object({ foodId: z.string(), grams: z.number().positive().max(2000) });

export const mealOptionsSchema = z.object({
  options: z
    .array(z.object({ namePt: text, items: z.array(aiItem).min(1).max(8), notePt: z.string().max(400).optional() }))
    .min(1)
    .max(3),
});
export type MealOptionsResult = z.infer<typeof mealOptionsSchema>;

export const describedMealSchema = z.object({
  items: z.array(aiItem.extend({ confidence: z.number().min(0).max(1) })).max(12),
});
export type DescribedMeal = z.infer<typeof describedMealSchema>;

export const PLAN_ACTIONS = ['replace', 'remove', 'add'] as const;
export const planChangesSchema = z.object({
  explanationPt: text,
  changes: z
    .array(
      z.object({
        action: z.enum(PLAN_ACTIONS),
        dayId: z.string(),
        exerciseId: z.string(),
        replaceWithId: z.string().nullable().optional(),
        reasonPt: text,
      }),
    )
    .max(10),
});
export type PlanChanges = z.infer<typeof planChangesSchema>;
export type PlanChange = PlanChanges['changes'][number];

export const coachReplySchema = z.object({
  replyPt: z.string().min(1).max(3000),
  suggestedExerciseIds: z.array(z.string()).max(5),
  safetyFlag: z.boolean(),
});
export type CoachReply = z.infer<typeof coachReplySchema>;

export const weeklySummarySchema = z.object({ summaryPt: text, focusNextWeekPt: text });
export type WeeklySummary = z.infer<typeof weeklySummarySchema>;
