import { View } from 'react-native';

import { Chip, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { makeStyles } from '@/theme';

const w = strings.workout;
const OPTIONS = [0, 1, 2, 3, 4];

type Props = { value: number | null; onChange: (rir: number) => void };

/** "Quantas ainda sobravam?" com chips grandes, na última série (seção 9.4). */
export function RirChips({ value, onChange }: Props) {
  const styles = useStyles();
  if (value != null) {
    return (
      <Text variant="caption" color="textMuted" style={styles.answered}>
        {w.rirAnswered(value)}
      </Text>
    );
  }
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={w.rirQuestion}>
      <Text variant="label">{w.rirQuestion}</Text>
      <View style={styles.row}>
        {OPTIONS.map((n) => (
          <Chip key={n} label={w.rirOption(n)} accessibilityLabel={w.rirLabel(n)} selected={false} onPress={() => onChange(n)} />
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.sm, paddingHorizontal: t.spacing.sm, paddingVertical: t.spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  answered: { paddingHorizontal: t.spacing.sm },
}));
