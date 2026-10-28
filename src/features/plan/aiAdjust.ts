import { adjustPlan, type PlanSuggestion } from '@/ai/functions/adjustPlan';
import { profileContext } from '@/ai/prompts/common';
import { EXERCISES } from '@/data/exercises';
import { getActivePlan, updatePlanDay } from '@/db/plansRepo';
import { trainingPrefs } from '@/features/workout/prefs';
import { appDayKey } from '@/lib/dates';
import type { Profile } from '@/profile/profile';
import { recoveryState } from '@/safety/recovery';
import { useProfile } from '@/stores/profileStore';
import { applyChanges } from '@/training/aiPlan';
import { findExercise } from '@/training/catalog';
import type { Exercise } from '@/training/exerciseModel';
import { avoidList } from '@/training/plan';
import { plannedFrom } from '@/training/planned';

/** O catálogo que a IA pode usar: sem o que fere minhas limitações ou o modo recuperação. */
export function allowedCatalog(profile: Profile): Exercise[] {
  const avoid = avoidList(profile.limitations, recoveryState(profile.surgery, appDayKey(new Date())).avoid);
  return EXERCISES.filter((e) => !e.restrictions.some((r) => avoid.includes(r)));
}

/** "Ajustar o plano com IA": pede a sugestão (sem salvar). */
export async function suggestPlanChanges(request: string): Promise<PlanSuggestion & { planId: string }> {
  const plan = await getActivePlan();
  if (!plan) return { explanationPt: '', changes: [], dropped: 0, planId: '' };
  const profile = useProfile.getState().profile;
  const suggestion = await adjustPlan({
    plan,
    request: request.trim(),
    context: profileContext(profile),
    catalog: allowedCatalog(profile),
    find: findExercise,
  });
  return { ...suggestion, planId: plan.id };
}

/** Aplica no plano o que eu confirmei. */
export async function applyPlanSuggestion(suggestion: PlanSuggestion): Promise<void> {
  const plan = await getActivePlan();
  if (!plan) return;
  const { restOverride } = trainingPrefs();
  const days = applyChanges(plan, suggestion.changes, (exercise, sets) => plannedFrom(exercise, sets, restOverride));
  for (const [dayId, exercises] of days) {
    const day = plan.days.find((d) => d.id === dayId);
    if (day) await updatePlanDay(dayId, { name: day.name, exercises });
  }
}
