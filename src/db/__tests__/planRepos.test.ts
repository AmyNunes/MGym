import { emptyProfile } from '@/profile/profile';

import { cardioSince, deleteCardio, insertCardio } from '../cardioRepo';
import { getActivePlan, getPlanDay, savePlan, setDeloadWeek, updatePlanDay } from '../plansRepo';
import { getProfile, saveProfile } from '../profileRepo';

import { memoryDbHolder } from './memoryDb';

const mockDb = memoryDbHolder();
jest.mock('../client', () => ({ getDb: () => mockDb.get() }));

beforeEach(() => mockDb.reset());

const day = (name: string) => ({
  name,
  note: null,
  exercises: [{ exerciseId: 'barbell-hip-thrust', sets: 3, repMin: 8, repMax: 12, restSec: 120 }],
});

describe('perfil', () => {
  it('salva a cada resposta e marca quando o Guia termina', async () => {
    expect(await getProfile()).toBeNull();
    await saveProfile({ ...emptyProfile(), goal: 'feminineShape' });
    expect((await getProfile())?.answers.goal).toBe('feminineShape');
    expect((await getProfile())?.completedAt).toBeNull();

    await saveProfile({ ...emptyProfile(), goal: 'feminineShape', daysPerWeek: 3 }, true);
    const done = await getProfile();
    expect(done?.completedAt).not.toBeNull();

    // Editar depois não apaga a data de conclusão.
    await saveProfile({ ...emptyProfile(), goal: 'strengthHealth' });
    expect((await getProfile())?.completedAt).toBe(done?.completedAt);
  });
});

describe('planos', () => {
  it('um plano novo desativa o anterior; dias em ordem, editáveis', async () => {
    await savePlan({ template: 'fullBodyAB', createdAt: '2026-10-01T10:00:00.000Z', targets: {}, days: [day('A')] });
    await savePlan({
      template: 'upperLower4',
      createdAt: '2026-10-20T10:00:00.000Z',
      targets: { glutes: { min: 12, max: 20 } },
      days: [day('Inferior A'), day('Superior A')],
    });

    const plan = await getActivePlan();
    expect(plan?.template).toBe('upperLower4');
    expect(plan?.targets.glutes).toEqual({ min: 12, max: 20 });
    expect(plan?.days.map((d) => d.name)).toEqual(['Inferior A', 'Superior A']);

    await updatePlanDay(plan!.days[0].id, { name: 'Inferior Glúteo', exercises: [] });
    expect((await getPlanDay(plan!.days[0].id))?.name).toBe('Inferior Glúteo');

    await setDeloadWeek(plan!.id, '2026-11-02');
    expect((await getActivePlan())?.deloadWeek).toBe('2026-11-02');
  });
});

describe('cardio', () => {
  it('registra, lista por data e apaga', async () => {
    const id = await insertCardio({ date: '2026-10-27T18:00:00.000Z', kind: 'inclineWalk', minutes: 30, notes: null });
    await insertCardio({ date: '2026-10-10T18:00:00.000Z', kind: 'bike', minutes: 20, notes: null });
    expect((await cardioSince('2026-10-26T00:00:00.000Z')).map((c) => c.minutes)).toEqual([30]);
    await deleteCardio(id);
    expect(await cardioSince('2026-10-26T00:00:00.000Z')).toEqual([]);
  });
});
