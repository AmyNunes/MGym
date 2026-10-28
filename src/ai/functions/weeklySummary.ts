import type { CheckinAnswers, CheckinStats } from '@/features/checkin/model';

import { callAI } from '../client';
import { GOLDEN_RULES } from '../prompts/common';
import { weeklySummarySchema, type WeeklySummary } from '../schemas';
import type { ChatMessage } from '../types';

/** Os números da semana em texto: calculados no aparelho, a IA só resume. */
export function weekFacts(stats: CheckinStats, answers: CheckinAnswers, includeWeight: boolean): string {
  const r = answers.ratings;
  const lines = [
    `Treinos: ${stats.workouts} de ${stats.planned}.`,
    `Séries de glúteos: ${stats.glutes} (meta ${stats.glutesGoal}).`,
    `Recordes novos: ${stats.records}.`,
    `Cardio: ${stats.cardioMinutes} min (meta 150).`,
    stats.mealsMarkedPct != null ? `Refeições do cardápio marcadas: ${stats.mealsMarkedPct}%.` : '',
    includeWeight && stats.weightRate ? `Tendência do peso: ${stats.weightRate.kg} kg na semana.` : '',
    Object.keys(r).length
      ? `Como foi (1 a 5): energia ${r.energy ?? '-'}, sono ${r.sleep ?? '-'}, fome ${r.hunger ?? '-'}, humor ${r.mood ?? '-'}, dores ${r.pain ?? '-'} (5 = muitas).`
      : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function prompt(facts: string, context: string): ChatMessage[] {
  const system = `${GOLDEN_RULES}
Agora você escreve o resumo da semana de treino e comida: 2–4 frases calorosas que celebram o que deu certo sem cobrar o que faltou, e um foco simples e concreto para a próxima semana.
Use só os números informados; não invente outros.`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: [context, facts].filter(Boolean).join('\n\n') },
  ];
}

/** `weeklySummary` (seção 14.3): números da semana → resumo e foco. */
export async function weeklySummary(facts: string, context: string): Promise<WeeklySummary> {
  const { data } = await callAI('weeklySummary', prompt(facts, context), weeklySummarySchema, { temperature: 0.6 });
  return data;
}
