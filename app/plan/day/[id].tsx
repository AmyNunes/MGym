import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { usePlannedRowHeight } from '@/components/routines/PlannedExerciseRow';
import { PlannedEditorList } from '@/components/routines/PlannedEditorList';
import { Button, EmptyState, ErrorState, Notice, Screen, Skeleton, TextField } from '@/components/ui';
import { getPlanDay, updatePlanDay } from '@/db/plansRepo';
import { usePlannedEditor } from '@/features/planned/usePlannedEditor';
import { useActivePlan } from '@/features/plan/usePlan';
import { startPlanDay } from '@/features/workout/start';
import { strings } from '@/i18n/strings';
import { useProfile } from '@/stores/profileStore';
import { makeStyles } from '@/theme';
import { planWarnings } from '@/training/plan';

const w = strings.workoutTab;

/** Montar/editar um dia do plano (seção 9.2). Avisa, sem bloquear, se o volume de glúteos cai ou um grupo some. */
export default function PlanDayScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const rowHeight = usePlannedRowHeight();
  const profile = useProfile((s) => s.profile);
  const plan = useActivePlan();
  const editor = usePlannedEditor(id, {
    load: async () => {
      const day = await getPlanDay(id);
      return day ? { name: day.name, items: day.exercises } : null;
    },
    save: (d) => updatePlanDay(id, { name: d.name, exercises: d.items }),
  });

  const active = plan.state.status === 'success' ? plan.state.data : null;
  const day = active?.days.find((d) => d.id === id);
  const warnings = active
    ? planWarnings(
        active.days.map((d) => (d.id === id ? { exercises: editor.items } : d)),
        profile.daysPerWeek ?? active.days.length,
        active.targets,
      )
    : [];

  if (editor.status !== 'ready') {
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ title: w.planDay }} />
        {editor.status === 'loading' && <Skeleton height={rowHeight * 3} />}
        {editor.status === 'error' && <ErrorState onRetry={editor.reload} />}
        {editor.status === 'missing' && <EmptyState icon="alert-circle" message={strings.common.genericError} />}
      </Screen>
    );
  }

  const start = async (light: boolean) => {
    await editor.flush();
    if (day && active) await startPlanDay({ ...day, name: editor.name, exercises: editor.items }, active, { light });
  };

  return (
    <Screen
      edges={[]}
      footer={
        editor.items.length > 0 && day ? (
          <View style={styles.footer}>
            <Button label={strings.workout.start} icon="play" size="main" onPress={() => void start(false)} />
            <Button label={w.lightDay} icon="feather" variant="ghost" onPress={() => void start(true)} />
          </View>
        ) : undefined
      }
    >
      <Stack.Screen options={{ title: editor.name || w.planDay }} />
      <TextField label={w.dayName} value={editor.name} onChangeText={editor.rename} maxLength={40} />
      {day?.note && <Notice icon="wind">{day.note}</Notice>}
      {warnings.map((x) => (
        <Notice key={x.kind === 'groupMissing' ? x.group : x.kind} tone="warning">
          {x.kind === 'glutesLow'
            ? strings.result.warnings.glutesLow(String(x.sets), x.min)
            : strings.result.warnings.groupMissing(strings.volumeGroups[x.group])}
        </Notice>
      ))}
      <PlannedEditorList editor={editor} />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  footer: { gap: t.spacing.xs },
}));
