import { useCallback, useEffect, useRef, useState } from 'react';

import { trainingPrefs } from '@/features/workout/prefs';
import { strings } from '@/i18n/strings';
import { moveItem } from '@/lib/arrays';
import { useDebouncedSave } from '@/lib/useDebouncedSave';
import { showSnackbar } from '@/stores/snackbarStore';
import { findExercise } from '@/training/catalog';
import { plannedFrom } from '@/training/planned';
import type { PlannedExercise } from '@/training/workoutModel';

export type PlannedDraft = { name: string; items: PlannedExercise[] };
type Status = 'loading' | 'ready' | 'missing' | 'error';

export type PlannedSource = {
  load: () => Promise<PlannedDraft | null>;
  save: (draft: PlannedDraft) => Promise<void>;
  /** Sair com a lista vazia (ex.: apagar um treino montado que ficou vazio). */
  onLeaveEmpty?: () => Promise<void>;
};

/**
 * Edição de uma lista de exercícios planejados ("Meus treinos" e dias do plano).
 * Cada mudança salva sozinha, com uma pequena espera; nada se perde ao sair.
 */
export function usePlannedEditor(key: string, source: PlannedSource) {
  const [status, setStatus] = useState<Status>('loading');
  const [draft, setDraft] = useState<PlannedDraft>({ name: '', items: [] });
  const draftRef = useRef(draft);
  const loaded = useRef(false);
  const stopped = useRef(false);
  const sourceRef = useRef(source);
  useEffect(() => {
    sourceRef.current = source;
  });
  const saver = useDebouncedSave((d: PlannedDraft) => (stopped.current ? Promise.resolve() : sourceRef.current.save(d)));

  const fetchDraft = useCallback(() => {
    sourceRef.current.load().then(
      (found) => {
        if (!found) return setStatus('missing');
        loaded.current = true;
        draftRef.current = found;
        setDraft(found);
        setStatus('ready');
      },
      () => setStatus('error'),
    );
  }, []);

  useEffect(fetchDraft, [fetchDraft, key]);

  useEffect(
    () => () => {
      if (!stopped.current && loaded.current && draftRef.current.items.length === 0) {
        void sourceRef.current.onLeaveEmpty?.();
      }
    },
    [key],
  );

  const update = (fn: (d: PlannedDraft) => PlannedDraft) => {
    const next = fn(draftRef.current);
    draftRef.current = next;
    setDraft(next);
    saver.schedule(next);
  };

  const removeItem = (index: number) => {
    const removed = draftRef.current.items[index];
    update((d) => ({ ...d, items: d.items.filter((_, i) => i !== index) }));
    const name = findExercise(removed.exerciseId)?.name ?? '';
    showSnackbar(strings.routines.removed(name), {
      label: strings.common.undo,
      onPress: () => update((d) => ({ ...d, items: [...d.items.slice(0, index), removed, ...d.items.slice(index)] })),
    });
  };

  return {
    status,
    reload: () => {
      setStatus('loading');
      fetchDraft();
    },
    name: draft.name,
    items: draft.items,
    rename: (name: string) => update((d) => ({ ...d, name })),
    addExercises: (ids: string[]) =>
      update((d) => ({
        ...d,
        items: [
          ...d.items,
          ...[...new Set(ids)]
            .filter((exerciseId) => !d.items.some((it) => it.exerciseId === exerciseId))
            .flatMap((exerciseId) => {
              const exercise = findExercise(exerciseId);
              return exercise ? [plannedFrom(exercise, undefined, trainingPrefs().restOverride)] : [];
            }),
        ],
      })),
    patchItem: (index: number, patch: Partial<PlannedExercise>) =>
      update((d) => ({ ...d, items: d.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) })),
    move: (from: number, to: number) => update((d) => ({ ...d, items: moveItem(d.items, from, to) })),
    removeItem,
    flush: saver.flush,
    /** Para de salvar (a lista foi apagada). */
    stop: () => {
      stopped.current = true;
    },
  };
}

export type PlannedEditor = ReturnType<typeof usePlannedEditor>;
