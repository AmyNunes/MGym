import { insertWeight, listWeights } from '@/db/bodyRepo';
import { checkinForWeek } from '@/db/checkinsRepo';
import { getActivePlan } from '@/db/plansRepo';
import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { loadSafetyState } from '@/features/body/safetyState';
import { addWeight, syncFirstWeight } from '@/features/body/weightService';
import { createPlanFromProfile } from '@/features/plan/fromProfile';
import { emptyProfile, type Profile } from '@/profile/profile';
import { useFoods } from '@/stores/foodsStore';
import { useProfile } from '@/stores/profileStore';

import { checkinPending, decisionsFor, loadCheckinDraft, saveCheckin } from '../checkinService';
import { suggestDecisions } from '../decisions';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));
jest.mock('@/db/profileRepo', () => ({ saveProfile: jest.fn(async () => {}), getProfile: async () => null }));

const profile: Profile = {
  ...emptyProfile(),
  goal: 'feminineShape',
  experience: 'beginner',
  daysPerWeek: 4,
  sessionMinutes: 60,
  weightKg: 65,
  heightCm: 170,
  birthDate: '1996-05-10',
};
const sunday = new Date(2026, 10, 1, 18);

beforeEach(() => {
  mockDb.reset();
  useFoods.setState({ foods: new Map(), portions: new Map(), loaded: false });
  useProfile.setState({ profile, completed: true, loaded: true });
});

describe('peso', () => {
  it('o peso do Guia vira o primeiro registro; registrar atualiza o perfil com a tendência', async () => {
    await syncFirstWeight();
    await syncFirstWeight();
    expect((await listWeights()).map((w) => w.kg)).toEqual([65]);
    await addWeight(66.04);
    expect((await listWeights()).map((w) => w.kg)).toEqual([65, 66]);
    // Mesmo dia: a média do dia (65,5) vira a tendência.
    expect(useProfile.getState().profile.weightKg).toBe(65.5);
  });

  it('pesar 3 vezes no mesmo dia é um sinal de alerta e bloqueia o déficit', async () => {
    const now = new Date();
    for (let i = 0; i < 3; i++) await insertWeight(65, now.toISOString());
    const state = await loadSafetyState(profile, now);
    expect(state.signals).toEqual(['repeatedWeighing']);
    expect(state.blockDeficit).toBe(true);
  });
});

describe('check-in', () => {
  it('pendente só no domingo e até ser feito', async () => {
    expect(await checkinPending(new Date(2026, 9, 31, 18))).toBe(false);
    expect(await checkinPending(sunday)).toBe(true);
  });

  it('sugere semana leve com pouca energia e sono ruim, e reduzir um dia quando treinei bem menos', async () => {
    await createPlanFromProfile(profile, new Date(2026, 9, 26));
    const draft = await loadCheckinDraft(profile, sunday);
    expect(draft.stats.workouts).toBe(0);
    expect(draft.stats.planned).toBe(4);
    const offered = decisionsFor(draft, { ratings: { energy: 2, sleep: 1 } }, profile);
    expect(offered).toEqual(['keep', 'deload', 'dropDay']);

    await saveCheckin(draft, { ratings: { energy: 2, sleep: 1 } }, offered, ['deload', 'dropDay'], sunday);
    expect(useProfile.getState().profile.daysPerWeek).toBe(3);
    expect((await getActivePlan())?.deloadWeek).toBe('2026-11-02');
    const saved = await checkinForWeek('2026-10-26');
    expect(saved?.decisions.map((d) => [d.kind, d.accepted])).toEqual([
      ['keep', false],
      ['deload', true],
      ['dropDay', true],
    ]);
    expect(await checkinPending(sunday)).toBe(false);
  });

  it('com o peso escondido, o ritmo do peso não é guardado', async () => {
    useProfile.setState({ profile: { ...profile, weightVisibility: 'hide' } });
    await insertWeight(65, '2026-10-20T10:00:00.000Z');
    await insertWeight(64.5, '2026-10-31T10:00:00.000Z');
    const draft = await loadCheckinDraft(useProfile.getState().profile, sunday);
    expect(draft.stats.weightRate).toBeNull();
  });

  it('ajustar metas só aparece quando há ajuste', () => {
    const stats = { workouts: 3, planned: 3, glutes: 10, glutesGoal: 10, records: 0, cardioMinutes: 0, mealsMarkedPct: 80, weightRate: null, signals: [] };
    const base = { stats, ratings: {}, deloadDue: false, deloadActive: false, hasPlan: true, daysPerWeek: 3 };
    expect(suggestDecisions({ ...base, adjustment: null })).toEqual(['keep']);
    expect(suggestDecisions({ ...base, adjustment: 150 })).toEqual(['keep', 'adjustFood']);
  });
});
