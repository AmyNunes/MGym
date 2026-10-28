import * as Notifications from 'expo-notifications';

import { useSettings } from '@/stores/settingsStore';

import { CHANNELS, ensureChannels } from './channels';

/** Para onde o toque na notificação leva (seção 6.3: `mgym://session/current`). */
export const REST_URL = '/session/current';

/**
 * Agenda a notificação do fim do descanso com `alarmClock` (seção 2.2): a economia
 * de bateria não atrasa. Devolve o id para cancelar ao pular ou mudar o descanso.
 */
export async function scheduleRestEnd(endsAt: Date, title: string, body: string): Promise<string | null> {
  // Central de Notificações › Fim do descanso desligado: a pílula da tela continua avisando.
  if (!useSettings.getState().notifications.rest.enabled) return null;
  try {
    await ensureChannels();
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { type: 'rest', url: REST_URL } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: endsAt,
        channelId: CHANNELS.rest,
        delivery: 'alarmClock',
      },
    });
  } catch {
    // Sem permissão ou sem notificações: o descanso continua na tela.
    return null;
  }
}

export async function cancelRestEnd(id: string | null): Promise<void> {
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  await Notifications.dismissNotificationAsync(id).catch(() => {});
}
