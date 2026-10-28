import { View } from 'react-native';

import { Button } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { makeStyles } from '@/theme';
import type { Exercise } from '@/training/exerciseModel';
import type { Suggestion } from '@/training/progression';
import type { RecordKind } from '@/training/records';
import { isExerciseDone, previousAt } from '@/training/session';
import { summarizeSets } from '@/training/setSummary';
import type { WorkoutExercise, WorkoutSet } from '@/training/workoutModel';

import { ExerciseCardHeader } from './ExerciseCardHeader';
import { RirChips } from './RirChips';
import { SetRow, type SetField } from './SetRow';
import { SetTableHeader } from './SetTableHeader';

const w = strings.workout;

type Props = {
  item: WorkoutExercise;
  exercise: Exercise;
  /** Séries difíceis da última vez. */
  previous: readonly WorkoutSet[];
  records: Record<string, RecordKind[]>;
  suggestion: Suggestion | null;
  /** Primeiro composto do grupo, ainda sem aproximação: mostra o botão (seção 9.3). */
  canAddWarmup: boolean;
  /** Perguntar "Quantas ainda sobravam?" na última série. */
  askRir: boolean;
  careTip?: string | null;
  onEditSet: (setId: string, field: SetField) => void;
  onToggleSet: (setId: string) => void;
  onSetMenu: (setId: string) => void;
  onDeleteSet: (setId: string) => void;
  onCopySet: (setId: string) => void;
  onRir: (setId: string, rir: number) => void;
  onAddSet: () => void;
  onAddWarmup: () => void;
  onMenu: () => void;
  onInfo: () => void;
};

/** Cartão de um exercício no treino em andamento (seção 9.5). */
export function ExerciseCard(props: Props) {
  const { item, exercise, previous, records } = props;
  const styles = useStyles();
  const lastSet = item.sets[item.sets.length - 1];
  const showRir = props.askRir && lastSet && isExerciseDone(item) && lastSet.kind !== 'warmup';
  let hardIndex = 0;

  return (
    <View style={styles.card}>
      <ExerciseCardHeader
        exercise={exercise}
        last={summarizeSets(previous, exercise.tracking)}
        suggestion={props.suggestion}
        notes={item.notes}
        careTip={props.careTip}
        onMenu={props.onMenu}
        onInfo={props.onInfo}
      />
      {props.canAddWarmup && (
        <Button label={w.approachSets} icon="trending-up" variant="ghost" accessibilityHint={w.approachHint} onPress={props.onAddWarmup} />
      )}

      <SetTableHeader tracking={exercise.tracking} />
      {item.sets.map((set) => {
        const number = set.kind === 'warmup' ? 0 : ++hardIndex;
        return (
          <SetRow
            key={set.id}
            set={set}
            number={number}
            tracking={exercise.tracking}
            previous={set.kind === 'warmup' ? null : previousAt(previous, number - 1)}
            records={records[set.id]}
            onEdit={(field) => props.onEditSet(set.id, field)}
            onToggle={() => props.onToggleSet(set.id)}
            onMenu={() => props.onSetMenu(set.id)}
            onDelete={() => props.onDeleteSet(set.id)}
            onCopyPrevious={() => props.onCopySet(set.id)}
          />
        );
      })}
      {showRir && <RirChips value={lastSet.rir} onChange={(rir) => props.onRir(lastSet.id, rir)} />}
      <Button label={w.addSet} icon="plus" variant="ghost" onPress={props.onAddSet} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    gap: t.spacing.sm,
    padding: t.spacing.sm,
    paddingTop: t.spacing.md,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.hairline,
    borderColor: t.colors.border,
  },
}));
