import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import type { TodayData } from '@/features/today/useToday';
import { strings } from '@/i18n/strings';
import { weekdayInitial, weekdayShort } from '@/lib/dates';
import { formatKgNumber } from '@/lib/format';
import { makeStyles } from '@/theme';

const t = strings.today;

/** "Sua semana" (seção 12.1): dias, treinos feitos, glúteos e cardio. Constância, sem culpa. */
export function WeekCard({ week }: { week: TodayData['week'] }) {
  const styles = useStyles();
  return (
    <Card title={t.weekTitle}>
      <View style={styles.row}>
        <View style={styles.dots}>
          {week.dots.map((d) => (
            <View key={d.key} style={styles.day} accessible accessibilityLabel={t.dotLabel(weekdayShort(d.weekday), d.state)}>
              <Text variant="caption" color={d.today ? 'primary' : 'textMuted'}>
                {weekdayInitial(d.weekday)}
              </Text>
              <View style={[styles.dot, d.state === 'done' && styles.done, d.state === 'planned' && styles.planned]} />
            </View>
          ))}
        </View>
        <View style={styles.stats}>
          <Text variant="label">{t.weekCount(week.trained, week.target)}</Text>
          <Text variant="label" color="primary">
            {t.glutes(formatKgNumber(week.glutes), week.glutesGoal)}
          </Text>
          {week.cardioMinutes > 0 && (
            <Text variant="caption" color="textMuted">
              {t.cardio(week.cardioMinutes)}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

const useStyles = makeStyles((th) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: th.spacing.lg },
  dots: { flexDirection: 'row', gap: th.spacing.sm },
  day: { alignItems: 'center', gap: th.spacing.xs },
  dot: {
    width: th.spacing.md,
    height: th.spacing.md,
    borderRadius: th.radii.full,
    backgroundColor: th.colors.surfaceAlt,
  },
  done: { backgroundColor: th.colors.primary },
  planned: { backgroundColor: th.colors.surface, borderWidth: th.sizes.hairline * 2, borderColor: th.colors.primary },
  stats: { flex: 1, gap: th.spacing.xs, alignItems: 'flex-end' },
}));
