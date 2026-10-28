import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';

import GuideStepScreen from '@/../app/guide/[step]';
import GuideResultScreen from '@/../app/guide/result';
import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { getActivePlan } from '@/db/plansRepo';
import { getProfile } from '@/db/profileRepo';
import { strings } from '@/i18n/strings';
import { emptyProfile } from '@/profile/profile';
import { useProfile } from '@/stores/profileStore';

const mockDb = memoryDbHolder();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDismissTo = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    router: {
      push: (p: string) => mockPush(p),
      replace: (p: string) => mockReplace(p),
      dismissTo: (p: string) => mockDismissTo(p),
      back: jest.fn(),
    },
    Stack: { Screen: () => null },
    useLocalSearchParams: () => mockParams,
    useIsFocused: () => true,
    useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]),
  };
});
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (visible ? children : null),
}));

const g = strings.guide;

beforeEach(() => {
  mockDb.reset();
  mockPush.mockClear();
  mockReplace.mockClear();
  mockDismissTo.mockClear();
  useProfile.setState({ profile: emptyProfile(), completed: false, loaded: true });
});

describe('Guia', () => {
  it('pergunta obrigatória: "Continuar" só depois de escolher, e a resposta fica salva', async () => {
    mockParams = { step: 'goal' };
    await render(<GuideStepScreen />);
    expect(screen.getByRole('button', { name: g.continue })).toBeDisabled();

    await act(async () => fireEvent.press(screen.getByRole('radio', { name: /Silhueta mais feminina/ })));
    await fireEvent.press(screen.getByRole('button', { name: g.continue }));

    expect(mockPush).toHaveBeenCalledWith('/guide/priorities');
    expect((await getProfile())?.answers.goal).toBe('feminineShape');
  });

  it('opcional tem "Pular"', async () => {
    mockParams = { step: 'context' };
    await render(<GuideStepScreen />);
    await fireEvent.press(screen.getByRole('button', { name: g.skip }));
    expect(mockPush).toHaveBeenCalledWith('/guide/hrt');
  });

  it('prioridades: cada opção diz o que muda, marca e desmarca', async () => {
    mockParams = { step: 'priorities' };
    await render(<GuideStepScreen />);
    expect(screen.getByText(g.steps.priorities.help)).toBeOnTheScreen();
    expect(screen.getByText(g.options.prioritiesHelp.legs)).toBeOnTheScreen();
    const legs = screen.getByRole('checkbox', { name: `${g.options.priorities.legs}, ${g.options.prioritiesHelp.legs}` });
    await act(async () => fireEvent.press(legs));
    expect(useProfile.getState().profile.priorities).toEqual(['legs']);
    expect(legs).toBeChecked();
    await act(async () => fireEvent.press(legs));
    expect(useProfile.getState().profile.priorities).toEqual([]);
  });

  it('contexto: tem mulher e homem, cis e trans, e a escolha fica salva', async () => {
    mockParams = { step: 'context' };
    await render(<GuideStepScreen />);
    for (const label of [g.options.context.cisWoman, g.options.context.cisMan, g.options.context.transWoman, g.options.context.transMan]) {
      expect(screen.getByRole('radio', { name: label })).toBeOnTheScreen();
    }
    await act(async () => fireEvent.press(screen.getByRole('radio', { name: g.options.context.cisWoman })));
    expect(useProfile.getState().profile.context).toBe('cisWoman');
  });

  it('a última pergunta monta o plano e abre o resultado', async () => {
    useProfile.setState({
      profile: { ...emptyProfile(), goal: 'feminineShape', experience: 'beginner', daysPerWeek: 3, sessionMinutes: 60, limitations: ['knee'] },
    });
    mockParams = { step: 'potassium' };
    await render(<GuideStepScreen />);
    await act(async () => fireEvent.press(screen.getByRole('button', { name: g.skip })));

    expect(mockReplace).toHaveBeenCalledWith('/guide/result');
    const plan = await getActivePlan();
    expect(plan?.template).toBe('fullBodyAB');
    expect((await getProfile())?.completedAt).not.toBeNull();
  });
});

describe('Resultado do Guia: o Guia já terminou, não dá para voltar às perguntas', () => {
  it('"Começar" vai para Hoje e fecha as perguntas', async () => {
    await render(<GuideResultScreen />);
    await act(async () => fireEvent.press(screen.getByRole('button', { name: strings.result.start })));
    expect(mockDismissTo).toHaveBeenCalledWith('/');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('o "voltar" do Android (botão ou gesto) também vai para Hoje', async () => {
    type BackListener = Parameters<typeof BackHandler.addEventListener>[1];
    let onBack: BackListener | null = null;
    const spy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
      onBack = handler;
      return { remove: jest.fn() };
    });
    await render(<GuideResultScreen />);
    expect(onBack).not.toBeNull();
    let handled: ReturnType<BackListener> | undefined;
    await act(async () => {
      handled = onBack?.({ type: 'hardwareBackPress', timeStamp: Date.now() });
    });
    expect(handled).toBe(true);
    expect(mockDismissTo).toHaveBeenCalledWith('/');
    spy.mockRestore();
  });
});
