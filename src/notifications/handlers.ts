import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';

import { markNotificationOpened } from '@/db/notificationLogRepo';

import { ACTION_LATER } from './channels';
import { snooze } from './scheduler';

/**
 * Com o app aberto, o fim do descanso não aparece como notificação: o RestTimer
 * da tela já avisa (vibração e leitor de tela). As outras aparecem normalmente.
 */
export function configureForegroundPresentation(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isRest = notification.request.content.data?.type === 'rest';
      return {
        shouldShowBanner: !isRest,
        shouldShowList: !isRest,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    },
  });
}

const handled = new Set<string>();

function open(response: Notifications.NotificationResponse) {
  const request = response.notification.request;
  const key = `${request.identifier}:${response.actionIdentifier}`;
  if (handled.has(key)) return;
  handled.add(key);
  const data = request.content.data ?? {};
  if (response.actionIdentifier === ACTION_LATER) {
    // "Mais tarde" com o app aberto: reagenda e some, sem abrir nada.
    void snooze(request.content).then(() => Notifications.dismissNotificationAsync(request.identifier).catch(() => {}));
    return;
  }
  if (typeof data.logId === 'string') void markNotificationOpened(data.logId, new Date().toISOString()).catch(() => {});
  if (typeof data.url === 'string') router.push(data.url as Href);
}

/** Toque numa notificação com o app aberto → abre a tela certa. */
export function listenNotificationResponses(): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(open);
  return () => sub.remove();
}

/** A notificação que abriu o app (início a frio): abre a tela dela. Devolve se havia uma. */
export async function consumeLaunchNotification(): Promise<boolean> {
  try {
    const r = await Notifications.getLastNotificationResponseAsync();
    if (!r) return false;
    open(r);
    await Notifications.clearLastNotificationResponseAsync();
    return true;
  } catch {
    return false;
  }
}
