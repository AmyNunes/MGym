import { usesEstrogen, type Profile } from '@/profile/profile';

/**
 * O que esperar (seção 11.6): linha do tempo honesta, adaptada ao objetivo e ao tempo de
 * terapia hormonal. Os textos ficam em `strings.expectations`.
 */

export const EXPECTATION_ROWS = ['strength', 'muscle', 'silhouette', 'fatLoss', 'hrtFat', 'hrtMuscle', 'hrtCardio'] as const;
export type ExpectationRow = (typeof EXPECTATION_ROWS)[number];

/** Janela (em meses de terapia) em que cada efeito acontece, para marcar "você está nessa fase". */
const HRT_WINDOWS: Partial<Record<ExpectationRow, [number, number]>> = {
  hrtFat: [3, 60],
  hrtMuscle: [3, 24],
  hrtCardio: [0, 4],
};

export type Expectation = { row: ExpectationRow; now: boolean };

export function expectations(profile: Pick<Profile, 'goal' | 'weightGoal' | 'hrt' | 'hrtMonths'>): Expectation[] {
  const hrt = usesEstrogen(profile);
  const losing = profile.weightGoal === 'lose' || profile.goal === 'loseFat';
  return EXPECTATION_ROWS.filter((row) => {
    if (row === 'fatLoss') return losing;
    if (row in HRT_WINDOWS) return hrt;
    return true;
  }).map((row) => {
    const window = HRT_WINDOWS[row];
    const months = profile.hrtMonths;
    return { row, now: window != null && months != null && months >= window[0] && months <= window[1] };
  });
}
