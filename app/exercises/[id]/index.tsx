import { router, Stack, useLocalSearchParams } from 'expo-router';

import { AddToWorkout } from '@/components/exercises/AddToWorkout';
import { ExerciseHistoryCard } from '@/components/exercises/ExerciseHistoryCard';
import { MuscleLegend } from '@/components/muscles/MuscleLegend';
import { MuscleMap } from '@/components/muscles/MuscleMap';
import { BulletList, Button, Card, EmptyState, ListGroup, ListRow, Notice, Screen, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatRest } from '@/lib/format';
import { findExercise, substitutesOf } from '@/training/catalog';

const x = strings.exercises;
const d = x.detail;

/** Detalhe do exercício (seção 12.4). */
export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = findExercise(id);

  if (!exercise) {
    return (
      <Screen edges={[]}>
        <EmptyState icon="alert-circle" message={d.notFound} />
      </Screen>
    );
  }

  const range =
    exercise.tracking === 'time'
      ? d.seconds(exercise.repMin, exercise.repMax, exercise.perSide)
      : d.reps(exercise.repMin, exercise.repMax, exercise.perSide);
  const meta = [
    strings.groups[exercise.group],
    exercise.equipment.map((e) => strings.equipment[e]).join(', '),
    strings.levels[exercise.level],
  ].join(' · ');

  return (
    <Screen edges={[]} footer={<AddToWorkout exercise={exercise} />}>
      <Stack.Screen options={{ title: exercise.name }} />
      <Card>
        <MuscleMap primary={exercise.primary} secondary={exercise.secondary} labels />
        <MuscleLegend hasSecondary={exercise.secondary.length > 0} />
      </Card>

      <Text color="textMuted">{meta}</Text>
      <Text variant="heading">
        {range} · {d.rest(formatRest(exercise.restSec))}
      </Text>
      {exercise.glute > 0 && (
        <Text variant="label" color="primary">
          {d.glute} {'★'.repeat(exercise.glute)}
        </Text>
      )}

      <Card title={d.cues}>
        <BulletList items={exercise.cues} />
        <Button
          label={strings.ai.explain.button}
          icon="cpu"
          variant="secondary"
          onPress={() => router.push(`/exercises/${exercise.id}/explain`)}
        />
      </Card>
      {exercise.mistakes.length > 0 && (
        <Card title={d.mistakes}>
          <BulletList items={exercise.mistakes} />
        </Card>
      )}
      {exercise.safety.length > 0 && (
        <Notice tone="warning">
          <Text variant="label">{d.safety}</Text>
          <BulletList items={exercise.safety} />
        </Notice>
      )}

      <ExerciseHistoryCard exercise={exercise} />

      <ListGroup title={d.substitutes}>
        {substitutesOf(exercise).map((sub) => (
          <ListRow
            key={sub.id}
            icon="repeat"
            title={sub.name}
            subtitle={strings.groups[sub.group]}
            onPress={() => router.push(`/exercises/${sub.id}`)}
          />
        ))}
      </ListGroup>
    </Screen>
  );
}
