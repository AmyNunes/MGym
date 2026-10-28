import { router } from 'expo-router';

import type { Routine } from '@/db/routinesRepo';
import { appDayKey } from '@/lib/dates';
import { recoveryState } from '@/safety/recovery';
import { useProfile } from '@/stores/profileStore';
import { skipRest } from '@/stores/restStore';
import { showSnackbar } from '@/stores/snackbarStore';
import { askStartConflict } from '@/stores/startConflictStore';
import type { Plan, PlanDay } from '@/training/planModel';
import { effectiveItems, inEasyStart, isDeloadWeek } from '@/training/schedule';
import { doneSets, startDecision } from '@/training/session';
import { strings } from '@/i18n/strings';
import { discardWorkout, finishWorkout, resumeWorkout, startWorkout, useWorkout, type StartInput } from '@/stores/workoutStore';

/** Começa um treino montado e abre a tela. */
export async function startRoutine(routine: Pick<Routine, 'id' | 'name' | 'items'>) {
  await begin({ name: routine.name, routineId: routine.id, items: routine.items });
}

/** Treino livre: a mesma tela, começando vazia (seção 9.5). */
export async function startFreeWorkout() {
  await begin({ name: strings.workout.freeName, items: [] });
}

/**
 * Começa um dia do plano. Semanas 1–2 de iniciante (ou com "sim" na triagem): 2 séries;
 * semana leve e "dia leve" (ou recuperação leve): metade das séries (seções 9.2, 9.4 e 16).
 */
export async function startPlanDay(
  day: PlanDay,
  plan: Pick<Plan, 'createdAt' | 'deloadWeek'>,
  options: { light?: boolean; replace?: boolean } = {},
) {
  const profile = useProfile.getState().profile;
  const now = new Date();
  const mode = {
    easyStart: (profile.experience !== 'experienced' || profile.screening.length > 0) && inEasyStart(plan.createdAt, now),
    deload: isDeloadWeek(plan.deloadWeek, now),
    light: !!options.light || recoveryState(profile.surgery, appDayKey(now)).lightOnly,
  };
  const w = strings.workout;
  const intro = mode.light ? w.lightNote : mode.deload ? w.deloadNote : mode.easyStart ? w.easyStart : null;
  const input = {
    name: options.light ? strings.workoutTab.lightName(day.name) : day.name,
    planDayId: day.id,
    items: effectiveItems(day.exercises, mode),
    intro,
  };
  await begin(input, options.replace);
}

/**
 * Começa um treino cuidando do que já está em andamento (`startDecision`): o mesmo treino continua;
 * um sem nenhuma série feita é descartado; um com séries feitas pergunta. Vindo de uma notificação
 * (`replace`), não pergunta: continua o que está em andamento e a tela de abertura sai da pilha.
 */
async function begin(input: StartInput, replace = false) {
  await resumeWorkout().catch(() => null);
  const active = useWorkout.getState().workout;
  const decision = startDecision(active, input);

  if (active && decision === 'open') return openSession(active.id, replace);
  if (active && decision === 'ask') {
    const choice = replace
      ? 'continue'
      : await askStartConflict({ activeName: active.name ?? strings.workout.freeName, doneSets: doneSets(active), nextName: input.name });
    if (choice == null) return;
    if (choice === 'continue') return openSession(active.id, replace);
    await skipRest();
    await finishWorkout();
    showSnackbar(strings.workout.conflict.saved);
  }
  if (active && decision === 'replace') {
    await skipRest();
    await discardWorkout();
  }
  openSession(await startWorkout(input), replace);
}

function openSession(id: string, replace: boolean) {
  if (replace) router.replace(`/session/${id}`);
  else router.push(`/session/${id}`);
}
