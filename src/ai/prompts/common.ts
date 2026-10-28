import { strings } from '@/i18n/strings';
import { appDayKey } from '@/lib/dates';
import type { Profile } from '@/profile/profile';
import { recoveryState } from '@/safety/recovery';

/**
 * Regras de ouro (seção 14.2) e linguagem (seção 5), repetidas em todo prompt de sistema.
 * O app valida a saída: ids desconhecidos são descartados e os números de nutrição vêm da TACO.
 */
export const GOLDEN_RULES = `Você ajuda uma pessoa a treinar musculação e a comer bem, dentro de um app pessoal (MGym). Ela quer um corpo mais feminino (glúteos, quadris e pernas) com saúde.
Regras de ouro:
- Português do Brasil, simples, frases curtas, carinhoso e sem culpa. Fale com "você" e evite marcar gênero.
- Nunca use "queimar", "compensar", "jaca", "limpo/sujo", "merecer"; nenhum alimento é proibido; nada de comparar com outras pessoas.
- Nunca fale de doses, hormônios, remédios ou diagnósticos: para isso, oriente procurar o médico.
- Nunca sugira comer menos de 1.500 kcal por dia nem treinar para "pagar" comida.
- Os números de nutrição (proteína, carboidratos, gordura, kcal) vêm do app (tabela TACO), não de você.
- Exercícios e alimentos só pelos ids das listas que o app mandar.
- Responda apenas com o JSON pedido.`;

const g = strings.guide.options;
const fo = strings.guide.foodOptions;

/**
 * O que a IA pode saber de mim (seção 14.4). Sem nome. Identidade, terapia hormonal, cirurgias,
 * peso e medidas só com "Incluir meu contexto nas perguntas à IA" ligado. Nunca doses.
 */
export function profileContext(profile: Profile, extra: { waistCm?: number | null } = {}): string {
  const lines = [
    profile.goal && `Objetivo: ${g.goal[profile.goal]}.`,
    profile.experience && `Experiência: ${g.experience[profile.experience]}.`,
    profile.daysPerWeek && `Treina ${profile.daysPerWeek} dias por semana${profile.sessionMinutes ? `, ${profile.sessionMinutes} min por treino` : ''}.`,
    profile.priorities.length > 0 && `Prioridades: ${profile.priorities.map((p) => g.priorities[p]).join(', ')}.`,
    profile.limitations.length > 0 && `Limitações (evitar sobrecarregar): ${profile.limitations.map((l) => g.limitations[l]).join(', ')}.`,
    profile.restrictions.length > 0 && `Restrições alimentares: ${profile.restrictions.map((r) => fo.restrictions[r]).join(', ')}.`,
    profile.cookingTime && `Tempo para cozinhar: ${fo.cooking[profile.cookingTime]}.`,
    profile.lunchPlace && `Almoço: ${fo.lunch[profile.lunchPlace]}.`,
  ];
  if (profile.includeContextInAi) {
    const recovery = recoveryState(profile.surgery, appDayKey(new Date()));
    lines.push(
      profile.context && profile.context !== 'preferNot' ? `Identidade: ${g.context[profile.context]}.` : null,
      profile.hrt && profile.hrt !== 'preferNot'
        ? `Terapia hormonal: ${g.hrt[profile.hrt]}${profile.hrtMonths != null ? ` há ${profile.hrtMonths} meses` : ''} (não fale de doses).`
        : null,
      profile.surgery ? `Cirurgia: ${g.surgery[profile.surgery.kind]}${recovery.active ? ' (em recuperação: só esforço leve)' : ''}.` : null,
      profile.weightKg && profile.heightCm ? `Altura ${profile.heightCm} cm, peso ${profile.weightKg} kg.` : null,
      extra.waistCm ? `Cintura: ${extra.waistCm} cm.` : null,
    );
  } else {
    const recovery = recoveryState(profile.surgery, appDayKey(new Date()));
    if (recovery.active) lines.push('Está em recuperação de uma cirurgia: só esforço leve.');
  }
  return lines.filter(Boolean).join('\n');
}
