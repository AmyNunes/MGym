import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MacroBar } from '@/components/meals/MacroBar';
import { MealEntriesCard } from '@/components/meals/MealEntriesCard';
import { MealSlotSection } from '@/components/meals/MealSlotSection';
import { Card, EmptyState, ErrorState, IconButton, MenuSheet, Notice, Screen, ScreenHeader, Skeleton, Text } from '@/components/ui';
import { regenerateDay, regenerateWeek } from '@/features/meals/menuService';
import { useMealsDay } from '@/features/meals/useMealsDay';
import { strings } from '@/i18n/strings';
import { addDays, formatShortDate, parseDateKey, appDayKey } from '@/lib/dates';
import { usesSpironolactone } from '@/profile/profile';
import { useProfile } from '@/stores/profileStore';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles, useTheme } from '@/theme';

const m = strings.meals;

/** Cardápio (seção 12.5): o dia com as refeições, as opções e a MacroBar. */
export default function MealsScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const profile = useProfile((s) => s.profile);
  const completed = useProfile((s) => s.completed);
  const [date, setDate] = useState(() => parseDateKey(appDayKey(new Date())));
  const [menu, setMenu] = useState(false);
  const { state, reload, refresh } = useMealsDay(date);
  const data = state.status === 'success' && state.data.status === 'ready' ? state.data : null;
  const isToday = appDayKey(date) === appDayKey(new Date());

  return (
    <Screen>
      <ScreenHeader
        title={m.title}
        right={<IconButton icon="more-vertical" accessibilityLabel={m.dayMenu} onPress={() => setMenu(true)} />}
      />
      <View style={styles.dayNav}>
        <IconButton icon="chevron-left" accessibilityLabel={m.prevDay} onPress={() => setDate((d) => addDays(d, -1))} />
        <Text variant="label" style={styles.dayLabel} accessibilityLiveRegion="polite">
          {isToday ? `${m.today} · ${formatShortDate(date)}` : formatShortDate(date)}
        </Text>
        <IconButton icon="chevron-right" accessibilityLabel={m.nextDay} onPress={() => setDate((d) => addDays(d, 1))} />
      </View>

      {state.status === 'loading' && (
        <>
          <Skeleton height={theme.sizes.listRowHeight * 2} radius="lg" />
          <Skeleton height={theme.sizes.chartHeight * 2} radius="lg" />
        </>
      )}
      {state.status === 'error' && <ErrorState message={m.loadError} onRetry={reload} />}
      {state.status === 'success' && state.data.status === 'needsProfile' && (
        <EmptyState
          icon="coffee"
          message={m.needsProfile}
          action={{ label: m.answerGuide, onPress: () => router.push(completed ? '/guide/body?edit=1' : '/guide') }}
        />
      )}
      {data && (
        <>
          <Card>
            <MacroBar eaten={data.eaten} target={data.targets.day} mode={profile.numbersMode} />
          </Card>
          {usesSpironolactone(profile) && <Notice icon="info">{m.spiroTip}</Notice>}
          {profile.nutritionistMode && <Notice icon="user">{m.nutriMode}</Notice>}
          {data.slots.map((slot) => (
            <MealSlotSection
              key={`${slot.id}-${slot.options.length}`}
              slot={slot}
              mode={profile.numbersMode}
              limitPotassium={profile.limitPotassium === true}
              nutritionistMode={profile.nutritionistMode}
              onChanged={refresh}
            />
          ))}
          <MealEntriesCard entries={data.entries.filter((e) => e.source !== 'plan')} onChanged={refresh} />
        </>
      )}

      <MenuSheet
        visible={menu}
        onClose={() => setMenu(false)}
        title={m.dayMenu}
        actions={[
          { label: m.shopping, icon: 'shopping-cart', onPress: () => router.push('/meals/shopping') },
          {
            label: m.regenerateDay,
            icon: 'refresh-cw',
            hidden: profile.nutritionistMode,
            onPress: () => void regenerateDay(date).then(() => (showSnackbar(m.regenerated), refresh())),
          },
          {
            label: m.regenerateWeek,
            icon: 'refresh-ccw',
            hidden: profile.nutritionistMode,
            onPress: () => void regenerateWeek(date).then(() => (showSnackbar(m.regenerated), refresh())),
          },
        ]}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  dayNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayLabel: { flex: 1, textAlign: 'center' },
}));
