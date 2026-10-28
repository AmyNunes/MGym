import { formatCount, handPortion, householdLabel, itemMacros, sumMacros, toHousehold } from '../macros';
import type { Food } from '../models';

const rice: Food = {
  id: 'taco-3',
  name: 'Arroz, tipo 1, cozido',
  category: 'Cereais e derivados',
  kcal: 128,
  protein: 2.5,
  carbs: 28.1,
  fat: 0.2,
  fiber: 1.6,
  sodium: 1,
  potassium: 15,
  source: 'taco',
  favorite: false,
};
const spoon = { label: 'colher de sopa cheia', plural: 'colheres de sopa cheias', grams: 25 };

describe('macros pela TACO', () => {
  it('por quantidade e somados', () => {
    expect(itemMacros(rice, 200)).toEqual({ kcal: 256, protein: 5, carbs: 56.2, fat: 0.4 });
    const total = sumMacros(
      [
        { foodId: 'taco-3', grams: 100 },
        { foodId: 'x', grams: 50 },
      ],
      (id) => (id === 'taco-3' ? rice : undefined),
    );
    expect(total.carbs).toBeCloseTo(28.1);
  });
});

describe('medidas caseiras', () => {
  it('arredonda para meia medida e devolve as gramas reais', () => {
    const h = toHousehold(108, [spoon]);
    expect(h).toEqual({ count: 4.5, portion: spoon, grams: 113 });
    expect(householdLabel(toHousehold(100, [spoon]))).toBe('4 colheres de sopa cheias');
    expect(householdLabel(toHousehold(12, [spoon]))).toBe('½ colher de sopa cheia');
  });

  it('sem medida, gramas de 5 em 5', () => {
    expect(householdLabel(toHousehold(118, undefined))).toBe('120 g');
  });

  it('frações', () => {
    expect([0.5, 1, 1.5, 3].map(formatCount)).toEqual(['½', '1', '1½', '3']);
  });
});

describe('porções com a mão (modo sem números)', () => {
  it('palma, punho, concha e polegar', () => {
    expect(handPortion('protein', { kcal: 0, protein: 33, carbs: 0, fat: 0 })).toEqual({ unit: 'palm', count: 1.5 });
    expect(handPortion('carb', { kcal: 0, protein: 0, carbs: 50, fat: 0 })).toEqual({ unit: 'fist', count: 2 });
    expect(handPortion('fat', { kcal: 0, protein: 0, carbs: 0, fat: 2 })).toEqual({ unit: 'thumb', count: 0.5 });
  });
});
