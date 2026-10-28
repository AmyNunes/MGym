import { router } from 'expo-router';
import { create } from 'zustand';

type PickerState = {
  /** Quem pediu a escolha recebe os ids escolhidos (em ordem). */
  onPick: ((exerciseIds: string[]) => void) | null;
};

/** Escolha de exercícios no catálogo, para montar um treino ou adicionar ao treino em andamento. */
export const useExercisePicker = create<PickerState>()(() => ({ onPick: null }));

export function openExercisePicker(onPick: (exerciseIds: string[]) => void) {
  useExercisePicker.setState({ onPick });
  router.push('/exercises?pick=1');
}

export function finishExercisePick(exerciseIds: string[]) {
  const { onPick } = useExercisePicker.getState();
  useExercisePicker.setState({ onPick: null });
  onPick?.(exerciseIds);
}
