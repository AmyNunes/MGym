import { act, fireEvent, render, screen } from '@testing-library/react-native';

import DataSettingsScreen from '@/../app/settings/data';
import { pickBackup, restoreBackup, wipeEverything, wipeWeightHistory } from '@/features/data/backupService';
import { strings } from '@/i18n/strings';
import { useSnackbar } from '@/stores/snackbarStore';

const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({
  router: { dismissTo: (p: string) => mockDismissTo(p) },
  Stack: { Screen: () => null },
  useIsFocused: () => true,
}));
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (visible ? children : null),
}));
jest.mock('@/features/data/backupService', () => ({
  exportBackup: jest.fn(async () => {}),
  lastBackupAt: async () => null,
  pickBackup: jest.fn(),
  restoreBackup: jest.fn(),
  wipeEverything: jest.fn(),
  wipeWeightHistory: jest.fn(),
}));

const d = strings.settings.data;
const fail = async () => {
  throw new Error('falhou');
};

beforeEach(() => {
  mockDismissTo.mockClear();
  useSnackbar.setState({ current: null });
});

describe('Dados: quando algo dá errado, a tela avisa', () => {
  it('importar', async () => {
    (pickBackup as jest.Mock).mockResolvedValue({ app: 'mgym', format: 1, schemaVersion: 7, exportedAt: '2026-10-20T12:00:00.000Z', tables: {} });
    (restoreBackup as jest.Mock).mockImplementation(fail);
    await render(<DataSettingsScreen />);
    await act(async () => fireEvent.press(screen.getByRole('button', { name: new RegExp(`^${d.import}`) })));
    await act(async () => fireEvent.press(screen.getByRole('button', { name: d.replace })));
    expect(useSnackbar.getState().current?.message).toBe(d.importFailed);
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it('apagar tudo', async () => {
    (wipeEverything as jest.Mock).mockImplementation(fail);
    await render(<DataSettingsScreen />);
    await act(async () => fireEvent.press(screen.getByRole('button', { name: new RegExp(`^${d.wipe},`) })));
    await fireEvent.changeText(screen.getByLabelText(d.wipeField), d.wipeWord);
    await act(async () => fireEvent.press(screen.getByRole('button', { name: d.wipeConfirm })));
    expect(useSnackbar.getState().current?.message).toBe(d.wipeFailed);
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it('apagar o histórico de peso', async () => {
    (wipeWeightHistory as jest.Mock).mockImplementation(fail);
    await render(<DataSettingsScreen />);
    await act(async () => fireEvent.press(screen.getByRole('button', { name: new RegExp(`^${d.weights}`) })));
    await act(async () => fireEvent.press(screen.getByRole('button', { name: d.weightsConfirm })));
    expect(useSnackbar.getState().current?.message).toBe(d.weightsFailed);
  });
});
