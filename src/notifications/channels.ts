import {
  AndroidImportance,
  AndroidNotificationVisibility,
  setNotificationCategoryAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';

import { strings } from '@/i18n/strings';

import type { NotificationType } from './types';

/** Um canal por tipo (seção 13): dá para silenciar cada um no Android também. */
export const CHANNELS = {
  rest: 'rest',
  training: 'training',
  meals: 'meals',
  weighIn: 'weighIn',
  measurements: 'measurements',
  checkin: 'checkin',
} as const;

/** Botões das notificações (seção 13). "Mais tarde" funciona com o app fechado. */
export const ACTION_LATER = 'later';
export const ACTION_OPEN = 'open';

/** Vibração do fim do descanso: média, duas vezes (ms). */
const REST_VIBRATION = [0, 350, 150, 350];

const a = strings.notifications.actions;
const OPEN_LABEL: Record<NotificationType, string> = {
  training: a.start,
  meals: a.seeOptions,
  weighIn: a.log,
  measurements: a.measure,
  checkin: a.see,
};

export const categoryId = (type: NotificationType) => `mgym-${type}`;

let ready = false;

export async function ensureChannels(): Promise<void> {
  if (ready) return;
  const names = strings.notifications.channels;
  await setNotificationChannelAsync(CHANNELS.rest, {
    name: names.rest,
    importance: AndroidImportance.MAX,
    vibrationPattern: REST_VIBRATION,
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
  });
  for (const type of ['training', 'meals', 'weighIn', 'measurements', 'checkin'] as const) {
    await setNotificationChannelAsync(CHANNELS[type], {
      name: names[type],
      importance: type === 'training' ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
      // Na tela bloqueada, só "MGym" (o texto pode falar de corpo e comida).
      lockscreenVisibility: AndroidNotificationVisibility.PRIVATE,
    });
    await setNotificationCategoryAsync(categoryId(type), [
      { identifier: ACTION_OPEN, buttonTitle: OPEN_LABEL[type], options: { opensAppToForeground: true } },
      ...(type === 'training' ? [{ identifier: ACTION_LATER, buttonTitle: a.later, options: { opensAppToForeground: false } }] : []),
    ]);
  }
  ready = true;
}
