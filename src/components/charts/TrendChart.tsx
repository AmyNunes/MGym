import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { Text } from '@/components/ui';
import { projectPoints, type ChartPoint } from '@/lib/chart';
import { makeStyles, useTheme, withAlpha } from '@/theme';

type Props = {
  /** A tendência (linha). */
  trend: readonly ChartPoint[];
  /** Os registros (pontos claros). */
  records: readonly ChartPoint[];
  formatTime: (t: number) => string;
  accessibilityLabel: string;
};

/** Pontos claros fora da linha: transparência dos registros. */
const RECORD_ALPHA = 0.35;

/**
 * TrendChart (seção 4.4): a linha da tendência e os registros como pontos claros,
 * na mesma escala. Nunca destaca a diferença de um dia para o outro.
 */
export function TrendChart({ trend, records, formatTime, accessibilityLabel }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const height = theme.sizes.chartHeight;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const all = [...trend, ...records];
  const projected = width && all.length ? projectPoints(all, width, height, theme.spacing.sm) : [];
  const line = projected.slice(0, trend.length);
  const dots = projected.slice(trend.length);
  const first = all.length ? Math.min(...all.map((p) => p.t)) : 0;
  const last = all.length ? Math.max(...all.map((p) => p.t)) : 0;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.wrap}>
      <View style={[styles.plot, { height }]} onLayout={onLayout}>
        {width > 0 && (
          <Svg width={width} height={height}>
            {dots.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={theme.sizes.chartDot} fill={withAlpha(theme.colors.primary, RECORD_ALPHA)} />
            ))}
            {line.length > 1 && (
              <Polyline
                points={line.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth={theme.sizes.chartStroke}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
          </Svg>
        )}
      </View>
      {all.length > 0 && (
        <View style={styles.xLabels}>
          <Text variant="caption" color="textMuted">
            {formatTime(first)}
          </Text>
          {last !== first && (
            <Text variant="caption" color="textMuted">
              {formatTime(last)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.xs },
  plot: { borderRadius: t.radii.sm, backgroundColor: t.colors.surfaceAlt },
  xLabels: { flexDirection: 'row', justifyContent: 'space-between' },
}));
