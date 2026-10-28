import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SessionScreen from '@/../app/session/[id]';
import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { strings } from '@/i18n/strings';
import { useRest } from '@/stores/restStore';
import { useSnackbar } from '@/stores/snackbarStore';
import { startWorkout, useWorkout } from '@/stores/workoutStore';

const mockDb = memoryDbHolder();
const mockSchedule = jest.fn(async () => 'notif-1');
const mockReplace = jest.fn();

jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: (p: string) => mockReplace(p), canGoBack: () => true },
  useLocalSearchParams: () => ({ id: 'current' }),
  useIsFocused: () => true,
}));
jest.mock('@/notifications/permissions', () => ({
  requestNotificationPermission: async () => 'granted',
  openSystemSettings: jest.fn(),
}));
jest.mock('@/notifications/rest', () => ({
  scheduleRestEnd: (...args: unknown[]) => mockSchedule(...(args as [])),
  cancelRestEnd: async () => {},
}));
jest.mock('@/components/muscles/MuscleMap', () => ({ MuscleMap: () => null }));
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (visible ? children : null),
}));

const w = strings.workout;

beforeEach(() => {
  mockDb.reset();
  useWorkout.setState({ workout: null, context: {}, records: {}, endedId: null });
  useRest.setState({ rest: null });
});

async function openSession() {
  await startWorkout({
    name: 'Inferior A',
    items: [{ exerciseId: 'barbell-hip-thrust', sets: 2, repMin: 8, repMax: 12, restSec: 120 }],
  });
  await render(
    <GestureHandlerRootView>
      <SessionScreen />
    </GestureHandlerRootView>,
  );
}

describe('treino em andamento', () => {
  it('✓ sem carga abre o teclado; depois marca a série e começa o descanso', async () => {
    await openSession();
    expect(screen.getByText('Inferior A')).toBeOnTheScreen();
    expect(screen.getByText(w.firstTime)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('checkbox', { name: w.checkSet(1) }));
    expect(screen.getByText(w.pad.kg)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: '6' }));
    await fireEvent.press(screen.getByRole('button', { name: '0' }));
    await fireEvent.press(screen.getByRole('button', { name: w.pad.next }));
    expect(screen.getByText(w.pad.reps)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: '1' }));
    await fireEvent.press(screen.getByRole('button', { name: '0' }));
    await fireEvent.press(screen.getByRole('button', { name: w.pad.done }));

    expect(screen.getByRole('button', { name: w.editWeight(1, '60') })).toBeOnTheScreen();
    await act(async () => fireEvent.press(screen.getByRole('checkbox', { name: w.checkSet(1) })));

    expect(screen.getByRole('checkbox', { name: w.uncheckSet(1) })).toBeChecked();
    expect(useRest.getState().rest?.label).toBe(w.rest.next(2, 'Elevação pélvica com barra (hip thrust)'));
    expect(mockSchedule).toHaveBeenCalled();
    expect(screen.getByText(w.rest.title)).toBeOnTheScreen();
  });

  it('excluir pelo menu da série tem "Desfazer"', async () => {
    await openSession();
    await fireEvent.press(screen.getByRole('button', { name: w.setButton(2, w.setKinds.normal) }));
    await fireEvent.press(screen.getByRole('button', { name: w.deleteSet }));

    expect(screen.queryByRole('checkbox', { name: w.checkSet(2) })).toBeNull();
    await act(async () => useSnackbar.getState().current?.action?.onPress());
    expect(screen.getByRole('checkbox', { name: w.checkSet(2) })).toBeOnTheScreen();
  });

  it('na última série pergunta "Quantas ainda sobravam?"', async () => {
    await openSession();
    const we = useWorkout.getState().workout!.exercises[0];
    for (const set of we.sets) {
      await act(async () => {
        useWorkout.setState({
          workout: {
            ...useWorkout.getState().workout!,
            exercises: [
              {
                ...useWorkout.getState().workout!.exercises[0],
                sets: useWorkout.getState().workout!.exercises[0].sets.map((x) =>
                  x.id === set.id ? { ...x, weightKg: 50, reps: 10 } : x,
                ),
              },
            ],
          },
        });
      });
      await act(async () => fireEvent.press(screen.getByRole('checkbox', { name: w.checkSet(we.sets.indexOf(set) + 1) })));
    }
    expect(screen.getByText(w.rirQuestion)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: w.rirLabel(2) }));
    expect(screen.getByText(w.rirAnswered(2))).toBeOnTheScreen();
  });

  it('o tipo da série muda pelo número (aquecimento vira "A")', async () => {
    await openSession();
    await fireEvent.press(screen.getByRole('button', { name: w.setButton(1, w.setKinds.normal) }));
    await fireEvent.press(screen.getByRole('button', { name: w.setKinds.warmup }));
    expect(screen.getByText('A')).toBeOnTheScreen();
  });
});
