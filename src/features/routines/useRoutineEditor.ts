import { deleteRoutine, getRoutine, restoreRoutine, updateRoutine } from '@/db/routinesRepo';
import { usePlannedEditor } from '@/features/planned/usePlannedEditor';
import { strings } from '@/i18n/strings';
import { showSnackbar } from '@/stores/snackbarStore';

/**
 * Edição de um treino montado à mão. Cada mudança salva sozinha (com uma pequena espera).
 * Sair com o treino vazio apaga o rascunho: um treino sem exercícios não serve para nada.
 */
export function useRoutineEditor(id: string) {
  const editor = usePlannedEditor(id, {
    load: async () => {
      const routine = await getRoutine(id);
      return routine ? { name: routine.name, items: routine.items } : null;
    },
    save: (d) => updateRoutine(id, d),
    onLeaveEmpty: () => deleteRoutine(id),
  });

  const remove = async () => {
    await editor.flush();
    const routine = await getRoutine(id);
    editor.stop();
    await deleteRoutine(id);
    if (routine && routine.items.length > 0) {
      showSnackbar(strings.routines.deleted, { label: strings.common.undo, onPress: () => void restoreRoutine(routine) });
    }
  };

  return { ...editor, remove };
}
