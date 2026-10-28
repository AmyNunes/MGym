import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { Text } from '@/components/ui';
import { projectPoints, type ChartPoint } from '@/lib/chart';
import { makeStyles, useTheme, type ColorTokens } from '@/theme';

type Props = {
  points: readonly ChartPoint[];
  color?: keyof ColorTokens;
  formatValue: (v: number) => string;
  formatTime: (t: number) => string;
  accessibilityLabel: string;
};

/** Gráfico de linha simples, desenhado por nós (seção 2.3: sem bibliotecas de gráfico). */
export function LineChart({ points, color = 'primary', formatValue, formatTime, accessibilityLabel }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const height = theme.sizes.chartHeight;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const projected = width ? projectPoints(points, width, height, theme.spacing.sm) : [];

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.wrap}>
      <Text variant="label" color="textMuted">
        {points.length > 1
          ? `${formatValue(points[0].v)} → ${formatValue(points[points.length - 1].v)}`
          : formatValue(points[0].v)}
      </Text>
      <View style={[styles.plot, { height }]} onLayout={onLayout}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <Polyline
              points={projected.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={theme.colors[color]}
              strokeWidth={theme.sizes.chartStroke}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {projected.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={theme.sizes.chartDot} fill={theme.colors[color]} />
            ))}
          </Svg>
        )}
      </View>
      <View style={styles.xLabels}>
        <Text variant="caption" color="textMuted">
          {formatTime(points[0].t)}
        </Text>
        {points.length > 1 && (
          <Text variant="caption" color="textMuted">
            {formatTime(points[points.length - 1].t)}
          </Text>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.xs },
  plot: {
    borderRadius: t.radii.sm,
    backgroundColor: t.colors.surfaceAlt,
  },
  xLabels: { flexDirection: 'row', justifyContent: 'space-between' },
}));
