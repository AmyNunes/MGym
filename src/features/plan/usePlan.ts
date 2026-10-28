import { getActivePlan } from '@/db/plansRepo';
import { useLoader } from '@/lib/useLoader';
import type { Profile } from '@/profile/profile';
import { findExercise } from '@/training/catalog';
import { estimateMinutes } from '@/training/duration';
import { gluteAim, planWarnings, weeklyVolume } from '@/training/plan';
import type { Plan } from '@/training/planModel';

/** O plano ativo e as contas de cada dia (duração) e da semana (volume, avisos). */
export function describePlan(plan: Plan, profile: Profile) {
  const daysPerWeek = profile.daysPerWeek ?? plan.days.length;
  const experience = profile.experience ?? 'beginner';
  const goals = Object.fromEntries(Object.entries(plan.targets).map(([g, t]) => [g, t.min]));
  goals.glutes = gluteAim({ experience, goal: profile.goal, priorities: profile.priorities });
  return {
    plan,
    days: plan.days.map((d) => ({ ...d, minutes: estimateMinutes(d.exercises, findExercise) })),
    volume: weeklyVolume(plan.days, daysPerWeek),
    goals,
    warnings: planWarnings(plan.days, daysPerWeek, plan.targets),
  };
}

export type PlanView = ReturnType<typeof describePlan>;

export function useActivePlan() {
  return useLoader(getActivePlan);
}
