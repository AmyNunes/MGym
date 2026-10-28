import { act, fireEvent, render, screen } from '@testing-library/react-native';

import ExplainScreen from '@/../app/exercises/[id]/explain';
import CoachScreen from '@/../app/coach';
import { AIError } from '@/ai/errors';
import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { strings } from '@/i18n/strings';
import { emptyProfile } from '@/profile/profile';
import { useProfile } from '@/stores/profileStore';

import { callAI } from '@/ai/client';

const mockDb = memoryDbHolder();
const mockPush = jest.fn();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));
jest.mock('@/ai/client', () => ({ callAI: jest.fn(), toAIError: jest.requireActual('@/ai/errors').toAIError }));
jest.mock('@/ai/cache', () => ({
  withCache: async (_f: string, _i: unknown, _s: unknown, compute: () => Promise<unknown>) => ({ data: await compute(), cached: false }),
}));
jest.mock('expo-router', () => ({
  router: { push: (p: string) => mockPush(p), back: jest.fn() },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: 'barbell-hip-thrust' }),
  useIsFocused: () => true,
}));

const mockCall = callAI as jest.MockedFunction<typeof callAI>;
const reply = (data: unknown) => mockCall.mockResolvedValueOnce({ data, model: 'm', usage: { inputTokens: 1, outputTokens: 1, estimatedCost: 0 } } as never);

beforeEach(() => {
  mockDb.reset();
  mockCall.mockReset();
  mockPush.mockClear();
  useProfile.setState({ profile: { ...emptyProfile(), goal: 'feminineShape' }, completed: true, loaded: true });
});

describe('Explicar com IA', () => {
  it('mostra o passo a passo e o que sentir', async () => {
    reply({
      overviewPt: 'Ponte com as costas no banco.',
      steps: [{ titlePt: 'Subir', instructionPt: 'Empurre o chão com os calcanhares.', feelPt: 'O glúteo apertando no topo.' }],
      mistakes: [{ mistakePt: 'Arquear a lombar', fixPt: 'Queixo para o peito' }],
      focusTipsPt: ['Pense em empurrar com os calcanhares'],
      safetyPt: 'Pare se doer a lombar.',
    });
    await render(<ExplainScreen />);
    expect(await screen.findByText(`${strings.ai.explain.feel}: O glúteo apertando no topo.`)).toBeOnTheScreen();
    expect(screen.getByText('Arquear a lombar')).toBeOnTheScreen();
  });

  it('sem IA configurada: explica e leva para Configurações', async () => {
    mockCall.mockRejectedValueOnce(new AIError('notConfigured'));
    await render(<ExplainScreen />);
    await act(async () => fireEvent.press(await screen.findByRole('button', { name: strings.ai.configure })));
    expect(mockPush).toHaveBeenCalledWith('/settings/ai');
  });

  it('sem conexão: mensagem amigável e "Tentar de novo"', async () => {
    mockCall.mockRejectedValueOnce(new AIError('offline'));
    await render(<ExplainScreen />);
    expect(await screen.findByText(strings.ai.errors.offline)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: strings.common.retry })).toBeOnTheScreen();
  });
});

describe('Perguntar à IA', () => {
  it('pergunta, resposta e o aviso quando aparece um sinal de alerta', async () => {
    reply({ replyPt: 'Pare o treino e procure atendimento.', suggestedExerciseIds: [], safetyFlag: false });
    await render(<CoachScreen />);
    await fireEvent.changeText(await screen.findByLabelText(strings.ai.coach.label), 'Senti dor no peito');
    await act(async () => fireEvent.press(screen.getByRole('button', { name: strings.ai.coach.send })));
    expect(await screen.findByText('Pare o treino e procure atendimento.')).toBeOnTheScreen();
    expect(screen.getByText(strings.ai.coach.safety)).toBeOnTheScreen();
  });
});
