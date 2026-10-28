import { cardioSince } from '@/db/cardioRepo';
import { getActivePlan } from '@/db/plansRepo';
import { doneWorkoutDaysSince, lastDonePlanDayId, listDoneWorkouts } from '@/db/workoutsRepo';
import { loadWeightView } from '@/features/body/weightService';
import { checkinPending } from '@/features/checkin/checkinService';
import { loadMealsDay } from '@/features/meals/useMealsDay';
import { loadWeekVolume } from '@/features/plan/useTrainingOverview';
import { isAiConfigured } from '@/features/settings/useAiConfigured';
import { appDayKey, parseDateKey, startOfAppDay, startOfWeek } from '@/lib/dates';
import { useLoader } from '@/lib/useLoader';
import { trainingWeekdays, type Profile } from '@/profile/profile';
import { recoveryState } from '@/safety/recovery';
import { useProfile } from '@/stores/profileStore';
import { findExercise } from '@/training/catalog';
import { estimateMinutes } from '@/training/duration';
import { gluteAim } from '@/training/plan';
import { isTrainingWeekday, nextPlanDayIndex } from '@/training/schedule';

import { weekDots } from './week';

/** Tudo de Hoje (seção 12.1) numa carga só. */
export async function loadToday(profile: Profile, completed: boolean, now = new Date()) {
  const weekStart = startOfWeek(now).toISOString();
  const [plan, trainedDays, recent, volume, cardio, aiReady, meals, weight, checkin] = await Promise.all([
    getActivePlan(),
    doneWorkoutDaysSince(weekStart),
    listDoneWorkouts(1),
    loadWeekVolume(now),
    cardioSince(weekStart),
    isAiConfigured().catch(() => false),
    loadMealsDay(parseDateKey(appDayKey(now))).catch(() => null),
    loadWeightView(now),
    checkinPending(now),
  ]);
  const dayIds = plan?.days.map((d) => d.id) ?? [];
  const nextIndex = nextPlanDayIndex(dayIds, await lastDonePlanDayId(dayIds));
  const nextDay = plan?.days[nextIndex] ?? null;
  const weekdays = trainingWeekdays(profile);
  const doneToday = recent[0] && Date.parse(recent[0].startedAt) >= startOfAppDay(now).getTime() ? recent[0] : null;

  return {
    plan,
    nextDay: nextDay ? { ...nextDay, minutes: estimateMinutes(nextDay.exercises, findExercise) } : null,
    trainingDay: isTrainingWeekday(weekdays, now),
    doneToday,
    recovery: recoveryState(profile.surgery, appDayKey(now)),
    meals: meals?.status === 'ready' ? meals : null,
    weight,
    checkinPending: checkin,
    week: {
      dots: weekDots(now, trainedDays, weekdays),
      trained: trainedDays.length,
      target: profile.daysPerWeek ?? weekdays.length,
      glutes: volume.glutes,
      glutesGoal: gluteAim({ experience: profile.experience ?? 'beginner', goal: profile.goal, priorities: profile.priorities }),
      cardioMinutes: cardio.reduce((sum, c) => sum + c.minutes, 0),
    },
    /** Primeiro uso: os 3 passos (seção 12.1). */
    firstUse: { guide: completed, ai: aiReady, firstWorkout: recent.length > 0 },
  };
}

export type TodayData = Awaited<ReturnType<typeof loadToday>>;

export function useToday() {
  const profile = useProfile((s) => s.profile);
  const completed = useProfile((s) => s.completed);
  return useLoader(() => loadToday(profile, completed), `${completed}|${JSON.stringify(profile)}`);
}
