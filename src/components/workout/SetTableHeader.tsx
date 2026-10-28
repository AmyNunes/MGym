import { View } from 'react-native';

import { Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { makeStyles } from '@/theme';
import type { Tracking } from '@/training/exerciseModel';

const w = strings.workout;

/** Largura da coluna "Anterior": a mesma no cabeçalho e na SetRow, para as colunas alinharem. */
export const PREVIOUS_FLEX = 1.1;

/** Cabeçalho da tabela, alinhado com as colunas da SetRow. */
export function SetTableHeader({ tracking }: { tracking: Tracking }) {
  const styles = useStyles();
  const weightLabel = tracking === 'bodyweight' ? w.table.extraKg : tracking === 'assisted' ? w.table.assistKg : w.table.kg;
  return (
    <View style={styles.header} importantForAccessibility="no-hide-descendants">
      <Text variant="caption" color="textMuted" align="center" style={styles.headNumber}>
        {w.table.set}
      </Text>
      <Text variant="caption" color="textMuted" style={styles.previous}>
        {w.table.previous}
      </Text>
      {tracking !== 'time' && (
        <Text variant="caption" color="textMuted" align="center" style={styles.headCell}>
          {weightLabel}
        </Text>
      )}
      <Text variant="caption" color="textMuted" align="center" style={styles.headCell}>
        {tracking === 'time' ? w.table.seconds : w.table.reps}
      </Text>
      <View style={styles.headCheck} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, paddingHorizontal: t.spacing.xs },
  headNumber: { width: t.sizes.touchTarget },
  previous: { flex: PREVIOUS_FLEX },
  headCell: { flex: 1 },
  headCheck: { width: t.sizes.touchTargetWorkout },
}));
