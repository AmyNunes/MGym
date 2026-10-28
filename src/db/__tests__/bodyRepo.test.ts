import { checkinForWeek, insertCheckin } from '../checkinsRepo';
import {
  deleteMeasurement,
  deleteWeight,
  deletionsSince,
  insertMeasurement,
  insertWeight,
  listMeasurements,
  listWeights,
  restoreWeight,
} from '../bodyRepo';

import { memoryDbHolder } from './memoryDb';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));

beforeEach(() => mockDb.reset());

describe('peso e medidas no banco', () => {
  it('grava, lista em ordem e desfaz a exclusão sem contar como exclusão', async () => {
    await insertWeight(65.4, '2026-10-20T10:00:00.000Z');
    const id = await insertWeight(65.1, '2026-10-21T10:00:00.000Z');
    expect((await listWeights()).map((w) => w.kg)).toEqual([65.4, 65.1]);

    const [, last] = await listWeights();
    await deleteWeight(id);
    expect(await listWeights()).toHaveLength(1);
    expect(await deletionsSince('2000-01-01')).toBe(1);
    await restoreWeight(last);
    expect(await listWeights()).toHaveLength(2);
    expect(await deletionsSince('2000-01-01')).toBe(0);
  });

  it('medidas por local, em JSON validado', async () => {
    const id = await insertMeasurement({ waist: 80.4, hips: 101 }, '2026-10-20T10:00:00.000Z');
    expect((await listMeasurements())[0].values).toEqual({ waist: 80.4, hips: 101 });
    await deleteMeasurement(id);
    expect(await listMeasurements()).toEqual([]);
  });

  it('check-in da semana', async () => {
    await insertCheckin({
      weekStart: '2026-10-26',
      stats: null,
      answers: { ratings: { energy: 4 } },
      decisions: [{ kind: 'keep', accepted: true }],
      summaryPt: null,
    });
    const saved = await checkinForWeek('2026-10-26');
    expect(saved?.answers.ratings.energy).toBe(4);
    expect(saved?.decisions).toEqual([{ kind: 'keep', accepted: true }]);
    expect(await checkinForWeek('2026-10-19')).toBeNull();
  });
});
