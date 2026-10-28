import type { Food } from '../models';
import { fitsRestrictions } from '../restrictions';

const food = (name: string, category: string): Food => ({
  id: name,
  name,
  category,
  kcal: 100,
  protein: 5,
  carbs: 10,
  fat: 2,
  fiber: null,
  sodium: null,
  potassium: null,
  source: 'taco',
  favorite: false,
});

describe('restrições por alimento', () => {
  it('vegetariana tira carnes e peixes (inclusive pratos com carne)', () => {
    expect(fitsRestrictions(food('Frango, peito, grelhado', 'Carnes e derivados'), ['vegetarian'])).toBe(false);
    expect(fitsRestrictions(food('Feijoada', 'Alimentos preparados'), ['vegetarian'])).toBe(false);
    expect(fitsRestrictions(food('Ovo, de galinha, cozido', 'Ovos e derivados'), ['vegetarian'])).toBe(true);
  });

  it('vegana tira também leite, ovo e mel; sem lactose tira laticínios mas não leite de coco', () => {
    expect(fitsRestrictions(food('Ovo, de galinha, cozido', 'Ovos e derivados'), ['vegan'])).toBe(false);
    expect(fitsRestrictions(food('Queijo, minas, frescal', 'Leite e derivados'), ['lactoseFree'])).toBe(false);
    expect(fitsRestrictions(food('Leite, de coco', 'Miscelâneas'), ['lactoseFree'])).toBe(true);
    expect(fitsRestrictions(food('Feijão, carioca, cozido', 'Leguminosas e derivados'), ['vegan'])).toBe(true);
  });

  it('sem glúten tira pão e macarrão', () => {
    expect(fitsRestrictions(food('Pão, trigo, francês', 'Cereais e derivados'), ['glutenFree'])).toBe(false);
    expect(fitsRestrictions(food('Arroz, tipo 1, cozido', 'Cereais e derivados'), ['glutenFree'])).toBe(true);
  });
});
