import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { getRoutine, insertRoutine } from '@/db/routinesRepo';
import { getWorkout } from '@/db/workoutsRepo';
import { deleteWorkoutWithUndo } from '@/features/history/history';
import { useSnackbar } from '@/stores/snackbarStore';
import { finishWorkout, startWorkout, toggleSet, updateSet, useWorkout } from '@/stores/workoutStore';

import { loadWorkoutSummary } from '../useWorkoutSummary';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));

beforeEach(() => {
  mockDb.reset();
  useWorkout.setState({ workout: null, context: {}, records: {}, endedId: null });
});

const hipThrust = { exerciseId: 'barbell-hip-thrust', sets: 3, repMin: 8, repMax: 12, restSec: 120 };

async function doRoutine(routineId: string, loads: [number, number][]) {
  await startWorkout({ name: 'Inferior', routineId, items: [{ ...hipThrust, sets: loads.length }] });
  const we = useWorkout.getState().workout!.exercises[0];
  loads.forEach(([kg, reps], i) => {
    updateSet(we.id, we.sets[i].id, { weightKg: kg, reps });
    toggleSet(we.id, we.sets[i].id);
  });
  return (await finishWorkout())!;
}

describe('resumo do fim do treino', () => {
  it('números, glúteos da semana, recordes e a pergunta de atualizar o treino', async () => {
    const routineId = await insertRoutine({ name: 'Inferior', items: [hipThrust] });
    await doRoutine(routineId, [
      [60, 10],
      [60, 10],
      [60, 10],
    ]);
    const id = await doRoutine(routineId, [
      [62.5, 10],
      [65, 8],
    ]);

    const summary = (await loadWorkoutSummary(id))!;
    expect(summary.sets).toBe(2);
    expect(summary.volumeKg).toBe(625 + 520);
    expect(summary.trainedGlutes).toBe(true);
    expect(summary.glutesWeek).toBe(5);
    // Duas séries bateram recorde de carga; o resumo mostra só o melhor.
    expect(summary.records.filter((r) => r.kind === 'weight').map((r) => r.value)).toEqual([65]);
    // Fiz 2 séries em vez de 3: pergunta se quero atualizar o treino montado.
    expect(summary.update).toMatchObject({ kind: 'routine' });
    expect(summary.update?.items[0].sets).toBe(2);
    expect((await getRoutine(routineId))?.items[0].sets).toBe(3);
  });
});

describe('histórico', () => {
  it('apagar um treino tem "Desfazer" que volta o treino', async () => {
    const routineId = await insertRoutine({ name: 'Inferior', items: [hipThrust] });
    const id = await doRoutine(routineId, [[60, 10]]);
    const onChange = jest.fn();

    await deleteWorkoutWithUndo(id, onChange);
    expect(await getWorkout(id)).toBeNull();

    useSnackbar.getState().current?.action?.onPress();
    await new Promise((r) => setTimeout(r, 50));
    expect((await getWorkout(id))?.exercises[0].sets).toHaveLength(1);
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
