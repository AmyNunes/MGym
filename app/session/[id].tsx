import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { Button, EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { SessionView } from '@/components/workout/SessionView';
import { strings } from '@/i18n/strings';
import { requestNotificationPermission } from '@/notifications/permissions';
import { resumeWorkout, useWorkout } from '@/stores/workoutStore';
import { useTheme } from '@/theme';

type Status = 'loading' | 'ready' | 'missing' | 'error';

/** Treino em andamento (tela cheia). `session/current` abre o treino em andamento, seja qual for. */
export default function SessionScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkout((s) => s.workout);
  const [status, setStatus] = useState<Status>(workout ? 'ready' : 'loading');
  const [attempt, setAttempt] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const endedId = useWorkout((st) => st.endedId);

  useEffect(() => {
    if (useWorkout.getState().workout) return;
    resumeWorkout().then(
      (found) => setStatus(found ? 'ready' : 'missing'),
      () => setStatus('error'),
    );
  }, [attempt]);

  useEffect(() => {
    requestNotificationPermission().then(
      (s) => setBlocked(s === 'blocked'),
      () => {},
    );
  }, []);

  if (workout && (id === 'current' || workout.id === id)) {
    return <SessionView workout={workout} notificationsBlocked={blocked} />;
  }
  // Acabou de terminar: a tela de resumo já vem.
  if (!workout && endedId && (id === 'current' || id === endedId)) return <Screen>{null}</Screen>;

  if (status === 'error') {
    return (
      <Screen>
        <ErrorState
          message={strings.workout.loadError}
          onRetry={() => {
            setStatus('loading');
            setAttempt((a) => a + 1);
          }}
        />
      </Screen>
    );
  }
  if (status === 'missing' || (workout && workout.id !== id)) {
    return (
      <Screen>
        <EmptyState icon="activity" message={strings.workout.notFound} />
        <Button label={strings.tabs.workout} onPress={() => router.dismissTo('/workout')} />
      </Screen>
    );
  }
  return (
    <Screen>
      <Skeleton height={theme.sizes.touchTargetWorkout} />
      <Skeleton height={theme.sizes.chartHeight * 2} radius="lg" />
    </Screen>
  );
}
