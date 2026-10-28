import { Stack } from 'expo-router';
import { useState } from 'react';

import { CHART_RANGES, inRange, type ChartRange } from '@/body/trend';
import { TrendChart } from '@/components/charts/TrendChart';
import { HistoryRows } from '@/components/progress/HistoryRows';
import { WeightCard } from '@/components/progress/WeightCard';
import { WeightPad } from '@/components/progress/WeightPad';
import { Button, Card, ErrorState, Notice, Screen, Segmented, Skeleton, Text } from '@/components/ui';
import { deleteWeight, restoreWeight, type WeightRecord } from '@/db/bodyRepo';
import { loadWeightView } from '@/features/body/weightService';
import { strings } from '@/i18n/strings';
import { formatDayMonth, formatShortDate, formatTime } from '@/lib/dates';
import { formatKgNumber } from '@/lib/format';
import { useLoader } from '@/lib/useLoader';
import { useProfile } from '@/stores/profileStore';
import { showSnackbar } from '@/stores/snackbarStore';
import { useTheme } from '@/theme';

const w = strings.weight;

/** Peso (seção 11.1): tendência, ritmo, gráfico com intervalo e os registros. */
export default function WeightScreen() {
  const theme = useTheme();
  const visibility = useProfile((s) => s.profile.weightVisibility);
  const { state, reload, refresh } = useLoader(() => loadWeightView());
  const [range, setRange] = useState<ChartRange>('3m');
  const [pad, setPad] = useState(false);
  const view = state.status === 'success' ? state.data : null;
  const points = view ? inRange(view.points, range, new Date()) : [];

  const remove = (record: WeightRecord) =>
    void deleteWeight(record.id).then(() => {
      refresh();
      showSnackbar(w.deleted, { label: strings.common.undo, onPress: () => void restoreWeight(record).then(refresh) });
    });

  return (
    <Screen edges={[]} footer={<Button label={strings.evolution.logWeight} icon="plus" size="main" onPress={() => setPad(true)} />}>
      <Stack.Screen options={{ title: w.title }} />
      {state.status === 'loading' && <Skeleton height={theme.sizes.chartHeight} radius="lg" />}
      {state.status === 'error' && <ErrorState onRetry={reload} />}
      {visibility === 'hide' && <Notice icon="eye-off">{w.hidden}</Notice>}
      {view && visibility !== 'hide' && <WeightCard view={view} visibility={visibility} compact />}
      {view && visibility === 'show' && view.points.length > 1 && (
        <Card>
          <Segmented
            accessibilityLabel={w.range}
            options={CHART_RANGES.map((value) => ({ value, label: w.ranges[value] }))}
            value={range}
            onChange={setRange}
          />
          {points.length > 0 && (
            <TrendChart
              trend={points.map((p) => ({ t: p.t, v: p.trend }))}
              records={points.map((p) => ({ t: p.t, v: p.kg }))}
              formatTime={(t) => formatDayMonth(new Date(t))}
              accessibilityLabel={w.chartLabel(
                formatDayMonth(new Date(points[0].t)),
                formatDayMonth(new Date(points[points.length - 1].t)),
                w.kg(formatKgNumber(points[0].trend)),
                w.kg(formatKgNumber(points[points.length - 1].trend)),
              )}
            />
          )}
          <Text variant="caption" color="textMuted">
            {w.help}
          </Text>
        </Card>
      )}
      {view && visibility === 'show' && view.records.length > 0 && (
        <>
          <Text variant="label" color="textMuted" accessibilityRole="header">
            {w.records}
          </Text>
          <HistoryRows
            items={[...view.records].reverse()}
            keyOf={(r) => r.id}
            title={(r) => w.kg(formatKgNumber(r.kg))}
            subtitle={(r) => `${formatShortDate(new Date(r.measuredAt))} · ${formatTime(new Date(r.measuredAt))}`}
            removeLabel={(r) => w.remove(formatShortDate(new Date(r.measuredAt)))}
            onRemove={remove}
          />
        </>
      )}
      <WeightPad visible={pad} onClose={() => setPad(false)} onSaved={refresh} />
    </Screen>
  );
}
