import { savePlan } from '@/db/plansRepo';
import { trainingPrefs } from '@/features/workout/prefs';
import { appDayKey, nowIso } from '@/lib/dates';
import type { Profile } from '@/profile/profile';
import { recoveryState } from '@/safety/recovery';
import { generatePlan, type PlanInput } from '@/training/plan';

/** As respostas do Guia viram a entrada do gerador do plano (com padrões para o que ficou sem resposta). */
export function planInputFrom(profile: Profile, today: Date): PlanInput {
  return {
    daysPerWeek: profile.daysPerWeek ?? 3,
    sessionMinutes: profile.sessionMinutes ?? 60,
    experience: profile.experience ?? 'beginner',
    goal: profile.goal,
    priorities: profile.priorities,
    limitations: profile.limitations,
    recoveryAvoid: recoveryState(profile.surgery, appDayKey(today)).avoid,
    restOverride: trainingPrefs().restOverride,
  };
}

/** Gera e grava um plano novo a partir do perfil. Devolve o id. */
export async function createPlanFromProfile(profile: Profile, today = new Date()): Promise<string> {
  const generated = generatePlan(planInputFrom(profile, today));
  return savePlan({
    template: generated.template,
    createdAt: nowIso(),
    targets: generated.targets,
    days: generated.days.map((d) => ({ name: d.name, exercises: d.exercises, note: d.note })),
  });
}
