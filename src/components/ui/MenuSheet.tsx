import type { IconName } from './Icon';
import { ListGroup } from './ListGroup';
import { ListRow } from './ListRow';
import { Sheet } from './Sheet';

export type MenuAction = {
  label: string;
  icon: IconName;
  onPress: () => void;
  /** Ações destrutivas (excluir, descartar) ficam em `danger`. */
  destructive?: boolean;
  hidden?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: MenuAction[];
};

/** Menu ⋯ em bottom sheet: a alternativa visível dos gestos (seção 7). */
export function MenuSheet({ visible, onClose, title, actions }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title} snapPoints={['50%', '75%']}>
      <ListGroup>
        {actions
          .filter((a) => !a.hidden)
          .map((a) => (
            <ListRow
              key={a.label}
              icon={a.icon}
              iconColor={a.destructive ? 'danger' : 'primary'}
              title={a.label}
              onPress={() => {
                onClose();
                a.onPress();
              }}
              right={null}
            />
          ))}
      </ListGroup>
    </Sheet>
  );
}
