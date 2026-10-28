import { SettingsButton } from '@/components/navigation/SettingsButton';
import { ConstancyCard } from '@/components/progress/ConstancyCard';
import { CheckinCard, ExpectationsCard, StrengthCard, WeekVolumeCard } from '@/components/progress/EvolutionCards';
import { MeasuresCard } from '@/components/progress/MeasuresCard';
import { WeightCard } from '@/components/progress/WeightCard';
import { ErrorState, Screen, ScreenHeader, Skeleton } from '@/components/ui';
import { useEvolution } from '@/features/progress/useEvolution';
import { strings } from '@/i18n/strings';
import { useProfile } from '@/stores/profileStore';
import { useTheme } from '@/theme';

const e = strings.evolution;

/** Evolução (seção 12.6): peso (ou oculto), medidas, força, semana, constância, check-in e o que esperar. */
export default function ProgressScreen() {
  const theme = useTheme();
  const profile = useProfile((s) => s.profile);
  const { state, reload } = useEvolution();

  return (
    <Screen>
      <ScreenHeader title={e.title} right={<SettingsButton />} />
      {state.status === 'loading' && (
        <>
          <Skeleton height={theme.sizes.chartHeight} radius="lg" />
          <Skeleton height={theme.sizes.listRowHeight * 2} radius="lg" />
        </>
      )}
      {state.status === 'error' && <ErrorState message={e.loadError} onRetry={reload} />}
      {state.status === 'success' && (
        <>
          {state.data.checkinPending && <CheckinCard pending last={state.data.lastCheckin} />}
          <WeightCard view={state.data.weight} visibility={profile.weightVisibility} />
          <MeasuresCard entries={state.data.measurements} sites={profile.measureSites} />
          <StrengthCard records={state.data.records} />
          <WeekVolumeCard volume={state.data.volume} goals={state.data.goals} cardioMinutes={state.data.cardioMinutes} />
          <ConstancyCard grid={state.data.constancy} />
          {!state.data.checkinPending && <CheckinCard pending={false} last={state.data.lastCheckin} />}
          <ExpectationsCard profile={profile} />
        </>
      )}
    </Screen>
  );
}
