import type { DietRestriction } from '@/profile/profile';

import type { Food } from './models';

/**
 * Um alimento serve para as minhas restrições (pergunta 17)? Usado para montar a lista que
 * a IA pode usar (os modelos de refeição já têm etiquetas). Regras simples pela categoria da
 * TACO e pelo nome; "outra" não filtra nada.
 */

const MEAT_CATEGORIES = ['Carnes e derivados', 'Pescados e frutos do mar'];
const MEAT_WORDS = /\b(carne|frango|peixe|porco|bovin|presunto|bacon|lingui[cç]a|salsicha|mortadela|salame|atum|sardinha|camar[aã]o|feijoada|toucinho|charque|lombo|peru|fígado|figado)/i;
const DAIRY_WORDS = /\b(leite|queijo|iogurte|requeij[aã]o|manteiga|creme de leite|nata|ricota|coalhada)/i;
const PLANT_MILK = /\b(coco|soja|castanha|am[eê]ndoa|aveia)\b/i;
const EGG_WORDS = /\bovos?\b/i;
const GLUTEN_WORDS = /\b(trigo|p[aã]o|p[aã]es|macarr[aã]o|biscoito|bolo|torrada|aveia|centeio|cevada|pizza|lasanha|empada|pastel|coxinha|esfiha|quibe|lasanha|bolacha|cereal matinal)/i;

const isMeat = (f: Food) => MEAT_CATEGORIES.includes(f.category) || MEAT_WORDS.test(f.name);
const isDairy = (f: Food) => (f.category === 'Leite e derivados' || DAIRY_WORDS.test(f.name)) && !PLANT_MILK.test(f.name);
const isEgg = (f: Food) => f.category === 'Ovos e derivados' || EGG_WORDS.test(f.name);

export function fitsRestrictions(food: Food, restrictions: readonly DietRestriction[]): boolean {
  for (const r of restrictions) {
    if ((r === 'vegetarian' || r === 'vegan') && isMeat(food)) return false;
    if (r === 'vegan' && (isDairy(food) || isEgg(food) || /\bmel\b/i.test(food.name))) return false;
    if (r === 'lactoseFree' && isDairy(food)) return false;
    if (r === 'glutenFree' && GLUTEN_WORDS.test(food.name)) return false;
  }
  return true;
}
