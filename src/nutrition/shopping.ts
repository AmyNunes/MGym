import type { Food, MealItem, Portion } from './models';

/**
 * Lista de compras (seção 10.7): soma o que está no cardápio, converte o pronto (cozido,
 * grelhado…) em cru pelo par da própria TACO, agrupa por seção do mercado e usa medidas práticas.
 */

export const SECTIONS = ['produce', 'butcher', 'dairy', 'bakery', 'pantry', 'drinks', 'other'] as const;
export type Section = (typeof SECTIONS)[number];

const SECTION_BY_CATEGORY: Record<string, Section> = {
  'Verduras, hortaliças e derivados': 'produce',
  'Frutas e derivados': 'produce',
  'Carnes e derivados': 'butcher',
  'Pescados e frutos do mar': 'butcher',
  'Leite e derivados': 'dairy',
  'Ovos e derivados': 'dairy',
  'Bebidas (alcoólicas e não alcoólicas)': 'drinks',
};

export function sectionOf(food: Pick<Food, 'category' | 'name'>): Section {
  if (food.category === 'Cereais e derivados' && /^(Pão|Torrada)/.test(food.name)) return 'bakery';
  return SECTION_BY_CATEGORY[food.category] ?? (food.category === 'Meus alimentos' ? 'other' : 'pantry');
}

const COOKED = /, (cozid[oa]|grelhad[oa]|assad[oa]|frit[oa]|refogad[oa])(\/.*)?$/;

/** O alimento cru da TACO que corresponde ao pronto ("Arroz, tipo 1, cozido" → "Arroz, tipo 1, cru"). */
export function rawCounterpart(food: Food, all: readonly Food[]): Food | null {
  if (!COOKED.test(food.name)) return null;
  const base = food.name.replace(COOKED, '');
  return all.find((f) => f.id !== food.id && (f.name === `${base}, cru` || f.name === `${base}, crua`)) ?? null;
}

/** Gramas cruas que rendem estas gramas prontas (pela energia: o cozimento muda a água, não as kcal). */
export function rawGrams(cooked: Food, raw: Food, grams: number): number {
  if (!cooked.kcal || !raw.kcal) return grams;
  return (grams * cooked.kcal) / raw.kcal;
}

export type ShoppingLine = { foodId: string; label: string; quantity: string; section: Section; grams: number };

const UNIT = /^unidade/;

/** "1,2 kg", "350 g" (sempre para cima, de 50 em 50 g) ou "12 unidades" (com `units`). */
export function practicalQuantity(grams: number, unit?: { portion: Portion; count: number }): string {
  if (unit) {
    const n = Math.ceil(unit.count - 1e-9);
    return `${n} ${n === 1 ? unit.portion.label : unit.portion.plural}`;
  }
  if (grams >= 1000) return `${(Math.ceil(grams / 100) / 10).toString().replace('.', ',')} kg`;
  return `${Math.max(50, Math.ceil(grams / 50) * 50)} g`;
}

/** Nome curto para a lista: sem o preparo (", cru", ", cozido/10minutos"…). */
const shortName = (name: string) => name.replace(COOKED, '').replace(/, cru[a]?$/, '');

export function buildShoppingList(
  items: readonly MealItem[],
  find: (id: string) => Food | undefined,
  all: readonly Food[],
  portionsOf: (id: string) => Portion[] | undefined,
): ShoppingLine[] {
  const totals = new Map<string, { food: Food; grams: number; unit?: { portion: Portion; count: number } }>();
  for (const item of items) {
    const food = find(item.foodId);
    if (!food) continue;
    // O que se compra em unidades (ovos, pães, frutas) é contado pelo cardápio, sem converter.
    const unitPortion = portionsOf(food.id)?.find((p) => UNIT.test(p.label));
    const raw = unitPortion ? null : rawCounterpart(food, all);
    const target = raw ?? food;
    const grams = raw ? rawGrams(food, raw, item.grams) : item.grams;
    const prev = totals.get(target.id);
    const unit = unitPortion
      ? { portion: unitPortion, count: (prev?.unit?.count ?? 0) + item.grams / unitPortion.grams }
      : prev?.unit;
    totals.set(target.id, { food: target, grams: (prev?.grams ?? 0) + grams, unit });
  }
  return [...totals.values()]
    .map(({ food, grams, unit }) => ({
      foodId: food.id,
      label: shortName(food.name),
      quantity: practicalQuantity(grams, unit),
      section: sectionOf(food),
      grams: Math.round(grams),
    }))
    .sort((a, b) => SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section) || a.label.localeCompare(b.label));
}
