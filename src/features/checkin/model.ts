import { z } from 'zod';

import { CARE_QUESTIONS } from '@/safety/warnings';

/** Check-in semanal (seção 11.5): números, "como foi", decisões e cuidado gentil. */

export const RATINGS = ['energy', 'sleep', 'hunger', 'mood', 'pain'] as const;
export type Rating = (typeof RATINGS)[number];

export const DECISIONS = ['keep', 'deload', 'adjustFood', 'dropDay'] as const;
export type DecisionKind = (typeof DECISIONS)[number];

export const checkinStatsSchema = z.object({
  workouts: z.number(),
  planned: z.number(),
  glutes: z.number(),
  glutesGoal: z.number(),
  records: z.number(),
  cardioMinutes: z.number(),
  /** % das refeições do cardápio marcadas na semana (até hoje). */
  mealsMarkedPct: z.number().nullable(),
  /** Ritmo da tendência do peso (só guardado se o peso está visível). */
  weightRate: z.object({ kg: z.number(), pct: z.number() }).nullable(),
  signals: z.array(z.string()),
});
export type CheckinStats = z.infer<typeof checkinStatsSchema>;

export const checkinAnswersSchema = z.object({
  ratings: z.partialRecord(z.enum(RATINGS), z.number().int().min(1).max(5)),
  care: z.partialRecord(z.enum(CARE_QUESTIONS), z.boolean()).optional(),
});
export type CheckinAnswers = z.infer<typeof checkinAnswersSchema>;

export const decisionSchema = z.object({
  kind: z.enum(DECISIONS),
  accepted: z.boolean(),
  /** Para "ajustar metas": a mudança em kcal. */
  delta: z.number().optional(),
});
export type Decision = z.infer<typeof decisionSchema>;
export const decisionsSchema = z.array(decisionSchema);
