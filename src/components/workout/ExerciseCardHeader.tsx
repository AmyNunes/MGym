import { Pressable, View } from 'react-native';

import { MuscleMap } from '@/components/muscles/MuscleMap';
import { Icon, IconButton, Notice, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatKg } from '@/lib/format';
import { makeStyles, useTheme } from '@/theme';
import type { Exercise } from '@/training/exerciseModel';
import type { Suggestion } from '@/training/progression';

const w = strings.workout;

type Props = {
  exercise: Exercise;
  /** "4 × 10 · 60 kg", ou vazio na primeira vez. */
  last: string;
  suggestion: Suggestion | null;
  notes: string | null;
  /** Cuidado do perfil para este exercício (ex.: levantar devagar do chão). */
  careTip?: string | null;
  onMenu: () => void;
  onInfo: () => void;
};

/** Título (segurar abre o menu), mapa, "Última vez" com a sugestão ↑/↓ e notas. */
export function ExerciseCardHeader({ exercise, last, suggestion, notes, careTip, onMenu, onInfo }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const kg = suggestion?.weightKg != null ? formatKg(suggestion.weightKg) : null;
  const arrow =
    kg && suggestion?.trend === 'up'
      ? { text: w.suggestionUp(kg), label: w.suggestionUpLabel(kg) }
      : kg && suggestion?.trend === 'down'
        ? { text: w.suggestionDown(kg), label: w.suggestionDownLabel(kg) }
        : null;

  return (
    <>
      <View style={styles.titleRow}>
        <Pressable onLongPress={onMenu} accessibilityRole="header" accessibilityHint={w.exerciseMenu(exercise.name)} style={styles.title}>
          <Text variant="heading">{exercise.name}</Text>
        </Pressable>
        <IconButton icon="more-vertical" accessibilityLabel={w.exerciseMenu(exercise.name)} onPress={onMenu} />
      </View>

      <View style={styles.meta}>
        <MuscleMap primary={exercise.primary} secondary={exercise.secondary} size="sm" />
        <View style={styles.metaText}>
          <Text variant="caption" color="textMuted">
            {strings.groups[exercise.group]} · {exercise.equipment.map((e) => strings.equipment[e]).join(', ')}
          </Text>
          <Text variant="label">
            {last ? w.lastTime(last) : w.firstTime}
            {arrow && (
              <Text variant="label" color="primary" accessibilityLabel={arrow.label}>
                {'  '}
                {arrow.text}
              </Text>
            )}
          </Text>
        </View>
        <IconButton icon="info" color="textMuted" accessibilityLabel={w.technique} onPress={onInfo} />
      </View>

      {suggestion?.stalled && <Notice icon="moon">{w.stalled}</Notice>}
      {careTip && <Notice tone="warning">{careTip}</Notice>}

      {notes && (
        <View style={styles.note}>
          <Icon name="edit-3" color="textMuted" size={theme.sizes.iconSmall} />
          <Text variant="caption" color="textMuted" style={styles.noteText}>
            {notes}
          </Text>
        </View>
      )}
    </>
  );
}

const useStyles = makeStyles((t) => ({
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: t.spacing.sm },
  title: { flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingLeft: t.spacing.sm },
  metaText: { flex: 1, gap: t.spacing.xs / 2 },
  note: { flexDirection: 'row', gap: t.spacing.xs, paddingHorizontal: t.spacing.sm },
  noteText: { flex: 1 },
}));
