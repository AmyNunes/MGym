import foodsJson from '@/data/foods-v1.json';

import { tacoId, type Food, type MealTemplate } from '../models';
import { eligibleTemplates, generateDays, optionMacros, optionOrder, scaleTemplate, withinTarget, type MenuPrefs } from '../menu';

const FOODS = new Map<string, Food>(
  foodsJson.rows.map((r) => [
    tacoId(r[0] as number),
    {
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
    },
  ]),
);
const lookups = { find: (id: string) => FOODS.get(id), portionsOf: () => undefined };

const t = (id: string, kinds: MealTemplate['kinds'], tags: MealTemplate['tags'], items: MealTemplate['items'], prep = 10): MealTemplate => ({
  id,
  name: id,
  kinds,
  prepMinutes: prep,
  tags,
  items,
});

const PF = t('pf-frango', ['lunch', 'dinner'], ['lactoseFree', 'glutenFree', 'restaurant', 'lunchbox'], [
  { foodId: 3, grams: 120, role: 'carb' },
  { foodId: 561, grams: 80, role: 'carb' },
  { foodId: 410, grams: 100, role: 'protein' },
  { foodId: 77, grams: 40, role: 'vegetable' },
]);
const LENTIL = t('lentilha-arroz', ['lunch', 'dinner'], ['vegetarian', 'vegan', 'lactoseFree', 'glutenFree'], [
  { foodId: 3, grams: 100, role: 'carb' },
  { foodId: 577, grams: 150, role: 'protein' },
  { foodId: 100, grams: 60, role: 'vegetable' },
], 30);
const BEEF = t('carne-batata', ['lunch', 'dinner'], ['lactoseFree', 'glutenFree'], [
  { foodId: 91, grams: 150, role: 'carb' },
  { foodId: 377, grams: 100, role: 'protein' },
], 25);
const EGG_LUNCH = t('ovo-arroz', ['lunch'], ['vegetarian', 'lactoseFree', 'glutenFree'], [
  { foodId: 3, grams: 120, role: 'carb' },
  { foodId: 488, grams: 100, role: 'protein' },
]);
const ALL = [PF, LENTIL, BEEF, EGG_LUNCH];

const prefs: MenuPrefs = { restrictions: [], dislikes: [], likes: [], cookingTime: null, lunchPlace: null, limitPotassium: false };

describe('filtro das refeições-modelo', () => {
  it('restrições nunca afrouxam (vegana só vê vegana)', () => {
    expect(eligibleTemplates(ALL, 'lunch', { ...prefs, restrictions: ['vegan'] }).map((x) => x.id)).toEqual(['lentilha-arroz']);
  });

  it('"não como" tira a refeição', () => {
    expect(eligibleTemplates(ALL, 'lunch', { ...prefs, dislikes: [tacoId(410)] }).map((x) => x.id)).not.toContain('pf-frango');
  });

  it('pouco tempo de cozinha prefere preparo rápido, mas afrouxa se sobrar pouca opção', () => {
    expect(eligibleTemplates(ALL, 'lunch', { ...prefs, cookingTime: 'little' })).toHaveLength(ALL.length);
    const many = [...ALL, t('rapido-2', ['lunch'], [], [{ foodId: 410, grams: 100, role: 'protein' }]), t('rapido-3', ['lunch'], [], [{ foodId: 488, grams: 100, role: 'protein' }])];
    expect(eligibleTemplates(many, 'lunch', { ...prefs, cookingTime: 'little' }).every((x) => x.prepMinutes <= 10)).toBe(true);
  });

  it('marmita no almoço', () => {
    expect(eligibleTemplates(ALL, 'lunch', { ...prefs, lunchPlace: 'lunchbox' }).length).toBeGreaterThan(0);
  });
});

describe('escala por papel (±10%)', () => {
  it('o prato feito chega na meta de proteína e carboidratos', () => {
    const target = { kcal: 650, protein: 40, carbs: 75, fat: 15 };
    const option = scaleTemplate(PF, target, lookups);
    expect(withinTarget(optionMacros(option, lookups.find), target)).toBe(true);
  });

  it('uma refeição menor também (lanche de 20 g de proteína)', () => {
    const target = { kcal: 450, protein: 25, carbs: 50, fat: 12 };
    expect(withinTarget(optionMacros(scaleTemplate(BEEF, target, lookups), lookups.find), target)).toBe(true);
  });
});

describe('semana', () => {
  const week = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];
  const many = Array.from({ length: 12 }, (_, i) => ({ ...PF, id: `pf-${i}` }));

  it('3 opções por refeição e a mesma opção no máximo 2× na semana', () => {
    const days = generateDays({
      dates: week,
      slots: [{ slot: 'lunch', time: '12:30' }],
      targets: { lunch: { kcal: 650, protein: 40, carbs: 75, fat: 15 } },
      templates: many,
      prefs,
      lookups,
      seed: 'teste',
    });
    const counts = new Map<string, number>();
    for (const d of days) {
      expect(d.slots[0].options).toHaveLength(3);
      for (const o of d.slots[0].options) counts.set(o.templateId!, (counts.get(o.templateId!) ?? 0) + 1);
    }
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
  });

  it('a mesma semente gera o mesmo cardápio', () => {
    const input = {
      dates: week.slice(0, 2),
      slots: [{ slot: 'lunch' as const, time: '12:30' }],
      targets: { lunch: { kcal: 650, protein: 40, carbs: 75, fat: 15 } },
      templates: many,
      prefs,
      lookups,
      seed: 'x',
    };
    expect(generateDays(input)).toEqual(generateDays(input));
  });
});

describe('ordem das opções', () => {
  const options = [
    { name: 'Pão', templateId: null, items: [{ foodId: 'taco-3', grams: 50 }] },
    { name: 'Frango', templateId: null, items: [{ foodId: 'taco-410', grams: 120 }] },
  ];

  it('"Sem números": da mais proteica para a menos; nos outros modos, a ordem original', () => {
    expect(optionOrder(options, true, lookups.find)).toEqual([1, 0]);
    expect(optionOrder(options, false, lookups.find)).toEqual([0, 1]);
  });
});
