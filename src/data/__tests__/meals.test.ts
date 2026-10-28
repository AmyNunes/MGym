import foodsJson from '@/data/foods-v1.json';
import { MEAL_TEMPLATES } from '@/data/meals';
import { eligibleTemplates, optionMacros, scaleTemplate, withinTarget, type MenuPrefs } from '@/nutrition/menu';
import { MEAL_KINDS, mealTemplateSchema, tacoId, type Food } from '@/nutrition/models';

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
const prefs: MenuPrefs = { restrictions: [], dislikes: [], likes: [], cookingTime: null, lunchPlace: null, limitPotassium: false };

describe('refeições-modelo (src/data/meals.ts)', () => {
  it('cerca de 80, todas válidas, com ids únicos', () => {
    expect(MEAL_TEMPLATES.length).toBeGreaterThanOrEqual(75);
    for (const t of MEAL_TEMPLATES) {
      const r = mealTemplateSchema.safeParse(t);
      if (!r.success) throw new Error(`${t.id}: ${r.error.message}`);
    }
    expect(new Set(MEAL_TEMPLATES.map((t) => t.id)).size).toBe(MEAL_TEMPLATES.length);
  });

  it('só alimentos que existem na TACO, com valores', () => {
    for (const t of MEAL_TEMPLATES) {
      for (const item of t.items) {
        const food = FOODS.get(tacoId(item.foodId));
        expect(food).toBeDefined();
        expect(food?.kcal).not.toBeNull();
      }
    }
  });

  it('opções para cada refeição e para cada restrição', () => {
    for (const kind of MEAL_KINDS) {
      expect(eligibleTemplates(MEAL_TEMPLATES, kind, prefs).length).toBeGreaterThanOrEqual(6);
      for (const r of ['vegetarian', 'vegan', 'lactoseFree', 'glutenFree'] as const) {
        expect(eligibleTemplates(MEAL_TEMPLATES, kind, { ...prefs, restrictions: [r] }).length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('os exemplos da spec estão lá', () => {
    const names = MEAL_TEMPLATES.map((t) => t.name.toLowerCase()).join(' | ');
    for (const word of ['tapioca', 'cuscuz', 'iogurte', 'omelete', 'atum', 'castanha']) expect(names).toContain(word);
  });

  it('nada de palavras de dieta e culpa nos nomes (seção 16.4)', () => {
    for (const t of MEAL_TEMPLATES) expect(t.name).not.toMatch(/\b(fit|light|detox|limp[oa]|magr[oa]|culpa|jaca)\b/i);
  });

  it('escaladas para metas típicas, a grande maioria fica em ±10% de proteína e carboidratos', () => {
    const targets = {
      breakfast: { kcal: 450, protein: 28, carbs: 55, fat: 14 },
      lunch: { kcal: 650, protein: 38, carbs: 75, fat: 18 },
      dinner: { kcal: 550, protein: 32, carbs: 60, fat: 15 },
      snack: { kcal: 220, protein: 12, carbs: 25, fat: 6 },
      supper: { kcal: 220, protein: 12, carbs: 25, fat: 6 },
    };
    let ok = 0;
    let total = 0;
    for (const t of MEAL_TEMPLATES) {
      for (const kind of t.kinds) {
        total++;
        if (withinTarget(optionMacros(scaleTemplate(t, targets[kind], lookups), lookups.find), targets[kind])) ok++;
      }
    }
    expect(ok / total).toBeGreaterThanOrEqual(0.7);
  });
});
