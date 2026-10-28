import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Card, EmptyState, ErrorState, Icon, IconButton, Screen, Segmented, Skeleton, SwipeableRow, Text } from '@/components/ui';
import { deleteShoppingItem, restoreShoppingItem, setShoppingChecked, shoppingList, type ShoppingItem } from '@/db/mealsRepo';
import { generateShopping } from '@/features/meals/menuService';
import { strings } from '@/i18n/strings';
import { appDayKey, parseDateKey } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { useLoader } from '@/lib/useLoader';
import { SECTIONS, type Section } from '@/nutrition/shopping';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles, useTheme } from '@/theme';

const s = strings.shopping;

/** Lista de compras (seção 10.7): por seção do mercado; toque marca como comprado. */
export default function ShoppingScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const { state, reload, refresh } = useLoader(shoppingList);
  const [days, setDays] = useState<'3' | '7'>('7');
  const [busy, setBusy] = useState(false);
  const items = state.status === 'success' ? state.data : [];
  const done = items.filter((i) => i.checked).length;

  const generate = async () => {
    setBusy(true);
    await generateShopping(parseDateKey(appDayKey(new Date())), days === '3' ? 3 : 7);
    setBusy(false);
    refresh();
  };

  const toggle = (item: ShoppingItem) => {
    haptics.light();
    void setShoppingChecked(item.id, !item.checked).then(refresh);
  };

  const remove = (item: ShoppingItem) =>
    void deleteShoppingItem(item.id).then(() => {
      refresh();
      showSnackbar(s.removed(item.label), { label: strings.common.undo, onPress: () => void restoreShoppingItem(item).then(refresh) });
    });

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: s.title }} />
      <Card title={s.days}>
        <Segmented
          accessibilityLabel={s.days}
          options={[
            { value: '3', label: s.daysOption(3) },
            { value: '7', label: s.daysOption(7) },
          ]}
          value={days}
          onChange={setDays}
        />
        <Text variant="caption" color="textMuted">
          {s.help}
        </Text>
        <Button label={items.length ? s.regenerate : s.generate} icon="shopping-cart" loading={busy} onPress={() => void generate()} />
      </Card>

      {state.status === 'loading' && <Skeleton height={theme.sizes.listRowHeight * 4} radius="lg" />}
      {state.status === 'error' && <ErrorState onRetry={reload} />}
      {state.status === 'success' && items.length === 0 && <EmptyState icon="shopping-cart" message={s.empty} />}
      {items.length > 0 && (
        <Text variant="label" color="textMuted" accessibilityLiveRegion="polite">
          {s.progress(done, items.length)}
        </Text>
      )}
      {SECTIONS.map((section: Section) => {
        const rows = items.filter((i) => i.section === section);
        if (!rows.length) return null;
        return (
          <View key={section} style={styles.group}>
            <Text variant="label" color="textMuted" accessibilityRole="header">
              {s.sections[section]}
            </Text>
            {rows.map((item) => (
              <SwipeableRow key={item.id} left={{ icon: 'trash-2', color: 'danger', onCommit: () => remove(item) }}>
                <View style={styles.row}>
                  <Pressable
                    onPress={() => toggle(item)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.checked }}
                    accessibilityLabel={s.item(item.label, item.quantity, item.checked)}
                    style={styles.main}
                  >
                    <Icon name={item.checked ? 'check-square' : 'square'} color={item.checked ? 'success' : 'textMuted'} />
                    <View style={styles.texts}>
                      <Text style={item.checked && styles.checked}>{item.label}</Text>
                      <Text variant="caption" color="textMuted">
                        {item.quantity}
                      </Text>
                    </View>
                  </Pressable>
                  <IconButton icon="x" color="textMuted" accessibilityLabel={s.remove(item.label)} onPress={() => remove(item)} />
                </View>
              </SwipeableRow>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  group: { gap: t.spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: t.radii.md,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.hairline,
    borderColor: t.colors.border,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, minHeight: t.sizes.listRowHeight, paddingHorizontal: t.spacing.lg },
  texts: { flex: 1 },
  checked: { textDecorationLine: 'line-through', opacity: t.opacity.pressed },
}));
