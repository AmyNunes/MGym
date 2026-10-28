import { listMeasurements, listWeights } from '@/db/bodyRepo';
import { cardioSince } from '@/db/cardioRepo';
import { listCheckins } from '@/db/checkinsRepo';
import { getActivePlan } from '@/db/plansRepo';
import { recentRecords } from '@/db/recordsRepo';
import { doneWorkoutDaysSince } from '@/db/workoutsRepo';
import { weightView } from '@/features/body/weightService';
import { checkinPending } from '@/features/checkin/checkinService';
import { describePlan } from '@/features/plan/usePlan';
import { loadWeekVolume } from '@/features/plan/useTrainingOverview';
import { addDays, appDayKey, startOfWeek } from '@/lib/dates';
import { useLoader } from '@/lib/useLoader';
import type { Profile } from '@/profile/profile';
import { useProfile } from '@/stores/profileStore';
import { constancyGrid } from '@/training/constancy';
import type { VolumeGroup } from '@/training/exerciseModel';
import { gluteAim } from '@/training/plan';

/** Semanas no calendário de constância. */
export const CONSTANCY_WEEKS = 8;

/** Tudo da aba Evolução (seção 12.6) numa carga só. */
export async function loadEvolution(profile: Profile, now = new Date()) {
  const since = startOfWeek(addDays(now, -7 * (CONSTANCY_WEEKS - 1))).toISOString();
  const [weights, measurements, records, plan, volume, cardio, trainedDays, checkins, pending] = await Promise.all([
    listWeights(),
    listMeasurements(),
    recentRecords(3),
    getActivePlan(),
    loadWeekVolume(now),
    cardioSince(startOfWeek(now).toISOString()),
    doneWorkoutDaysSince(since),
    listCheckins(1),
    checkinPending(now),
  ]);
  const goals: Partial<Record<VolumeGroup, number>> = plan
    ? describePlan(plan, profile).goals
    : { glutes: gluteAim({ experience: profile.experience ?? 'beginner', goal: profile.goal, priorities: profile.priorities }) };
  return {
    weight: weightView(weights, now),
    measurements,
    records,
    volume,
    goals,
    cardioMinutes: cardio.reduce((sum, c) => sum + c.minutes, 0),
    constancy: constancyGrid(trainedDays, appDayKey(now), CONSTANCY_WEEKS, profile.daysPerWeek ?? 3),
    lastCheckin: checkins[0] ?? null,
    checkinPending: pending,
  };
}

export type Evolution = Awaited<ReturnType<typeof loadEvolution>>;

export function useEvolution() {
  const profile = useProfile((s) => s.profile);
  return useLoader(() => loadEvolution(profile), JSON.stringify(profile));
}
