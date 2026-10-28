import { recordsOfWorkout, type PersonalRecord } from '@/db/recordsRepo';
import { getPlanDay } from '@/db/plansRepo';
import { getRoutine } from '@/db/routinesRepo';
import { getWorkout, hardSetsSince, updateWorkout } from '@/db/workoutsRepo';
import { startOfWeek } from '@/lib/dates';
import { useLoader } from '@/lib/useLoader';
import { findExercise } from '@/training/catalog';
import type { Exercise } from '@/training/exerciseModel';
import { changedForPlan, differsFromPlan, mergeIntoPlan, planFromWorkout, workedMuscles } from '@/training/session';
import { countHardSets, tonnage, volumeByGroup } from '@/training/volume';
import type { Feeling, Pain, PlannedExercise } from '@/training/workoutModel';

/** Oferta de "atualizar" o treino montado ou o dia do plano com o que foi feito (seção 9.5). */
export type UpdateOffer = { kind: 'routine' | 'planDay'; id: string; name: string; items: PlannedExercise[] };

function updateOffer(
  done: PlannedExercise[],
  routine: { id: string; name: string; items: PlannedExercise[] } | null,
  planDay: { id: string; name: string; exercises: PlannedExercise[] } | null,
): UpdateOffer | null {
  if (!done.length) return null;
  if (routine && differsFromPlan(routine.items, done)) return { kind: 'routine', id: routine.id, name: routine.name, items: done };
  if (planDay && changedForPlan(planDay.exercises, done)) {
    return { kind: 'planDay', id: planDay.id, name: planDay.name, items: mergeIntoPlan(planDay.exercises, done) };
  }
  return null;
}

const known = <T extends { exerciseId: string }>(list: readonly T[]) =>
  list.flatMap((item) => {
    const exercise = findExercise(item.exerciseId);
    return exercise ? [{ ...item, exercise }] : [];
  });

/** O melhor recorde de cada exercício e tipo (um treino pode bater o mesmo recorde mais de uma vez). */
export function bestRecords(records: readonly PersonalRecord[]): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  for (const r of records) {
    const key = `${r.exerciseId}|${r.kind}`;
    const current = best.get(key);
    if (!current || r.value > current.value) best.set(key, r);
  }
  return [...best.values()];
}

/** Números do fim do treino (seção 9.5). */
export async function loadWorkoutSummary(id: string) {
  const workout = await getWorkout(id);
  if (!workout) return null;
  const [records, weekSets, routine, planDay] = await Promise.all([
    recordsOfWorkout(id),
    hardSetsSince(startOfWeek(new Date(workout.startedAt)).toISOString()),
    workout.routineId ? getRoutine(workout.routineId) : Promise.resolve(null),
    workout.planDayId ? getPlanDay(workout.planDayId) : Promise.resolve(null),
  ]);
  const allSets = workout.exercises.flatMap((e) => e.sets);
  const end = workout.endedAt ? Date.parse(workout.endedAt) : Date.now();
  const thisWorkout = volumeByGroup(
    known(workout.exercises).map((e) => ({ exercise: e.exercise as Exercise, sets: countHardSets(e.sets) })),
  );
  const done = planFromWorkout(workout, findExercise);

  return {
    workout,
    durationMs: end - Date.parse(workout.startedAt),
    sets: countHardSets(allSets),
    volumeKg: tonnage(allSets),
    records: bestRecords(records),
    muscles: workedMuscles(workout, findExercise),
    trainedGlutes: thisWorkout.glutes > 0,
    glutesWeek: volumeByGroup(known(weekSets)).glutes,
    /** O treino montado ou o dia do plano mudou? Então a tela pergunta se quero atualizar (seção 9.5). */
    update: updateOffer(done, routine, planDay),
  };
}

export type WorkoutSummary = NonNullable<Awaited<ReturnType<typeof loadWorkoutSummary>>>;

export function useWorkoutSummary(id: string) {
  return useLoader(() => loadWorkoutSummary(id), id);
}

export function saveFeedback(id: string, patch: { feeling?: Feeling | null; pain?: Pain | null }) {
  return updateWorkout(id, patch);
}
