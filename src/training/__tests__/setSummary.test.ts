import { formatSet, summarizeSets } from '../setSummary';

const s = (weightKg: number | null, reps: number, kind: 'normal' | 'warmup' = 'normal') => ({ weightKg, reps, kind });

describe('summarizeSets', () => {
  it('todas iguais: "4 × 10 · 60 kg"', () => {
    expect(summarizeSets([s(60, 10), s(60, 10), s(60, 10), s(60, 10)], 'load')).toBe('4 × 10 · 60 kg');
  });

  it('mesma carga: repetições listadas', () => {
    expect(summarizeSets([s(62.5, 10), s(62.5, 9), s(62.5, 8)], 'load')).toBe('62,5 kg · 10, 9, 8');
  });

  it('cargas diferentes: cada série', () => {
    expect(summarizeSets([s(60, 10), s(62.5, 8)], 'load')).toBe('60 × 10 · 62,5 × 8');
  });

  it('aquecimento fica de fora', () => {
    expect(summarizeSets([s(30, 8, 'warmup'), s(60, 10), s(60, 10)], 'load')).toBe('2 × 10 · 60 kg');
  });

  it('peso do corpo e tempo', () => {
    expect(summarizeSets([s(null, 12), s(null, 10)], 'bodyweight')).toBe('12, 10');
    expect(summarizeSets([s(null, 30), s(null, 30), s(null, 30)], 'time')).toBe('3 × 30 s');
    expect(formatSet(s(5, 8), 'bodyweight')).toBe('+5 × 8');
  });
});
