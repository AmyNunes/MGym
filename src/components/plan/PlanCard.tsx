import { router } from 'expo-router';

import { Chip, IconButton, ListGroup, ListRow } from '@/components/ui';
import type { PlanView } from '@/features/plan/usePlan';
import { startPlanDay } from '@/features/workout/start';
import { strings } from '@/i18n/strings';

const w = strings.workoutTab;

/** O plano atual (seção 12.2): dias com duração e exercícios; tocar edita, ▶ começa. */
export function PlanCard({ view, nextIndex }: { view: PlanView; nextIndex: number }) {
  return (
    <ListGroup title={w.planTitle} footer={strings.plan.templates[view.plan.template]}>
      {view.days.map((day, i) => (
        <ListRow
          key={day.id}
          icon={i === nextIndex ? 'play-circle' : 'calendar'}
          iconColor={i === nextIndex ? 'primary' : 'textMuted'}
          title={day.name}
          subtitle={strings.result.day(day.minutes, day.exercises.length)}
          onPress={() => router.push(`/plan/day/${day.id}`)}
          accessibilityHint={i === nextIndex ? w.nextLabel(day.name) : undefined}
          right={
            <>
              {i === nextIndex && <Chip label={w.next} />}
              <IconButton
                icon="play"
                color="primary"
                accessibilityLabel={w.startRoutine(day.name)}
                onPress={() => void startPlanDay(day, view.plan)}
              />
            </>
          }
        />
      ))}
    </ListGroup>
  );
}
