import { View } from 'react-native';

import { Button, Sheet, Stepper, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatRest } from '@/lib/format';
import { makeStyles } from '@/theme';
import type { Exercise } from '@/training/exerciseModel';
import { PLANNED_LIMITS as L } from '@/training/planned';
import type { PlannedExercise } from '@/training/workoutModel';

const r = strings.routines;

type Props = {
  visible: boolean;
  onClose: () => void;
  item: PlannedExercise | null;
  exercise: Exercise | null;
  onChange: (patch: Partial<PlannedExercise>) => void;
  onRemove: () => void;
};

/** Séries, faixa de repetições e descanso de um exercício do treino. */
export function PlannedExerciseSheet({ visible, onClose, item, exercise, onChange, onRemove }: Props) {
  const styles = useStyles();
  const timed = exercise?.tracking === 'time';

  return (
    <Sheet visible={visible} onClose={onClose} title={exercise?.name}>
      {item && (
        <>
          <Field label={r.sets}>
            <Stepper accessibilityLabel={r.sets} value={item.sets} min={1} max={L.setsMax} onChange={(sets) => onChange({ sets })} />
          </Field>
          <Field label={timed ? r.secMin : r.repMin}>
            <Stepper
              accessibilityLabel={timed ? r.secMin : r.repMin}
              value={item.repMin}
              min={1}
              max={item.repMax}
              step={timed ? L.secondsStep : 1}
              onChange={(repMin) => onChange({ repMin })}
            />
          </Field>
          <Field label={timed ? r.secMax : r.repMax}>
            <Stepper
              accessibilityLabel={timed ? r.secMax : r.repMax}
              value={item.repMax}
              min={item.repMin}
              max={timed ? L.secondsMax : L.repsMax}
              step={timed ? L.secondsStep : 1}
              onChange={(repMax) => onChange({ repMax })}
            />
          </Field>
          <Field label={r.rest}>
            <Stepper
              accessibilityLabel={r.rest}
              value={item.restSec}
              min={L.restMin}
              max={L.restMax}
              step={L.restStep}
              format={formatRest}
              onChange={(restSec) => onChange({ restSec })}
            />
          </Field>
          <View style={styles.actions}>
            <Button label={strings.common.remove} icon="trash-2" variant="ghost" onPress={onRemove} />
          </View>
        </>
      )}
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.md },
  label: { flex: 1 },
  actions: { alignItems: 'flex-start' },
}));
