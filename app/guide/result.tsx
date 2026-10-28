import { router, Stack } from 'expo-router';

import { FoodTargetsCard } from '@/components/guide/FoodTargetsCard';
import { CareList } from '@/components/plan/CareList';
import { ExpectationsCard } from '@/components/progress/EvolutionCards';
import { MuscleBars } from '@/components/plan/MuscleBars';
import { Button, Card, EmptyState, ErrorState, ListGroup, ListRow, Notice, Screen, Skeleton, Text } from '@/components/ui';
import { describePlan, useActivePlan } from '@/features/plan/usePlan';
import { strings } from '@/i18n/strings';
import { appDayKey } from '@/lib/dates';
import { useBackTo } from '@/lib/useBackTo';
import { careItems } from '@/safety/care';
import { useProfile } from '@/stores/profileStore';
import { useTheme } from '@/theme';

const r = strings.result;

/**
 * Resultado do Guia (seção 8.2): o plano, o volume da semana, as metas de comida, o que esperar e os cuidados.
 * O Guia já terminou: "Começar" e o "voltar" do Android vão para Hoje e fecham as perguntas.
 */
export default function GuideResultScreen() {
  const theme = useTheme();
  const profile = useProfile((s) => s.profile);
  const { state, reload } = useActivePlan();
  const view = state.status === 'success' && state.data ? describePlan(state.data, profile) : null;
  const care = careItems(profile, appDayKey(new Date()));
  useBackTo('/');

  return (
    <Screen edges={[]} footer={<Button label={r.start} icon="sun" size="main" onPress={() => router.dismissTo('/')} />}>
      <Stack.Screen options={{ title: r.title, headerBackVisible: false }} />
      {state.status === 'loading' && <Skeleton height={theme.sizes.chartHeight} radius="lg" />}
      {state.status === 'error' && <ErrorState onRetry={reload} />}
      {state.status === 'success' && !view && <EmptyState icon="alert-circle" message={strings.common.genericError} />}
      {view && (
        <>
          <Text variant="title" accessibilityRole="header">
            {r.planTitle}
          </Text>
          <Text color="textMuted">{r.template(strings.plan.templates[view.plan.template], profile.daysPerWeek ?? view.days.length)}</Text>
          <ListGroup>
            {view.days.map((d) => (
              <ListRow key={d.id} icon="calendar" title={d.name} subtitle={r.day(d.minutes, d.exercises.length)} />
            ))}
          </ListGroup>
          <Card title={r.volumeTitle}>
            <Text variant="caption" color="textMuted">
              {r.volumeHelp}
            </Text>
            <MuscleBars volume={view.volume} goals={view.goals} />
          </Card>
          {view.warnings.map((w) => (
            <Notice key={w.kind === 'groupMissing' ? w.group : w.kind} tone="warning">
              {w.kind === 'glutesLow' ? r.warnings.glutesLow(String(w.sets), w.min) : r.warnings.groupMissing(strings.volumeGroups[w.group])}
            </Notice>
          ))}
        </>
      )}
      <FoodTargetsCard profile={profile} />
      <ExpectationsCard profile={profile} />
      {care.length > 0 && (
        <Card title={r.careTitle}>
          <CareList items={care} />
        </Card>
      )}
    </Screen>
  );
}
