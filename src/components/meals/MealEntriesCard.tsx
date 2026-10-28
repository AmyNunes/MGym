import { IconButton, ListGroup, ListRow } from '@/components/ui';
import { deleteEntry, type MealEntry } from '@/db/mealsRepo';
import { strings } from '@/i18n/strings';
import { friendlyName } from '@/nutrition/display';
import { findFood } from '@/stores/foodsStore';

const m = strings.meals;

/** "Comi outra coisa": o que registrei pela busca, com "Tirar". */
export function MealEntriesCard({ entries, onChanged }: { entries: MealEntry[]; onChanged: () => void }) {
  const rows = entries.flatMap((e) => e.items.map((item, i) => ({ entry: e, item, key: `${e.id}-${i}` })));
  if (!rows.length) return null;
  return (
    <ListGroup title={m.entries}>
      {rows.map(({ entry, item, key }) => {
        const name = friendlyName(findFood(item.foodId)?.name ?? '');
        return (
          <ListRow
            key={key}
            title={name}
            subtitle={`${m.slots[entry.slot]} · ${item.grams} g`}
            right={
              <IconButton
                icon="x"
                color="textMuted"
                accessibilityLabel={`${m.removeEntry} ${name}`}
                onPress={() => void deleteEntry(entry.id).then(onChanged)}
              />
            }
          />
        );
      })}
    </ListGroup>
  );
}
