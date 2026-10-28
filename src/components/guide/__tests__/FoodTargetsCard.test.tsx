import { render, screen } from '@testing-library/react-native';

import { strings } from '@/i18n/strings';
import { emptyProfile, type Profile } from '@/profile/profile';

import { FoodTargetsCard } from '../FoodTargetsCard';

const r = strings.result;
const base: Profile = { ...emptyProfile(), weightKg: 65, heightCm: 170, birthDate: '1996-05-10', daysPerWeek: 3 };

describe('metas de comida no resultado do Guia', () => {
  it('proteína e carboidratos, com a frase de metas iniciais', async () => {
    await render(<FoodTargetsCard profile={base} />);
    expect(screen.getByText(r.foodTitle)).toBeOnTheScreen();
    expect(screen.getByText(strings.meals.protein)).toBeOnTheScreen();
    expect(screen.queryByText(strings.meals.energy)).toBeNull();
    expect(screen.getByText(r.foodNote)).toBeOnTheScreen();
  });

  it('modo "Tudo" mostra energia; "Sem números" fala em porções com a mão', async () => {
    await render(<FoodTargetsCard profile={{ ...base, numbersMode: 'all' }} />);
    expect(screen.getByText(strings.meals.energy)).toBeOnTheScreen();
    await render(<FoodTargetsCard profile={{ ...base, numbersMode: 'none' }} />);
    expect(screen.getByText(r.foodHands)).toBeOnTheScreen();
  });

  it('sem altura e peso, não mostra nada', async () => {
    await render(<FoodTargetsCard profile={emptyProfile()} />);
    expect(screen.queryByText(r.foodTitle)).toBeNull();
  });
});
