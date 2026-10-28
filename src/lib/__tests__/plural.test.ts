import { pluralizeMeasure } from '../plural';

describe('pluralizeMeasure', () => {
  it.each([
    ['unidade', 'unidades'],
    ['fatia média', 'fatias médias'],
    ['colher de sopa', 'colheres de sopa'],
    ['porção', 'porções'],
    ['copo americano', 'copos americanos'],
  ])('%s → %s', (one, many) => {
    expect(pluralizeMeasure(one)).toBe(many);
  });
});
