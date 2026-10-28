import { act, renderHook, waitFor } from '@testing-library/react-native';

import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { getRoutine, insertRoutine } from '@/db/routinesRepo';
import { useSnackbar } from '@/stores/snackbarStore';

import { useRoutineEditor } from '../useRoutineEditor';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));

beforeEach(() => mockDb.reset());

async function setup(items = 0) {
  const id = await insertRoutine({
    name: 'Inferior',
    items: items ? [{ exerciseId: 'goblet-squat', sets: 3, repMin: 8, repMax: 15, restSec: 120 }] : [],
  });
  const hook = await renderHook(() => useRoutineEditor(id));
  await waitFor(() => expect(hook.result.current.status).toBe('ready'));
  return { id, ...hook };
}

describe('useRoutineEditor', () => {
  it('adiciona com os valores do catálogo, sem repetir, e salva a ordem', async () => {
    const { id, result } = await setup();
    await act(async () => result.current.addExercises(['barbell-hip-thrust', 'barbell-hip-thrust', 'leg-press-45']));
    expect(result.current.items).toEqual([
      { exerciseId: 'barbell-hip-thrust', sets: 3, repMin: 6, repMax: 12, restSec: 120 },
      { exerciseId: 'leg-press-45', sets: 3, repMin: 8, repMax: 15, restSec: 150 },
    ]);

    await act(async () => result.current.move(0, 1));
    await act(async () => result.current.patchItem(0, { sets: 4 }));
    await act(async () => result.current.flush());

    const saved = await getRoutine(id);
    expect(saved?.items.map((i) => [i.exerciseId, i.sets])).toEqual([
      ['leg-press-45', 4],
      ['barbell-hip-thrust', 3],
    ]);
  });

  it('remover mostra "Desfazer", que devolve o exercício ao mesmo lugar', async () => {
    const { result } = await setup(1);
    await act(async () => result.current.addExercises(['barbell-hip-thrust']));
    await act(async () => result.current.removeItem(0));
    expect(result.current.items.map((i) => i.exerciseId)).toEqual(['barbell-hip-thrust']);

    await act(async () => useSnackbar.getState().current?.action?.onPress());
    expect(result.current.items.map((i) => i.exerciseId)).toEqual(['goblet-squat', 'barbell-hip-thrust']);
  });

  it('sair com o treino vazio apaga o rascunho', async () => {
    const { id, unmount } = await setup();
    await act(async () => unmount());
    await waitFor(async () => expect(await getRoutine(id)).toBeNull());
  });
});
