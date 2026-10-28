import { router } from 'expo-router';
import { useState } from 'react';

import { Button, ListGroup, ListRow, Sheet, Text } from '@/components/ui';
import { updateRoutine } from '@/db/routinesRepo';
import { useRoutineList } from '@/features/routines/useRoutines';
import { trainingPrefs } from '@/features/workout/prefs';
import { strings } from '@/i18n/strings';
import { showSnackbar } from '@/stores/snackbarStore';
import { addExercises, useWorkout } from '@/stores/workoutStore';
import type { Exercise } from '@/training/exerciseModel';
import { plannedFrom } from '@/training/planned';

const x = strings.exercises.add;

/** "Adicionar ao treino" (seção 12.4): ao treino em andamento ou a um dos meus treinos. */
export function AddToWorkout({ exercise }: { exercise: Exercise }) {
  const active = useWorkout((s) => s.workout);
  const [sheet, setSheet] = useState(false);
  const { state, refresh } = useRoutineList();
  const routines = state.status === 'success' ? state.data.filter((r) => r.items.length > 0) : [];

  if (active) {
    return (
      <Button
        label={x.toActive}
        icon="plus"
        size="main"
        onPress={() => {
          void addExercises([exercise.id]);
          showSnackbar(x.added(active.name ?? strings.workout.freeName));
          router.back();
        }}
      />
    );
  }

  return (
    <>
      <Button label={x.toRoutine} icon="plus" variant="secondary" onPress={() => setSheet(true)} />
      <Sheet visible={sheet} onClose={() => setSheet(false)} title={x.toRoutine}>
        {routines.length === 0 ? (
          <Text color="textMuted">{x.noRoutines}</Text>
        ) : (
          <ListGroup>
            {routines.map((routine) => {
              const has = routine.items.some((i) => i.exerciseId === exercise.id);
              return (
                <ListRow
                  key={routine.id}
                  icon={has ? 'check' : 'clipboard'}
                  title={routine.name}
                  subtitle={has ? x.already : strings.routines.count(routine.items.length)}
                  onPress={() => {
                    setSheet(false);
                    if (has) return;
                    const item = plannedFrom(exercise, undefined, trainingPrefs().restOverride);
                    void updateRoutine(routine.id, { name: routine.name, items: [...routine.items, item] }).then(() => {
                      showSnackbar(x.added(routine.name));
                      refresh();
                    });
                  }}
                />
              );
            })}
          </ListGroup>
        )}
      </Sheet>
    </>
  );
}
