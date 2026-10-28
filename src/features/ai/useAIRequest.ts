import { useCallback, useEffect, useRef, useState } from 'react';

import { toAIError, type AIError } from '@/ai/client';

export type AIState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: AIError };

/**
 * Um pedido à IA disparado por um botão: carregando, sucesso ou erro amigável,
 * com "Tentar de novo" repetindo o último pedido.
 */
export function useAIRequest<A, T>(fn: (arg: A) => Promise<T>) {
  const [state, setState] = useState<AIState<T>>({ status: 'idle' });
  const lastArg = useRef<{ arg: A } | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(
    async (arg: A): Promise<T | null> => {
      lastArg.current = { arg };
      setState({ status: 'loading' });
      try {
        const data = await fn(arg);
        if (alive.current) setState({ status: 'success', data });
        return data;
      } catch (error) {
        if (alive.current) setState({ status: 'error', error: toAIError(error) });
        return null;
      }
    },
    [fn],
  );

  const retry = useCallback(() => {
    if (lastArg.current) void run(lastArg.current.arg);
  }, [run]);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, run, retry, reset };
}
