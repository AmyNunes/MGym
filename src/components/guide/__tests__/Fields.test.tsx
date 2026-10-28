import { fireEvent, render, screen } from '@testing-library/react-native';

import { DateField } from '../Fields';

describe('DateField', () => {
  it('digitando só os números, as barras entram sozinhas e a data é salva', async () => {
    const onChange = jest.fn();
    await render(<DateField label="Data de nascimento" value={null} onChange={onChange} />);
    await fireEvent.changeText(screen.getByLabelText('Data de nascimento'), '22111999');
    expect(screen.getByDisplayValue('22/11/1999')).toBeOnTheScreen();
    expect(onChange).toHaveBeenLastCalledWith('1999-11-22');
  });

  it('enquanto a data está pela metade, não salva nada', async () => {
    const onChange = jest.fn();
    await render(<DateField label="Data de nascimento" value={null} onChange={onChange} />);
    await fireEvent.changeText(screen.getByLabelText('Data de nascimento'), '2211');
    expect(screen.getByDisplayValue('22/11')).toBeOnTheScreen();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('apagar tudo tira a data', async () => {
    const onChange = jest.fn();
    await render(<DateField label="Data de nascimento" value="1999-11-22" onChange={onChange} />);
    await fireEvent.changeText(screen.getByLabelText('Data de nascimento'), '');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
