import { bestsOf, epley, recordsBeaten, recordsInWorkout, recordValues } from '../records';
import type { SetKind } from '../workoutModel';

const done = '2026-10-26T10:00:00.000Z';
const set = (weightKg: number, reps: number, kind: SetKind = 'normal', completedAt: string | null = done) => ({
  kind,
  weightKg,
  reps,
  completedAt,
});

describe('epley', () => {
  it('carga × (1 + reps/30), com uma casa', () => {
    expect(epley(60, 10)).toBe(80);
    expect(epley(62.5, 8)).toBe(79.2);
    expect(epley(100, 1)).toBe(103.3);
  });
});

describe('recordValues', () => {
  it('carga só conta com pelo menos o mínimo da faixa', () => {
    expect(recordValues(set(80, 6), 8).weight).toBeNull();
    expect(recordValues(set(80, 8), 8).weight).toBe(80);
  });

  it('1RM estimado só com até 12 repetições', () => {
    expect(recordValues(set(40, 12), 8).e1rm).toBe(56);
    expect(recordValues(set(40, 13), 8).e1rm).toBeNull();
  });

  it('aquecimento e série não concluída não contam', () => {
    expect(recordValues(set(100, 10, 'warmup'), 8)).toEqual({ weight: null, e1rm: null });
    expect(recordValues(set(100, 10, 'normal', null), 8)).toEqual({ weight: null, e1rm: null });
  });

  it('drop e falha contam', () => {
    expect(recordValues(set(50, 10, 'drop'), 8).weight).toBe(50);
    expect(recordValues(set(50, 10, 'failure'), 8).weight).toBe(50);
  });
});

describe('recordsBeaten', () => {
  const before = bestsOf([set(60, 10), set(65, 6)], 8);

  it('os melhores de antes ignoram séries abaixo da faixa para a carga', () => {
    expect(before.weight).toBe(60);
    expect(before.e1rm).toBe(80);
  });

  it('mais carga dentro da faixa bate o recorde de carga', () => {
    expect(recordsBeaten(set(62.5, 8), before, 8)).toEqual(['weight']);
  });

  it('mais repetições com a mesma carga bate só o 1RM estimado', () => {
    expect(recordsBeaten(set(60, 12), before, 8)).toEqual(['e1rm']);
  });

  it('igualar não é recorde', () => {
    expect(recordsBeaten(set(60, 10), before, 8)).toEqual([]);
  });

  it('sem histórico, não há recorde (a primeira vez vira referência)', () => {
    expect(recordsBeaten(set(100, 10), { weight: null, e1rm: null }, 8)).toEqual([]);
  });
});

describe('recordsInWorkout', () => {
  it('compara cada série com o histórico e com as séries anteriores do treino', () => {
    const sets = [
      { id: 'a', ...set(62.5, 10) },
      { id: 'b', ...set(62.5, 10) },
      { id: 'c', ...set(65, 8) },
      { id: 'w', ...set(80, 8, 'warmup') },
    ];
    const result = recordsInWorkout(sets, { weight: 60, e1rm: 80 }, 8);
    expect(result.get('a')).toEqual(['weight', 'e1rm']);
    expect(result.has('b')).toBe(false);
    expect(result.get('c')).toEqual(['weight']);
    expect(result.has('w')).toBe(false);
  });

  it('sem histórico, nenhuma série do primeiro treino é recorde', () => {
    const result = recordsInWorkout([{ id: 'a', ...set(40, 10) }, { id: 'b', ...set(45, 10) }], { weight: null, e1rm: null }, 8);
    expect(result.size).toBe(0);
  });
});
