import { useCallback, useEffect, useState } from 'react';

import { getDb } from '@/db/client';
import { loadProfile } from '@/stores/profileStore';
import { useSettings } from '@/stores/settingsStore';

export type BootState = 'loading' | 'ready' | 'error';

/** Abre o banco (com migrations) e carrega as configurações antes de mostrar o app. */
export function useBootstrap() {
  const loadSettings = useSettings((s) => s.load);
  const [state, setState] = useState<BootState>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    getDb()
      .then(() => loadSettings())
      .then(() => loadProfile())
      .then(
        () => alive && setState('ready'),
        () => alive && setState('error'),
      );
    return () => {
      alive = false;
    };
  }, [loadSettings, attempt]);

  const retry = useCallback(() => {
    setState('loading');
    setAttempt((a) => a + 1);
  }, []);

  return { state, retry };
}
