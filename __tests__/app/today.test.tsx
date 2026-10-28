import { render, screen } from '@testing-library/react-native';

import TodayScreen from '@/../app/(tabs)/index';
import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { createPlanFromProfile } from '@/features/plan/fromProfile';
import { weekDots } from '@/features/today/week';
import { strings } from '@/i18n/strings';
import { emptyProfile, type Profile } from '@/profile/profile';
import { useProfile } from '@/stores/profileStore';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));
// Começar treino (start.ts) para o descanso; o módulo de notificações não roda no Jest.
jest.mock('@/notifications/rest', () => ({ scheduleRestEnd: jest.fn(async () => 'n1'), cancelRestEnd: jest.fn(async () => {}) }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useIsFocused: () => true,
}));
jest.mock('@/features/settings/useAiConfigured', () => ({ isAiConfigured: async () => false }));

const t = strings.today;
const profile: Profile = { ...emptyProfile(), goal: 'feminineShape', experience: 'beginner', daysPerWeek: 3, sessionMinutes: 60 };

beforeEach(() => {
  mockDb.reset();
  jest.useFakeTimers({ doNotFake: ['setTimeout', 'setInterval', 'setImmediate', 'nextTick', 'queueMicrotask'] });
});
afterEach(() => jest.useRealTimers());

async function renderOn(date: Date) {
  jest.setSystemTime(date);
  useProfile.setState({ profile, completed: true, loaded: true });
  await createPlanFromProfile(profile);
  await render(<TodayScreen />);
}

describe('Hoje', () => {
  it('dia de treino: mostra o dia do plano e "Começar treino"', async () => {
    await renderOn(new Date(2026, 9, 26, 10)); // segunda
    expect(await screen.findByText(/Hoje é dia de Corpo inteiro A · ~\d+ min/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: t.start })).toBeOnTheScreen();
  });

  it('dia de descanso: sugere caminhada e oferece cardio', async () => {
    await renderOn(new Date(2026, 9, 27, 10)); // terça
    expect(await screen.findByText(t.restDay)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: t.logCardio })).toBeOnTheScreen();
  });

  it('primeiro uso: os 3 passos', async () => {
    jest.setSystemTime(new Date(2026, 9, 26, 10));
    useProfile.setState({ profile: emptyProfile(), completed: false, loaded: true });
    await render(<TodayScreen />);
    expect(await screen.findByText(t.steps.guide)).toBeOnTheScreen();
    expect(screen.getByText(t.steps.ai)).toBeOnTheScreen();
  });
});

describe('Sua semana', () => {
  it('● treinou, ○ dia de treino, · descanso, começando na segunda', () => {
    const dots = weekDots(new Date(2026, 9, 28), ['2026-10-26'], [1, 3, 5]);
    expect(dots.map((d) => d.state)).toEqual(['done', 'rest', 'planned', 'rest', 'planned', 'rest', 'rest']);
    expect(dots.find((d) => d.today)?.key).toBe('2026-10-28');
  });
});
