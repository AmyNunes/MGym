import { render, screen } from '@testing-library/react-native';

import { strings } from '@/i18n/strings';

import { MuscleMap } from '../MuscleMap';

describe('MuscleMap', () => {
  it('descreve os músculos para o leitor de tela', async () => {
    await render(<MuscleMap primary={['gluteMax']} secondary={['hamstrings']} />);
    expect(
      screen.getByLabelText(strings.muscleMap.label(strings.muscles.gluteMax, strings.muscles.hamstrings)),
    ).toBeOnTheScreen();
  });

  it('mostra "Frente" e "Costas" quando pedido', async () => {
    await render(<MuscleMap primary={['chest']} labels />);
    expect(screen.getByText(strings.muscleMap.front)).toBeOnTheScreen();
    expect(screen.getByText(strings.muscleMap.back)).toBeOnTheScreen();
  });
});
