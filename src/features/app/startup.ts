import { router } from 'expo-router';

import { configureForegroundPresentation, consumeLaunchNotification } from '@/notifications/handlers';
import { restoreRest } from '@/stores/restStore';
import { resumeWorkout } from '@/stores/workoutStore';

/**
 * Depois de abrir o banco: volta o descanso e o treino em andamento ("se o app fechar,
 * volta para ele", seção 9.5). Se o app abriu por uma notificação, ela decide a tela.
 */
export async function onAppReady(): Promise<void> {
  configureForegroundPresentation();
  await restoreRest().catch(() => {});
  const active = await resumeWorkout().catch(() => null);
  const openedByNotification = await consumeLaunchNotification();
  if (active && !openedByNotification) router.push('/session/current');
}
