import { router } from 'expo-router';

import { insertRoutine, listRoutines } from '@/db/routinesRepo';
import { strings } from '@/i18n/strings';
import { useLoader } from '@/lib/useLoader';

/** "Meus treinos" (aba Treino). */
export function useRoutineList() {
  return useLoader(listRoutines);
}

/** Cria um treino vazio ("Treino 3") e abre o editor. */
export async function createRoutine(existing: number) {
  const id = await insertRoutine({ name: strings.routines.defaultName(existing + 1), items: [] });
  router.push(`/routines/${id}`);
}
