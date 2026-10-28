import { router } from 'expo-router';

import { ConfirmSheet, MenuSheet, type MenuAction } from '@/components/ui';
import type { SessionUi } from '@/features/workout/useSessionUi';
import { strings } from '@/i18n/strings';
import { openExercisePicker } from '@/stores/pickerStore';
import {
  addExercises,
  copyPreviousSet,
  moveExercise,
  replaceExercise,
  setExerciseNotes,
  setWorkoutNotes,
  updateSet,
} from '@/stores/workoutStore';
import { findExercise } from '@/training/catalog';
import { pendingSets } from '@/training/session';
import { SET_KINDS, type Workout } from '@/training/workoutModel';

import { NoteSheet } from './NoteSheet';
import { NumberPad } from './NumberPad';
import { ReorderSheet } from './ReorderSheet';
import { SwapSheet } from './SwapSheet';

const w = strings.workout;

/** Todas as folhas (sheets) do treino em andamento: teclado, menus, trocar, nota, reordenar, confirmar. */
export function SessionSheets({ ui, workout }: { ui: SessionUi; workout: Workout }) {
  const { sheets, open } = ui;

  const setTarget = sheets.setSheet;
  const setWe = setTarget && workout.exercises.find((e) => e.id === setTarget.weId);
  const setIndex = setWe ? setWe.sets.findIndex((s) => s.id === setTarget?.setId) : -1;
  const theSet = setWe && setIndex >= 0 ? setWe.sets[setIndex] : null;

  const exIndex = workout.exercises.findIndex((e) => e.id === sheets.exerciseMenu);
  const exWe = exIndex >= 0 ? workout.exercises[exIndex] : null;
  const exCatalog = exWe ? findExercise(exWe.exerciseId) : undefined;

  const swapWe = workout.exercises.find((e) => e.id === sheets.swap);
  const noteWe = sheets.note?.weId ? workout.exercises.find((e) => e.id === sheets.note?.weId) : null;

  const setActions: MenuAction[] =
    setWe && theSet
      ? [
          ...SET_KINDS.map((kind) => ({
            label: w.setKinds[kind],
            icon: kind === theSet.kind ? ('check-circle' as const) : ('circle' as const),
            onPress: () => updateSet(setWe.id, theSet.id, { kind }),
          })),
          { label: w.sameAsPrevious, icon: 'copy', onPress: () => copyPreviousSet(setWe.id, theSet.id) },
          { label: w.deleteSet, icon: 'trash-2', destructive: true, onPress: () => ui.deleteSet(setWe.id, theSet.id) },
        ]
      : [];

  const exerciseActions: MenuAction[] = exWe
    ? [
        { label: w.swap, icon: 'repeat', onPress: () => open.swap(exWe.id) },
        { label: w.technique, icon: 'info', onPress: () => router.push(`/exercises/${exWe.exerciseId}`) },
        { label: strings.ai.explain.button, icon: 'cpu', onPress: () => router.push(`/exercises/${exWe.exerciseId}/explain`) },
        { label: w.note, icon: 'edit-3', onPress: () => open.note({ weId: exWe.id }) },
        { label: strings.common.moveUp, icon: 'arrow-up', hidden: exIndex === 0, onPress: () => moveExercise(exIndex, exIndex - 1) },
        {
          label: strings.common.moveDown,
          icon: 'arrow-down',
          hidden: exIndex === workout.exercises.length - 1,
          onPress: () => moveExercise(exIndex, exIndex + 1),
        },
        { label: w.removeExercise, icon: 'trash-2', destructive: true, onPress: () => ui.removeExercise(exWe.id) },
      ]
    : [];

  const workoutActions: MenuAction[] = [
    { label: w.addExercise, icon: 'plus', onPress: () => openExercisePicker((ids) => void addExercises(ids)) },
    { label: w.reorder, icon: 'menu', hidden: workout.exercises.length < 2, onPress: () => open.reorder(true) },
    { label: w.workoutNotes, icon: 'edit-3', onPress: () => open.note({ weId: null }) },
    { label: w.finish, icon: 'flag', onPress: ui.finish },
    { label: w.discard, icon: 'trash-2', destructive: true, onPress: ui.discard },
  ];

  return (
    <>
      <NumberPad request={ui.padRequest} onClose={ui.closePad} onSubmit={ui.submitPad} />
      <MenuSheet
        visible={theSet != null}
        onClose={() => open.setSheet(null)}
        title={w.setMenu(setIndex + 1)}
        actions={setActions}
      />
      <MenuSheet
        visible={exWe != null}
        onClose={() => open.exerciseMenu(null)}
        title={exCatalog?.name}
        actions={exerciseActions}
      />
      <SwapSheet
        exercise={swapWe ? (findExercise(swapWe.exerciseId) ?? null) : null}
        onClose={() => open.swap(null)}
        onPick={(id) => swapWe && void replaceExercise(swapWe.id, id)}
      />
      <NoteSheet
        visible={sheets.note != null}
        title={noteWe ? (findExercise(noteWe.exerciseId)?.name ?? w.note) : w.workoutNotes}
        initial={(noteWe ? noteWe.notes : workout.notes) ?? ''}
        onClose={() => open.note(null)}
        onSave={(text) => (noteWe ? setExerciseNotes(noteWe.id, text) : setWorkoutNotes(text))}
      />
      <MenuSheet visible={sheets.menu} onClose={() => open.menu(false)} title={w.menu} actions={workoutActions} />
      <ReorderSheet
        visible={sheets.reorder}
        exercises={workout.exercises}
        onClose={() => open.reorder(false)}
        onMove={moveExercise}
      />
      <ConfirmSheet
        visible={sheets.confirmFinish}
        onClose={ui.closeConfirmFinish}
        title={w.finishTitle}
        message={w.finishPending(pendingSets(workout))}
        confirmLabel={w.finishAnyway}
        cancelLabel={w.keepGoing}
        onConfirm={() => void ui.doFinish()}
      />
      <ConfirmSheet
        visible={sheets.confirmDiscard}
        onClose={ui.closeConfirmDiscard}
        title={w.discardTitle}
        message={w.discardBody}
        confirmLabel={w.discard}
        cancelLabel={w.keepGoing}
        onConfirm={() => void ui.doDiscard()}
      />
    </>
  );
}
