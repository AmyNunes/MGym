import { countHardSets, setWeights, tonnage, volumeByGroup } from '../volume';

const hipThrust = { primary: ['gluteMax'] as const, secondary: ['hamstrings', 'adductors'] as const };
const bulgarian = { primary: ['quads', 'gluteMax', 'adductors'] as const, secondary: [] as const };
const abduction = { primary: ['gluteMed', 'gluteMax'] as const, secondary: [] as const };
const done = 'x';

describe('setWeights', () => {
  it('principal conta 1 e secundário 0,5; adutores não têm meta', () => {
    expect(setWeights({ primary: [...hipThrust.primary], secondary: [...hipThrust.secondary] })).toEqual({
      glutes: 1,
      hamstrings: 0.5,
    });
  });

  it('dois músculos do mesmo grupo contam uma vez só', () => {
    expect(setWeights({ primary: [...abduction.primary], secondary: [] })).toEqual({ glutes: 1 });
  });
});

describe('volumeByGroup', () => {
  it('soma séries por grupo', () => {
    const volume = volumeByGroup([
      { exercise: { primary: [...hipThrust.primary], secondary: [...hipThrust.secondary] }, sets: 4 },
      { exercise: { primary: [...bulgarian.primary], secondary: [] }, sets: 3 },
    ]);
    expect(volume.glutes).toBe(7);
    expect(volume.quads).toBe(3);
    expect(volume.hamstrings).toBe(2);
    expect(volume.chest).toBe(0);
  });
});

describe('séries e volume em kg', () => {
  const sets = [
    { kind: 'warmup' as const, completedAt: done, weightKg: 30, reps: 8 },
    { kind: 'normal' as const, completedAt: done, weightKg: 60, reps: 10 },
    { kind: 'drop' as const, completedAt: done, weightKg: 40, reps: 12 },
    { kind: 'normal' as const, completedAt: null, weightKg: 60, reps: 10 },
  ];

  it('só séries difíceis concluídas contam', () => {
    expect(countHardSets(sets)).toBe(2);
    expect(tonnage(sets)).toBe(60 * 10 + 40 * 12);
  });
});
