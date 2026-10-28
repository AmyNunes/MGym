import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import TodayScreen from '@/../app/(tabs)/index';
import ProgressScreen from '@/../app/(tabs)/progress';
import CheckinScreen from '@/../app/checkin';
import MeasureScreen from '@/../app/progress/measure';
import { QuickAddHost } from '@/components/navigation/QuickAdd';
import { insertWeight, listMeasurements, listWeights } from '@/db/bodyRepo';
import { checkinForWeek } from '@/db/checkinsRepo';
import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { createPlanFromProfile } from '@/features/plan/fromProfile';
import { strings } from '@/i18n/strings';
import { emptyProfile, type Profile } from '@/profile/profile';
import { useFoods } from '@/stores/foodsStore';
import { useProfile } from '@/stores/profileStore';
import { openQuickAdd } from '@/stores/quickAddStore';

const mockDb = memoryDbHolder();
const mockBack = jest.fn();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));
// Começar treino (start.ts) para o descanso; o módulo de notificações não roda no Jest.
jest.mock('@/notifications/rest', () => ({ scheduleRestEnd: jest.fn(async () => 'n1'), cancelRestEnd: jest.fn(async () => {}) }));
jest.mock('@/db/profileRepo', () => ({ saveProfile: jest.fn(async () => {}), getProfile: async () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: () => mockBack() },
  Stack: { Screen: () => null },
  useIsFocused: () => true,
}));
jest.mock('@/features/settings/useAiConfigured', () => ({ isAiConfigured: async () => false }));
jest.mock('@/components/muscles/MuscleMap', () => ({ MuscleMap: () => null }));
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (visible ? children : null),
}));

const profile: Profile = {
  ...emptyProfile(),
  goal: 'feminineShape',
  experience: 'beginner',
  daysPerWeek: 3,
  sessionMinutes: 60,
  weightKg: 65,
  heightCm: 170,
  birthDate: '1996-05-10',
};
const wrap = (ui: React.ReactElement) => render(<GestureHandlerRootView>{ui}</GestureHandlerRootView>);

beforeEach(() => {
  mockDb.reset();
  mockBack.mockClear();
  useFoods.setState({ foods: new Map(), portions: new Map(), loaded: false });
  useProfile.setState({ profile, completed: true, loaded: true });
});

async function weighDays() {
  const kgs = [66, 64.6, 65.8, 64.4, 65.5, 64.2, 65.2, 64.1];
  for (let i = 0; i < kgs.length; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (kgs.length - 1 - i));
    d.setHours(9, 0, 0, 0);
    await insertWeight(kgs[i], d.toISOString());
  }
}

describe('Evolução', () => {
  it('mostra a tendência suave do peso e o ritmo da semana', async () => {
    await weighDays();
    await wrap(<ProgressScreen />);
    expect(await screen.findByText(strings.evolution.weightTitle, {}, { timeout: 15000 })).toBeOnTheScreen();
    // A tendência fica perto de 65,4 (não segue o sobe-e-desce de 64,1 a 66).
    expect(screen.getByText(/^65,\d kg$/)).toBeOnTheScreen();
    expect(screen.getByText(/kg por semana/)).toBeOnTheScreen();
  });

  it('"Esconder meu peso" tira o peso da Evolução', async () => {
    await weighDays();
    useProfile.setState({ profile: { ...profile, weightVisibility: 'hide' } });
    await wrap(<ProgressScreen />);
    expect(await screen.findByText(strings.evolution.measuresTitle, {}, { timeout: 15000 })).toBeOnTheScreen();
    expect(screen.queryByText(strings.evolution.weightTitle)).toBeNull();
  });

  it('com o peso escondido, Hoje também não mostra o peso', async () => {
    await weighDays();
    useProfile.setState({ profile: { ...profile, weightVisibility: 'hide' } });
    await wrap(<TodayScreen />);
    expect(await screen.findByText(strings.meals.todayCard, {}, { timeout: 15000 })).toBeOnTheScreen();
    expect(screen.queryByText(strings.evolution.weightTitle)).toBeNull();
  });

  it('só a direção: sem número de peso', async () => {
    await weighDays();
    useProfile.setState({ profile: { ...profile, weightVisibility: 'direction' } });
    await wrap(<ProgressScreen />);
    expect(await screen.findByText(/^Tendência: /, {}, { timeout: 15000 })).toBeOnTheScreen();
    expect(screen.queryByText(/^\d+,\d kg$/)).toBeNull();
  });
});

describe('registro rápido', () => {
  it('+ › Peso pelo teclado', async () => {
    openQuickAdd('weight');
    await wrap(<QuickAddHost />);
    for (const key of ['6', '4', strings.workout.pad.decimal, '8']) await fireEvent.press(screen.getByRole('button', { name: key }));
    await act(async () => fireEvent.press(screen.getByRole('button', { name: strings.workout.pad.done })));
    await waitFor(async () => expect((await listWeights()).map((w) => w.kg)).toEqual([64.8]));
  });
});

describe('medidas', () => {
  it('mede a cintura com o guia: duas leituras viram a média', async () => {
    await wrap(<MeasureScreen />);
    expect(screen.getByText(strings.measures.where.waist)).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText(strings.measures.reading1), '80,2');
    await fireEvent.changeText(screen.getByLabelText(strings.measures.reading2), '80,6');
    expect(screen.getByText(strings.measures.average('80,4'))).toBeOnTheScreen();
    for (let i = 0; i < profile.measureSites.length - 1; i++) await fireEvent.press(screen.getByRole('button', { name: strings.measures.skip }));
    await act(async () => fireEvent.press(screen.getByRole('button', { name: strings.measures.save })));
    expect((await listMeasurements())[0].values).toEqual({ waist: 80.4 });
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('check-in', () => {
  it('números, como foi, decisões; confirmar a semana leve', async () => {
    await createPlanFromProfile(profile);
    await wrap(<CheckinScreen />);
    expect(await screen.findByText(strings.checkin.numbersTitle, {}, { timeout: 15000 })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: strings.checkin.next }));
    await fireEvent.press(screen.getByRole('button', { name: strings.checkin.ratingValue('Energia', 1) }));
    await fireEvent.press(screen.getByRole('button', { name: strings.checkin.ratingValue('Sono', 2) }));
    await fireEvent.press(screen.getByRole('button', { name: strings.checkin.next }));
    expect(screen.getByText(strings.checkin.decisions.deload.title)).toBeOnTheScreen();
    await act(async () => fireEvent(screen.getByLabelText(strings.checkin.decisions.deload.title), 'valueChange', true));
    await act(async () => fireEvent.press(screen.getByRole('button', { name: strings.checkin.save })));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    const { weekKey } = jest.requireActual<typeof import('@/training/schedule')>('@/training/schedule');
    const saved = await checkinForWeek(weekKey(new Date()));
    expect(saved?.answers.ratings).toEqual({ energy: 1, sleep: 2 });
    expect(saved?.decisions.find((d) => d.kind === 'deload')?.accepted).toBe(true);
  });
});
