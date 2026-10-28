import type { Exercise } from '@/training/exerciseModel';

import type { ChatMessage } from '../types';
import { GOLDEN_RULES } from './common';
import { catalogLine } from './plan';

/** `coachTurn` (seção 14.3): o histórico da conversa e o contexto (perfil e plano). */
export function coachPrompt(input: {
  history: readonly { role: 'user' | 'assistant'; text: string }[];
  context: string;
  planSummary: string;
  catalog: readonly Exercise[];
}): ChatMessage[] {
  const system = `${GOLDEN_RULES}
Agora você conversa como uma treinadora atenciosa: tira dúvidas de treino, técnica, recuperação e comida do dia a dia.
- Respostas curtas (até 6 frases), práticas e gentis.
- "suggestedExerciseIds": até 3 ids do catálogo abaixo, só se ajudarem a responder; senão, lista vazia.
- "safetyFlag": true se a pessoa citar dor no peito, falta de ar, desmaio, sinais de trombose, dor forte ou lesão, vômito, laxantes, pular refeições para emagrecer, perder o controle ao comer, tristeza que não passa, vontade de se machucar, ou uso de hormônios sem receita. Nesse caso, acolha, oriente procurar ajuda profissional e não dê instruções de treino.
- Você não substitui médico, nutricionista nem psicóloga ou psicólogo.

Sobre a pessoa:
${input.context}

Plano de treino:
${input.planSummary}

Catálogo de exercícios:
${input.catalog.map(catalogLine).join('\n')}`;
  return [{ role: 'system', content: system }, ...input.history.map((m) => ({ role: m.role, content: m.text }))];
}
