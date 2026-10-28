import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import TodayScreen from '@/../app/(tabs)/index';
import MealsScreen from '@/../app/(tabs)/meals';
import ShoppingScreen from '@/../app/meals/shopping';
import { QuickAddHost } from '@/components/navigation/QuickAdd';
import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { entriesForDate, shoppingList } from '@/db/mealsRepo';
import { strings } from '@/i18n/strings';
import { emptyProfile, type Profile } from '@/profile/profile';
import { useFoods } from '@/stores/foodsStore';
import { useProfile } from '@/stores/profileStore';
import { openQuickAdd, useQuickAdd } from '@/stores/quickAddStore';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));
// Começar treino (start.ts) para o descanso; o módulo de notificações não roda no Jest.
jest.mock('@/notifications/rest', () => ({ scheduleRestEnd: jest.fn(async () => 'n1'), cancelRestEnd: jest.fn(async () => {}) }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  Stack: { Screen: () => null },
  useIsFocused: () => true,
  useFocusEffect: () => undefined,
}));
jest.mock('@/features/settings/useAiConfigured', () => ({ isAiConfigured: async () => false }));
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (visible ? children : null),
}));

const m = strings.meals;
const profile: Profile = {
  ...emptyProfile(),
  weightKg: 65,
  heightCm: 170,
  birthDate: '1996-05-10',
  hrt: 'estrogen',
  hrtMonths: 12,
  daysPerWeek: 3,
  weightGoal: 'maintain',
  mealsPerDay: 4,
};

beforeEach(() => {
  mockDb.reset();
  useFoods.setState({ foods: new Map(), portions: new Map(), loaded: false });
  jest.useFakeTimers({ doNotFake: ['setTimeout', 'setInterval', 'setImmediate', 'nextTick', 'queueMicrotask'] });
  jest.setSystemTime(new Date(2026, 9, 26, 15));
});
afterEach(() => jest.useRealTimers());

const wrap = (ui: React.ReactElement) => render(<GestureHandlerRootView>{ui}</GestureHandlerRootView>);

describe('Cardápio', () => {
  it('mostra as refeições do dia com opções e marca "Comi"', async () => {
    useProfile.setState({ profile, completed: true, loaded: true });
    await wrap(<MealsScreen />);
    expect(m.slotTitle(m.slots.breakfast, '07:30')).toBe('Café da manhã · 7h30');
    expect(await screen.findByText(m.slotTitle(m.slots.breakfast, '07:30'), {}, { timeout: 15000 })).toBeOnTheScreen();
    expect(screen.getAllByLabelText(m.option(1, 3)).length).toBeGreaterThan(0);
    fireEvent.press(screen.getAllByRole('button', { name: m.ate })[0]);
    expect((await screen.findAllByText(m.ateDone)).length).toBe(2);
    expect(await entriesForDate('2026-10-26')).toHaveLength(1);
  });

  it('sem altura, nascimento e peso: pede o Guia', async () => {
    useProfile.setState({ profile: emptyProfile(), completed: false, loaded: true });
    await wrap(<MealsScreen />);
    expect(await screen.findByText(m.needsProfile)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: m.answerGuide })).toBeOnTheScreen();
  });
});

describe('Lista de compras', () => {
  it('gera por seção do mercado e marca como comprado', async () => {
    useProfile.setState({ profile, completed: true, loaded: true });
    await wrap(<ShoppingScreen />);
    expect(await screen.findByText(strings.shopping.empty)).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: strings.shopping.generate }));
    expect(await screen.findByText(strings.shopping.sections.produce, {}, { timeout: 15000 })).toBeOnTheScreen();
    const items = await shoppingList();
    expect(items.length).toBeGreaterThan(5);
    fireEvent.press(screen.getAllByRole('checkbox')[0]);
    expect(await screen.findByText(strings.shopping.progress(1, items.length))).toBeOnTheScreen();
  });
});

describe('Hoje e o +', () => {
  it('Hoje mostra o cartão do cardápio com a próxima refeição', async () => {
    useProfile.setState({ profile, completed: true, loaded: true });
    await wrap(<TodayScreen />);
    expect(await screen.findByText(m.todayCard, {}, { timeout: 15000 })).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: /^Próxima: Lanche da tarde das 16h · 3 opções$/ })).toBeOnTheScreen();
  });

  it('+ › Marcar refeição marca a refeição em 1 toque', async () => {
    useProfile.setState({ profile, completed: true, loaded: true });
    openQuickAdd('meal');
    await wrap(<QuickAddHost />);
    fireEvent.press(await screen.findByRole('button', { name: new RegExp('^' + m.slotTitle(m.slots.lunch, '12:30')) }, { timeout: 15000 }));
    await waitFor(async () => expect(await entriesForDate('2026-10-26')).toHaveLength(1));
    expect(useQuickAdd.getState().sheet).toBeNull();
  });
});
