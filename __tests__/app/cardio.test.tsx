import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { CardioSheet } from '@/components/cardio/CardioSheet';
import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { cardioSince } from '@/db/cardioRepo';
import { strings } from '@/i18n/strings';
import { emptyProfile } from '@/profile/profile';
import { useProfile } from '@/stores/profileStore';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (visible ? children : null),
}));

const c = strings.cardio;

beforeEach(() => {
  mockDb.reset();
  useProfile.setState({ profile: emptyProfile() });
});

describe('registro de cardio', () => {
  it('escolhe tipo e minutos sem digitar e salva', async () => {
    const onClose = jest.fn();
    await render(<CardioSheet visible onClose={onClose} />);
    await fireEvent.press(screen.getByRole('button', { name: c.kinds.bike }));
    await fireEvent.press(screen.getByRole('button', { name: c.minutesValue(45) }));
    await act(async () => fireEvent.press(screen.getByRole('button', { name: c.save })));

    const saved = await cardioSince('2000-01-01T00:00:00.000Z');
    expect(saved).toMatchObject([{ kind: 'bike', minutes: 45 }]);
    expect(onClose).toHaveBeenCalled();
  });

  it('em recuperação de vaginoplastia: sem bicicleta e com o aviso', async () => {
    useProfile.setState({ profile: { ...emptyProfile(), surgery: { kind: 'vaginoplasty', date: null, clearedOn: null } } });
    await render(<CardioSheet visible onClose={jest.fn()} />);
    expect(screen.queryByRole('button', { name: c.kinds.bike })).toBeNull();
    expect(screen.getByText(c.recoveryTip)).toBeOnTheScreen();
  });
});
