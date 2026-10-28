import { Pressable, View } from 'react-native';

import { Icon, SwipeableRow, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatKgNumber } from '@/lib/format';
import { makeStyles, TINT, useTheme, withAlpha } from '@/theme';
import type { Tracking } from '@/training/exerciseModel';
import type { RecordKind } from '@/training/records';
import { formatSet } from '@/training/setSummary';
import type { WorkoutSet } from '@/training/workoutModel';

import { RecordBadge } from './RecordBadge';
import { SetCell } from './SetCell';
import { PREVIOUS_FLEX } from './SetTableHeader';

const w = strings.workout;

export type SetField = 'weight' | 'reps';

type Props = {
  set: WorkoutSet;
  /** Número mostrado (as séries de aquecimento mostram "A"). */
  number: number;
  tracking: Tracking;
  previous: WorkoutSet | null;
  records: readonly RecordKind[] | undefined;
  onEdit: (field: SetField) => void;
  onToggle: () => void;
  onMenu: () => void;
  onDelete: () => void;
  onCopyPrevious: () => void;
};

/**
 * Linha da série (seção 4.4): nº · anterior · kg · reps · ✓.
 * Concluída: fundo `success` suave e ✓ preenchido. ← exclui, → copia a de cima.
 */
export function SetRow(props: Props) {
  const { set, number, tracking, previous, records, onEdit, onToggle, onMenu, onDelete, onCopyPrevious } = props;
  const theme = useTheme();
  const styles = useStyles();
  const done = set.completedAt != null;
  const kindShort = w.setKindShort[set.kind];
  const weightText = set.weightKg == null ? w.noValue : formatKgNumber(set.weightKg);
  const repsText = set.reps == null ? w.noValue : String(set.reps);
  const previousText = previous ? formatSet(previous, tracking) : w.noValue;

  return (
    <SwipeableRow
      left={{ icon: 'trash-2', color: 'danger', onCommit: onDelete }}
      right={{ icon: 'copy', color: 'primary', onCommit: onCopyPrevious }}
    >
      <View style={styles.row}>
        {done && <View style={[styles.doneTint, { backgroundColor: withAlpha(theme.colors.success, TINT) }]} />}
        <Pressable
          onPress={onMenu}
          accessibilityRole="button"
          accessibilityLabel={w.setButton(number, w.setKinds[set.kind])}
          style={({ pressed }) => [styles.number, pressed && styles.pressed]}
        >
          <Text variant="heading" color={kindShort ? 'primary' : 'text'}>
            {kindShort || number}
          </Text>
        </Pressable>

        <Text
          variant="caption"
          color="textMuted"
          numberOfLines={1}
          style={styles.previous}
          accessibilityLabel={w.previousLabel(previousText)}
        >
          {previousText}
        </Text>

        {tracking !== 'time' && (
          <SetCell
            text={weightText}
            label={w.editWeight(number, weightText)}
            onPress={() => onEdit('weight')}
          />
        )}
        <SetCell
          text={repsText}
          label={tracking === 'time' ? w.editSeconds(number, repsText) : w.editReps(number, repsText)}
          onPress={() => onEdit('reps')}
        />

        <Pressable
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityLabel={done ? w.uncheckSet(number) : w.checkSet(number)}
          accessibilityState={{ checked: done }}
          style={({ pressed }) => [styles.check, done && styles.checkDone, pressed && styles.pressed]}
        >
          <Icon name="check" color={done ? 'onSuccess' : 'textMuted'} />
        </Pressable>
      </View>
      {records && records.length > 0 && (
        <View style={styles.badge}>
          <RecordBadge kinds={records} />
        </View>
      )}
    </SwipeableRow>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.xs,
    borderRadius: t.radii.md,
    backgroundColor: t.colors.surface,
  },
  doneTint: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: t.radii.md },
  number: {
    width: t.sizes.touchTarget,
    height: t.sizes.touchTargetWorkout,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previous: { flex: PREVIOUS_FLEX },
  check: {
    width: t.sizes.touchTargetWorkout,
    height: t.sizes.touchTargetWorkout,
    borderRadius: t.radii.full,
    borderWidth: t.sizes.hairline * 2,
    borderColor: t.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: t.colors.success, borderColor: t.colors.success },
  pressed: { opacity: t.opacity.pressed },
  badge: { paddingLeft: t.sizes.touchTarget + t.spacing.xs, paddingBottom: t.spacing.xs },
}));
