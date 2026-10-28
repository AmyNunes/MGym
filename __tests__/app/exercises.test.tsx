import { fireEvent, render, screen } from '@testing-library/react-native';

import ExercisesScreen from '@/../app/exercises/index';
import ExerciseScreen from '@/../app/exercises/[id]/index';
import { strings } from '@/i18n/strings';
import { openExercisePicker } from '@/stores/pickerStore';

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: { push: (path: string) => mockPush(path), back: () => mockBack() },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockParams,
  useIsFocused: () => true,
}));
// O mapa muscular (SVG) é testado à parte; aqui só deixaria a lista lenta.
jest.mock('@/components/muscles/MuscleMap', () => ({ MuscleMap: () => null }));
jest.mock('@/db/workoutsRepo', () => ({ historySetsFor: async () => [], lastSetsFor: async () => null }));
jest.mock('@/db/routinesRepo', () => ({ listRoutines: async () => [], updateRoutine: jest.fn() }));
jest.mock('@/components/ui/Sheet', () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (visible ? children : null),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockBack.mockClear();
  mockParams = {};
});

describe('catálogo de exercícios', () => {
  it('busca sem acento filtra e tocar abre o detalhe', async () => {
    await render(<ExercisesScreen />);
    await fireEvent.changeText(screen.getByLabelText(strings.exercises.search), 'bulgaro');

    expect(screen.getByText(strings.exercises.count(1))).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /Agachamento búlgaro/ }));
    expect(mockPush).toHaveBeenCalledWith('/exercises/bulgarian-split-squat');
  });

  it('nada encontrado: estado vazio com "Limpar filtros"', async () => {
    await render(<ExercisesScreen />);
    await fireEvent.changeText(screen.getByLabelText(strings.exercises.search), 'xyzw');

    expect(screen.getByText(strings.exercises.empty)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: strings.exercises.clearFilters }));
    expect(screen.queryByText(strings.exercises.empty)).toBeNull();
  });

  it('modo escolher: marca vários e devolve os ids em ordem', async () => {
    const onPick = jest.fn();
    openExercisePicker(onPick);
    mockParams = { pick: '1' };
    await render(<ExercisesScreen />);

    await fireEvent.changeText(screen.getByLabelText(strings.exercises.search), 'elevacao pelvica com barra');
    await fireEvent.press(screen.getByRole('checkbox', { name: /Elevação pélvica com barra/ }));
    await fireEvent.changeText(screen.getByLabelText(strings.exercises.search), 'abdutora');
    await fireEvent.press(screen.getByRole('checkbox', { name: /Cadeira abdutora/ }));
    await fireEvent.press(screen.getByRole('button', { name: strings.exercises.pickAdd(2) }));

    expect(onPick).toHaveBeenCalledWith(['barbell-hip-thrust', 'hip-abduction-machine']);
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('detalhe do exercício', () => {
  it('mostra faixa, dicas, cuidados e trocas', async () => {
    mockParams = { id: 'barbell-hip-thrust' };
    await render(<ExerciseScreen />);

    expect(screen.getByText(/6–12 repetições/)).toBeOnTheScreen();
    expect(screen.getByText('Canela na vertical no topo.')).toBeOnTheScreen();
    expect(await screen.findByText(strings.exercises.detail.noHistory)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /Elevação pélvica na máquina/ }));
    expect(mockPush).toHaveBeenCalledWith('/exercises/machine-hip-thrust');
  });

  it('id que não existe: aviso em vez de quebrar', async () => {
    mockParams = { id: 'nao-existe' };
    await render(<ExerciseScreen />);
    expect(screen.getByText(strings.exercises.detail.notFound)).toBeOnTheScreen();
  });
});
