import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { IconButton, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatRest } from '@/lib/format';
import { makeStyles } from '@/theme';
import type { Exercise } from '@/training/exerciseModel';
import type { PlannedExercise } from '@/training/workoutModel';

type Props = {
  item: PlannedExercise;
  exercise: Exercise;
  handle: ReactNode;
  onPress: () => void;
  onMenu: () => void;
};

/** Linha de altura fixa de um exercício no treino montado: ≡ · nome · "3 × 8–12 · 2 min" · ⋯ */
export function PlannedExerciseRow({ item, exercise, handle, onPress, onMenu }: Props) {
  const styles = useStyles();
  const detail = strings.routines.planned(
    item.sets,
    item.repMin,
    item.repMax,
    formatRest(item.restSec),
    exercise.tracking === 'time' ? 'time' : 'reps',
  );

  return (
    <View style={styles.row}>
      {handle}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${exercise.name}, ${detail}`}
        accessibilityHint={strings.routines.edit}
        style={({ pressed }) => [styles.texts, pressed && styles.pressed]}
      >
        <Text variant="label" numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {detail}
        </Text>
      </Pressable>
      <IconButton icon="more-vertical" accessibilityLabel={strings.routines.itemMenu(exercise.name)} onPress={onMenu} />
    </View>
  );
}

/** Altura de cada linha (o DraggableList precisa dela). */
export const usePlannedRowHeight = () => {
  const styles = useStyles();
  return (styles.row.height as number) + (styles.gap.height as number);
};

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: t.sizes.listRowHeight + t.spacing.lg,
    borderRadius: t.radii.md,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.hairline,
    borderColor: t.colors.border,
  },
  gap: { height: t.spacing.sm },
  texts: { flex: 1, gap: t.spacing.xs / 2, justifyContent: 'center', alignSelf: 'stretch' },
  pressed: { opacity: t.opacity.pressed },
}));
