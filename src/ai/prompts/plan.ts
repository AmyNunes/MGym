import { strings } from '@/i18n/strings';
import type { Exercise } from '@/training/exerciseModel';
import type { Plan } from '@/training/planModel';

import type { ChatMessage } from '../types';
import { GOLDEN_RULES } from './common';

/** Uma linha do catálogo para a IA: id, nome, grupo, padrão, músculos principais e equipamento. */
export function catalogLine(e: Exercise): string {
  return `${e.id}: ${e.name} — ${strings.groups[e.group]}; ${e.primary.map((m) => strings.muscles[m]).join(', ')}; ${e.equipment
    .map((q) => strings.equipment[q])
    .join(', ')}`;
}

/** `adjustPlan` (seção 14.3): o plano atual, o pedido e o catálogo permitido. */
export function adjustPlanPrompt(input: { plan: Plan; request: string; context: string; catalog: readonly Exercise[]; nameOf: (id: string) => string }): ChatMessage[] {
  const system = `${GOLDEN_RULES}
Agora você ajusta o plano de treino a pedido da pessoa, mexendo o mínimo possível.
- "changes": cada mudança com "action" (replace, remove ou add), "dayId" do plano, "exerciseId" e, em replace, "replaceWithId".
- Em add, "exerciseId" é o exercício novo. Use SOMENTE ids do catálogo permitido (ele já tira o que fere as limitações).
- Em troca, prefira um exercício que trabalhe os mesmos músculos.
- Mantenha os glúteos em destaque e não tire a parte de cima do corpo inteira.
- "explanationPt": explique em 1–3 frases o que mudou e por quê.`;
  const days = input.plan.days
    .map((d) => `Dia ${d.id} — ${d.name}: ${d.exercises.map((x) => `${x.exerciseId} (${input.nameOf(x.exerciseId)}, ${x.sets} séries)`).join('; ')}`)
    .join('\n');
  const user = [
    `Pedido: "${input.request}"`,
    input.context,
    `Plano atual:\n${days}`,
    `Catálogo permitido:\n${input.catalog.map(catalogLine).join('\n')}`,
  ];
  return [
    { role: 'system', content: system },
    { role: 'user', content: user.filter(Boolean).join('\n\n') },
  ];
}
