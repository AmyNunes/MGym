import { findExercise } from '../catalog';
import { isStalled, roundToStep, suggestNext, type PastSession } from '../progression';
import {
  deloadDue,
  effectiveItems,
  inEasyStart,
  isFirstCompoundOfGroup,
  isTrainingWeekday,
  nextPlanDayIndex,
  warmupLoads,
} from '../schedule';

const session = (sets: [number, number][], rir: number | null = null): PastSession => ({
  sets: sets.map(([weightKg, reps], i) => ({
    kind: 'normal' as const,
    weightKg,
    reps,
    rir: i === sets.length - 1 ? rir : null,
    completedAt: 'x',
  })),
});
const load = { tracking: 'load' as const };
const range = { repMin: 8, repMax: 12 };

describe('dupla progressão (9.4)', () => {
  it('todas no topo da faixa, sobrando ≤ 2 → sobe o menor incremento', () => {
    const s = suggestNext([session([[60, 12], [60, 12], [60, 12]], 2)], load, range, 5);
    expect(s).toEqual({ weightKg: 65, reps: 8, trend: 'up', stalled: false });
  });

  it('no topo mas sobrando 3 ou mais → mantém', () => {
    expect(suggestNext([session([[60, 12], [60, 12]], 3)], load, range, 5)?.trend).toBe('same');
  });

  it('abaixo da faixa por 2 treinos → baixa ~7,5%, arredondado ao incremento', () => {
    const s = suggestNext([session([[60, 7], [60, 6]]), session([[60, 7], [60, 6]])], load, range, 2.5);
    expect(s).toMatchObject({ weightKg: 55, trend: 'down' });
  });

  it('abaixo da faixa uma vez só → mantém a carga e tenta mais repetições', () => {
    const s = suggestNext([session([[60, 10]]), session([[60, 7], [60, 6]])], load, range, 2.5);
    expect(s).toMatchObject({ weightKg: 60, reps: 7, trend: 'same' });
  });

  it('sem histórico, sem sugestão; aquecimento não conta', () => {
    expect(suggestNext([], load, range, 2.5)).toBeNull();
    const warm: PastSession = { sets: [{ kind: 'warmup', weightKg: 100, reps: 12, rir: null, completedAt: 'x' }] };
    expect(suggestNext([warm], load, range, 2.5)).toBeNull();
  });

  it('travou: 3 treinos sem passar o melhor de antes', () => {
    const flat = [session([[60, 10]]), session([[60, 9]]), session([[60, 10]]), session([[60, 10]])];
    expect(isStalled(flat)).toBe(true);
    expect(isStalled([...flat.slice(0, 3), session([[62.5, 10]])])).toBe(false);
    expect(isStalled(flat.slice(0, 3))).toBe(false);
  });

  it('arredonda ao incremento', () => {
    expect(roundToStep(55.5, 2.5)).toBe(55);
    expect(roundToStep(56.4, 2.5)).toBe(57.5);
  });
});

describe('rodízio e semanas especiais', () => {
  it('o próximo dia é o seguinte ao último feito, dando a volta', () => {
    expect(nextPlanDayIndex(['a', 'b', 'c'], null)).toBe(0);
    expect(nextPlanDayIndex(['a', 'b', 'c'], 'b')).toBe(2);
    expect(nextPlanDayIndex(['a', 'b', 'c'], 'c')).toBe(0);
    expect(nextPlanDayIndex(['a', 'b'], 'outro-plano')).toBe(0);
  });

  it('dias da semana de treino', () => {
    expect(isTrainingWeekday([1, 3, 5], new Date(2026, 9, 26))).toBe(true);
    expect(isTrainingWeekday([1, 3, 5], new Date(2026, 9, 27))).toBe(false);
  });

  it('iniciante: 2 séries nas 2 primeiras semanas; deload e dia leve: metade', () => {
    const items = [{ exerciseId: 'x', sets: 4, repMin: 8, repMax: 12, restSec: 90 }];
    expect(effectiveItems(items, { easyStart: true, deload: false, light: false })[0].sets).toBe(2);
    expect(effectiveItems(items, { easyStart: false, deload: true, light: false })[0].sets).toBe(2);
    expect(effectiveItems([{ ...items[0], sets: 3 }], { easyStart: false, deload: false, light: true })[0].sets).toBe(2);
    expect(inEasyStart('2026-10-20T10:00:00.000Z', new Date('2026-10-30T10:00:00.000Z'))).toBe(true);
    expect(inEasyStart('2026-10-01T10:00:00.000Z', new Date('2026-10-30T10:00:00.000Z'))).toBe(false);
  });

  it('deload sugerido depois de 6 semanas do plano (ou do último)', () => {
    expect(deloadDue('2026-09-01T10:00:00.000Z', null, new Date('2026-10-20T10:00:00.000Z'))).toBe(true);
    expect(deloadDue('2026-10-01T10:00:00.000Z', null, new Date('2026-10-20T10:00:00.000Z'))).toBe(false);
    expect(deloadDue('2026-08-01T10:00:00.000Z', '2026-10-05', new Date('2026-10-20T10:00:00.000Z'))).toBe(false);
  });
});

describe('aquecimento (9.3)', () => {
  it('50% × 8, 70% × 4, 85% × 2, arredondado', () => {
    expect(warmupLoads(60, 2.5)).toEqual([
      { weightKg: 30, reps: 8 },
      { weightKg: 42.5, reps: 4 },
      { weightKg: 50, reps: 2 },
    ]);
  });

  it('só no primeiro composto de cada grupo', () => {
    const w = {
      exercises: ['back-squat', 'leg-press-45', 'barbell-hip-thrust', 'leg-extension'].map((exerciseId) => ({ exerciseId })),
    } as never;
    expect(isFirstCompoundOfGroup(w, 0, findExercise)).toBe(true);
    expect(isFirstCompoundOfGroup(w, 1, findExercise)).toBe(false);
    expect(isFirstCompoundOfGroup(w, 2, findExercise)).toBe(true);
    expect(isFirstCompoundOfGroup(w, 3, findExercise)).toBe(false);
  });
});
