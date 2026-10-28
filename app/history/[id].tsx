import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Card, EmptyState, ErrorState, IconButton, MenuSheet, Screen, Skeleton, Text } from '@/components/ui';
import { RecordBadge } from '@/components/workout/RecordBadge';
import { deleteWorkoutWithUndo, saveWorkoutAsRoutine } from '@/features/history/history';
import { useWorkoutSummary } from '@/features/summary/useWorkoutSummary';
import { strings } from '@/i18n/strings';
import { formatShortDate, formatTime } from '@/lib/dates';
import { formatDuration, formatInt, formatKg } from '@/lib/format';
import { makeStyles, useTheme } from '@/theme';
import { findExercise } from '@/training/catalog';
import { formatSet } from '@/training/setSummary';

const h = strings.history;
const s = strings.summary;

/** Um treino feito: exercícios, séries, recordes e como foi. */
export default function HistoryDetailScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, reload } = useWorkoutSummary(id);
  const [menu, setMenu] = useState(false);
  const data = state.status === 'success' ? state.data : null;
  const name = data?.workout.name ?? strings.workout.freeName;
  const startedAt = data ? new Date(data.workout.startedAt) : null;

  return (
    <Screen edges={[]}>
      <Stack.Screen
        options={{
          title: name,
          headerRight: () => (
            <IconButton icon="more-vertical" accessibilityLabel={h.menu(name)} onPress={() => setMenu(true)} />
          ),
        }}
      />
      {state.status === 'loading' && <Skeleton height={theme.sizes.chartHeight} radius="lg" />}
      {state.status === 'error' && <ErrorState onRetry={reload} />}
      {state.status === 'success' && !data && <EmptyState icon="alert-circle" message={h.notFound} />}
      {data && startedAt && (
        <>
          <Text color="textMuted">
            {[
              `${formatShortDate(startedAt)}, ${formatTime(startedAt)}`,
              formatDuration(data.durationMs),
              s.volumeValue(formatInt(data.volumeKg)),
            ].join(' · ')}
          </Text>
          {data.workout.feeling && <Text>{h.feeling(s.feelings[data.workout.feeling])}</Text>}
          {data.workout.pain && data.workout.pain !== 'none' && <Text>{h.pain(s.pains[data.workout.pain])}</Text>}
          {data.workout.notes && (
            <Card title={h.notes}>
              <Text>{data.workout.notes}</Text>
            </Card>
          )}
          {data.workout.exercises.map((e) => {
            const exercise = findExercise(e.exerciseId);
            if (!exercise) return null;
            return (
              <Card key={e.id} title={exercise.name}>
                {e.sets.map((set, i) => (
                  <View key={set.id} style={styles.set}>
                    <Text variant="label" color="textMuted" style={styles.setNumber}>
                      {strings.workout.setKindShort[set.kind] || i + 1}
                    </Text>
                    <Text variant="label">{formatSet(set, exercise.tracking)}</Text>
                  </View>
                ))}
                {e.notes && (
                  <Text variant="caption" color="textMuted">
                    {e.notes}
                  </Text>
                )}
              </Card>
            );
          })}
          {data.records.length > 0 && (
            <Card title={s.records}>
              {data.records.map((r) => (
                <View key={`${r.exerciseId}|${r.kind}`} style={styles.record}>
                  <RecordBadge kinds={[r.kind]} />
                  <Text>
                    {s.recordLine(
                      findExercise(r.exerciseId)?.name ?? '',
                      strings.workout.recordKinds[r.kind],
                      formatKg(r.value),
                    )}
                  </Text>
                </View>
              ))}
            </Card>
          )}
        </>
      )}
      <MenuSheet
        visible={menu}
        onClose={() => setMenu(false)}
        actions={[
          { label: h.saveAsRoutine, icon: 'save', onPress: () => void saveWorkoutAsRoutine(id) },
          {
            label: h.deleteWorkout,
            icon: 'trash-2',
            destructive: true,
            onPress: () => {
              void deleteWorkoutWithUndo(id, () => {});
              router.back();
            },
          },
        ]}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  set: { flexDirection: 'row', gap: t.spacing.md },
  setNumber: { width: t.sizes.iconSmall },
  record: { gap: t.spacing.xs },
}));
