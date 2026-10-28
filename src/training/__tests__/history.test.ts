import { heaviestSet, historyChart } from '../history';

const set = (workoutId: string, day: number, weightKg: number | null, reps: number, kind: 'normal' | 'warmup' = 'normal') => ({
  workoutId,
  startedAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
  weightKg,
  reps,
  kind,
  completedAt: 'x',
});

describe('historyChart', () => {
  it('com carga: o melhor 1RM estimado de cada treino, em ordem', () => {
    const points = historyChart(
      [set('b', 22, 65, 8), set('a', 20, 60, 10), set('a', 20, 60, 8), set('b', 22, 100, 15), set('a', 20, 90, 3, 'warmup')],
      'load',
    );
    expect(points.map((p) => p.v)).toEqual([80, 82.3]);
    expect(points[0].t).toBeLessThan(points[1].t);
  });

  it('peso do corpo e tempo: a melhor série', () => {
    expect(historyChart([set('a', 20, null, 10), set('a', 20, null, 12)], 'bodyweight').map((p) => p.v)).toEqual([12]);
    expect(historyChart([set('a', 20, null, 45)], 'time').map((p) => p.v)).toEqual([45]);
  });

  it('com ajuda não tem gráfico', () => {
    expect(historyChart([set('a', 20, 30, 8)], 'assisted')).toEqual([]);
  });
});

describe('heaviestSet', () => {
  it('maior carga com o mínimo da faixa; empate fica com mais repetições', () => {
    expect(heaviestSet([set('a', 1, 60, 10), set('a', 1, 70, 5), set('a', 1, 60, 12)], 8)).toEqual({ weightKg: 60, reps: 12 });
  });
});
