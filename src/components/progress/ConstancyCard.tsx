import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { weekdayInitial } from '@/lib/dates';
import { makeStyles } from '@/theme';
import { weeksMet, type ConstancyWeek } from '@/training/constancy';

const e = strings.evolution;
/** Segunda a domingo. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

/** Constância (seção 11.4): calendário das últimas semanas e semanas com a meta. Sem sequência de dias. */
export function ConstancyCard({ grid }: { grid: ConstancyWeek[] }) {
  const styles = useStyles();
  const trained = grid.reduce((sum, w) => sum + w.trained, 0);
  return (
    <Card title={e.constancyTitle}>
      <View accessible accessibilityRole="image" accessibilityLabel={e.calendarLabel(trained, grid.length)} style={styles.grid}>
        <View style={styles.week}>
          {WEEK.map((d) => (
            <Text key={d} variant="caption" color="textMuted" style={styles.cell}>
              {weekdayInitial(d)}
            </Text>
          ))}
        </View>
        {grid.map((week) => (
          <View key={week.start} style={styles.week}>
            {week.days.map((day) => (
              <View key={day.key} style={styles.cell}>
                <View style={[styles.dot, day.done && styles.done, day.future && styles.future]} />
              </View>
            ))}
          </View>
        ))}
      </View>
      <Text variant="label">{e.weeksMet(weeksMet(grid), grid.length)}</Text>
      <Text variant="caption" color="textMuted">
        {e.constancyHint}
      </Text>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  grid: { gap: t.spacing.xs },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { width: t.spacing.xl, alignItems: 'center', textAlign: 'center' },
  dot: { width: t.spacing.md, height: t.spacing.md, borderRadius: t.radii.full, backgroundColor: t.colors.surfaceAlt },
  done: { backgroundColor: t.colors.primary },
  future: { opacity: t.opacity.disabled },
}));
