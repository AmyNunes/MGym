import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ExerciseHistoryCard } from '@/components/exercises/ExerciseHistoryCard';
import { MuscleMap } from '@/components/muscles/MuscleMap';
import { MuscleBars } from '@/components/plan/MuscleBars';
import { CardioRing } from '@/components/progress/CardioRing';
import { RecordRows } from '@/components/progress/RecordRows';
import { Card, Chip, ErrorState, Screen, Skeleton, Text } from '@/components/ui';
import { recentRecords } from '@/db/recordsRepo';
import { loadEvolution } from '@/features/progress/useEvolution';
import { strings } from '@/i18n/strings';
import { useLoader } from '@/lib/useLoader';
import { useProfile } from '@/stores/profileStore';
import { makeStyles, useTheme } from '@/theme';
import { findExercise } from '@/training/catalog';
import { MUSCLES, MUSCLE_VOLUME_GROUP, type Muscle } from '@/training/exerciseModel';

const s = strings.strength;
/** Quantos exercícios aparecem nos chips do gráfico de 1RM. */
const TOP_EXERCISES = 6;

/** Força e volume (seção 11.4): 1RM estimado dos principais, recordes e o volume da semana. */
export default function StrengthScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const profile = useProfile((p) => p.profile);
  const { state, reload } = useLoader(async () => {
    const [evolution, records] = await Promise.all([loadEvolution(profile), recentRecords(100)]);
    return { evolution, records };
  }, JSON.stringify(profile));
  const [picked, setPicked] = useState<string | null>(null);
  const data = state.status === 'success' ? state.data : null;

  // Os exercícios com mais recordes primeiro (os principais do meu treino).
  const counts = new Map<string, number>();
  for (const r of data?.records ?? []) counts.set(r.exerciseId, (counts.get(r.exerciseId) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_EXERCISES).map(([id]) => id);
  const exercise = findExercise(picked && top.includes(picked) ? picked : (top[0] ?? ''));

  const intensity: Partial<Record<Muscle, number>> = {};
  if (data) {
    for (const m of MUSCLES) {
      const group = MUSCLE_VOLUME_GROUP[m];
      const goal = group ? data.evolution.goals[group] : undefined;
      if (group && goal) intensity[m] = data.evolution.volume[group] / goal;
    }
  }

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: s.title }} />
      {state.status === 'loading' && <Skeleton height={theme.sizes.chartHeight} radius="lg" />}
      {state.status === 'error' && <ErrorState onRetry={reload} />}
      {data && (
        <>
          <Card title={s.e1rmTitle}>
            <Text variant="caption" color="textMuted">
              {s.e1rmHelp}
            </Text>
            {top.length === 0 && <Text color="textMuted">{s.noHistory}</Text>}
            {top.length > 0 && (
              <View style={styles.chips}>
                {top.map((id) => (
                  <Chip key={id} label={findExercise(id)?.name ?? id} selected={id === exercise?.id} onPress={() => setPicked(id)} />
                ))}
              </View>
            )}
          </Card>
          {exercise && <ExerciseHistoryCard key={exercise.id} exercise={exercise} />}
          {data.records.length > 0 && (
            <Card title={s.recordsTitle} flat>
              <RecordRows records={data.records.slice(0, 20)} />
            </Card>
          )}
          <Card title={s.volumeTitle}>
            <MuscleMap intensity={intensity} labels accessibilityLabel={s.mapLabel} />
            <MuscleBars volume={data.evolution.volume} goals={data.evolution.goals} />
            <CardioRing minutes={data.evolution.cardioMinutes} />
          </Card>
        </>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
