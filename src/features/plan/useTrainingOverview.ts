import { getActivePlan } from '@/db/plansRepo';
import { listRoutines } from '@/db/routinesRepo';
import { hardSetsSince, lastDonePlanDayId } from '@/db/workoutsRepo';
import { startOfWeek } from '@/lib/dates';
import { useLoader } from '@/lib/useLoader';
import type { Profile } from '@/profile/profile';
import { useProfile } from '@/stores/profileStore';
import { findExercise } from '@/training/catalog';
import { deloadDue, isDeloadWeek, nextPlanDayIndex } from '@/training/schedule';
import { volumeByGroup } from '@/training/volume';

import { describePlan } from './usePlan';

/** Volume da semana (séries difíceis feitas desde segunda) por grupo. */
export async function loadWeekVolume(now = new Date()) {
  const sets = await hardSetsSince(startOfWeek(now).toISOString());
  return volumeByGroup(
    sets.flatMap((s) => {
      const exercise = findExercise(s.exerciseId);
      return exercise ? [{ exercise, sets: s.sets }] : [];
    }),
  );
}

/** Tudo da aba Treino (seção 12.2): plano, próximo dia do rodízio, semana leve, volume e meus treinos. */
export async function loadTrainingOverview(profile: Profile, now = new Date()) {
  const [plan, routines, weekVolume] = await Promise.all([getActivePlan(), listRoutines(), loadWeekVolume(now)]);
  const dayIds = plan?.days.map((d) => d.id) ?? [];
  const lastDayId = await lastDonePlanDayId(dayIds);
  return {
    plan: plan ? describePlan(plan, profile) : null,
    nextIndex: nextPlanDayIndex(dayIds, lastDayId),
    deloadDue: plan ? deloadDue(plan.createdAt, plan.deloadWeek, now) : false,
    deloadActive: plan ? isDeloadWeek(plan.deloadWeek, now) : false,
    routines: routines.filter((r) => r.items.length > 0),
    weekVolume,
  };
}

export type TrainingOverview = Awaited<ReturnType<typeof loadTrainingOverview>>;

export function useTrainingOverview() {
  const profile = useProfile((s) => s.profile);
  return useLoader(() => loadTrainingOverview(profile), JSON.stringify(profile));
}
