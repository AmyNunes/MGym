import { useState } from 'react';
import { View } from 'react-native';

import { NumberField } from '@/components/guide/Fields';
import { Button, Chip, Sheet, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatCount } from '@/nutrition/macros';
import { friendlyName } from '@/nutrition/display';
import type { Food } from '@/nutrition/models';
import { portionsOf } from '@/stores/foodsStore';
import { makeStyles } from '@/theme';

const f = strings.foods;
const COUNTS = [0.5, 1, 1.5, 2, 3];
const DEFAULT_GRAMS = 100;

type Props = { food: Food | null; onClose: () => void; onConfirm: (grams: number) => void };

/** "Quanto?": medidas caseiras em um toque (½, 1, 2…) ou gramas pelo teclado. */
export function AmountSheet({ food, onClose, onConfirm }: Props) {
  return (
    <Sheet visible={food != null} onClose={onClose} title={food ? f.amountTitle(friendlyName(food.name)) : undefined}>
      {food && <AmountBody key={food.id} food={food} onConfirm={onConfirm} />}
    </Sheet>
  );
}

function AmountBody({ food, onConfirm }: { food: Food; onConfirm: (grams: number) => void }) {
  const styles = useStyles();
  const portion = portionsOf(food.id)?.[0];
  const [grams, setGrams] = useState<number | null>(portion ? portion.grams : DEFAULT_GRAMS);

  return (
    <>
      {portion && (
        <View style={styles.chips}>
          {COUNTS.map((n) => {
            const g = Math.round(n * portion.grams);
            return (
              <Chip
                key={n}
                label={`${formatCount(n)} ${n > 1 ? portion.plural : portion.label}`}
                selected={grams === g}
                onPress={() => setGrams(g)}
              />
            );
          })}
        </View>
      )}
      <NumberField label={f.grams} value={grams} unit="g" decimals={false} step={10} onChange={setGrams} />
      {grams != null && grams > 0 && (
        <Text variant="caption" color="textMuted">
          {strings.meals.shortMacros(Math.round(((food.protein ?? 0) * grams) / 100), Math.round(((food.carbs ?? 0) * grams) / 100))}
        </Text>
      )}
      <Button label={strings.common.save} size="main" disabled={!grams} onPress={() => grams && onConfirm(grams)} />
    </>
  );
}

const useStyles = makeStyles((t) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
