import { router } from 'expo-router';
import { useState } from 'react';

import { Button, DraggableList, EmptyState, MenuSheet } from '@/components/ui';
import type { PlannedEditor } from '@/features/planned/usePlannedEditor';
import { strings } from '@/i18n/strings';
import { openExercisePicker } from '@/stores/pickerStore';
import { findExercise } from '@/training/catalog';

import { PlannedExerciseRow, usePlannedRowHeight } from './PlannedExerciseRow';
import { PlannedExerciseSheet } from './PlannedExerciseSheet';

const r = strings.routines;

/**
 * A lista de exercícios de um treino montado ou de um dia do plano:
 * reordenar pela alça ≡ (ou pelo menu), séries/repetições/descanso e adicionar do catálogo.
 */
export function PlannedEditorList({ editor }: { editor: PlannedEditor }) {
  const rowHeight = usePlannedRowHeight();
  const [editing, setEditing] = useState<number | null>(null);
  const [itemMenu, setItemMenu] = useState<number | null>(null);
  const editingItem = editing != null ? editor.items[editing] : null;
  const menuItem = itemMenu != null ? editor.items[itemMenu] : null;

  return (
    <>
      {editor.items.length === 0 ? (
        <EmptyState icon="list" message={r.empty} />
      ) : (
        <DraggableList
          items={editor.items}
          keyOf={(item) => item.exerciseId}
          rowHeight={rowHeight}
          onMove={editor.move}
          renderRow={(item, index, handle) => {
            const exercise = findExercise(item.exerciseId);
            return exercise ? (
              <PlannedExerciseRow
                item={item}
                exercise={exercise}
                handle={handle}
                onPress={() => setEditing(index)}
                onMenu={() => setItemMenu(index)}
              />
            ) : null;
          }}
        />
      )}

      <Button label={r.addExercises} icon="plus" variant="secondary" onPress={() => openExercisePicker(editor.addExercises)} />

      <PlannedExerciseSheet
        visible={editingItem != null}
        onClose={() => setEditing(null)}
        item={editingItem}
        exercise={editingItem ? (findExercise(editingItem.exerciseId) ?? null) : null}
        onChange={(patch) => editing != null && editor.patchItem(editing, patch)}
        onRemove={() => {
          if (editing == null) return;
          editor.removeItem(editing);
          setEditing(null);
        }}
      />

      <MenuSheet
        visible={menuItem != null}
        onClose={() => setItemMenu(null)}
        title={menuItem ? findExercise(menuItem.exerciseId)?.name : undefined}
        actions={
          itemMenu == null
            ? []
            : [
                { label: r.edit, icon: 'sliders', onPress: () => setEditing(itemMenu) },
                {
                  label: strings.exercises.details,
                  icon: 'info',
                  onPress: () => menuItem && router.push(`/exercises/${menuItem.exerciseId}`),
                },
                {
                  label: strings.common.moveUp,
                  icon: 'arrow-up',
                  hidden: itemMenu === 0,
                  onPress: () => editor.move(itemMenu, itemMenu - 1),
                },
                {
                  label: strings.common.moveDown,
                  icon: 'arrow-down',
                  hidden: itemMenu === editor.items.length - 1,
                  onPress: () => editor.move(itemMenu, itemMenu + 1),
                },
                { label: strings.common.remove, icon: 'trash-2', destructive: true, onPress: () => editor.removeItem(itemMenu) },
              ]
        }
      />
    </>
  );
}
