import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { MuscleMap } from '@/components/muscles/MuscleMap';
import { Button, Card, EmptyState, ErrorState, Screen, Skeleton, Text } from '@/components/ui';
import { RecordBadge } from '@/components/workout/RecordBadge';
import { SummaryFeedback } from '@/components/workout/SummaryFeedback';
import { updatePlanDay } from '@/db/plansRepo';
import { updateRoutine } from '@/db/routinesRepo';
import { useWorkoutSummary, type WorkoutSummary } from '@/features/summary/useWorkoutSummary';
import { strings } from '@/i18n/strings';
import { formatDuration, formatInt, formatKg, formatKgNumber } from '@/lib/format';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles, useTheme } from '@/theme';
import { findExercise } from '@/training/catalog';

const s = strings.summary;

/** Fim do treino (seção 9.5): resumo bonito, recordes, músculos e "Como foi?". */
export default function SummaryScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, reload } = useWorkoutSummary(id);

  return (
    <Screen footer={<Button label={s.finish} icon="check" size="main" onPress={() => router.dismissTo('/workout')} />}>
      {state.status === 'loading' && <Skeleton height={theme.sizes.chartHeight} radius="lg" />}
      {state.status === 'error' && <ErrorState onRetry={reload} />}
      {state.status === 'success' && !state.data && <EmptyState icon="alert-circle" message={s.notFound} />}
      {state.status === 'success' && state.data && <SummaryBody summary={state.data} />}
    </Screen>
  );
}

function SummaryBody({ summary }: { summary: WorkoutSummary }) {
  const theme = useTheme();
  const styles = useStyles();
  const reducedMotion = useReducedMotion();
  const [routineAsked, setRoutineAsked] = useState(false);
  const enter = (i: number) =>
    reducedMotion ? undefined : FadeInDown.duration(theme.durations.transition).delay(i * theme.durations.micro);

  return (
    <>
      <Animated.View entering={enter(0)}>
        <Text variant="display" accessibilityRole="header">
          {summary.trainedGlutes ? s.doneGlutes : s.done}
        </Text>
      </Animated.View>
      <Animated.View entering={enter(1)}>
        <Card>
          <View style={styles.stats}>
            <Stat label={s.duration} value={formatDuration(summary.durationMs)} />
            <Stat label={s.sets} value={String(summary.sets)} />
            <Stat label={s.volume} value={s.volumeValue(formatInt(summary.volumeKg))} />
          </View>
          <Text variant="label" color="primary" align="center">
            {s.glutesWeek(formatKgNumber(summary.glutesWeek))}
          </Text>
        </Card>
      </Animated.View>

      {summary.records.length > 0 && (
        <Animated.View entering={enter(2)}>
          <Card title={s.records}>
            {summary.records.map((r) => (
              <View key={`${r.exerciseId}|${r.kind}`} style={styles.record}>
                <RecordBadge kinds={[r.kind]} />
                <Text style={styles.recordText}>
                  {s.recordLine(findExercise(r.exerciseId)?.name ?? '', strings.workout.recordKinds[r.kind], formatKg(r.value))}
                </Text>
              </View>
            ))}
          </Card>
        </Animated.View>
      )}

      {summary.muscles.primary.length > 0 && (
        <Animated.View entering={enter(3)}>
          <Card title={s.muscles}>
            <MuscleMap primary={summary.muscles.primary} secondary={summary.muscles.secondary} labels />
          </Card>
        </Animated.View>
      )}

      <SummaryFeedback workoutId={summary.workout.id} feeling={summary.workout.feeling} pain={summary.workout.pain} />

      {summary.update && !routineAsked && (
        <Card title={summary.update.kind === 'planDay' ? s.updatePlanTitle : s.updateRoutineTitle(summary.update.name)}>
          <Text color="textMuted">{s.updateRoutineBody}</Text>
          <Button
            label={summary.update.kind === 'planDay' ? s.updatePlan : s.updateRoutine}
            icon="save"
            onPress={() => {
              const update = summary.update!;
              const save =
                update.kind === 'planDay'
                  ? updatePlanDay(update.id, { name: update.name, exercises: update.items })
                  : updateRoutine(update.id, { name: update.name, items: update.items });
              void save.then(() => showSnackbar(s.routineUpdated));
              setRoutineAsked(true);
            }}
          />
          <Button label={s.keepRoutine} variant="ghost" onPress={() => setRoutineAsked(true)} />
        </Card>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <Text variant="metric">{value}</Text>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  stats: { flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md },
  stat: { flex: 1, alignItems: 'center', gap: t.spacing.xs },
  record: { gap: t.spacing.xs },
  recordText: { flex: 1 },
}));
