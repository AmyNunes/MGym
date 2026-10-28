import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { recordsOfWorkout } from '@/db/recordsRepo';
import { getActiveWorkout, getWorkout } from '@/db/workoutsRepo';

import {
  addExercises,
  addWarmupSets,
  addSet,
  deleteSet,
  finishWorkout,
  flushWorkoutWrites,
  moveExercise,
  removeExercise,
  restoreExercise,
  restoreSet,
  resumeWorkout,
  startWorkout,
  toggleSet,
  updateSet,
  useWorkout,
} from '../workoutStore';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));

const hipThrust = { exerciseId: 'barbell-hip-thrust', sets: 2, repMin: 8, repMax: 12, restSec: 120 };

beforeEach(() => {
  mockDb.reset();
  useWorkout.setState({ workout: null, context: {}, records: {}, endedId: null });
});

const current = () => useWorkout.getState().workout!;
const sets = (i = 0) => current().exercises[i].sets;

/** Faz um treino inteiro com as cargas dadas e termina. */
async function doWorkout(loads: [number, number][]) {
  await startWorkout({ name: 'A', items: [{ ...hipThrust, sets: loads.length }] });
  const we = current().exercises[0].id;
  loads.forEach(([kg, reps], i) => {
    const id = sets()[i].id;
    updateSet(we, id, { weightKg: kg, reps });
    toggleSet(we, id);
  });
  return finishWorkout();
}

describe('treino em andamento', () => {
  it('começa com as séries vazias na primeira vez e preenchidas com a última vez depois', async () => {
    await doWorkout([
      [60, 10],
      [60, 9],
    ]);
    await startWorkout({ name: 'B', items: [{ ...hipThrust, sets: 3 }] });
    expect(sets().map((s) => [s.weightKg, s.reps])).toEqual([
      [60, 10],
      [60, 9],
      [60, 9],
    ]);
  });

  it('salva a cada toque: fechar o app no meio e voltar recupera tudo', async () => {
    await startWorkout({ name: 'A', items: [hipThrust] });
    const we = current().exercises[0].id;
    updateSet(we, sets()[0].id, { weightKg: 50, reps: 12 });
    toggleSet(we, sets()[0].id);
    addSet(we);
    await flushWorkoutWrites();

    useWorkout.setState({ workout: null, context: {}, records: {}, endedId: null });
    expect(await resumeWorkout()).not.toBeNull();
    expect(sets().length).toBe(3);
    expect(sets()[0]).toMatchObject({ weightKg: 50, reps: 12 });
    expect(sets()[0].completedAt).not.toBeNull();
  });

  it('recorde aparece na hora quando a série passa o histórico', async () => {
    await doWorkout([[60, 10]]);
    await startWorkout({ name: 'B', items: [hipThrust] });
    const we = current().exercises[0].id;
    updateSet(we, sets()[0].id, { weightKg: 65, reps: 10 });
    expect(toggleSet(we, sets()[0].id)).toEqual({ completed: true, records: ['weight', 'e1rm'] });
    expect(toggleSet(we, sets()[1].id).records).toEqual([]);
  });

  it('terminar tira séries não marcadas e grava os recordes', async () => {
    await doWorkout([[60, 10]]);
    await startWorkout({ name: 'B', items: [hipThrust] });
    const we = current().exercises[0].id;
    updateSet(we, sets()[0].id, { weightKg: 62.5, reps: 10 });
    toggleSet(we, sets()[0].id);
    const id = await finishWorkout();

    const saved = await getWorkout(id!);
    expect(saved?.status).toBe('done');
    expect(saved?.exercises[0].sets).toHaveLength(1);
    expect((await recordsOfWorkout(id!)).map((r) => [r.kind, r.value])).toEqual([
      ['weight', 62.5],
      ['e1rm', 83.3],
    ]);
    expect(await getActiveWorkout()).toBeNull();
  });

  it('excluir série e exercício têm "Desfazer"; mover salva a ordem', async () => {
    await startWorkout({ name: 'A', items: [hipThrust] });
    await addExercises(['hip-abduction-machine']);
    const [a, b] = current().exercises;

    const removedSet = deleteSet(a.id, a.sets[0].id)!;
    expect(sets()).toHaveLength(1);
    restoreSet(a.id, removedSet.set, removedSet.index);
    expect(sets()[0].id).toBe(a.sets[0].id);

    const removed = removeExercise(b.id)!;
    expect(current().exercises).toHaveLength(1);
    restoreExercise(removed.exercise, removed.index);

    moveExercise(1, 0);
    await flushWorkoutWrites();
    const saved = await getWorkout(current().id);
    expect(saved?.exercises.map((e) => e.exerciseId)).toEqual(['hip-abduction-machine', 'barbell-hip-thrust']);
    expect(saved?.exercises[1].sets).toHaveLength(2);
  });

  it('com um treino em andamento, "começar" devolve o mesmo', async () => {
    const first = await startWorkout({ name: 'A', items: [hipThrust] });
    expect(await startWorkout({ name: 'B', items: [] })).toBe(first);
  });
});

describe('progressão e aproximação', () => {
  it('no topo da faixa com sobra ≤ 2, o próximo treino já vem com +5 kg (composto de pernas)', async () => {
    await startWorkout({ name: 'A', items: [{ ...hipThrust, sets: 2 }] });
    const we = current().exercises[0].id;
    for (const s of sets()) {
      updateSet(we, s.id, { weightKg: 60, reps: 12 });
      toggleSet(we, s.id);
    }
    updateSet(we, sets()[1].id, { rir: 2 });
    await finishWorkout();

    await startWorkout({ name: 'B', items: [hipThrust] });
    expect(sets().map((s) => [s.weightKg, s.reps])).toEqual([
      [65, 8],
      [65, 8],
    ]);
  });

  it('"Séries de aproximação" põe 50/70/85% antes das séries de trabalho', async () => {
    await startWorkout({ name: 'A', items: [hipThrust] });
    const we = current().exercises[0].id;
    updateSet(we, sets()[0].id, { weightKg: 60, reps: 10 });
    addWarmupSets(we);
    expect(sets().map((s) => [s.kind, s.weightKg])).toEqual([
      ['warmup', 30],
      ['warmup', 40],
      ['warmup', 50],
      ['normal', 60],
      ['normal', null],
    ]);
    await flushWorkoutWrites();
    const saved = await getWorkout(current().id);
    expect(saved?.exercises[0].sets.map((s) => s.kind)).toEqual(['warmup', 'warmup', 'warmup', 'normal', 'normal']);
  });
});
