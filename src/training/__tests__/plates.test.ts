import { platesFor } from '../plates';

describe('calculadora de anilhas', () => {
  it('60 kg com barra de 20: 20 de cada lado', () => {
    expect(platesFor(60, 20)).toEqual({ perSide: [20], remainder: 0, belowBar: false });
  });

  it('72,5 kg: 25 + 1,25 de cada lado', () => {
    expect(platesFor(72.5, 20)).toEqual({ perSide: [25, 1.25], remainder: 0, belowBar: false });
  });

  it('carga que não fecha: mostra o que sobra', () => {
    expect(platesFor(61, 20).remainder).toBe(1);
  });

  it('menor que a barra; barra configurável', () => {
    expect(platesFor(15, 20).belowBar).toBe(true);
    expect(platesFor(35, 15).perSide).toEqual([10]);
  });
});
