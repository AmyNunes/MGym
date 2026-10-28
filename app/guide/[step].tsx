import { router, Stack, useLocalSearchParams } from 'expo-router';

import {
  AddressStep,
  ContextStep,
  FollowUpStep,
  GoalStep,
  HrtStep,
  PrioritiesStep,
  ScreeningStep,
  SurgeryStep,
} from '@/components/guide/AboutSteps';
import { DietRestrictionsStep, MealsStep, NumbersStep, PotassiumStep, RoutineStep, WeightGoalStep } from '@/components/guide/FoodSteps';
import { GuideScaffold } from '@/components/guide/GuideScaffold';
import { MeasurementsStep } from '@/components/guide/MeasurementsStep';
import { BodyStep, ExperienceStep, LimitationsStep, ScheduleStep } from '@/components/guide/TrainingSteps';
import { EmptyState, Screen } from '@/components/ui';
import { syncFirstWeight } from '@/features/body/weightService';
import { createPlanFromProfile } from '@/features/plan/fromProfile';
import { isStepId, MENU_STEPS, nextStepId, PLAN_STEPS, STEP_META, type StepId } from '@/features/guide/steps';
import { regenerateWeek } from '@/features/meals/menuService';
import { offerMenuUpdate } from '@/features/meals/offerMenuUpdate';
import { strings } from '@/i18n/strings';
import { showSnackbar } from '@/stores/snackbarStore';
import { finishGuide, patchProfile, useProfile } from '@/stores/profileStore';

const g = strings.guide;

const BODIES: Record<StepId, () => React.JSX.Element> = {
  address: AddressStep,
  goal: GoalStep,
  priorities: PrioritiesStep,
  context: ContextStep,
  hrt: HrtStep,
  followUp: FollowUpStep,
  surgery: SurgeryStep,
  screening: ScreeningStep,
  experience: ExperienceStep,
  schedule: ScheduleStep,
  limitations: LimitationsStep,
  body: BodyStep,
  measurements: MeasurementsStep,
  numbers: NumbersStep,
  weightGoal: WeightGoalStep,
  meals: MealsStep,
  dietRestrictions: DietRestrictionsStep,
  routine: RoutineStep,
  potassium: PotassiumStep,
};

const FOOD_TEXTS: Partial<Record<StepId, { title: string; help?: string }>> = {
  measurements: g.measurements,
  numbers: g.food.numbers,
  weightGoal: { title: g.food.weightGoal.title },
  meals: g.food.meals,
  dietRestrictions: g.food.restrictions,
  routine: { title: g.food.routine.title },
  potassium: g.food.potassium,
};

function stepTexts(step: StepId): { title: string; help?: string } {
  const food = FOOD_TEXTS[step];
  if (food) return food;
  const s = g.steps[step as keyof typeof g.steps];
  return { title: s.title, help: 'help' in s ? (s as { help: string }).help : undefined };
}

/**
 * Uma pergunta do Guia. Cada resposta salva na hora. Com `?edit=1` (vindo de Configurações › Perfil),
 * "Salvar" volta e, se a resposta muda o treino, oferece atualizar o plano.
 */
export default function GuideStepScreen() {
  const { step, edit } = useLocalSearchParams<{ step: string; edit?: string }>();
  const profile = useProfile((s) => s.profile);

  if (!isStepId(step)) {
    return (
      <Screen edges={[]}>
        <EmptyState icon="alert-circle" message={strings.common.genericError} />
      </Screen>
    );
  }

  const Body = BODIES[step];
  const next = nextStepId(step);
  const editing = edit === '1';

  const go = async () => {
    if (step === 'screening') await patchProfile({ screeningAnswered: true });
    // O peso do Guia vira o primeiro registro de peso (Fase 5).
    if (step === 'body') await syncFirstWeight().catch(() => {});
    if (editing) {
      router.back();
      if (PLAN_STEPS.includes(step)) {
        showSnackbar(g.planNeedsUpdate, {
          label: g.updatePlan,
          onPress: () => void createPlanFromProfile(useProfile.getState().profile).then(() => showSnackbar(g.saved)),
        });
      } else if (MENU_STEPS.includes(step)) {
        offerMenuUpdate();
      }
      return;
    }
    if (next) router.push(`/guide/${next}`);
    else {
      await finishGuide();
      await regenerateWeek(new Date()).catch(() => {});
      router.replace('/guide/result');
    }
  };

  return (
    <GuideScaffold
      step={step}
      title={stepTexts(step).title}
      help={stepTexts(step).help}
      canContinue={STEP_META[step].ready(profile)}
      continueLabel={editing ? g.save : next ? g.continue : g.finish}
      onContinue={() => void go()}
      onSkip={() => void go()}
    >
      <Stack.Screen options={{ title: g.title }} />
      <Body />
    </GuideScaffold>
  );
}
