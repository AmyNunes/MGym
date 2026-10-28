import * as Haptics from 'expo-haptics';

import { useSettings } from '@/stores/settingsStore';

/** Vibração sutil e desligável (seção 4.3; Configurações › Celebrações › Vibração). */
const enabled = () => useSettings.getState().celebrations.haptics;

export const haptics = {
  /** Ao concluir uma série. */
  light: () => {
    if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  /** No fim do descanso. */
  medium: () => {
    if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  /** Ao concluir o treino e ao bater recorde. */
  success: () => {
    if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
};
