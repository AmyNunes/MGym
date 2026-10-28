import { insertRecords, recordsOfWorkout } from '../recordsRepo';
import { getRoutine, insertRoutine } from '../routinesRepo';
import {
  deleteWorkout,
  getActiveWorkout,
  getWorkout,
  hardSetsSince,
  historySetsFor,
  insertSet,
  insertWorkout,
  insertWorkoutExercise,
  lastSetsFor,
  listDoneWorkouts,
  insertWorkoutTree,
  updateSet,
  updateWorkout,
} from '../workoutsRepo';

import { memoryDbHolder } from './memoryDb';

const mockDb = memoryDbHolder();
jest.mock('../client', () => ({ getDb: () => mockDb.get() }));

beforeEach(() => mockDb.reset());

let n = 0;
const id = () => `id-${++n}`;

async function workout(startedAt: string, sets: [number, number][], exerciseId = 'barbell-hip-thrust') {
  const w = id();
  await insertWorkout({
    id: w,
    planDayId: null,
    routineId: null,
    name: 'Treino A',
    startedAt,
    endedAt: null,
    status: 'active',
    notes: null,
    feeling: null,
    pain: null,
    warmupDone: false,
  });
  const we = id();
  await insertWorkoutExercise({ id: we, workoutId: w, exerciseId, position: 0, notes: null, restSec: 120, repMin: 8, repMax: 12 });
  for (const [i, [kg, reps]] of sets.entries()) {
    await insertSet(we, { id: id(), position: i, kind: 'normal', weightKg: kg, reps, rir: null, completedAt: startedAt });
  }
  return { w, we };
}

describe('workoutsRepo (SQLite em memória)', () => {
  it('o treino em andamento volta inteiro, com exercícios e séries em ordem', async () => {
    const { w } = await workout('2026-10-20T10:00:00.000Z', [
      [60, 10],
      [62.5, 8],
    ]);
    const active = await getActiveWorkout();
    expect(active?.id).toBe(w);
    expect(active?.exercises[0].sets.map((s) => s.weightKg)).toEqual([60, 62.5]);
  });

  it('"última vez" ignora o treino atual e treinos não concluídos', async () => {
    const first = await workout('2026-10-20T10:00:00.000Z', [[60, 10]]);
    await updateWorkout(first.w, { status: 'done' });
    const current = await workout('2026-10-22T10:00:00.000Z', [[65, 8]]);

    const last = await lastSetsFor('barbell-hip-thrust', current.w);
    expect(last?.workoutId).toBe(first.w);
    expect(last?.sets.map((s) => [s.weightKg, s.reps])).toEqual([[60, 10]]);
  });

  it('histórico, volume da semana e lista de feitos', async () => {
    const a = await workout('2026-10-20T10:00:00.000Z', [
      [60, 10],
      [60, 9],
    ]);
    await updateWorkout(a.w, { status: 'done', endedAt: '2026-10-20T11:00:00.000Z' });
    const b = await workout('2026-10-27T10:00:00.000Z', [[70, 8]]);
    await updateWorkout(b.w, { status: 'done' });

    expect((await historySetsFor('barbell-hip-thrust')).map((s) => s.weightKg)).toEqual([60, 60, 70]);
    expect(await hardSetsSince('2026-10-26T00:00:00.000Z')).toEqual([{ exerciseId: 'barbell-hip-thrust', sets: 1 }]);

    const list = await listDoneWorkouts();
    expect(list.map((x) => x.id)).toEqual([b.w, a.w]);
    expect(list[1]).toMatchObject({ exerciseCount: 1, setCount: 2, tonnage: 60 * 10 + 60 * 9 });
  });

  it('aquecimento não entra no volume nem nas contas', async () => {
    const { w, we } = await workout('2026-10-27T10:00:00.000Z', [[60, 10]]);
    await insertSet(we, { id: 'aq', position: 5, kind: 'warmup', weightKg: 30, reps: 8, rir: null, completedAt: 'x' });
    await updateWorkout(w, { status: 'done' });
    expect(await hardSetsSince('2026-10-26T00:00:00.000Z')).toEqual([{ exerciseId: 'barbell-hip-thrust', sets: 1 }]);
  });

  it('apagar leva séries e recordes junto; desfazer volta tudo', async () => {
    const { w, we } = await workout('2026-10-27T10:00:00.000Z', [[60, 10]]);
    const setId = (await getWorkout(w))!.exercises[0].sets[0].id;
    await updateSet(setId, { reps: 12 });
    await insertRecords([
      { exerciseId: 'barbell-hip-thrust', kind: 'weight', value: 60, weightKg: 60, reps: 12, setId, workoutId: w, achievedAt: 'x' },
    ]);
    const saved = (await getWorkout(w))!;

    await deleteWorkout(w);
    expect(await getWorkout(w)).toBeNull();
    expect(await recordsOfWorkout(w)).toEqual([]);

    await insertWorkoutTree(saved);
    const back = await getWorkout(w);
    expect(back?.exercises[0].id).toBe(we);
    expect(back?.exercises[0].sets[0].reps).toBe(12);
  });
});

describe('routinesRepo (SQLite em memória)', () => {
  it('guarda os exercícios em JSON e lê validando', async () => {
    const rid = await insertRoutine({
      name: 'Inferior A',
      items: [{ exerciseId: 'barbell-hip-thrust', sets: 4, repMin: 8, repMax: 12, restSec: 120 }],
    });
    expect((await getRoutine(rid))?.items[0]).toEqual({
      exerciseId: 'barbell-hip-thrust',
      sets: 4,
      repMin: 8,
      repMax: 12,
      restSec: 120,
    });
  });
});
