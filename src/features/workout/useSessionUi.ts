import { router } from 'expo-router';
import { useState } from 'react';

import type { PadRequest } from '@/components/workout/NumberPad';
import type { SetField } from '@/components/workout/SetRow';
import { strings } from '@/i18n/strings';
import { haptics } from '@/lib/haptics';
import { skipRest, startRest } from '@/stores/restStore';
import { useSettings } from '@/stores/settingsStore';
import { showSnackbar } from '@/stores/snackbarStore';
import {
  copyPreviousSet,
  deleteSet,
  discardWorkout,
  finishWorkout,
  removeExercise,
  restoreExercise,
  restoreSet,
  toggleSet,
  updateSet,
  useWorkout,
} from '@/stores/workoutStore';
import { findExercise } from '@/training/catalog';
import { stepFor } from './prefs';
import { nextPendingSet, pendingSets } from '@/training/session';

const w = strings.workout;

type PadTarget = { weId: string; setId: string; field: SetField };

const getWorkout = () => useWorkout.getState().workout;

/** Os valores do NumberPad para uma célula (kg ou repetições) de uma série. */
function padRequestFor({ weId, setId, field }: PadTarget): PadRequest | null {
  const state = useWorkout.getState();
  const we = state.workout?.exercises.find((e) => e.id === weId);
  const index = we?.sets.findIndex((s) => s.id === setId) ?? -1;
  const exercise = we && findExercise(we.exerciseId);
  if (!we || !exercise || index < 0) return null;
  const set = we.sets[index];
  const above = index > 0 ? we.sets[index - 1] : (state.context[we.exerciseId]?.previous[0] ?? null);
  const weight = field === 'weight';
  const t = exercise.tracking;
  return {
    title: w.pad.title(exercise.name, index + 1),
    label: weight
      ? t === 'bodyweight'
        ? w.pad.extraKg
        : t === 'assisted'
          ? w.pad.assistKg
          : w.pad.kg
      : t === 'time'
        ? w.pad.seconds
        : w.pad.reps,
    value: weight ? set.weightKg : set.reps,
    decimals: weight,
    step: weight ? stepFor(exercise) : t === 'time' ? 5 : 1,
    same: above ? (weight ? above.weightKg : above.reps) : null,
    hasNext: weight,
    barKg: weight && t === 'load' && exercise.equipment.includes('barbell') ? useSettings.getState().workout.barKg : null,
  };
}

/** Estado das folhas e as ações da tela do treino em andamento. */
export function useSessionUi() {
  const [pad, setPad] = useState<PadTarget | null>(null);
  const [setSheet, setSetSheet] = useState<{ weId: string; setId: string } | null>(null);
  const [exerciseMenu, setExerciseMenu] = useState<string | null>(null);
  const [swap, setSwap] = useState<string | null>(null);
  const [note, setNote] = useState<{ weId: string | null } | null>(null);
  const [menu, setMenu] = useState(false);
  const [reorder, setReorder] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [current, setCurrent] = useState(0);

  const doFinish = async () => {
    await skipRest();
    const id = await finishWorkout();
    haptics.success();
    if (id) router.replace(`/session/summary/${id}`);
  };

  return {
    pad,
    padRequest: pad ? padRequestFor(pad) : null,
    current,
    sheets: {
      setSheet,
      exerciseMenu,
      swap,
      note,
      menu,
      reorder,
      confirmFinish,
      confirmDiscard,
    },
    open: { setSheet: setSetSheet, exerciseMenu: setExerciseMenu, swap: setSwap, note: setNote, menu: setMenu, reorder: setReorder },
    closePad: () => setPad(null),
    closeConfirmFinish: () => setConfirmFinish(false),
    closeConfirmDiscard: () => setConfirmDiscard(false),

    editSet: (weId: string, setId: string, field: SetField) => setPad({ weId, setId, field }),

    submitPad: (value: number | null, next: boolean) => {
      if (!pad) return;
      const patch = pad.field === 'weight' ? { weightKg: value } : { reps: value == null ? null : Math.round(value) };
      updateSet(pad.weId, pad.setId, patch);
      setPad(next ? { ...pad, field: 'reps' } : null);
    },

    /** ✓: marca a série (vibração leve), mostra recorde e começa o descanso. */
    toggle: (weId: string, setId: string) => {
      const we = getWorkout()?.exercises.find((e) => e.id === weId);
      const set = we?.sets.find((s) => s.id === setId);
      const exercise = we && findExercise(we.exerciseId);
      if (!we || !set || !exercise) return;
      setCurrent(getWorkout()?.exercises.indexOf(we) ?? 0);
      if (!set.completedAt) {
        const needsWeight = exercise.tracking === 'load' || exercise.tracking === 'assisted';
        if (needsWeight && set.weightKg == null) return setPad({ weId, setId, field: 'weight' });
        if (set.reps == null) return setPad({ weId, setId, field: 'reps' });
      }
      const result = toggleSet(weId, setId);
      if (!result.completed) return;
      haptics.light();
      if (result.records.length) haptics.success();
      const workout = getWorkout();
      const next = workout && nextPendingSet(workout, weId);
      if (workout && next) {
        const nextName = findExercise(workout.exercises[next.exerciseIndex].exerciseId)?.name ?? '';
        void startRest(we.restSec, next.setNumber, nextName);
      } else {
        void skipRest();
      }
    },

    deleteSet: (weId: string, setId: string) => {
      const removed = deleteSet(weId, setId);
      if (!removed) return;
      showSnackbar(w.setDeleted, { label: strings.common.undo, onPress: () => restoreSet(weId, removed.set, removed.index) });
    },

    copySet: (weId: string, setId: string) => {
      copyPreviousSet(weId, setId);
      haptics.light();
    },

    removeExercise: (weId: string) => {
      const removed = removeExercise(weId);
      if (!removed) return;
      const name = findExercise(removed.exercise.exerciseId)?.name ?? '';
      showSnackbar(w.removed(name), {
        label: strings.common.undo,
        onPress: () => restoreExercise(removed.exercise, removed.index),
      });
    },

    finish: () => {
      const workout = getWorkout();
      if (workout && pendingSets(workout) > 0) setConfirmFinish(true);
      else void doFinish();
    },
    doFinish,
    discard: () => setConfirmDiscard(true),
    doDiscard: async () => {
      await skipRest();
      await discardWorkout();
      showSnackbar(w.discarded);
      minimize();
    },
    minimize: () => minimize(),
  };
}

/** Sai do treino sem duplicar as abas na pilha (`dismissTo` volta para elas, ou as abre se não estiverem lá). */
function minimize() {
  if (router.canGoBack()) router.back();
  else router.dismissTo('/workout');
}

export type SessionUi = ReturnType<typeof useSessionUi>;
