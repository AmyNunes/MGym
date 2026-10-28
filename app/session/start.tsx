import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { EmptyState, Screen, Skeleton } from '@/components/ui';
import { getActivePlan } from '@/db/plansRepo';
import { getActiveWorkout } from '@/db/workoutsRepo';
import { startPlanDay } from '@/features/workout/start';
import { strings } from '@/i18n/strings';
import { useLoader } from '@/lib/useLoader';
import { useTheme } from '@/theme';

/**
 * `mgym://session/start?day={id}` (seção 6.3): o "Começar" do lembrete do dia de treino.
 * Começa o dia do plano; um treino em andamento com séries feitas continua, um vazio é descartado (`startPlanDay`).
 * Sem plano, abre o treino em andamento, se houver.
 */
export default function StartFromLinkScreen() {
  const theme = useTheme();
  const { day } = useLocalSearchParams<{ day?: string }>();
  const { state } = useLoader(async () => {
    const plan = await getActivePlan();
    const planDay = plan?.days.find((d) => d.id === day) ?? plan?.days[0];
    if (plan && planDay) return { kind: 'start' as const, plan, planDay };
    const active = await getActiveWorkout();
    return active ? { kind: 'active' as const, id: active.id } : { kind: 'missing' as const };
  }, day ?? '');

  useEffect(() => {
    if (state.status !== 'success') return;
    const r = state.data;
    if (r.kind === 'active') router.replace(`/session/${r.id}`);
    else if (r.kind === 'start') void startPlanDay(r.planDay, r.plan, { replace: true });
  }, [state]);

  const missing = state.status === 'error' || (state.status === 'success' && state.data.kind === 'missing');
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: strings.today.start }} />
      {missing ? (
        <EmptyState icon="activity" message={strings.common.genericError} action={{ label: strings.tabs.workout, onPress: () => router.dismissTo('/workout') }} />
      ) : (
        <Skeleton height={theme.sizes.chartHeight} radius="lg" />
      )}
    </Screen>
  );
}
