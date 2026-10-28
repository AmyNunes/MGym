import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { ACTION_LATER } from './channels';
import { snooze } from './scheduler';

/**
 * Tarefa em segundo plano: no Android, recebe o toque em "Mais tarde" mesmo com o app fechado
 * e reagenda o aviso sem abrir o app. Precisa ser definida no carregamento (index.ts).
 */
export const NOTIFICATION_TASK = 'mgym-notification-actions';

type TaskData = {
  actionIdentifier?: string;
  notification?: { request?: { identifier?: string; content?: Parameters<typeof snooze>[0] } };
};

export function defineNotificationTask(): void {
  TaskManager.defineTask<TaskData>(NOTIFICATION_TASK, async ({ data, error }) => {
    if (error || !data || data.actionIdentifier !== ACTION_LATER) return;
    const request = data.notification?.request;
    if (!request?.content) return;
    await snooze(request.content);
    if (request.identifier) await Notifications.dismissNotificationAsync(request.identifier).catch(() => {});
  });
}

export async function registerNotificationTask(): Promise<void> {
  try {
    await Notifications.registerTaskAsync(NOTIFICATION_TASK);
  } catch {
    // Sem a tarefa, o "Mais tarde" funciona com o app aberto.
  }
}
