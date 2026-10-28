import foodsJson from '@/data/foods-v1.json';

import { itemMacros } from '../macros';
import { tacoId, type Food } from '../models';
import { buildShoppingList, practicalQuantity, rawCounterpart, sectionOf } from '../shopping';
import { equivalents, isHighPotassium, roleOf } from '../swaps';

const FOODS: Food[] = foodsJson.rows.map((r) => ({
  id: tacoId(r[0] as number),
  name: r[1] as string,
  category: foodsJson.categories[r[2] as number],
  kcal: r[3] as number | null,
  protein: r[4] as number | null,
  carbs: r[5] as number | null,
  fat: r[6] as number | null,
  fiber: r[7] as number | null,
  sodium: r[8] as number | null,
  potassium: r[9] as number | null,
  source: 'taco',
  favorite: false,
}));
const byId = new Map(FOODS.map((f) => [f.id, f]));
const find = (id: string) => byId.get(id);
const food = (n: number) => byId.get(tacoId(n))!;

describe('papel de cada alimento', () => {
  it('pelo perfil de macros e pela categoria', () => {
    expect(roleOf(food(410))).toBe('protein'); // frango grelhado
    expect(roleOf(food(3))).toBe('carb'); // arroz cozido
    expect(roleOf(food(260))).toBe('fat'); // azeite
    expect(roleOf(food(182))).toBe('fruit'); // banana prata
    expect(roleOf(food(100))).toBe('vegetable'); // brócolis cozido
  });
});

describe('trocas equivalentes (10.5)', () => {
  it('troca o frango mantendo a proteína, ordenado pela semelhança', () => {
    const chicken = food(410);
    const swaps = equivalents(chicken, 120, 'protein', FOODS);
    expect(swaps.length).toBeGreaterThan(3);
    for (const s of swaps) {
      expect(roleOf(s.food)).toBe('protein');
      expect(Math.abs(s.macros.protein - itemMacros(chicken, 120).protein)).toBeLessThan(2);
    }
    expect(swaps[0].distance).toBeLessThanOrEqual(swaps[swaps.length - 1].distance);
  });

  it('com o total da refeição, só trocas que mantêm P e C em ±10%', () => {
    const meal = { kcal: 600, protein: 40, carbs: 70, fat: 15 };
    const swaps = equivalents(food(410), 120, 'protein', FOODS, { meal });
    for (const s of swaps) {
      const p = meal.protein - itemMacros(food(410), 120).protein + s.macros.protein;
      expect(Math.abs(p - meal.protein)).toBeLessThanOrEqual(4);
    }
  });

  it('não sugere o que eu não como', () => {
    const swaps = equivalents(food(410), 120, 'protein', FOODS, { exclude: [tacoId(408)] });
    expect(swaps.some((s) => s.food.id === tacoId(408))).toBe(false);
  });
});

describe('potássio (10.9)', () => {
  it('banana tem potássio alto; arroz não', () => {
    expect(isHighPotassium(food(182))).toBe(true);
    expect(isHighPotassium(food(3))).toBe(false);
  });
});

describe('lista de compras (10.7)', () => {
  it('converte pronto em cru pelo par da TACO e agrupa por seção', () => {
    expect(rawCounterpart(food(3), FOODS)?.id).toBe(tacoId(4));
    const list = buildShoppingList(
      [
        { foodId: tacoId(3), grams: 700 },
        { foodId: tacoId(410), grams: 840 },
        { foodId: tacoId(488), grams: 600 },
      ],
      find,
      FOODS,
      (id) => (id === tacoId(488) ? [{ label: 'unidade', plural: 'unidades', grams: 50 }] : undefined),
    );
    const rice = list.find((l) => l.foodId === tacoId(4))!;
    expect(rice.label).toBe('Arroz, tipo 1');
    expect(rice.grams).toBe(Math.round((700 * 128) / 358));
    const chicken = list.find((l) => l.label.startsWith('Frango, peito'))!;
    expect(chicken.quantity).toMatch(/kg$/);
    expect(chicken.section).toBe('butcher');
    expect(list.find((l) => l.label.startsWith('Ovo'))).toMatchObject({ label: 'Ovo, de galinha, inteiro', quantity: '12 unidades' });
  });

  it('medidas práticas', () => {
    expect(practicalQuantity(1120)).toBe('1,2 kg');
    expect(practicalQuantity(310)).toBe('350 g');
    expect(sectionOf({ category: 'Cereais e derivados', name: 'Pão, trigo, francês' })).toBe('bakery');
  });
});
