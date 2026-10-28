import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { recentNotificationLogs } from '@/db/notificationLogRepo';
import { DAY } from '@/lib/dates';
import { useLoader } from '@/lib/useLoader';
import { notificationPermission, requestNotificationPermission, type PermissionState } from '@/notifications/permissions';
import { normalizedOrder, type NotificationSettings, type NotificationType } from '@/notifications/types';
import { useSettings } from '@/stores/settingsStore';

export type PauseOption = 'day' | 'week' | 'forever';
const PAUSE_DAYS: Record<Exclude<PauseOption, 'forever'>, number> = { day: 1, week: 7 };

/** Estado e ações da Central de Notificações (seção 13). */
export function useNotificationCenter() {
  const settings = useSettings((s) => s.notifications);
  const update = useSettings((s) => s.update);
  const [permission, setPermission] = useState<PermissionState | null>(null);

  useEffect(() => {
    const check = () => notificationPermission().then(setPermission, () => setPermission('blocked'));
    void check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && void check());
    return () => sub.remove();
  }, []);

  const history = useLoader(() => recentNotificationLogs(new Date().toISOString(), 20));
  const set = (patch: Partial<NotificationSettings>) => update('notifications', patch);
  const order = normalizedOrder(settings.order);

  const move = (type: NotificationType, delta: number) => {
    const i = order.indexOf(type);
    const j = i + delta;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    void set({ order: next });
  };

  return {
    settings,
    permission,
    history,
    order,
    set,
    move,
    askPermission: async () => setPermission(await requestNotificationPermission()),
    pause: (option: PauseOption) =>
      option === 'forever'
        ? set({ pausedForever: true, pausedUntil: null })
        : set({ pausedForever: false, pausedUntil: new Date(Date.now() + PAUSE_DAYS[option] * DAY).toISOString() }),
    resume: () => set({ pausedForever: false, pausedUntil: null }),
    toggleType: (type: NotificationType, enabled: boolean) => set({ [type]: { ...settings[type], enabled } } as Partial<NotificationSettings>),
  };
}

/** Pausado agora? Devolve a data de retorno, `forever` ou `null`. */
export function pauseState(s: NotificationSettings): Date | 'forever' | null {
  if (s.pausedForever) return 'forever';
  if (s.pausedUntil && new Date(s.pausedUntil).getTime() > Date.now()) return new Date(s.pausedUntil);
  return null;
}
