import { useState } from 'react';
import { View } from 'react-native';

import type { DescribedItem } from '@/ai/functions/meals';
import { AIStatus } from '@/components/ai/AIStatus';
import { Button, IconButton, Notice, Sheet, Text, TextField } from '@/components/ui';
import { useAIRequest } from '@/features/ai/useAIRequest';
import { describeMealText, saveDescribed } from '@/features/meals/aiMeals';
import { strings } from '@/i18n/strings';
import { haptics } from '@/lib/haptics';
import { friendlyName } from '@/nutrition/display';
import type { MealSlot } from '@/nutrition/models';
import { findFood } from '@/stores/foodsStore';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles } from '@/theme';

const m = strings.ai.meals;
/** Abaixo disso, o item ganha "confira". */
const UNSURE = 0.6;

type Props = { visible: boolean; date: string; slot: MealSlot; onClose: () => void; onSaved: () => void };

/** "Comi outra coisa" › "Descrever com IA" (seção 10.4): texto livre vira alimentos do banco, que confiro antes de salvar. */
export function DescribeMealSheet({ visible, date, slot, onClose, onSaved }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title={m.describeTitle} snapPoints={['85%']}>
      {visible && <DescribeBody date={date} slot={slot} onSaved={onSaved} />}
    </Sheet>
  );
}

function DescribeBody({ date, slot, onSaved }: Omit<Props, 'visible' | 'onClose'>) {
  const styles = useStyles();
  const [text, setText] = useState('');
  const { state, run, retry } = useAIRequest(describeMealText);
  const [items, setItems] = useState<DescribedItem[] | null>(null);

  const send = async () => {
    const result = await run(text);
    if (result) setItems(result);
  };

  const save = async () => {
    if (!items?.length) return;
    await saveDescribed(date, slot, items);
    haptics.light();
    showSnackbar(m.saved);
    onSaved();
  };

  return (
    <View style={styles.body}>
      <TextField label={m.describeLabel} placeholder={m.describePlaceholder} value={text} onChangeText={setText} multiline />
      <Button label={m.describeSend} icon="cpu" variant="secondary" disabled={!text.trim() || state.status === 'loading'} onPress={() => void send()} />
      <AIStatus state={state} onRetry={retry} loadingText={m.describeLoading} />
      {items && items.length === 0 && <Notice icon="search">{m.describeEmpty}</Notice>}
      {items && items.length > 0 && (
        <>
          <Text variant="caption" color="textMuted">
            {m.describeReview}
          </Text>
          {items.map((item) => {
            const name = friendlyName(findFood(item.foodId)?.name ?? '');
            return (
              <View key={item.foodId} style={styles.row}>
                <View style={styles.flex}>
                  <Text variant="label">{name}</Text>
                  <Text variant="caption" color={item.confidence < UNSURE ? 'warning' : 'textMuted'}>
                    {item.grams} g{item.confidence < UNSURE ? ` · ${m.unsure}` : ''}
                  </Text>
                </View>
                <IconButton
                  icon="x"
                  color="textMuted"
                  accessibilityLabel={strings.meals.removeEntry + ' ' + m.itemLabel(name, item.grams)}
                  onPress={() => setItems((old) => (old ?? []).filter((i) => i.foodId !== item.foodId))}
                />
              </View>
            );
          })}
          <Button label={m.saveItems} icon="check" onPress={() => void save()} />
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  flex: { flex: 1 },
}));
