import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Button, Card, EmptyState, ListGroup, ListRow, Notice, Screen, Skeleton, Text, Toggle } from '@/components/ui';
import { deleteCustomFood } from '@/db/foodsRepo';
import { strings } from '@/i18n/strings';
import { formatKgNumber } from '@/lib/format';
import { friendlyName } from '@/nutrition/display';
import { itemMacros } from '@/nutrition/macros';
import { isHighPotassium } from '@/nutrition/swaps';
import { loadFoods, portionsOf, useFoods } from '@/stores/foodsStore';
import { patchProfile, useProfile } from '@/stores/profileStore';
import { makeStyles, useTheme } from '@/theme';

const f = strings.foods;
const v = f.values;

/** Detalhe do alimento (seção 10.2): por 100 g e por medida caseira, potássio, "Amo" e "Não como". */
export default function FoodScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const loaded = useFoods((s) => s.loaded);
  const profile = useProfile((s) => s.profile);
  const food = useFoods((s) => s.foods.get(id));

  useEffect(() => {
    if (!loaded) void loadFoods().catch(() => {});
  }, [loaded]);

  if (!loaded) {
    return (
      <Screen edges={[]}>
        <Skeleton height={theme.sizes.chartHeight} radius="lg" />
      </Screen>
    );
  }
  if (!food) {
    return (
      <Screen edges={[]}>
        <EmptyState icon="alert-circle" message={f.notFound} />
      </Screen>
    );
  }

  const value = (n: number | null) => (n == null ? f.noData : formatKgNumber(n));
  const rows: [string, number | null][] = [
    [v.kcal, food.kcal],
    [v.protein, food.protein],
    [v.carbs, food.carbs],
    [v.fat, food.fat],
    [v.fiber, food.fiber],
    [v.sodium, food.sodium],
    [v.potassium, food.potassium],
  ];
  const toggleList = (key: 'likes' | 'dislikes', on: boolean) =>
    void patchProfile({ [key]: on ? [...new Set([...profile[key], food.id])] : profile[key].filter((x) => x !== food.id) });

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: friendlyName(food.name) }} />
      <Card title={f.per100Title}>
        {rows.map(([label, n]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.flex}>{label}</Text>
            <Text variant="label">{value(n)}</Text>
          </View>
        ))}
      </Card>
      {profile.limitPotassium && isHighPotassium(food) && <Notice tone="warning">{strings.meals.potassiumHigh}</Notice>}

      {(portionsOf(food.id) ?? []).length > 0 && (
        <ListGroup title={f.portions}>
          {(portionsOf(food.id) ?? []).map((p) => {
            const m = itemMacros(food, p.grams);
            return (
              <ListRow
                key={p.label}
                title={f.perPortion(p.label, p.grams)}
                subtitle={strings.meals.allMacros(Math.round(m.kcal), Math.round(m.protein), Math.round(m.carbs), Math.round(m.fat))}
              />
            );
          })}
        </ListGroup>
      )}

      <ListGroup>
        <ListRow
          title={f.like}
          right={<Toggle value={profile.likes.includes(food.id)} onValueChange={(on) => toggleList('likes', on)} accessibilityLabel={f.like} />}
        />
        <ListRow
          title={f.dislike}
          right={<Toggle value={profile.dislikes.includes(food.id)} onValueChange={(on) => toggleList('dislikes', on)} accessibilityLabel={f.dislike} />}
        />
      </ListGroup>

      <Text variant="caption" color="textMuted">
        {food.source === 'taco' ? f.source : f.customSource}
      </Text>
      {food.source === 'custom' && (
        <Button
          label={f.deleteCustom}
          icon="trash-2"
          variant="ghost"
          onPress={() =>
            void deleteCustomFood(food.id)
              .then(() => loadFoods(true))
              .then(() => router.back())
          }
        />
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: t.sizes.touchTarget - t.spacing.md },
  flex: { flex: 1 },
}));
