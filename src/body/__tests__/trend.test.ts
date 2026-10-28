import { inRange, trendDirection, weeklyRate, weightTrend } from '../trend';

describe('tendência do peso', () => {
  it('suaviza o sobe-e-desce (α = 0,1) e faz a média dos registros do mesmo dia', () => {
    const points = weightTrend([
      { day: '2026-10-01', kg: 70 },
      { day: '2026-10-02', kg: 71 },
      { day: '2026-10-02', kg: 72 },
      { day: '2026-10-03', kg: 69 },
    ]);
    expect(points.map((p) => p.kg)).toEqual([70, 71.5, 69]);
    expect(points[1].trend).toBe(70.15);
    expect(points[2].trend).toBe(70.04);
  });

  it('dias sem registro: α efetivo maior (1 − 0,9^Δ)', () => {
    const [, b] = weightTrend([
      { day: '2026-10-01', kg: 70 },
      { day: '2026-10-04', kg: 67 },
    ]);
    // α_ef = 1 − 0,9³ = 0,271 → 70 − 0,813
    expect(b.trend).toBe(69.19);
  });

  it('ritmo semanal pela tendência, em kg e % do peso', () => {
    const entries = Array.from({ length: 15 }, (_, i) => ({ day: `2026-10-${String(i + 1).padStart(2, '0')}`, kg: 70 - i * 0.1 }));
    const rate = weeklyRate(weightTrend(entries), '2026-10-15');
    expect(rate?.kg).toBeLessThan(0);
    expect(rate?.pct).toBeLessThan(0);
    expect(weeklyRate(weightTrend(entries.slice(0, 3)), '2026-10-03')).toBeNull();
  });

  it('direção para quem esconde o peso', () => {
    expect(trendDirection(null)).toBe('stable');
    expect(trendDirection({ kg: 0.03, pct: 0.05 })).toBe('stable');
    expect(trendDirection({ kg: 0.2, pct: 0.3 })).toBe('upSlow');
    expect(trendDirection({ kg: -0.5, pct: -0.7 })).toBe('down');
  });

  it('intervalo do gráfico', () => {
    const now = new Date(2026, 9, 26);
    const pts = [{ t: new Date(2026, 5, 1).getTime() }, { t: new Date(2026, 9, 20).getTime() }];
    expect(inRange(pts, '4w', now)).toHaveLength(1);
    expect(inRange(pts, 'all', now)).toHaveLength(2);
  });
});
