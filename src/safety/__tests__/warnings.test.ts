import { deficitBlocked, detectSignals, suggestProfessional, type SignalInput } from '../warnings';

const calm: SignalInput = {
  weeklyRates: [{ kg: -0.3, pct: -0.4 }, { kg: -0.3, pct: -0.4 }, null],
  completeDayIntakes: [1800, 1900],
  floor: 1500,
  trainingMinutesByDay: [60, 0, 55],
  hurtWorkouts: 0,
  weighInsByDay: [1, 1, 0],
  deletions: 0,
};

describe('sinais de alerta', () => {
  it('semana tranquila: nenhum sinal', () => {
    expect(detectSignals(calm)).toEqual([]);
  });

  it('perda > 1% por 3 semanas, dias abaixo do piso, treino longo, dor, pesagens e exclusões repetidas', () => {
    const fast = { kg: -0.9, pct: -1.3 };
    expect(
      detectSignals({
        ...calm,
        weeklyRates: [fast, fast, fast],
        completeDayIntakes: [1200, 1300, 1400],
        trainingMinutesByDay: [150],
        weighInsByDay: [4],
        deletions: 6,
        hurtWorkouts: 2,
      }),
    ).toEqual(['fastLoss', 'belowFloor', 'longTraining', 'trainingHurt', 'repeatedWeighing', 'repeatedDeleting']);
  });

  it('sinal ativo ou cintura/altura < 0,40 bloqueiam o déficit', () => {
    expect(deficitBlocked([], 0.45)).toBe(false);
    expect(deficitBlocked(['fastLoss'], 0.45)).toBe(true);
    expect(deficitBlocked([], 0.38)).toBe(true);
  });

  it('duas respostas "sim" sugerem conversar com um profissional', () => {
    expect(suggestProfessional({ compensate: true, control: false })).toBe(false);
    expect(suggestProfessional({ compensate: true, dominates: true })).toBe(true);
  });
});
