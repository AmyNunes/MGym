import { router } from 'expo-router';
import { useState } from 'react';

import { AdjustPlanSheet } from '@/components/plan/AdjustPlanSheet';
import { MuscleBars } from '@/components/plan/MuscleBars';
import { PlanCard } from '@/components/plan/PlanCard';
import { Button, Card, ErrorState, IconButton, ListGroup, ListRow, Notice, Screen, ScreenHeader, Skeleton, Text } from '@/components/ui';
import { ContinueWorkoutCard } from '@/components/workout/ContinueWorkoutCard';
import { setDeloadWeek } from '@/db/plansRepo';
import { useTrainingOverview } from '@/features/plan/useTrainingOverview';
import { createRoutine } from '@/features/routines/useRoutines';
import { startFreeWorkout, startRoutine } from '@/features/workout/start';
import { strings } from '@/i18n/strings';
import { useTheme } from '@/theme';
import { weekKey } from '@/training/schedule';

const w = strings.workoutTab;

/** Aba Treino (seção 12.2): plano atual, volume da semana, meus treinos e atalhos. */
export default function WorkoutScreen() {
  const theme = useTheme();
  const { state, reload, refresh } = useTrainingOverview();
  const data = state.status === 'success' ? state.data : null;
  const [adjusting, setAdjusting] = useState(false);

  const toggleDeload = async (on: boolean) => {
    if (!data?.plan) return;
    await setDeloadWeek(data.plan.plan.id, on ? weekKey(new Date()) : null);
    refresh();
  };

  return (
    <Screen>
      <ScreenHeader title={strings.tabs.workout} />
      <ContinueWorkoutCard />

      {state.status === 'loading' && <Skeleton height={theme.sizes.listRowHeight * 3} radius="lg" />}
      {state.status === 'error' && <ErrorState onRetry={reload} />}

      {data && !data.plan && (
        <Card>
          <Text>{w.guideHint}</Text>
          <Button label={w.answerGuide} icon="compass" onPress={() => router.push('/guide')} />
        </Card>
      )}
      {data?.plan && (
        <>
          {data.deloadActive ? (
            <Notice icon="feather" action={<Button label={w.deloadEnd} variant="ghost" onPress={() => void toggleDeload(false)} />}>
              {w.deloadActive}
            </Notice>
          ) : (
            data.deloadDue && (
              <Card title={w.deloadTitle}>
                <Text color="textMuted">{w.deloadBody}</Text>
                <Button label={w.deloadStart} icon="feather" variant="secondary" onPress={() => void toggleDeload(true)} />
              </Card>
            )
          )}
          <PlanCard view={data.plan} nextIndex={data.nextIndex} />
          <Card title={w.weekVolume}>
            <MuscleBars volume={data.weekVolume} goals={data.plan.goals} />
          </Card>
        </>
      )}

      {data && data.routines.length > 0 && (
        <ListGroup title={w.myWorkouts}>
          {data.routines.map((routine) => (
            <ListRow
              key={routine.id}
              icon="clipboard"
              title={routine.name}
              subtitle={strings.routines.count(routine.items.length)}
              onPress={() => router.push(`/routines/${routine.id}`)}
              right={
                <IconButton
                  icon="play"
                  color="primary"
                  accessibilityLabel={w.startRoutine(routine.name)}
                  onPress={() => void startRoutine(routine)}
                />
              }
            />
          ))}
        </ListGroup>
      )}

      <ListGroup>
        <ListRow icon="zap" title={w.freeWorkout} onPress={() => void startFreeWorkout()} />
        <ListRow icon="book-open" title={w.catalog} onPress={() => router.push('/exercises')} />
        <ListRow icon="calendar" title={w.history} onPress={() => router.push('/history')} />
        <ListRow icon="plus" title={w.newWorkout} onPress={() => void createRoutine(data?.routines.length ?? 0)} />
        {data?.plan && <ListRow icon="compass" title={w.redoGuide} onPress={() => router.push('/guide')} />}
      </ListGroup>
      <ListGroup>
        {data?.plan && <ListRow icon="cpu" title={strings.ai.adjust.button} onPress={() => setAdjusting(true)} />}
        <ListRow icon="message-circle" title={strings.ai.coach.entry} subtitle={strings.ai.coach.entryHint} onPress={() => router.push('/coach')} />
      </ListGroup>
      <AdjustPlanSheet
        visible={adjusting}
        onClose={() => setAdjusting(false)}
        onApplied={() => {
          setAdjusting(false);
          refresh();
        }}
      />
    </Screen>
  );
}
