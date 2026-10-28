import {
  activityFactor,
  dayTargets,
  mifflinFemale,
  MIFFLIN_GAP,
  proteinWeight,
  rangePosition,
  splitTargets,
  type TargetInput,
} from '../targets';

const base: TargetInput = {
  weightKg: 65,
  heightCm: 170,
  age: 28,
  hrt: 'estrogen',
  hrtMonths: 12,
  daysPerWeek: 3,
  goal: 'maintain',
};

describe('Mifflin–St Jeor em faixa (10.1)', () => {
  it('a versão masculina é sempre 166 kcal acima da feminina', () => {
    expect(mifflinFemale(65, 170, 28)).toBeCloseTo(10 * 65 + 6.25 * 170 - 5 * 28 - 161);
    expect(MIFFLIN_GAP).toBe(166);
  });

  it('meio da faixa por padrão; puxa para a feminina com estrogênio e para a masculina sem terapia', () => {
    expect(rangePosition(null, null)).toBe(0.5);
    expect(rangePosition('estrogen', 0)).toBe(0.5);
    expect(rangePosition('estrogen', 12)).toBe(0.375);
    expect(rangePosition('estrogen', 36)).toBe(0.25);
    expect(rangePosition('none', null)).toBe(0.75);
  });

  it('fator de atividade por dias de treino', () => {
    expect([2, 3, 4, 5].map(activityFactor)).toEqual([1.4, 1.4, 1.5, 1.6]);
  });
});

describe('objetivo, limites e piso', () => {
  const female = mifflinFemale(65, 170, 28);
  const bmr = female + 166 * 0.375;
  const tdee = bmr * 1.4;

  it('manter = gasto', () => {
    expect(dayTargets(base).kcal).toBe(Math.round(tdee));
  });

  it('ganhar = +7,5% (entre 5 e 10%)', () => {
    expect(dayTargets({ ...base, goal: 'gain' }).kcal).toBe(Math.round(tdee * 1.075));
  });

  it('perder = −15%, no máximo 500 kcal e 20% do gasto', () => {
    expect(dayTargets({ ...base, goal: 'lose' }).kcal).toBe(Math.round(tdee - tdee * 0.15));
    const big = dayTargets({ ...base, weightKg: 130, heightCm: 190, daysPerWeek: 5, goal: 'lose' });
    expect(big.tdee - big.kcal).toBeLessThanOrEqual(500 + 1);
  });

  it('nunca abaixo de 1.500 kcal nem do metabolismo basal', () => {
    const small = dayTargets({ ...base, weightKg: 45, heightCm: 150, age: 50, goal: 'lose', hrt: 'estrogen', hrtMonths: 60 });
    expect(small.kcal).toBeGreaterThanOrEqual(Math.max(1500, small.bmr));
    expect(small.atFloor).toBe(true);
  });

  it('déficit bloqueado com IMC < 18,5 ou alerta: vira manter', () => {
    expect(dayTargets({ ...base, weightKg: 50, heightCm: 170, goal: 'lose' }).goal).toBe('maintain');
    expect(dayTargets({ ...base, goal: 'lose', blockDeficit: true }).goal).toBe('maintain');
  });
});

describe('macros', () => {
  it('proteína 1,6 g/kg (1,8 em déficit); gordura 27,5%; carboidratos o resto', () => {
    const t = dayTargets(base);
    expect(t.protein).toBe(Math.round(1.6 * 65));
    expect(t.fat).toBe(Math.round((t.kcal * 0.275) / 9));
    expect(t.carbs).toBe(Math.round((t.kcal - t.protein * 4 - t.fat * 9) / 4));
    expect(dayTargets({ ...base, goal: 'lose' }).protein).toBe(Math.round(1.8 * 65));
  });

  it('com IMC ≥ 30 a proteína usa o peso de referência (IMC 25)', () => {
    expect(proteinWeight(100, 170)).toBeCloseTo(25 * 1.7 * 1.7);
    expect(proteinWeight(65, 170)).toBe(65);
  });

  it('divide entre as refeições do dia somando o total', () => {
    const split = splitTargets({ kcal: 2000, protein: 120, carbs: 230, fat: 60 }, ['breakfast', 'lunch', 'afternoonSnack', 'dinner']);
    expect(split.lunch.protein).toBe(Math.round(120 * (0.3 / 0.9)));
    const sum = Object.values(split).reduce((s, t) => s + t.protein, 0);
    expect(Math.abs(sum - 120)).toBeLessThanOrEqual(2);
  });
});
