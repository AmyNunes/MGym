import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, ListGroup, ListRow, Sheet, Skeleton, Text } from '@/components/ui';
import type { MealSlotRecord } from '@/db/mealsRepo';
import { toggleAte } from '@/features/meals/menuService';
import { loadMealsDay, type MealsDay } from '@/features/meals/useMealsDay';
import { nextMeal } from '@/features/today/nextMeal';
import { strings } from '@/i18n/strings';
import { appDayKey, parseDateKey } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { useProfile } from '@/stores/profileStore';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles, useTheme } from '@/theme';

const m = strings.meals;

type Props = { visible: boolean; onClose: () => void };

/** + › "Marcar refeição" (seção 6.1): marca uma refeição de hoje em 1 toque, ou abre "Comi outra coisa". */
export function MarkMealSheet({ visible, onClose }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title={m.markTitle}>
      {visible && <MarkMealList onClose={onClose} />}
    </Sheet>
  );
}

function MarkMealList({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const styles = useStyles();
  const completed = useProfile((s) => s.completed);
  const [day, setDay] = useState<MealsDay | null | 'error'>(null);

  useEffect(() => {
    let alive = true;
    loadMealsDay(parseDateKey(appDayKey(new Date()))).then(
      (d) => alive && setDay(d),
      () => alive && setDay('error'),
    );
    return () => {
      alive = false;
    };
  }, []);

  if (day === null) return <Skeleton height={theme.sizes.listRowHeight * 3} radius="lg" />;
  if (day === 'error') return <Text color="textMuted">{m.loadError}</Text>;
  if (day.status === 'needsProfile') {
    return (
      <View style={styles.empty}>
        <Text color="textMuted">{m.needsProfile}</Text>
        <Button
          label={m.answerGuide}
          onPress={() => {
            onClose();
            router.push(completed ? '/guide/body?edit=1' : '/guide');
          }}
        />
      </View>
    );
  }

  const mark = (slot: MealSlotRecord) =>
    void toggleAte(slot, slot.chosenIndex ?? 0).then(() => {
      haptics.light();
      showSnackbar(m.marked);
      onClose();
    });
  const target = nextMeal(day.slots, new Date()) ?? day.slots.at(-1);

  return (
    <View style={styles.empty}>
      {day.slots.length === 0 && <Text color="textMuted">{m.markEmpty}</Text>}
      {day.slots.length > 0 && (
        <ListGroup>
          {day.slots.map((slot) => (
            <ListRow
              key={slot.id}
              icon={slot.eatenAt ? 'check' : 'coffee'}
              iconColor={slot.eatenAt ? 'success' : 'primary'}
              title={m.slotTitle(m.slots[slot.slot], slot.time)}
              subtitle={slot.eatenAt ? m.ateDone : slot.options[slot.chosenIndex ?? 0]?.name}
              onPress={slot.eatenAt || !slot.options.length ? undefined : () => mark(slot)}
            />
          ))}
        </ListGroup>
      )}
      <Button
        label={m.ateSomethingElse}
        variant="secondary"
        icon="search"
        onPress={() => {
          onClose();
          router.push(`/foods?pick=entry&date=${day.date}&slot=${target?.slot ?? 'lunch'}`);
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  empty: { gap: t.spacing.md },
}));
