import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './Text';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
};

/** Pergunta curta antes de uma ação que não dá para desfazer (ex.: descartar o treino). */
export function ConfirmSheet({ visible, onClose, title, message, confirmLabel, cancelLabel, onConfirm }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title} snapPoints={['40%']}>
      <Text>{message}</Text>
      <Button
        label={confirmLabel}
        size="main"
        onPress={() => {
          onClose();
          onConfirm();
        }}
      />
      <Button label={cancelLabel} variant="ghost" onPress={onClose} />
    </Sheet>
  );
}
