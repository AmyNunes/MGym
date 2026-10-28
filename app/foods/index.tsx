import { FlashList } from '@shopify/flash-list';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AmountSheet } from '@/components/foods/AmountSheet';
import { FoodRow } from '@/components/foods/FoodRow';
import { DescribeMealSheet } from '@/components/meals/DescribeMealSheet';
import { Button, Chip, EmptyState, ErrorState, Screen, SearchField, Skeleton, Text } from '@/components/ui';
import { categories as listCategories, touchFoods } from '@/db/foodsRepo';
import { insertEntry } from '@/db/mealsRepo';
import { useFoodSearch } from '@/features/foods/useFoodSearch';
import { addItemToOption } from '@/features/meals/menuService';
import { strings } from '@/i18n/strings';
import { useLoader } from '@/lib/useLoader';
import { friendlyName } from '@/nutrition/display';
import { MEAL_SLOTS, type Food, type MealSlot } from '@/nutrition/models';
import { patchProfile, useProfile } from '@/stores/profileStore';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles, useTheme } from '@/theme';

const f = strings.foods;

/**
 * Busca de alimentos (seção 10.2). Com `?pick=`, escolhe um alimento para "Não como", "Amo",
 * "Comi outra coisa" (com `date` e `slot`) ou uma opção do modo da nutri (com `slotId` e `option`).
 */
export default function FoodsScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const params = useLocalSearchParams<{ pick?: string; date?: string; slot?: string; slotId?: string; option?: string }>();
  const pick = (['dislikes', 'likes', 'entry', 'option'] as const).find((p) => p === params.pick) ?? null;
  const search = useFoodSearch();
  const cats = useLoader(listCategories);
  const [amountFor, setAmountFor] = useState<Food | null>(null);
  const [describing, setDescribing] = useState(false);
  const entrySlot = MEAL_SLOTS.find((s) => s === params.slot);

  const choose = async (food: Food) => {
    if (pick === 'dislikes' || pick === 'likes') {
      const list = useProfile.getState().profile[pick];
      await patchProfile({ [pick]: [...new Set([...list, food.id])] });
      showSnackbar(f.added(friendlyName(food.name)));
      router.back();
    } else if (pick === 'entry' || pick === 'option') {
      setAmountFor(food);
    } else {
      router.push(`/foods/${food.id}`);
    }
  };

  const saveEntry = async (grams: number) => {
    const food = amountFor;
    const slot: MealSlot | undefined = entrySlot;
    setAmountFor(null);
    if (!food) return;
    if (pick === 'option' && params.slotId) {
      await addItemToOption(params.slotId, Number(params.option ?? 0), food.id, grams, strings.meals.builtOption);
    } else {
      if (!params.date || !slot) return;
      await insertEntry({ date: params.date, slot, items: [{ foodId: food.id, grams }], source: 'search' });
      await touchFoods([food.id]);
    }
    showSnackbar(f.added(friendlyName(food.name)));
    router.back();
  };

  const data = search.state.status === 'success' ? search.state.data : null;
  const list = data?.mode === 'search' ? data.results : [...(data?.favorites ?? []), ...(data?.recents ?? []).filter((r) => !data?.favorites.some((x) => x.id === r.id))];

  return (
    <Screen edges={[]} scroll={false}>
      <Stack.Screen options={{ title: pick ? f.pickTitle[pick] : f.title }} />
      <FlashList
        data={list}
        keyExtractor={(food) => food.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchField value={search.query} onChangeText={search.setQuery} placeholder={f.search} />
            {pick === 'entry' && params.date && entrySlot && (
              <Button label={strings.ai.meals.describe} icon="cpu" variant="secondary" onPress={() => setDescribing(true)} />
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label={f.allCategories} selected={search.category == null} onPress={() => search.setCategory(null)} />
              {(cats.state.status === 'success' ? cats.state.data : []).map((c) => (
                <Chip key={c} label={c} selected={search.category === c} onPress={() => search.setCategory(search.category === c ? null : c)} />
              ))}
            </ScrollView>
            {search.state.status === 'loading' && <Skeleton height={theme.sizes.listRowHeight * 3} radius="lg" />}
            {search.state.status === 'error' && <ErrorState onRetry={search.reload} />}
            {data?.mode === 'browse' && list.length > 0 && (
              <Text variant="label" color="textMuted">
                {data.favorites.length ? f.favorites : f.recents}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          data?.mode === 'search' ? (
            <EmptyState icon="search" message={f.empty} action={{ label: f.create, onPress: () => router.push('/foods/new') }} />
          ) : null
        }
        ListFooterComponent={
          !pick || pick === 'entry' || pick === 'option' ? <Button label={f.create} icon="plus" variant="ghost" onPress={() => router.push('/foods/new')} /> : null
        }
        renderItem={({ item }) => (
          <FoodRow food={item} onPress={() => void choose(item)} onToggleFavorite={() => void search.toggleFavorite(item)} />
        )}
      />
      <AmountSheet food={amountFor} onClose={() => setAmountFor(null)} onConfirm={(g) => void saveEntry(g)} />
      {pick === 'entry' && params.date && entrySlot && (
        <DescribeMealSheet
          visible={describing}
          date={params.date}
          slot={entrySlot}
          onClose={() => setDescribing(false)}
          onSaved={() => {
            setDescribing(false);
            router.back();
          }}
        />
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  content: { paddingHorizontal: t.spacing.screen, paddingBottom: t.spacing.huge },
  header: { gap: t.spacing.md, paddingTop: t.spacing.sm, paddingBottom: t.spacing.md },
  chips: { gap: t.spacing.sm },
}));
