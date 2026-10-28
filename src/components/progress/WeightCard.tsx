import { router } from 'expo-router';
import { View } from 'react-native';

import { TrendChart } from '@/components/charts/TrendChart';
import { Button, Card, Text } from '@/components/ui';
import { inRange } from '@/body/trend';
import type { WeightView } from '@/features/body/weightService';
import { strings } from '@/i18n/strings';
import { formatDayMonth } from '@/lib/dates';
import { formatKgNumber } from '@/lib/format';
import type { WeightVisibility } from '@/profile/profile';
import { openQuickAdd } from '@/stores/quickAddStore';
import { makeStyles } from '@/theme';

const e = strings.evolution;
const w = strings.weight;

/** "+0,2" / "−0,3" com vírgula. */
export const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatKgNumber(Math.abs(n))}`;

/** Ritmo semanal ou direção, conforme "Esconder meu peso". */
export function rateText(view: WeightView, visibility: WeightVisibility): string {
  if (visibility === 'direction') return w.direction(w.directions[view.direction]);
  return view.rate ? w.rate(signed(view.rate.kg), signed(view.rate.pct)) : w.noRate;
}

/** Peso na Evolução (seção 12.6): tendência em destaque, ritmo e o gráfico de 4 semanas. Some com "Esconder". */
export function WeightCard({ view, visibility, compact }: { view: WeightView; visibility: WeightVisibility; compact?: boolean }) {
  const styles = useStyles();
  if (visibility === 'hide') return null;
  const recent = inRange(view.points, '4w', new Date());

  return (
    <Card title={e.weightTitle}>
      {view.trend == null ? (
        <>
          <Text color="textMuted">{e.weightEmpty}</Text>
          <Button label={e.logWeight} icon="plus" variant="secondary" onPress={() => openQuickAdd('weight')} />
        </>
      ) : (
        <>
          <View style={styles.row}>
            {visibility === 'show' && (
              <Text variant="hero" accessibilityRole="text">
                {w.kg(formatKgNumber(view.trend))}
              </Text>
            )}
            <Text variant="label" color="textMuted" style={styles.flex}>
              {rateText(view, visibility)}
            </Text>
          </View>
          {visibility === 'show' && !compact && recent.length > 1 && (
            <TrendChart
              trend={recent.map((p) => ({ t: p.t, v: p.trend }))}
              records={recent.map((p) => ({ t: p.t, v: p.kg }))}
              formatTime={(t) => formatDayMonth(new Date(t))}
              accessibilityLabel={w.chartLabel(
                formatDayMonth(new Date(recent[0].t)),
                formatDayMonth(new Date(recent[recent.length - 1].t)),
                w.kg(formatKgNumber(recent[0].trend)),
                w.kg(formatKgNumber(recent[recent.length - 1].trend)),
              )}
            />
          )}
          {!compact && <Button label={e.seeWeight} variant="ghost" onPress={() => router.push('/progress/weight')} />}
        </>
      )}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: t.spacing.md },
  flex: { flexShrink: 1 },
}));
