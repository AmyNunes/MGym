import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { getActivePlan, savePlan } from '@/db/plansRepo';
import { ask, currentConversation } from '@/features/coach/coachService';
import { allowedCatalog, applyPlanSuggestion, suggestPlanChanges } from '@/features/plan/aiAdjust';
import { emptyProfile, type Profile } from '@/profile/profile';
import { useProfile } from '@/stores/profileStore';
import { latestConversation } from '@/db/coachRepo';
import type { CheckinStats } from '@/features/checkin/model';

import { callAI } from '../client';
import { mentionsAlert } from '../functions/coach';
import { weekFacts } from '../functions/weeklySummary';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));
jest.mock('@/db/profileRepo', () => ({ saveProfile: jest.fn(async () => {}), getProfile: async () => null }));
jest.mock('../client', () => ({ callAI: jest.fn() }));

const mockCall = callAI as jest.MockedFunction<typeof callAI>;
const reply = (data: unknown) => mockCall.mockResolvedValueOnce({ data, model: 'm', usage: { inputTokens: 1, outputTokens: 1, estimatedCost: 0 } } as never);

const profile: Profile = { ...emptyProfile(), goal: 'feminineShape', experience: 'beginner', daysPerWeek: 3, limitations: ['knee'] };
const planned = (exerciseId: string, sets = 3) => ({ exerciseId, sets, repMin: 8, repMax: 12, restSec: 120 });

beforeEach(async () => {
  mockDb.reset();
  mockCall.mockReset();
  useProfile.setState({ profile, completed: true, loaded: true });
  await savePlan({
    template: 'fullBodyLean',
    createdAt: '2026-10-26T10:00:00.000Z',
    targets: {},
    days: [{ name: 'Inferior A', exercises: [planned('back-squat', 4), planned('barbell-hip-thrust')], note: null }],
  });
});

describe('ajustar o plano com IA', () => {
  it('com limitação no joelho, o catálogo permitido não tem agachamento nem leg press', () => {
    const ids = allowedCatalog(profile).map((e) => e.id);
    expect(ids).not.toContain('leg-press-45');
    expect(ids).toContain('barbell-hip-thrust');
  });

  it('"trocar agachamento por algo sem joelho": só exercícios do catálogo permitido entram', async () => {
    const plan = await getActivePlan();
    const dayId = plan!.days[0].id;
    reply({
      explanationPt: 'Troquei o agachamento.',
      changes: [
        { action: 'replace', dayId, exerciseId: 'back-squat', replaceWithId: 'leg-press-45', reasonPt: 'Máquina' },
        { action: 'replace', dayId, exerciseId: 'back-squat', replaceWithId: 'exercicio-inventado', reasonPt: 'x' },
        { action: 'replace', dayId, exerciseId: 'back-squat', replaceWithId: 'glute-bridge', reasonPt: 'Sem joelho' },
        { action: 'remove', dayId: 'dia-inventado', exerciseId: 'barbell-hip-thrust', reasonPt: 'x' },
      ],
    });
    const suggestion = await suggestPlanChanges('trocar agachamento por algo sem joelho');
    expect(suggestion.changes).toHaveLength(1);
    expect(suggestion.dropped).toBe(3);
    await applyPlanSuggestion(suggestion);
    const after = await getActivePlan();
    // A troca mantém as 4 séries do agachamento.
    expect(after!.days[0].exercises.map((e) => [e.exerciseId, e.sets])).toEqual([
      ['glute-bridge', 4],
      ['barbell-hip-thrust', 3],
    ]);
  });
});

describe('perguntar à IA', () => {
  it('guarda a conversa, tira ids de fora do catálogo e marca sinais de alerta', async () => {
    reply({ replyPt: 'Procure ajuda.', suggestedExerciseIds: ['glute-bridge', 'leg-press-45', 'nada'], safetyFlag: false });
    const conversation = await currentConversation();
    const after = await ask(conversation, 'Senti dor no peito no treino, e agora?');
    const last = after.messages.at(-1);
    expect(last?.suggestedExerciseIds).toEqual(['glute-bridge']);
    expect(last?.safetyFlag).toBe(true);
    expect((await latestConversation())?.messages).toHaveLength(2);
  });

  it('a rede de segurança reconhece sinais em português', () => {
    expect(mentionsAlert('ando pulando refeições pra emagrecer')).toBe(true);
    expect(mentionsAlert('quanto descansar entre séries?')).toBe(false);
  });
});

describe('resumo da semana', () => {
  const stats: CheckinStats = {
    workouts: 3,
    planned: 3,
    glutes: 12,
    glutesGoal: 10,
    records: 1,
    cardioMinutes: 90,
    mealsMarkedPct: 70,
    weightRate: { kg: -0.2, pct: -0.3 },
    signals: [],
  };

  it('a IA recebe os números do aparelho; peso só com permissão', () => {
    expect(weekFacts(stats, { ratings: { energy: 4 } }, false)).not.toContain('peso');
    expect(weekFacts(stats, { ratings: {} }, true)).toContain('Tendência do peso: -0.2 kg');
    expect(weekFacts(stats, { ratings: { energy: 4 } }, false)).toContain('energia 4');
  });
});
