import { strings } from '@/i18n/strings';
import type { Profile } from '@/profile/profile';
import type { Exercise } from '@/training/exerciseModel';

import type { ChatMessage } from '../types';
import { GOLDEN_RULES, profileContext } from './common';

const SYSTEM = `${GOLDEN_RULES}
Agora você é uma treinadora experiente explicando UM exercício do catálogo, para alguém treinar sozinha na academia.
- Para cada passo: o que fazer, e o que a pessoa deve SENTIR (onde o músculo trabalha; por exemplo, o glúteo apertando no topo da elevação pélvica).
- Erros comuns com a correção, dicas de foco (conexão mente-músculo) e um cuidado de segurança.
- Explique só este exercício; não invente outros.`;

/** "Explicar com IA" (seção 14.3): o exercício do catálogo, o nível, o objetivo e a dúvida. */
export function explainPrompt(exercise: Exercise, profile: Profile, doubt: string): ChatMessage[] {
  const lines = [
    `Exercício: ${exercise.name} (${exercise.nameEn}).`,
    `Músculos principais: ${exercise.primary.map((m) => strings.muscles[m]).join(', ')}.`,
    exercise.secondary.length ? `Secundários: ${exercise.secondary.map((m) => strings.muscles[m]).join(', ')}.` : '',
    `Faixa: ${exercise.repMin}–${exercise.repMax}${exercise.tracking === 'time' ? ' segundos' : ' repetições'}${exercise.perSide ? ' por lado' : ''}.`,
    `Dicas do app: ${exercise.cues.join(' ')}`,
    exercise.mistakes.length ? `Erros que o app já cita: ${exercise.mistakes.join(' ')}` : '',
    exercise.safety.length ? `Cuidados: ${exercise.safety.join(' ')}` : '',
    profileContext(profile),
    doubt ? `A pessoa ainda não entendeu: "${doubt}". Ajuste a explicação para resolver essa dúvida.` : '',
  ];
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: lines.filter(Boolean).join('\n') },
  ];
}
