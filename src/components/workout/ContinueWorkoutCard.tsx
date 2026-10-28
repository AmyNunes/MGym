import { router } from 'expo-router';

import { Button, Card, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { useNow } from '@/lib/useNow';
import { useWorkout } from '@/stores/workoutStore';

/** "Continuar treino (32 min)" quando há um treino em andamento (seções 12.1 e 12.2). */
export function ContinueWorkoutCard() {
  const workout = useWorkout((s) => s.workout);
  const now = useNow(workout ? 30_000 : null);
  if (!workout) return null;
  const minutes = Math.max(0, Math.round((now - Date.parse(workout.startedAt)) / 60_000));

  return (
    <Card>
      <Text variant="heading">{workout.name ?? strings.workout.freeName}</Text>
      <Button
        label={strings.workout.continue(minutes)}
        icon="play"
        size="main"
        onPress={() => router.push(`/session/${workout.id}`)}
      />
    </Card>
  );
}
