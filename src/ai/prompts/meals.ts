import type { MacroTargets } from '@/nutrition/targets';

import type { ChatMessage } from '../types';
import { GOLDEN_RULES } from './common';

/** Um alimento que a IA pode usar: id, nome curto e papel na refeição. */
export type FoodCandidate = { id: string; name: string; role: string };

const ROLE_PT: Record<string, string> = {
  protein: 'proteína',
  carb: 'carboidrato',
  fat: 'gordura',
  vegetable: 'verdura/legume',
  fruit: 'fruta',
  other: 'outro',
};

const list = (foods: readonly FoodCandidate[]) => foods.map((f) => `${f.id}: ${f.name} (${ROLE_PT[f.role] ?? f.role})`).join('\n');

/** `mealOptions` (seção 14.3): 3 opções só com alimentos da lista; o app ajusta as quantidades pela TACO. */
export function mealOptionsPrompt(input: {
  slotName: string;
  target: MacroTargets;
  context: string;
  likes: readonly string[];
  current: readonly string[];
  foods: readonly FoodCandidate[];
}): ChatMessage[] {
  const system = `${GOLDEN_RULES}
Agora você monta opções de UMA refeição brasileira, gostosas e práticas, como as de casa, marmita ou prato feito.
- Use SOMENTE os alimentos da lista, pelo id exato ("taco-123" ou "custom-..."). Não invente ids.
- Cada opção: 2 a 6 itens, com um de proteína, e gramas realistas para uma pessoa.
- O app recalcula as quantidades pela tabela TACO para bater as metas; você só escolhe a combinação.`;
  const user = [
    `Refeição: ${input.slotName}.`,
    `Metas aproximadas desta refeição: proteína ${input.target.protein} g, carboidratos ${input.target.carbs} g, ${input.target.kcal} kcal.`,
    input.context,
    input.likes.length ? `Alimentos de que gosta (use quando couber): ${input.likes.join(', ')}.` : '',
    input.current.length ? `Opções que já existem (traga outras diferentes): ${input.current.join('; ')}.` : '',
    `Alimentos permitidos:\n${list(input.foods)}`,
  ];
  return [
    { role: 'system', content: system },
    { role: 'user', content: user.filter(Boolean).join('\n') },
  ];
}

/** `describeMeal` (seção 14.3): texto livre → alimentos do banco, com gramas e confiança. */
export function describeMealPrompt(text: string, foods: readonly FoodCandidate[]): ChatMessage[] {
  const system = `${GOLDEN_RULES}
Agora você transforma a descrição de uma refeição em alimentos da lista do app.
- Use SOMENTE ids da lista. Se um alimento não estiver na lista, escolha o mais parecido ou deixe de fora.
- Gramas de uma porção comum no Brasil (ex.: prato feito: arroz 150 g, feijão 100 g).
- "confidence" de 0 a 1: quanto você tem certeza do alimento e da quantidade.`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: `Descrição: "${text}"\n\nAlimentos permitidos:\n${list(foods)}` },
  ];
}
