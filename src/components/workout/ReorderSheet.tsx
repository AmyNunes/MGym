import { View } from 'react-native';

import { DraggableList, IconButton, Sheet, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { makeStyles } from '@/theme';
import { findExercise } from '@/training/catalog';
import type { WorkoutExercise } from '@/training/workoutModel';

type Props = {
  visible: boolean;
  exercises: readonly WorkoutExercise[];
  onClose: () => void;
  onMove: (from: number, to: number) => void;
};

/** Reordenar exercícios: arrastar pela alça ≡ ou usar as setas (seção 7). */
export function ReorderSheet({ visible, exercises, onClose, onMove }: Props) {
  const styles = useStyles();
  const rowHeight = (styles.row.height as number) + (styles.gap.height as number);

  return (
    <Sheet visible={visible} onClose={onClose} title={strings.workout.reorder} snapPoints={['70%', '90%']}>
      <DraggableList
        items={exercises}
        keyOf={(e) => e.id}
        rowHeight={rowHeight}
        onMove={onMove}
        renderRow={(e, index, handle) => (
          <View style={styles.row}>
            {handle}
            <Text variant="label" numberOfLines={1} style={styles.name}>
              {findExercise(e.exerciseId)?.name}
            </Text>
            <IconButton icon="arrow-up" accessibilityLabel={strings.common.moveUp} disabled={index === 0} onPress={() => onMove(index, index - 1)} />
            <IconButton
              icon="arrow-down"
              accessibilityLabel={strings.common.moveDown}
              disabled={index === exercises.length - 1}
              onPress={() => onMove(index, index + 1)}
            />
          </View>
        )}
      />
    </Sheet>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: t.sizes.listRowHeight,
    borderRadius: t.radii.md,
    backgroundColor: t.colors.surfaceAlt,
  },
  gap: { height: t.spacing.sm },
  name: { flex: 1 },
}));
