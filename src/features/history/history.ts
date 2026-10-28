import { insertRecords, recordsOfWorkout } from '@/db/recordsRepo';
import { insertRoutine } from '@/db/routinesRepo';
import { deleteWorkout, getWorkout, insertWorkoutTree, listDoneWorkouts } from '@/db/workoutsRepo';
import { strings } from '@/i18n/strings';
import { useLoader } from '@/lib/useLoader';
import { showSnackbar } from '@/stores/snackbarStore';
import { findExercise } from '@/training/catalog';
import { planFromWorkout } from '@/training/session';

/** Treinos feitos (seção 12.2 › Histórico). */
export function useHistoryList() {
  return useLoader(() => listDoneWorkouts());
}

/** Apaga um treino feito, com "Desfazer" (volta o treino e os recordes dele). */
export async function deleteWorkoutWithUndo(id: string, onChange: () => void) {
  const [workout, records] = await Promise.all([getWorkout(id), recordsOfWorkout(id)]);
  if (!workout) return;
  await deleteWorkout(id);
  onChange();
  showSnackbar(strings.history.deleted, {
    label: strings.common.undo,
    onPress: () =>
      void insertWorkoutTree(workout)
        .then(() => insertRecords(records.map(({ id: _id, ...r }) => r)))
        .then(onChange),
  });
}

/** "Salvar como treino meu": o treino feito vira um treino montado. */
export async function saveWorkoutAsRoutine(id: string) {
  const workout = await getWorkout(id);
  if (!workout) return;
  const items = planFromWorkout(workout, findExercise);
  if (!items.length) return;
  await insertRoutine({ name: workout.name ?? strings.workout.freeName, items });
  showSnackbar(strings.history.savedAsRoutine);
}
