import { ListGroup, ListRow, Sheet } from '@/components/ui';
import { MEAL_TEMPLATES } from '@/data/meals';
import type { MealSlotRecord } from '@/db/mealsRepo';
import { addOptionFromTemplate } from '@/features/meals/menuService';
import { strings } from '@/i18n/strings';
import { SLOT_KIND } from '@/nutrition/models';

type Props = { visible: boolean; slot: MealSlotRecord; onClose: () => void; onAdded: () => void };

/** Modo da nutri: escolher uma refeição-modelo para virar opção (nas quantidades base). */
export function TemplatePickerSheet({ visible, slot, onClose, onAdded }: Props) {
  const list = MEAL_TEMPLATES.filter((t) => t.kinds.includes(SLOT_KIND[slot.slot]));
  return (
    <Sheet visible={visible} onClose={onClose} title={strings.meals.templatesTitle}>
      <ListGroup>
        {list.map((t) => (
          <ListRow
            key={t.id}
            title={t.name}
            onPress={() => {
              onClose();
              void addOptionFromTemplate(slot.id, t.id).then(onAdded);
            }}
          />
        ))}
      </ListGroup>
    </Sheet>
  );
}
