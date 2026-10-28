import { router } from 'expo-router';

import { ListGroup, ListRow } from '@/components/ui';
import type { TodayData } from '@/features/today/useToday';
import { startFreeWorkout } from '@/features/workout/start';
import { strings } from '@/i18n/strings';

const t = strings.today;

/** Primeiro uso (seção 12.1): Guia, IA (opcional) e primeiro treino, com ✓ no que já foi feito. */
export function FirstUseCard({ steps }: { steps: TodayData['firstUse'] }) {
  if (steps.guide && steps.firstWorkout) return null;
  const rows = [
    { key: 'guide', label: t.steps.guide, done: steps.guide, icon: 'compass' as const, go: () => router.push('/guide') },
    { key: 'ai', label: t.steps.ai, done: steps.ai, icon: 'cpu' as const, go: () => router.push('/settings/ai') },
    {
      key: 'firstWorkout',
      label: t.steps.firstWorkout,
      done: steps.firstWorkout,
      icon: 'activity' as const,
      go: () => (steps.guide ? router.push('/workout') : void startFreeWorkout()),
    },
  ];
  return (
    <ListGroup title={t.firstUseTitle}>
      {rows.map((r) => (
        <ListRow
          key={r.key}
          icon={r.done ? 'check' : r.icon}
          iconColor={r.done ? 'success' : 'primary'}
          title={r.label}
          onPress={r.done ? undefined : r.go}
          accessibilityHint={r.done ? t.stepDone(r.label) : undefined}
        />
      ))}
    </ListGroup>
  );
}
