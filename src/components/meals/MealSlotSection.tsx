import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';

import { Button, IconButton, Text } from '@/components/ui';
import type { MealSlotRecord } from '@/db/mealsRepo';
import { chooseOption, dislikeFood, removeItem, swapItem, toggleAte } from '@/features/meals/menuService';
import { GESTURES } from '@/gestures/thresholds';
import { strings } from '@/i18n/strings';
import { haptics } from '@/lib/haptics';
import type { NumbersMode } from '@/profile/profile';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles } from '@/theme';
import { findFood } from '@/stores/foodsStore';
import { friendlyName } from '@/nutrition/display';
import { optionOrder } from '@/nutrition/menu';

import { AiOptionsButton } from './AiOptionsButton';
import { FoodSwapSheet } from './FoodSwapSheet';
import { MealOptionCard } from './MealOptionCard';
import { TemplatePickerSheet } from './TemplatePickerSheet';

const m = strings.meals;

type Props = {
  slot: MealSlotRecord;
  mode: NumbersMode;
  limitPotassium: boolean;
  nutritionistMode: boolean;
  onChanged: () => void;
};

/** Uma refeição do dia (seção 10.4): as opções (deslizar, setas ou pontos), escolher, "Comi" e trocas. */
export function MealSlotSection({ slot, mode, limitPotassium, nutritionistMode, onChanged }: Props) {
  const styles = useStyles();
  const total = slot.options.length;
  // No modo "Sem números", as opções aparecem da mais proteica para a menos (10.6).
  const order = optionOrder(slot.options, mode === 'none', findFood);
  const [position, setPosition] = useState(Math.max(0, order.indexOf(slot.chosenIndex ?? order[0] ?? 0)));
  const index = order[position] ?? 0;
  const [swapItemIndex, setSwapItemIndex] = useState<number | null>(null);
  const [templates, setTemplates] = useState(false);
  const option = slot.options[index] ?? null;
  const name = m.slots[slot.slot];

  const go = (delta: number) => total > 1 && setPosition((i) => (i + delta + total) % total);
  const pan = usePanGesture({
    runOnJS: true,
    activeOffsetX: GESTURES.swipeActivateX,
    failOffsetY: GESTURES.swipeFailY,
    onDeactivate: (e) => {
      if (e.translationX <= -GESTURES.swipeCommit / 2) go(1);
      else if (e.translationX >= GESTURES.swipeCommit / 2) go(-1);
    },
  });

  const run = (task: Promise<unknown>) => void task.then(onChanged);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="heading" accessibilityRole="header" style={styles.flex}>
          {m.slotTitle(name, slot.time)}
        </Text>
        {slot.eatenAt && (
          <Text variant="label" color="success">
            {m.ateDone}
          </Text>
        )}
      </View>

      {option ? (
        <GestureDetector gesture={pan}>
          <View>
            <MealOptionCard
              option={option}
              mode={mode}
              limitPotassium={limitPotassium}
              chosen={slot.chosenIndex === index}
              eaten={slot.eatenAt != null && slot.chosenIndex === index}
              onChoose={() => run(chooseOption(slot, index))}
              onAte={() =>
                run(
                  toggleAte(slot, index).then((ate) => {
                    if (ate) {
                      haptics.light();
                      showSnackbar(m.marked);
                    }
                  }),
                )
              }
              onSwapItem={setSwapItemIndex}
            />
          </View>
        </GestureDetector>
      ) : (
        <Text color="textMuted">{m.noOptions}</Text>
      )}

      {total > 1 && (
        <View style={styles.pager}>
          <IconButton icon="chevron-left" accessibilityLabel={m.prevOption} onPress={() => go(-1)} />
          <View style={styles.dots} accessible accessibilityLabel={m.option(position + 1, total)}>
            {slot.options.map((_, i) => (
              <View key={i} style={[styles.dot, i === position && styles.dotActive]} />
            ))}
          </View>
          <IconButton icon="chevron-right" accessibilityLabel={m.nextOption} onPress={() => go(1)} />
        </View>
      )}

      {nutritionistMode && (
        <View style={styles.row}>
          <Button
            label={option ? m.addFood : m.addOption}
            icon="plus"
            variant="secondary"
            onPress={() => router.push(`/foods?pick=option&slotId=${slot.id}&option=${option ? index : total}`)}
          />
          <Button label={m.fromTemplate} variant="ghost" onPress={() => setTemplates(true)} />
        </View>
      )}
      {!nutritionistMode && !slot.eatenAt && <AiOptionsButton slotId={slot.id} onDone={onChanged} />}
      <Button
        label={m.ateSomethingElse}
        variant="ghost"
        icon="search"
        onPress={() => router.push(`/foods?pick=entry&date=${slot.date}&slot=${slot.slot}`)}
      />

      <FoodSwapSheet
        option={option}
        itemIndex={swapItemIndex}
        onClose={() => setSwapItemIndex(null)}
        onSwap={(foodId, grams) => swapItemIndex != null && run(swapItem(slot.id, index, swapItemIndex, foodId, grams))}
        onDislike={(foodId) =>
          run(dislikeFood(foodId).then(() => showSnackbar(m.disliked(friendlyName(findFood(foodId)?.name ?? '')))))
        }
        onRemove={nutritionistMode ? () => swapItemIndex != null && run(removeItem(slot.id, index, swapItemIndex)) : undefined}
      />
      {nutritionistMode && (
        <TemplatePickerSheet visible={templates} slot={slot} onClose={() => setTemplates(false)} onAdded={onChanged} />
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  section: { gap: t.spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  flex: { flex: 1 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: t.spacing.xs, paddingHorizontal: t.spacing.sm },
  dot: { width: t.spacing.sm, height: t.spacing.sm, borderRadius: t.radii.full, backgroundColor: t.colors.border },
  dotActive: { backgroundColor: t.colors.primary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
