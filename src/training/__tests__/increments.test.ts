import { findExercise } from '../catalog';
import { incrementFor } from '../increments';

describe('incrementFor', () => {
  it('5 kg em compostos de pernas, 2,5 kg nos demais', () => {
    expect(incrementFor(findExercise('back-squat')!)).toBe(5);
    expect(incrementFor(findExercise('barbell-hip-thrust')!)).toBe(5);
    expect(incrementFor(findExercise('leg-extension')!)).toBe(2.5);
    expect(incrementFor(findExercise('db-bench-press')!)).toBe(2.5);
  });
});
