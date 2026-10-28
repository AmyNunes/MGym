import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { StartConflictHost } from '@/components/workout/StartConflictHost';
import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { getWorkout } from '@/db/workoutsRepo';
import { strings } from '@/i18n/strings';
import { emptyProfile } from '@/profile/profile';
import { useProfile } from '@/stores/profileStore';
import { useSnackbar } from '@/stores/snackbarStore';
import { answerStartConflict, askStartConflict, useStartConflict } from '@/stores/startConflictStore';
import { flushWorkoutWrites, toggleSet, useWorkout } from '@/stores/workoutStore';
import type { PlanDay } from '@/training/planModel';

import { startFreeWorkout, startPlanDay, startRoutine } from '../start';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('@/notifications/rest', () => ({ scheduleRestEnd: jest.fn(async () => 'n1'), cancelRestEnd: jest.fn(async () => {}) }));
jest.mock('@/notifications/restCountdown', () => ({ showRestCountdown: jest.fn(), hideRestCountdown: jest.fn() }));
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (visible ? children : null),
}));

const push = router.push as jest.Mock;
const replace = router.replace as jest.Mock;
const c = strings.workout.conflict;

const hipThrust = { exerciseId: 'barbell-hip-thrust', sets: 3, repMin: 8, repMax: 12, restSec: 120 };
const legPress = { exerciseId: 'leg-press-45', sets: 3, repMin: 8, repMax: 12, restSec: 120 };
const dayA: PlanDay = { id: 'A', planId: 'p', position: 0, name: 'Corpo inteiro A', exercises: [legPress, hipThrust], note: null };
const plan = { createdAt: '2026-01-01T10:00:00.000Z', deloadWeek: null };

const current = () => useWorkout.getState().workout!;
/** Espera a folha "treino em andamento" abrir. */
const waitForQuestion = async () => {
  for (let i = 0; i < 50 && !useStartConflict.getState().request; i++) await act(() => Promise.resolve());
  return useStartConflict.getState().request;
};

beforeEach(() => {
  mockDb.reset();
  push.mockClear();
  replace.mockClear();
  useWorkout.setState({ workout: null, context: {}, records: {}, endedId: null });
  useStartConflict.setState({ request: null });
  useSnackbar.setState({ current: null });
  useProfile.setState({ profile: { ...emptyProfile(), experience: 'experienced' } });
});

/** Um treino montado com uma série marcada. */
async function routineWithOneSetDone() {
  await startRoutine({ id: 'r1', name: 'Meu treino', items: [hipThrust] });
  const we = current().exercises[0];
  toggleSet(we.id, we.sets[0].id);
  await flushWorkoutWrites();
  return current().id;
}

describe('começar um treino com outro em andamento', () => {
  it('treino livre vazio: o dia do plano começa com os exercícios dele e o vazio é descartado', async () => {
    await startFreeWorkout();
    const freeId = current().id;
    await startPlanDay(dayA, plan);
    expect(current().planDayId).toBe('A');
    expect(current().exercises.map((e) => e.exerciseId)).toEqual(['leg-press-45', 'barbell-hip-thrust']);
    expect((await getWorkout(freeId))?.status).toBe('discarded');
    expect(push).toHaveBeenLastCalledWith(`/session/${current().id}`);
    expect(useStartConflict.getState().request).toBeNull();
  });

  it('o mesmo dia do plano: continua o que já está aberto', async () => {
    await startPlanDay(dayA, plan);
    const id = current().id;
    await startPlanDay(dayA, plan);
    expect(current().id).toBe(id);
    expect(push).toHaveBeenLastCalledWith(`/session/${id}`);
  });

  it('com séries feitas, pergunta; "Continuar esse treino" abre o que estava aberto', async () => {
    const oldId = await routineWithOneSetDone();
    const started = startPlanDay(dayA, plan);
    const request = await waitForQuestion();
    expect(request).toMatchObject({ activeName: 'Meu treino', doneSets: 1, nextName: 'Corpo inteiro A' });
    answerStartConflict('continue');
    await started;
    expect(current().id).toBe(oldId);
    expect(push).toHaveBeenLastCalledWith(`/session/${oldId}`);
  });

  it('"Salvar esse e começar" guarda o anterior só com a série feita e começa o novo', async () => {
    const oldId = await routineWithOneSetDone();
    const started = startPlanDay(dayA, plan);
    await waitForQuestion();
    answerStartConflict('saveAndStart');
    await started;
    const saved = await getWorkout(oldId);
    expect(saved?.status).toBe('done');
    expect(saved?.exercises[0].sets).toHaveLength(1);
    expect(current().planDayId).toBe('A');
    expect(useSnackbar.getState().current?.message).toBe(c.saved);
  });

  it('fechar a pergunta não muda nada', async () => {
    const oldId = await routineWithOneSetDone();
    push.mockClear();
    const started = startPlanDay(dayA, plan);
    await waitForQuestion();
    answerStartConflict(null);
    await started;
    expect(current().id).toBe(oldId);
    expect(push).not.toHaveBeenCalled();
  });

  it('vindo da notificação, não pergunta: continua o treino com séries feitas', async () => {
    const oldId = await routineWithOneSetDone();
    await startPlanDay(dayA, plan, { replace: true });
    expect(useStartConflict.getState().request).toBeNull();
    expect(replace).toHaveBeenLastCalledWith(`/session/${oldId}`);
  });
});

describe('folha "treino em andamento"', () => {
  it('mostra o treino aberto e as duas escolhas', async () => {
    await render(<StartConflictHost />);
    let answer: string | null | undefined;
    await act(async () => {
      void askStartConflict({ activeName: 'Meu treino', doneSets: 2, nextName: 'Corpo inteiro A' }).then((x) => (answer = x));
    });
    expect(screen.getByText(c.message('Meu treino', 2))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: c.continue })).toBeOnTheScreen();
    await act(async () => fireEvent.press(screen.getByRole('button', { name: c.saveAndStart('Corpo inteiro A') })));
    expect(answer).toBe('saveAndStart');
    expect(screen.queryByText(c.message('Meu treino', 2))).toBeNull();
  });
});
