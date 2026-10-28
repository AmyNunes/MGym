import { hideRestCountdown, showRestCountdown } from '@/notifications/restCountdown';

import { skipRest, startRest } from '../restStore';
import { useSettings } from '../settingsStore';

jest.mock('@/db/settingsRepo', () => ({ writeSetting: jest.fn(async () => {}), readSetting: async () => null, readAllSettings: async () => ({}) }));
jest.mock('@/notifications/rest', () => ({ scheduleRestEnd: jest.fn(async () => 'n1'), cancelRestEnd: jest.fn(async () => {}) }));
jest.mock('@/notifications/restCountdown', () => ({ showRestCountdown: jest.fn(), hideRestCountdown: jest.fn() }));

const show = showRestCountdown as jest.Mock;
const hide = hideRestCountdown as jest.Mock;

beforeEach(() => {
  show.mockClear();
  hide.mockClear();
});

describe('contagem do descanso na notificação', () => {
  it('começa com o descanso e some ao pular', async () => {
    await startRest(90, 2, 'Hip thrust');
    expect(show).toHaveBeenCalled();
    const [endsAt, , body] = show.mock.calls.at(-1) as [number, string, string];
    expect(endsAt).toBeGreaterThan(Date.now() + 80_000);
    expect(body).toContain('Hip thrust');
    await skipRest();
    expect(hide).toHaveBeenCalled();
  });

  it('com "Fim do descanso" desligado na Central, não aparece', async () => {
    await useSettings.getState().update('notifications', { rest: { enabled: false } });
    await startRest(60, 1, 'Agachamento');
    expect(show).not.toHaveBeenCalled();
    await useSettings.getState().update('notifications', { rest: { enabled: true } });
  });
});
