import { Button, ListGroup, ListRow, Sheet, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { friendlyName } from '@/nutrition/display';
import { householdLabel, roundMacros, sumMacros, toHousehold } from '@/nutrition/macros';
import type { MenuOption } from '@/nutrition/menu';
import { equivalents, roleOf } from '@/nutrition/swaps';
import { findFood, portionsOf, useFoods } from '@/stores/foodsStore';
import { useProfile } from '@/stores/profileStore';

const m = strings.meals;

type Props = {
  option: MenuOption | null;
  itemIndex: number | null;
  onClose: () => void;
  onSwap: (foodId: string, grams: number) => void;
  onDislike: (foodId: string) => void;
  /** No modo da nutri, dá para tirar o alimento da opção. */
  onRemove?: () => void;
};

/** Trocar um alimento (seção 10.5): equivalentes do mesmo papel, já na quantidade certa. */
export function FoodSwapSheet({ option, itemIndex, onClose, onSwap, onDislike, onRemove }: Props) {
  const foods = useFoods((s) => s.foods);
  const portions = useFoods((s) => s.portions);
  const dislikes = useProfile((s) => s.profile.dislikes);
  const item = option && itemIndex != null ? option.items[itemIndex] : null;
  const food = item ? findFood(item.foodId) : undefined;
  const role = food ? roleOf(food) : null;
  // Só alimentos comuns (com medida caseira) ou meus: nada de sugestão estranha.
  const candidates = [...foods.values()].filter((f) => portions.has(f.id) || f.source === 'custom');
  const swaps =
    item && food && role && option
      ? equivalents(food, item.grams, role, candidates, { exclude: dislikes, meal: sumMacros(option.items, findFood) })
      : [];

  return (
    <Sheet visible={item != null} onClose={onClose} title={food ? m.swapTitle(friendlyName(food.name)) : undefined}>
      <Text variant="caption" color="textMuted">
        {m.swapHelp}
      </Text>
      {swaps.length === 0 ? (
        <Text color="textMuted">{m.noSwaps}</Text>
      ) : (
        <ListGroup>
          {swaps.map((s) => {
            const macros = roundMacros(s.macros);
            return (
              <ListRow
                key={s.food.id}
                title={friendlyName(s.food.name)}
                subtitle={`${householdLabel(toHousehold(s.grams, portionsOf(s.food.id)))} · ${m.shortMacros(macros.protein, macros.carbs)}`}
                onPress={() => {
                  onSwap(s.food.id, toHousehold(s.grams, portionsOf(s.food.id)).grams);
                  onClose();
                }}
              />
            );
          })}
        </ListGroup>
      )}
      {food && (
        <Button
          label={m.dislike}
          icon="thumbs-down"
          variant="ghost"
          onPress={() => {
            onDislike(food.id);
            onClose();
          }}
        />
      )}
      {onRemove && (
        <Button
          label={strings.common.remove}
          icon="trash-2"
          variant="ghost"
          onPress={() => {
            onRemove();
            onClose();
          }}
        />
      )}
    </Sheet>
  );
}
