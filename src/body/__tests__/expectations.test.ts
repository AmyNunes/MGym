import { emptyProfile } from '@/profile/profile';

import { expectations } from '../expectations';

describe('o que esperar', () => {
  it('sem terapia hormonal e sem perder peso: só treino', () => {
    expect(expectations(emptyProfile()).map((e) => e.row)).toEqual(['strength', 'muscle', 'silhouette']);
  });

  it('com estrogênio há 6 meses: linhas da terapia, marcando a fase atual', () => {
    const rows = expectations({ ...emptyProfile(), hrt: 'estrogen', hrtMonths: 6, weightGoal: 'lose' });
    expect(rows.map((e) => e.row)).toEqual(['strength', 'muscle', 'silhouette', 'fatLoss', 'hrtFat', 'hrtMuscle', 'hrtCardio']);
    expect(rows.filter((e) => e.now).map((e) => e.row)).toEqual(['hrtFat', 'hrtMuscle']);
  });
});
