import { z } from 'zod';

/** Tipos de série (seção 4.4): o nº da série alterna entre eles. Aquecimento não conta nas estatísticas. */
export const SET_KINDS = ['normal', 'warmup', 'drop', 'failure'] as const;
export type SetKind = (typeof SET_KINDS)[number];

/** Séries que contam como "difíceis" no volume e nos recordes. */
export const HARD_SET_KINDS: readonly SetKind[] = ['normal', 'drop', 'failure'];

/** Um exercício num treino montado (rotina) ou num dia do plano. */
export const plannedExerciseSchema = z.object({
  exerciseId: z.string(),
  sets: z.number().int().min(1).max(10),
  repMin: z.number().int().positive(),
  repMax: z.number().int().positive(),
  restSec: z.number().int().min(15).max(600),
});
export type PlannedExercise = z.infer<typeof plannedExerciseSchema>;

export type WorkoutStatus = 'active' | 'done' | 'discarded';
/** "Como foi?" no fim do treino. */
export type Feeling = 'light' | 'good' | 'hard';
/** "Sentiu alguma dor?" no fim do treino. */
export type Pain = 'none' | 'muscle' | 'joint';

export type WorkoutSet = {
  id: string;
  position: number;
  kind: SetKind;
  weightKg: number | null;
  reps: number | null;
  /** "Quantas ainda sobravam?" (repetições em reserva), na última série. */
  rir: number | null;
  completedAt: string | null;
};

export type WorkoutExercise = {
  id: string;
  workoutId: string;
  exerciseId: string;
  position: number;
  notes: string | null;
  restSec: number;
  repMin: number | null;
  repMax: number | null;
  sets: WorkoutSet[];
};

export type Workout = {
  id: string;
  planDayId: string | null;
  routineId: string | null;
  name: string | null;
  startedAt: string;
  endedAt: string | null;
  status: WorkoutStatus;
  notes: string | null;
  feeling: Feeling | null;
  pain: Pain | null;
  /** Card "5–10 min de cardio leve e mobilidade" marcado (seção 9.3). */
  warmupDone: boolean;
  exercises: WorkoutExercise[];
};

export const isHardSet = (set: Pick<WorkoutSet, 'kind'>) => HARD_SET_KINDS.includes(set.kind);
export const isDone = (set: Pick<WorkoutSet, 'completedAt'>) => set.completedAt != null;
