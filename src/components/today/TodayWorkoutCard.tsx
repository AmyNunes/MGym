import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { ContinueWorkoutCard } from '@/components/workout/ContinueWorkoutCard';
import type { TodayData } from '@/features/today/useToday';
import { startPlanDay } from '@/features/workout/start';
import { strings } from '@/i18n/strings';
import { formatBrDate } from '@/lib/dates';
import { openQuickAdd } from '@/stores/quickAddStore';
import { useWorkout } from '@/stores/workoutStore';
import { makeStyles } from '@/theme';
import { findExercise } from '@/training/catalog';

const t = strings.today;
const PREVIEW = 4;

/** Nome curto do exercício para a prévia ("Elevação pélvica com barra"). */
const shortName = (id: string) => (findExercise(id)?.name ?? '').replace(/\s*\(.*\)$/, '');

/** O treino do dia (seção 12.1): começar, continuar, feito, descanso ou recuperação. */
export function TodayWorkoutCard({ data }: { data: TodayData }) {
  const styles = useStyles();
  const active = useWorkout((s) => s.workout);
  const { plan, nextDay } = data;

  if (active) return <ContinueWorkoutCard />;

  if (data.doneToday) {
    const id = data.doneToday.id;
    return (
      <Card>
        <Text variant="heading">{t.done}</Text>
        <Button label={t.seeSummary} variant="secondary" icon="eye" onPress={() => router.push(`/history/${id}`)} />
      </Card>
    );
  }

  if (data.recovery.active) {
    return (
      <Card title={t.recoveryTitle}>
        <Text>{data.recovery.clearedOn ? t.recoveryUntil(formatBrDate(data.recovery.clearedOn)) : t.recoveryNoDate}</Text>
        <Text variant="caption" color="textMuted">
          {t.recoveryHint}
        </Text>
        <Button label={t.logCardio} icon="wind" variant="secondary" onPress={() => openQuickAdd('cardio')} />
      </Card>
    );
  }

  if (!plan || !nextDay) return null;

  if (!data.trainingDay) {
    return (
      <Card>
        <Text variant="heading">{t.restDay}</Text>
        <Button label={t.logCardio} icon="wind" variant="secondary" onPress={() => openQuickAdd('cardio')} />
        <Button label={t.trainAnyway(nextDay.name)} variant="ghost" onPress={() => void startPlanDay(nextDay, plan)} />
      </Card>
    );
  }

  const names = nextDay.exercises.map((e) => shortName(e.exerciseId));
  const preview = names.slice(0, PREVIEW).join(' · ');
  const more = names.length > PREVIEW ? ` · ${t.more(names.length - PREVIEW)}` : '';

  return (
    <Card>
      <Text variant="heading">{t.trainingDay(nextDay.name, nextDay.minutes)}</Text>
      <Text color="textMuted">{preview + more}</Text>
      <View style={styles.actions}>
        <Button label={t.start} icon="play" size="main" onPress={() => void startPlanDay(nextDay, plan)} />
        <Button label={t.lightDay} icon="feather" variant="ghost" onPress={() => void startPlanDay(nextDay, plan, { light: true })} />
      </View>
    </Card>
  );
}

const useStyles = makeStyles((th) => ({
  actions: { gap: th.spacing.xs },
}));
