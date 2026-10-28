import { z } from 'zod';

import { VOLUME_GROUPS, type VolumeGroup } from './exerciseModel';
import { plannedExerciseSchema, type PlannedExercise } from './workoutModel';

/** Modelos de plano (seção 9.2). */
export const TEMPLATES = ['fullBodyLean', 'fullBodyAB', 'lowerUpperLower', 'upperLower4', 'upperLower5'] as const;
export type TemplateId = (typeof TEMPLATES)[number];

/** Meta semanal de séries difíceis de um grupo. */
export type VolumeTarget = { min: number; max: number };
export type PlanTargets = Partial<Record<VolumeGroup, VolumeTarget>>;

export const targetsSchema = z.partialRecord(z.enum(VOLUME_GROUPS), z.object({ min: z.number(), max: z.number() }));
export const planExercisesSchema = z.array(plannedExerciseSchema);

export type PlanDay = {
  id: string;
  planId: string;
  position: number;
  name: string;
  exercises: PlannedExercise[];
  /** Ex.: "20–30 min de cardio leve depois". */
  note: string | null;
};

export type Plan = {
  id: string;
  template: TemplateId;
  createdAt: string;
  active: boolean;
  /** Segunda-feira ("AAAA-MM-DD") da semana leve, se houver uma marcada. */
  deloadWeek: string | null;
  targets: PlanTargets;
  days: PlanDay[];
};
