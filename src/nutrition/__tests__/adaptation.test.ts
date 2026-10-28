import { adaptTargets, estimateTdee } from '../adaptation';
import { withAdjustment } from '../targets';

const base = { goal: 'maintain' as const, currentKcal: 2000, floor: 1500, windowDays: 14, blockDeficit: false };

describe('adaptação das metas', () => {
  it('reestima o gasto: média ingerida − Δtendência × 7.700 ÷ dias', () => {
    expect(Math.round(estimateTdee(2000, -0.5, 14))).toBe(2275);
  });

  it('peso caindo sem querer (manter): sobe a meta em passos de até 150 kcal', () => {
    const r = adaptTargets({ ...base, intakeDays: Array(10).fill(2000), trendDeltaKg: -0.5 });
    expect(r).toEqual({ delta: 150, estimatedTdee: 2275 });
  });

  it('perto do certo (menos de 100 kcal): não mexe', () => {
    expect(adaptTargets({ ...base, intakeDays: Array(10).fill(2000), trendDeltaKg: -0.1 })).toBeNull();
  });

  it('poucos dias marcados: sem ajuste', () => {
    expect(adaptTargets({ ...base, intakeDays: [2000, 2000], trendDeltaKg: -1 })).toBeNull();
  });

  it('perder: nunca abaixo do piso; com déficit bloqueado, mira o gasto', () => {
    const lose = { ...base, goal: 'lose' as const, currentKcal: 1600, intakeDays: Array(10).fill(1600), trendDeltaKg: 0 };
    expect(adaptTargets(lose)?.delta).toBe(-100);
    expect(adaptTargets({ ...lose, blockDeficit: true })).toBeNull();
  });

  it('aplica o ajuste: proteína fica, gordura acompanha, carboidratos com o resto', () => {
    const t = { kcal: 2000, protein: 110, carbs: 220, fat: 61, goal: 'maintain' as const, bmr: 1400, tdee: 2000, atFloor: false };
    const adjusted = withAdjustment(t, -150);
    expect(adjusted.kcal).toBe(1850);
    expect(adjusted.protein).toBe(110);
    expect(adjusted.fat).toBe(57);
    expect(withAdjustment(t, -900).kcal).toBe(1500);
  });
});
