import { act, fireEvent, render, screen } from '@testing-library/react-native';

import NutritionSettingsScreen from '@/../app/settings/nutrition';
import ProfileSettingsScreen from '@/../app/settings/profile';
import SourcesScreen from '@/../app/settings/sources';
import TrainingSettingsScreen from '@/../app/settings/training';
import SafetyScreen from '@/../app/safety';
import { answerSummary } from '@/features/guide/summary';
import { strings } from '@/i18n/strings';
import { emptyProfile } from '@/profile/profile';
import { useProfile } from '@/stores/profileStore';
import { useSettings } from '@/stores/settingsStore';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (p: string) => mockPush(p) }, Stack: { Screen: () => null } }));
jest.mock('@/db/settingsRepo', () => ({ writeSetting: jest.fn(async () => {}), readAllSettings: async () => ({}) }));
jest.mock('@/db/profileRepo', () => ({ saveProfile: jest.fn(async () => {}), getProfile: async () => null }));
jest.mock('@/features/meals/menuService', () => ({ updateWeekTargets: jest.fn(async () => {}), regenerateWeek: jest.fn(async () => {}) }));

beforeEach(() => mockPush.mockClear());

describe('Perfil', () => {
  it('resumos curtos das respostas', () => {
    const p = { ...emptyProfile(), daysPerWeek: 4, sessionMinutes: 60, hrt: 'estrogen' as const, hrtMonths: 14 };
    expect(answerSummary('schedule', p)).toBe('4 dias · 60 min');
    expect(answerSummary('hrt', p)).toBe('Estrogênio · 14 meses');
    expect(answerSummary('limitations', p)).toBe(strings.settings.profile.none);
  });

  it('tocar numa resposta abre a pergunta do Guia para editar', async () => {
    useProfile.setState({ profile: { ...emptyProfile(), goal: 'feminineShape' } });
    await render(<ProfileSettingsScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Objetivo, / }));
    expect(mockPush).toHaveBeenCalledWith('/guide/goal?edit=1');
  });
});

describe('Treino', () => {
  it('liga e desliga "quantas sobravam" e muda o incremento', async () => {
    useProfile.setState({ profile: { ...emptyProfile(), daysPerWeek: 3 } });
    await render(<TrainingSettingsScreen />);
    const t = strings.settings.training;
    await act(async () => fireEvent(screen.getByLabelText(t.askRir), 'valueChange', false));
    expect(useSettings.getState().workout.askRir).toBe(false);
    await act(async () => fireEvent.press(screen.getAllByRole('radio', { name: t.incrementValue('1') })[0]));
    expect(useSettings.getState().workout.incrementUpper).toBe(1);
  });
});

describe('Ajuda e segurança', () => {
  it('mostra os sinais para ligar ao SAMU e os contatos', async () => {
    useProfile.setState({ profile: emptyProfile() });
    await render(<SafetyScreen />);
    expect(screen.getByText(strings.safety.sections.emergency.items[0])).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: strings.safety.callSamu })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: strings.safety.callCvv })).toBeOnTheScreen();
    // 16.4, item 9: os sinais de risco com comida, peso e treino.
    expect(screen.getByText(strings.safety.sections.eating.items[0])).toBeOnTheScreen();
  });
});

describe('Alimentação', () => {
  const n = strings.settings.nutrition;

  it('mostra as respostas de comida e abre a pergunta para editar', async () => {
    useProfile.setState({ profile: { ...emptyProfile(), mealsPerDay: 4 } });
    await render(<NutritionSettingsScreen />);
    expect(screen.queryByRole('button', { name: /^Objetivo, / })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: /^Refeições, / }));
    expect(mockPush).toHaveBeenCalledWith('/guide/meals?edit=1');
  });

  it('modo da nutri: liga e mostra as metas para digitar', async () => {
    const profile = { ...emptyProfile(), weightKg: 65, heightCm: 170, birthDate: '1996-05-10' };
    useProfile.setState({ profile });
    await render(<NutritionSettingsScreen />);
    expect(screen.queryByText(n.nutriTargets)).toBeNull();
    await act(async () => fireEvent(screen.getByLabelText(n.nutriMode), 'valueChange', true));
    expect(useProfile.getState().profile.nutritionistMode).toBe(true);
    expect(await screen.findByLabelText(n.protein)).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText(n.protein), '140');
    await act(async () => fireEvent.press(screen.getByRole('button', { name: n.save })));
    expect(useProfile.getState().profile.nutriTargets?.protein).toBe(140);
  });
});

describe('Fontes dos dados', () => {
  it('cita a TACO e o IBGE', async () => {
    await render(<SourcesScreen />);
    expect(screen.getByText(strings.settings.sources.tacoTitle)).toBeOnTheScreen();
    expect(screen.getByText(strings.settings.sources.ibgeTitle)).toBeOnTheScreen();
  });
});
