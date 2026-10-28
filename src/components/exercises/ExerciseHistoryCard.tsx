import { LineChart } from '@/components/charts/LineChart';
import { Card, ErrorState, Skeleton, Text } from '@/components/ui';
import { useExerciseHistory } from '@/features/exercises/useExerciseHistory';
import { strings } from '@/i18n/strings';
import { formatDayMonth } from '@/lib/dates';
import { formatKg, formatKgNumber } from '@/lib/format';
import { useTheme } from '@/theme';
import type { Exercise } from '@/training/exerciseModel';

const d = strings.exercises.detail;

/** "Seu histórico" no detalhe: última vez, recordes e o gráfico do 1RM estimado. */
export function ExerciseHistoryCard({ exercise }: { exercise: Exercise }) {
  const theme = useTheme();
  const { state, reload } = useExerciseHistory(exercise);

  return (
    <Card title={d.history}>
      {state.status === 'loading' && <Skeleton height={theme.sizes.chartHeight} />}
      {state.status === 'error' && <ErrorState onRetry={reload} />}
      {state.status === 'success' && state.data && !state.data.hasHistory && (
        <Text color="textMuted">{d.noHistory}</Text>
      )}
      {state.status === 'success' && state.data?.hasHistory && (
        <>
          {state.data.last && <Text>{d.lastTime(state.data.last.summary, formatDayMonth(state.data.last.date))}</Text>}
          {state.data.heaviest && (
            <Text variant="label" color="textMuted">
              {d.bestWeight(formatKg(state.data.heaviest.weightKg), state.data.heaviest.reps)}
            </Text>
          )}
          {state.data.bestE1rm != null && (
            <Text variant="label" color="textMuted">
              {d.bestE1rm(formatKg(state.data.bestE1rm))}
            </Text>
          )}
          {state.data.chart.length > 1 && (
            <Text variant="caption" color="textMuted">
              {exercise.tracking === 'load' ? d.e1rmChart : d.bestSetChart}
            </Text>
          )}
          {state.data.chart.length > 1 && (
            <LineChart
              points={state.data.chart}
              formatValue={exercise.tracking === 'load' ? formatKg : exercise.tracking === 'time' ? (v) => `${v} s` : formatKgNumber}
              formatTime={(t) => formatDayMonth(new Date(t))}
              accessibilityLabel={d.e1rmChartLabel(
                formatDayMonth(new Date(state.data.chart[0].t)),
                formatDayMonth(new Date(state.data.chart[state.data.chart.length - 1].t)),
              )}
            />
          )}
        </>
      )}
    </Card>
  );
}
