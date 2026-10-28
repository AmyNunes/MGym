import { strings } from '@/i18n/strings';
import { useSettings } from '@/stores/settingsStore';

import { Button } from './Button';
import { Notice } from './Notice';
import { Text } from './Text';

type Props = { id: string; message: string };

/** Dica de gesto na primeira vez (seção 7). Some para sempre no "Entendi". */
export function CoachMark({ id, message }: Props) {
  const seen = useSettings((s) => s.tips.seen);
  const update = useSettings((s) => s.update);
  if (seen.includes(id)) return null;

  return (
    <Notice
      icon="info"
      action={
        <Button label={strings.workout.gotIt} variant="ghost" onPress={() => void update('tips', { seen: [...seen, id] })} />
      }
    >
      <Text variant="label">{message}</Text>
    </Notice>
  );
}
