import { SettingsButton } from '@/components/navigation/SettingsButton';
import { FirstUseCard } from '@/components/today/FirstUseCard';
import { CheckinCard } from '@/components/progress/EvolutionCards';
import { WeightCard } from '@/components/progress/WeightCard';
import { TodayMealsCard } from '@/components/today/TodayMealsCard';
import { TodayWorkoutCard } from '@/components/today/TodayWorkoutCard';
import { WeekCard } from '@/components/today/WeekCard';
import { ErrorState, Screen, ScreenHeader, Skeleton } from '@/components/ui';
import { getGreeting } from '@/features/today/greeting';
import { useToday } from '@/features/today/useToday';
import { useProfile } from '@/stores/profileStore';
import { useTheme } from '@/theme';

/** Hoje (seção 12.1): o treino do dia em 1 toque, o cardápio e a semana. */
export default function TodayScreen() {
  const theme = useTheme();
  const { greeting, date } = getGreeting(new Date());
  const { state, reload } = useToday();
  const mode = useProfile((s) => s.profile.numbersMode);
  const visibility = useProfile((s) => s.profile.weightVisibility);

  return (
    <Screen>
      <ScreenHeader eyebrow={date} title={greeting} right={<SettingsButton />} />
      {state.status === 'loading' && (
        <>
          <Skeleton height={theme.sizes.chartHeight} radius="lg" />
          <Skeleton height={theme.sizes.listRowHeight * 2} radius="lg" />
        </>
      )}
      {state.status === 'error' && <ErrorState onRetry={reload} />}
      {state.status === 'success' && (
        <>
          <FirstUseCard steps={state.data.firstUse} />
          {state.data.checkinPending && <CheckinCard pending last={null} />}
          <TodayWorkoutCard data={state.data} />
          {state.data.meals && <TodayMealsCard day={state.data.meals} mode={mode} />}
          {state.data.plan && <WeekCard week={state.data.week} />}
          {state.data.weight.trend != null && <WeightCard view={state.data.weight} visibility={visibility} compact />}
        </>
      )}
    </Screen>
  );
}
