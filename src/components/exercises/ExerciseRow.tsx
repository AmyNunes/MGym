import { Pressable, View } from 'react-native';

import { MuscleMap } from '@/components/muscles/MuscleMap';
import { Icon, IconButton, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { makeStyles, useTheme } from '@/theme';
import type { Exercise } from '@/training/exerciseModel';

type Props = {
  exercise: Exercise;
  onPress: () => void;
  /** No modo de escolha: marcado ou não (mostra ✓ no lugar da seta). */
  selected?: boolean;
  /** No modo de escolha, o ⓘ abre o detalhe sem escolher. */
  onInfo?: () => void;
};

/** Linha do catálogo: mapa muscular pequeno, nome e grupo · equipamento. */
export function ExerciseRow({ exercise, onPress, selected, onInfo }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const picking = selected !== undefined;
  const subtitle = strings.exercises.rowSubtitle(
    strings.groups[exercise.group],
    exercise.equipment.map((e) => strings.equipment[e]).join(', '),
  );

  return (
    <View style={[styles.row, selected && styles.selected]}>
      <Pressable
        onPress={onPress}
        accessibilityRole={picking ? 'checkbox' : 'button'}
        accessibilityLabel={`${exercise.name}, ${subtitle}`}
        accessibilityState={picking ? { checked: selected } : undefined}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <MuscleMap primary={exercise.primary} secondary={exercise.secondary} size="sm" />
        <View style={styles.texts}>
          <Text variant="label">{exercise.name}</Text>
          <Text variant="caption" color="textMuted">
            {subtitle}
          </Text>
        </View>
        {picking ? (
          <Icon
            name={selected ? 'check-circle' : 'circle'}
            color={selected ? 'primary' : 'textMuted'}
            size={theme.sizes.icon}
          />
        ) : (
          <Icon name="chevron-right" color="textMuted" />
        )}
      </Pressable>
      {onInfo && <IconButton icon="info" accessibilityLabel={strings.exercises.details} onPress={onInfo} color="textMuted" />}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: t.radii.md,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.hairline,
    borderColor: t.colors.border,
    marginBottom: t.spacing.sm,
    paddingRight: t.spacing.xs,
  },
  selected: { borderColor: t.colors.primary },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    minHeight: t.sizes.listRowHeight,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
  },
  pressed: { opacity: t.opacity.pressed },
  texts: { flex: 1, gap: t.spacing.xs / 2 },
}));
