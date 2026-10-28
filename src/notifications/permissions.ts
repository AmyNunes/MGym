import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

export type PermissionState = 'granted' | 'undetermined' | 'blocked';

/** Situação da permissão de notificações (o Android 13+ pede ao usuário). */
export async function notificationPermission(): Promise<PermissionState> {
  const status = await Notifications.getPermissionsAsync();
  if (status.granted) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'blocked';
}

/** Pede a permissão, se ainda dá para pedir. */
export async function requestNotificationPermission(): Promise<PermissionState> {
  const current = await notificationPermission();
  if (current !== 'undetermined') return current;
  const status = await Notifications.requestPermissionsAsync();
  if (status.granted) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'blocked';
}

/** Alarme exato: com `USE_EXACT_ALARM` já vem liberado no Android 13+ (decisão do plano). */
export async function exactAlarmAllowed(): Promise<boolean> {
  const status = await Notifications.getExactAlarmPermissionsAsync();
  return status.granted;
}

export function openSystemSettings(): void {
  void Linking.openSettings();
}
