import { AppState } from 'react-native';

import { useProfile } from '@/stores/profileStore';
import { useSettings } from '@/stores/settingsStore';

import { registerNotificationTask } from './backgroundTask';
import { requestReschedule } from './scheduler';

/**
 * Liga a Central ao app (seção 13): reagenda ao abrir, ao voltar e ao sair do app (com o treino
 * e as refeições do dia já registrados) e quando mudo as configurações ou o perfil.
 */
export function startNotificationService(): () => void {
  void registerNotificationTask();
  requestReschedule();
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active' || state === 'background') requestReschedule();
  });
  const stopSettings = useSettings.subscribe((state, prev) => {
    if (state.notifications !== prev.notifications) requestReschedule();
  });
  const stopProfile = useProfile.subscribe((state, prev) => {
    if (state.profile !== prev.profile) requestReschedule();
  });
  return () => {
    appState.remove();
    stopSettings();
    stopProfile();
  };
}
