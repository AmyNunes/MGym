import { fireEvent, render, screen } from '@testing-library/react-native';

import { strings } from '@/i18n/strings';

import { NumberPad } from '../NumberPad';

jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (visible ? children : null),
}));

const p = strings.workout.pad;
const request = { title: 'Agachamento · série 1', label: p.kg, value: 60, decimals: true, step: 2.5, same: null, hasNext: false };

describe('calculadora de anilhas no teclado', () => {
  it('mostra as anilhas por lado e acompanha o que digito', async () => {
    await render(<NumberPad request={{ ...request, barKg: 20 }} onClose={jest.fn()} onSubmit={jest.fn()} />);
    expect(screen.getByText(p.plates('20', '20'))).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: p.plusLabel('2,5') }));
    expect(screen.getByText(p.plates('20 + 1,25', '20'))).toBeOnTheScreen();
  });

  it('sem barra (máquina, halteres): não mostra', async () => {
    await render(<NumberPad request={request} onClose={jest.fn()} onSubmit={jest.fn()} />);
    expect(screen.queryByText(/Por lado/)).toBeNull();
  });
});
