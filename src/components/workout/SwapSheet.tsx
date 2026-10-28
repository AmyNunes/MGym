import { ListGroup, ListRow, Sheet, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { substitutesOf } from '@/training/catalog';
import type { Exercise } from '@/training/exerciseModel';

type Props = {
  exercise: Exercise | null;
  onClose: () => void;
  onPick: (exerciseId: string) => void;
};

/** "Trocar exercício": as melhores trocas do catálogo, em ordem de preferência (seção 9.1). */
export function SwapSheet({ exercise, onClose, onPick }: Props) {
  const options = exercise ? substitutesOf(exercise) : [];
  return (
    <Sheet visible={exercise != null} onClose={onClose} title={strings.workout.swapTitle}>
      {options.length === 0 ? (
        <Text color="textMuted">{strings.workout.noSwaps}</Text>
      ) : (
        <ListGroup>
          {options.map((o) => (
            <ListRow
              key={o.id}
              icon="repeat"
              title={o.name}
              subtitle={`${strings.groups[o.group]} · ${o.equipment.map((e) => strings.equipment[e]).join(', ')}`}
              onPress={() => {
                onPick(o.id);
                onClose();
              }}
            />
          ))}
        </ListGroup>
      )}
    </Sheet>
  );
}
