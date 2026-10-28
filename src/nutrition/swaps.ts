import { itemMacros, type Macros } from './macros';
import type { Food, Role } from './models';

/**
 * Trocar um alimento (seção 10.5): equivalentes do mesmo papel, ordenados pela semelhança
 * de proteína e carboidratos (pela TACO), com a quantidade ajustada para manter o principal.
 */

export const VEG_CATEGORY = 'Verduras, hortaliças e derivados';
export const FRUIT_CATEGORY = 'Frutas e derivados';

/** Papel de um alimento pelo perfil de macros (proteína ≥ 35% da energia, gordura ≥ 60%, carboidrato ≥ 50%). */
export function roleOf(food: Pick<Food, 'category' | 'protein' | 'carbs' | 'fat' | 'kcal'>): Role | null {
  if (food.category === VEG_CATEGORY) return 'vegetable';
  if (food.category === FRUIT_CATEGORY) return 'fruit';
  const p = (food.protein ?? 0) * 4;
  const c = (food.carbs ?? 0) * 4;
  const f = (food.fat ?? 0) * 9;
  const total = p + c + f;
  if (total <= 0) return null;
  if (p / total >= 0.35) return 'protein';
  if (f / total >= 0.6) return 'fat';
  if (c / total >= 0.5) return 'carb';
  return null;
}

/** O macro que a troca mantém igual, por papel. */
const MAIN: Record<Role, keyof Macros> = { protein: 'protein', carb: 'carbs', fat: 'fat', fruit: 'carbs', vegetable: 'kcal' };

const MIN_GRAMS = 10;
const MAX_GRAMS = 400;
const ROUND = 5;

export type Swap = { food: Food; grams: number; macros: Macros; distance: number };

/**
 * Equivalentes para `food` (em `grams`) entre `candidates`. Com `meal` (total da refeição),
 * só entram trocas que deixam proteína e carboidratos da refeição dentro de ±10%.
 */
export function equivalents(
  food: Food,
  grams: number,
  role: Role,
  candidates: readonly Food[],
  options: { exclude?: readonly string[]; meal?: Macros; limit?: number } = {},
): Swap[] {
  const main = MAIN[role];
  const current = itemMacros(food, grams);
  const target = current[main];
  const out: Swap[] = [];
  for (const c of candidates) {
    if (c.id === food.id || options.exclude?.includes(c.id) || roleOf(c) !== role) continue;
    const per100 = itemMacros(c, 100)[main];
    if (per100 <= 0 || target <= 0) continue;
    const raw = (target / per100) * 100;
    const g = Math.round(raw / ROUND) * ROUND;
    if (g < MIN_GRAMS || g > MAX_GRAMS) continue;
    const m = itemMacros(c, g);
    const distance = Math.abs(m.protein - current.protein) + Math.abs(m.carbs - current.carbs);
    if (options.meal) {
      const p = options.meal.protein - current.protein + m.protein;
      const carbs = options.meal.carbs - current.carbs + m.carbs;
      if (Math.abs(p - options.meal.protein) > 0.1 * options.meal.protein) continue;
      if (Math.abs(carbs - options.meal.carbs) > 0.1 * Math.max(options.meal.carbs, 1)) continue;
    }
    out.push({ food: c, grams: g, macros: m, distance });
  }
  return out.sort((a, b) => a.distance - b.distance).slice(0, options.limit ?? 8);
}

/** Potássio alto (seção 10.9): acima disto por 100 g, o alimento ganha aviso com o interruptor ligado. */
export const HIGH_POTASSIUM_MG = 300;
export const isHighPotassium = (food: Pick<Food, 'potassium'>) => (food.potassium ?? 0) > HIGH_POTASSIUM_MG;
