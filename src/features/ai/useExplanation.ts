import { useCallback, useEffect, useState } from 'react';

import { toAIError } from '@/ai/client';
import { explainExercise } from '@/ai/functions/explainExercise';
import type { Explanation } from '@/ai/schemas';
import { useProfile } from '@/stores/profileStore';
import type { Exercise } from '@/training/exerciseModel';

import type { AIState } from './useAIRequest';

/** "Explicar com IA" (seção 14.3): pede ao abrir; "Ainda não entendi…" pede de novo com a dúvida. */
export function useExplanation(exercise: Exercise) {
  const profile = useProfile((s) => s.profile);
  const [request, setRequest] = useState({ doubt: '', attempt: 0 });
  const [state, setState] = useState<AIState<Explanation>>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    explainExercise({ exercise, profile, doubt: request.doubt }).then(
      (result) => alive && setState({ status: 'success', data: result.data }),
      (error: unknown) => alive && setState({ status: 'error', error: toAIError(error) }),
    );
    return () => {
      alive = false;
    };
  }, [exercise, profile, request]);

  const ask = useCallback((doubt: string) => {
    setState({ status: 'loading' });
    setRequest((r) => ({ doubt: doubt.trim(), attempt: r.attempt + 1 }));
  }, []);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setRequest((r) => ({ ...r, attempt: r.attempt + 1 }));
  }, []);

  return { state, ask, retry, doubt: request.doubt };
}
