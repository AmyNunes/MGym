import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { CardioSheet } from '@/components/cardio/CardioSheet';
import { MarkMealSheet } from '@/components/meals/MarkMealSheet';
import { WeightPad } from '@/components/progress/WeightPad';
import { Icon, ListGroup, ListRow, Sheet } from '@/components/ui';
import { startFreeWorkout } from '@/features/workout/start';
import { strings } from '@/i18n/strings';
import { haptics } from '@/lib/haptics';
import { closeQuickAdd, openQuickAdd, useQuickAdd } from '@/stores/quickAddStore';
import { makeStyles } from '@/theme';

const q = strings.quickAdd;

/** Botão "+" da tab bar (seção 6.1): 56 dp, `primary`, abre o registro rápido. */
export function QuickAddButton() {
  const styles = useStyles();
  return (
    <Pressable
      onPress={() => {
        haptics.light();
        openQuickAdd('menu');
      }}
      accessibilityRole="button"
      accessibilityLabel={q.open}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Icon name="plus" color="onPrimary" />
    </Pressable>
  );
}

/** As folhas do registro rápido. Fica no layout das abas; Hoje também abre o cardio por aqui. */
export function QuickAddHost() {
  const sheet = useQuickAdd((s) => s.sheet);
  return (
    <>
      <Sheet visible={sheet === 'menu'} onClose={closeQuickAdd} title={q.title}>
        <ListGroup>
          <ListRow
            icon="zap"
            title={q.freeWorkout}
            subtitle={q.freeWorkoutHint}
            onPress={() => {
              closeQuickAdd();
              void startFreeWorkout();
            }}
          />
          <ListRow icon="wind" title={q.cardio} subtitle={q.cardioHint} onPress={() => openQuickAdd('cardio')} />
          <ListRow icon="coffee" title={q.meal} subtitle={q.mealHint} onPress={() => openQuickAdd('meal')} />
          <ListRow icon="trending-down" title={q.weight} subtitle={q.weightHint} onPress={() => openQuickAdd('weight')} />
          <ListRow
            icon="maximize-2"
            title={q.measures}
            subtitle={q.measuresHint}
            onPress={() => {
              closeQuickAdd();
              router.push('/progress/measure');
            }}
          />
        </ListGroup>
      </Sheet>
      <CardioSheet visible={sheet === 'cardio'} onClose={closeQuickAdd} />
      <MarkMealSheet visible={sheet === 'meal'} onClose={closeQuickAdd} />
      <WeightPad visible={sheet === 'weight'} onClose={closeQuickAdd} />
    </>
  );
}

const useStyles = makeStyles((t) => ({
  fab: {
    width: t.sizes.fab,
    height: t.sizes.fab,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: t.elevation.fab,
  },
  pressed: { opacity: t.opacity.pressed },
}));
