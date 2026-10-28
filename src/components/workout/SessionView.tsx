import { router } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef } from 'react';
import { ScrollView, View, type ScrollViewInstance } from 'react-native';

import { Button, CoachMark, EmptyState, Notice, Screen } from '@/components/ui';
import { useSessionUi } from '@/features/workout/useSessionUi';
import { strings } from '@/i18n/strings';
import { openSystemSettings } from '@/notifications/permissions';
import { usesSpironolactone } from '@/profile/profile';
import { FLOOR_PATTERNS } from '@/safety/care';
import { openExercisePicker } from '@/stores/pickerStore';
import { useProfile } from '@/stores/profileStore';
import { useSettings } from '@/stores/settingsStore';
import { addExercises, addSet, addWarmupSets, setWarmupDone, suggestionFor, updateSet, useWorkout } from '@/stores/workoutStore';
import { makeStyles } from '@/theme';
import { findExercise } from '@/training/catalog';
import { isFirstCompoundOfGroup } from '@/training/schedule';
import { nextIncompleteIndex, workoutProgress } from '@/training/session';
import type { Workout } from '@/training/workoutModel';

import { ExerciseCard } from './ExerciseCard';
import { RestTimer } from './RestTimer';
import { SessionHeader } from './SessionHeader';
import { SessionSheets } from './SessionSheets';
import { WarmupCard } from './WarmupCard';

const w = strings.workout;
const KEEP_AWAKE_TAG = 'workout';

type Props = { workout: Workout; notificationsBlocked: boolean };

/** Treino em andamento (seção 9.5): cartões dos exercícios, descanso flutuante e "Próximo exercício". */
export function SessionView({ workout, notificationsBlocked }: Props) {
  const styles = useStyles();
  const ui = useSessionUi();
  const context = useWorkout((s) => s.context);
  const records = useWorkout((s) => s.records);
  const keepAwake = useSettings((s) => s.workout.keepAwake);
  const askRir = useSettings((s) => s.workout.askRir);
  const intro = useWorkout((s) => s.intro);
  const spiro = useProfile((s) => usesSpironolactone(s.profile));
  const scroll = useRef<ScrollViewInstance>(null);
  const positions = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!keepAwake) return;
    void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => void deactivateKeepAwake(KEEP_AWAKE_TAG);
  }, [keepAwake]);

  const { done, total } = workoutProgress(workout);
  const next = nextIncompleteIndex(workout, ui.current);
  const allDone = total > 0 && done === total;

  const goNext = () => {
    if (next == null) return;
    const y = positions.current[workout.exercises[next].id];
    if (y != null) scroll.current?.scrollTo({ y, animated: true });
  };

  const addMore = () => openExercisePicker((ids) => void addExercises(ids));

  return (
    <Screen
      scroll={false}
      footer={
        <View>
          <RestTimer />
          {total > 0 && (
            <Button
              label={allDone || next == null ? w.finish : w.nextExercise}
              icon={allDone || next == null ? 'flag' : 'chevrons-down'}
              size="main"
              onPress={allDone || next == null ? ui.finish : goNext}
            />
          )}
        </View>
      }
    >
      <View style={styles.header}>
        <SessionHeader
          name={workout.name ?? w.freeName}
          startedAt={workout.startedAt}
          done={done}
          total={total}
          onMinimize={ui.minimize}
          onMenu={() => ui.open.menu(true)}
        />
      </View>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {notificationsBlocked && (
          <Notice tone="warning" action={<Button label={w.allowNotifications} variant="ghost" onPress={openSystemSettings} />}>
            {w.notificationsOff}
          </Notice>
        )}
        {intro && <Notice icon="feather">{intro}</Notice>}
        {total > 0 && <WarmupCard done={workout.warmupDone} onToggle={() => setWarmupDone(!workout.warmupDone)} />}
        {total > 0 && <CoachMark id="workout-swipe" message={w.swipeTip} />}
        {total === 0 && <EmptyState icon="plus-circle" message={w.emptyFree} action={{ label: w.addExercise, onPress: addMore }} />}

        {workout.exercises.map((item, index) => {
          const exercise = findExercise(item.exerciseId);
          if (!exercise) return null;
          const canAddWarmup =
            isFirstCompoundOfGroup(workout, index, findExercise) &&
            !item.sets.some((x) => x.kind === 'warmup') &&
            item.sets.some((x) => x.kind !== 'warmup' && x.weightKg != null);
          return (
            <View key={item.id} onLayout={(e) => (positions.current[item.id] = e.nativeEvent.layout.y)}>
              <ExerciseCard
                item={item}
                exercise={exercise}
                previous={context[item.exerciseId]?.previous ?? []}
                records={records}
                suggestion={suggestionFor(item, context[item.exerciseId])}
                canAddWarmup={canAddWarmup}
                careTip={spiro && (FLOOR_PATTERNS as readonly string[]).includes(exercise.pattern) ? strings.care.floorStandUp : null}
                askRir={askRir}
                onRir={(setId, rir) => updateSet(item.id, setId, { rir })}
                onAddWarmup={() => addWarmupSets(item.id)}
                onEditSet={(setId, field) => ui.editSet(item.id, setId, field)}
                onToggleSet={(setId) => ui.toggle(item.id, setId)}
                onSetMenu={(setId) => ui.open.setSheet({ weId: item.id, setId })}
                onDeleteSet={(setId) => ui.deleteSet(item.id, setId)}
                onCopySet={(setId) => ui.copySet(item.id, setId)}
                onAddSet={() => addSet(item.id)}
                onMenu={() => ui.open.exerciseMenu(item.id)}
                onInfo={() => router.push(`/exercises/${item.exerciseId}`)}
              />
            </View>
          );
        })}
        {total > 0 && <Button label={w.addExercise} icon="plus" variant="secondary" onPress={addMore} />}
      </ScrollView>
      <SessionSheets ui={ui} workout={workout} />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { paddingHorizontal: t.spacing.xs },
  content: { gap: t.spacing.lg, paddingHorizontal: t.spacing.screen, paddingBottom: t.spacing.huge },
}));
