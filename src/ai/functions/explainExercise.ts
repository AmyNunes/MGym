import type { Profile } from '@/profile/profile';
import type { Exercise } from '@/training/exerciseModel';

import { withCache } from '../cache';
import { callAI } from '../client';
import { explainPrompt } from '../prompts/explain';
import { explanationSchema, type Explanation } from '../schemas';

/**
 * "Explicar com IA" (seção 14.3). Cache: mesmo exercício + nível + objetivo + dúvida = sem nova chamada.
 */
export async function explainExercise(input: { exercise: Exercise; profile: Profile; doubt?: string }): Promise<{
  data: Explanation;
  cached: boolean;
}> {
  const doubt = input.doubt?.trim() ?? '';
  const key = {
    exerciseId: input.exercise.id,
    experience: input.profile.experience,
    goal: input.profile.goal,
    context: input.profile.includeContextInAi,
    doubt,
  };
  return withCache('explainExercise', key, explanationSchema, async () => {
    const { data } = await callAI('explainExercise', explainPrompt(input.exercise, input.profile, doubt), explanationSchema, {
      temperature: 0.4,
    });
    return data;
  });
}
