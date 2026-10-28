import { Stack, useLocalSearchParams } from 'expo-router';

import { MealSlotSection } from '@/components/meals/MealSlotSection';
import { EmptyState, ErrorState, Screen, Skeleton } from '@/components/ui';
import { getSlot } from '@/db/mealsRepo';
import { strings } from '@/i18n/strings';
import { useLoader } from '@/lib/useLoader';
import { loadFoods } from '@/stores/foodsStore';
import { useProfile } from '@/stores/profileStore';
import { useTheme } from '@/theme';

/** Uma refeição (seção 3: `meals/meal/[id]`): as opções e as trocas, aberta de Hoje ou de uma notificação. */
export default function MealScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfile((s) => s.profile);
  const { state, reload, refresh } = useLoader(async () => {
    await loadFoods();
    return getSlot(id);
  }, id);
  const slot = state.status === 'success' ? state.data : null;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: slot ? strings.meals.slots[slot.slot] : strings.meals.title }} />
      {state.status === 'loading' && <Skeleton height={theme.sizes.chartHeight * 2} radius="lg" />}
      {state.status === 'error' && <ErrorState onRetry={reload} />}
      {state.status === 'success' && !slot && <EmptyState icon="coffee" message={strings.common.genericError} />}
      {slot && (
        <MealSlotSection
          key={`${slot.id}-${slot.options.length}`}
          slot={slot}
          mode={profile.numbersMode}
          limitPotassium={profile.limitPotassium === true}
          nutritionistMode={profile.nutritionistMode}
          onChanged={refresh}
        />
      )}
    </Screen>
  );
}
