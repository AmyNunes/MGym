import { Button, Card, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';

const w = strings.workout;

/** Card de aquecimento no início do treino (seção 9.3), marcável. */
export function WarmupCard({ done, onToggle }: { done: boolean; onToggle: () => void }) {
  return (
    <Card title={w.warmupTitle}>
      <Text color="textMuted">{w.warmupBody}</Text>
      <Button
        label={done ? w.warmupDoneLabel : w.warmupDone}
        icon={done ? 'check-circle' : 'circle'}
        variant={done ? 'ghost' : 'secondary'}
        onPress={onToggle}
      />
    </Card>
  );
}
