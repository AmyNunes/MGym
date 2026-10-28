import { Pressable, View } from 'react-native';
import { GestureDetector, useTapGesture } from 'react-native-gesture-handler';

import { Button, Icon, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatCount, handPortion, householdLabel, itemMacros, roundMacros, sumMacros, toHousehold } from '@/nutrition/macros';
import type { MenuOption } from '@/nutrition/menu';
import { friendlyName } from '@/nutrition/display';
import { isHighPotassium, roleOf } from '@/nutrition/swaps';
import type { NumbersMode } from '@/profile/profile';
import { findFood, portionsOf } from '@/stores/foodsStore';
import { makeStyles, TINT, useTheme, withAlpha } from '@/theme';

const m = strings.meals;

type Props = {
  option: MenuOption;
  mode: NumbersMode;
  limitPotassium: boolean;
  chosen: boolean;
  eaten: boolean;
  onChoose: () => void;
  onAte: () => void;
  onSwapItem: (index: number) => void;
};

/** Uma opção de refeição (seção 4.4): alimentos em medidas caseiras, macros conforme o modo e as ações. */
export function MealOptionCard({ option, mode, limitPotassium, chosen, eaten, onChoose, onAte, onSwapItem }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const total = roundMacros(sumMacros(option.items, findFood));
  const doubleTap = useTapGesture({ numberOfTaps: 2, runOnJS: true, onActivate: () => !eaten && onAte() });

  return (
    <GestureDetector gesture={doubleTap}>
      <View style={[styles.card, chosen && styles.chosen]} accessibilityHint={m.doubleTapHint}>
        {eaten && <View style={[styles.tint, { backgroundColor: withAlpha(theme.colors.success, TINT) }]} />}
        <Text variant="heading">{option.name}</Text>
        <View style={styles.items}>
          {option.items.map((item, index) => {
            const food = findFood(item.foodId);
            if (!food) return null;
            const h = toHousehold(item.grams, portionsOf(item.foodId));
            const amount =
              mode === 'none' ? handText(roleOf(food) ?? 'carb', itemMacros(food, item.grams)) : `${householdLabel(h)}${h.portion ? ` ${m.gramsSuffix(item.grams)}` : ''}`;
            return (
              <Pressable
                key={`${item.foodId}-${index}`}
                onPress={() => onSwapItem(index)}
                accessibilityRole="button"
                accessibilityLabel={`${friendlyName(food.name)}, ${amount}. ${m.swapFood}`}
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}
              >
                <View style={styles.itemText}>
                  <Text variant="label">{friendlyName(food.name)}</Text>
                  <Text variant="caption" color="textMuted">
                    {amount}
                  </Text>
                </View>
                {limitPotassium && isHighPotassium(food) && (
                  <Text variant="caption" color="warning">
                    {m.potassiumHigh}
                  </Text>
                )}
                <Icon name="repeat" color="textMuted" size={theme.sizes.iconSmall} />
              </Pressable>
            );
          })}
        </View>
        {mode !== 'none' && (
          <Text variant="label" color="textMuted">
            {mode === 'all' ? m.allMacros(total.kcal, total.protein, total.carbs, total.fat) : m.shortMacros(total.protein, total.carbs)}
          </Text>
        )}
        <View style={styles.actions}>
          {!chosen && <Button label={m.choose} variant="secondary" onPress={onChoose} />}
          <View style={styles.flex}>
            <Button label={eaten ? m.ateDone : m.ate} icon={eaten ? 'check-circle' : 'check'} variant={eaten ? 'ghost' : 'primary'} onPress={onAte} />
          </View>
        </View>
      </View>
    </GestureDetector>
  );
}

function handText(role: 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit', macros: ReturnType<typeof itemMacros>): string {
  const h = handPortion(role, macros);
  if (h.unit === 'veggies') return m.hand.veggies;
  return m.hand[h.unit](formatCount(h.count));
}

const useStyles = makeStyles((t) => ({
  card: {
    gap: t.spacing.md,
    padding: t.spacing.lg,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.hairline,
    borderColor: t.colors.border,
    overflow: 'hidden',
  },
  chosen: { borderColor: t.colors.primary, borderWidth: t.sizes.hairline * 2 },
  tint: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  items: { gap: t.spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: t.sizes.touchTarget },
  itemText: { flex: 1 },
  pressed: { opacity: t.opacity.pressed },
  actions: { flexDirection: 'row', gap: t.spacing.sm },
  flex: { flex: 1 },
}));
