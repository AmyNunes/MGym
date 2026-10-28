import type { Exercise } from '@/training/exerciseModel';

import { callAI } from '../client';
import { coachPrompt } from '../prompts/coach';
import { coachReplySchema, type CoachReply } from '../schemas';

/** Mensagens que entram no prompt (as mais recentes). */
export const COACH_HISTORY = 12;

/**
 * Sinais de alerta no que eu escrevi (16.1 e 16.4). Rede de segurança no aparelho: mesmo se a IA
 * não marcar, a conversa mostra o atalho para "Ajuda e segurança".
 */
const ALERT = /(dor no peito|aperto no peito|falta de ar|desmai|trombose|v[oô]mit|laxante|diur[eé]tic|pul(ar|ando|ei|o)\s+(as\s+|a\s+)?refei|sem comer|perd(i|endo) o controle|me machucar|me matar|suic[ií]d|n[aã]o quero (mais )?viver|horm[oô]nio sem receita)/i;

export function mentionsAlert(text: string): boolean {
  return ALERT.test(text);
}

/** `coachTurn` (seção 14.3): exercícios sugeridos só do catálogo permitido; sinal de alerta vira `safetyFlag`. */
export async function coachTurn(input: Parameters<typeof coachPrompt>[0]): Promise<CoachReply> {
  const history = input.history.slice(-COACH_HISTORY);
  const { data } = await callAI('coachTurn', coachPrompt({ ...input, history }), coachReplySchema, { temperature: 0.6 });
  const allowed = new Set(input.catalog.map((e: Exercise) => e.id));
  const lastUser = [...history].reverse().find((m) => m.role === 'user')?.text ?? '';
  return {
    replyPt: data.replyPt,
    suggestedExerciseIds: [...new Set(data.suggestedExerciseIds.filter((id) => allowed.has(id)))].slice(0, 3),
    safetyFlag: data.safetyFlag || mentionsAlert(lastUser),
  };
}
