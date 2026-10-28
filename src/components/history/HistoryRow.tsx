import { Pressable, View } from 'react-native';

import { IconButton, SwipeableRow, Text } from '@/components/ui';
import type { WorkoutSummaryRow } from '@/db/workoutsRepo';
import { strings } from '@/i18n/strings';
import { formatShortDate } from '@/lib/dates';
import { formatDuration } from '@/lib/format';
import { makeStyles } from '@/theme';

type Props = {
  row: WorkoutSummaryRow;
  onPress: () => void;
  onDelete: () => void;
  onMenu: () => void;
};

/** Um treino feito na lista: deslizar ← apaga (com "Desfazer"); o ⋯ tem a mesma opção. */
export function HistoryRow({ row, onPress, onDelete, onMenu }: Props) {
  const styles = useStyles();
  const start = new Date(row.startedAt);
  const duration = row.endedAt ? formatDuration(Date.parse(row.endedAt) - start.getTime()) : '';
  const name = row.name ?? strings.workout.freeName;
  const subtitle = strings.history.row(formatShortDate(start), duration, row.setCount);

  return (
    <View style={styles.wrap}>
      <SwipeableRow left={{ icon: 'trash-2', color: 'danger', onCommit: onDelete }}>
        <View style={styles.row}>
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${subtitle}`}
            style={({ pressed }) => [styles.main, pressed && styles.pressed]}
          >
            <Text variant="label">{name}</Text>
            <Text variant="caption" color="textMuted">
              {subtitle}
            </Text>
          </Pressable>
          <IconButton icon="more-vertical" accessibilityLabel={strings.history.menu(name)} onPress={onMenu} />
        </View>
      </SwipeableRow>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { marginBottom: t.spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: t.radii.md,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.hairline,
    borderColor: t.colors.border,
  },
  main: {
    flex: 1,
    gap: t.spacing.xs / 2,
    minHeight: t.sizes.listRowHeight,
    justifyContent: 'center',
    paddingHorizontal: t.spacing.lg,
  },
  pressed: { opacity: t.opacity.pressed },
}));
