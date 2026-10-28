import { findExercise } from '../catalog';
import {
  changedForPlan,
  differsFromPlan,
  mergeIntoPlan,
  nextIncompleteIndex,
  nextPendingSet,
  nextSet,
  pendingSets,
  planFromWorkout,
  prefillSets,
  previousAt,
  startDecision,
  workedMuscles,
  workoutProgress,
} from '../session';
import type { WorkoutExercise, WorkoutSet } from '../workoutModel';

let n = 0;
const makeId = () => `s${++n}`;
const set = (weightKg: number | null, reps: number | null, done = false, kind: WorkoutSet['kind'] = 'normal'): WorkoutSet => ({
  id: makeId(),
  position: 0,
  kind,
  weightKg,
  reps,
  rir: null,
  completedAt: done ? 'x' : null,
});
const ex = (exerciseId: string, sets: WorkoutSet[]): WorkoutExercise => ({
  id: makeId(),
  workoutId: 'w',
  exerciseId,
  position: 0,
  notes: null,
  restSec: 120,
  repMin: 8,
  repMax: 12,
  sets,
});

describe('pré-preencher séries', () => {
  it('usa carga e repetições da última vez, posição por posição', () => {
    const prev = [set(60, 10, true), set(62.5, 8, true)];
    const sets = prefillSets(3, prev, makeId);
    expect(sets.map((s) => [s.weightKg, s.reps])).toEqual([
      [60, 10],
      [62.5, 8],
      [62.5, 8],
    ]);
    expect(sets.every((s) => s.completedAt === null && s.kind === 'normal')).toBe(true);
  });

  it('sem histórico, as séries vêm vazias', () => {
    expect(prefillSets(2, [], makeId).map((s) => s.weightKg)).toEqual([null, null]);
    expect(previousAt([], 0)).toBeNull();
  });

  it('"+ Adicionar série" copia a última', () => {
    const s = nextSet([{ ...set(40, 12), position: 2 }], makeId);
    expect(s).toMatchObject({ position: 3, weightKg: 40, reps: 12, completedAt: null });
  });
});

describe('andamento', () => {
  const workout = {
    exercises: [ex('barbell-hip-thrust', [set(60, 10, true), set(60, 10, true)]), ex('leg-press-45', [set(100, 10, true), set(100, 10)]), ex('plank', [set(null, 30)])],
  };

  it('progresso conta exercícios com todas as séries feitas', () => {
    expect(workoutProgress(workout)).toEqual({ done: 1, total: 3 });
    expect(pendingSets(workout)).toBe(2);
  });

  it('próximo exercício por fazer, dando a volta', () => {
    expect(nextIncompleteIndex(workout, 0)).toBe(1);
    expect(nextIncompleteIndex(workout, 2)).toBe(1);
  });

  it('músculos trabalhados: só exercícios com série difícil feita', () => {
    const worked = workedMuscles(workout, findExercise);
    expect(worked.primary).toContain('gluteMax');
    expect(worked.primary).toContain('quads');
    expect(worked.primary).not.toContain('abs');
  });
});

describe('atualizar o treino montado', () => {
  it('vira plano com as séries feitas; muda se a ordem ou as séries mudaram', () => {
    const done = planFromWorkout(
      { exercises: [ex('barbell-hip-thrust', [set(60, 10, true), set(60, 10, true), set(60, 10)]), ex('plank', [set(null, 30)])] },
      findExercise,
    );
    expect(done).toEqual([{ exerciseId: 'barbell-hip-thrust', sets: 2, repMin: 8, repMax: 12, restSec: 120 }]);
    expect(differsFromPlan([{ exerciseId: 'barbell-hip-thrust', sets: 2, repMin: 8, repMax: 12, restSec: 120 }], done)).toBe(false);
    expect(differsFromPlan([{ exerciseId: 'barbell-hip-thrust', sets: 3, repMin: 8, repMax: 12, restSec: 120 }], done)).toBe(true);
  });
});

describe('próxima série (texto do descanso)', () => {
  it('fica no mesmo exercício e depois passa para o próximo', () => {
    const a = ex('barbell-hip-thrust', [set(60, 10, true), set(60, 10)]);
    const b = ex('leg-press-45', [set(100, 10)]);
    expect(nextPendingSet({ exercises: [a, b] }, a.id)).toEqual({ exerciseIndex: 0, setNumber: 2 });
    const a2 = ex('barbell-hip-thrust', [set(60, 10, true)]);
    expect(nextPendingSet({ exercises: [a2, b] }, a2.id)).toEqual({ exerciseIndex: 1, setNumber: 1 });
    expect(nextPendingSet({ exercises: [a2] }, a2.id)).toBeNull();
  });
});

describe('atualizar o dia do plano', () => {
  const item = (exerciseId: string, sets: number) => ({ exerciseId, sets, repMin: 8, repMax: 12, restSec: 120 });

  it('séries a menos não pedem atualização; troca de exercício ou séries a mais pedem', () => {
    expect(changedForPlan([item('a', 3), item('b', 3)], [item('a', 2), item('b', 2)])).toBe(false);
    expect(changedForPlan([item('a', 3)], [item('c', 3)])).toBe(true);
    expect(changedForPlan([item('a', 3)], [item('a', 4)])).toBe(true);
    expect(changedForPlan([item('a', 3), item('b', 3)], [item('b', 3), item('a', 3)])).toBe(true);
  });

  it('mescla sem diminuir as séries', () => {
    expect(mergeIntoPlan([item('a', 3)], [item('a', 2), item('c', 2)])).toEqual([item('a', 3), item('c', 2)]);
  });
});

describe('começar um treino com outro em andamento', () => {
  const active = (planDayId: string | null, routineId: string | null, done: boolean) => ({
    planDayId,
    routineId,
    exercises: [ex('barbell-hip-thrust', [set(40, 10, done), set(40, 10)])],
  });

  it('sem treino em andamento, começa', () => {
    expect(startDecision(null, { planDayId: 'A' })).toBe('start');
  });

  it('o mesmo dia do plano, o mesmo treino montado ou dois livres: continua o que está aberto', () => {
    expect(startDecision(active('A', null, true), { planDayId: 'A' })).toBe('open');
    expect(startDecision(active(null, 'r1', false), { routineId: 'r1' })).toBe('open');
    expect(startDecision(active(null, null, false), {})).toBe('open');
  });

  it('outro treino sem nenhuma série feita: descarta sem perguntar', () => {
    expect(startDecision(active(null, null, false), { planDayId: 'A' })).toBe('replace');
    expect(startDecision({ planDayId: null, routineId: null, exercises: [] }, { planDayId: 'A' })).toBe('replace');
  });

  it('outro treino com séries feitas: pergunta', () => {
    expect(startDecision(active('B', null, true), { planDayId: 'A' })).toBe('ask');
    expect(startDecision(active(null, null, true), { routineId: 'r1' })).toBe('ask');
  });
});
