import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { makeStyles, useTheme } from '@/theme';

/** Meta de cardio da semana (seção 11.4). */
export const CARDIO_GOAL_MIN = 150;

/** Anel dos 150 min de cardio por semana. */
export function CardioRing({ minutes }: { minutes: number }) {
  const theme = useTheme();
  const styles = useStyles();
  const size = theme.sizes.touchTargetWorkout;
  const stroke = theme.spacing.xs;
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;
  const progress = Math.min(1, minutes / CARDIO_GOAL_MIN);
  const label = strings.evolution.cardioRing(minutes);

  return (
    <View style={styles.row} accessible accessibilityRole="progressbar" accessibilityLabel={label}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.colors.surfaceAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.colors.success}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${length * progress} ${length}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text variant="label">{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
}));
