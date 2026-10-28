import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { MacroBar } from '@/components/meals/MacroBar';
import { Card, Icon, Text } from '@/components/ui';
import type { MealsDay } from '@/features/meals/useMealsDay';
import { nextMeal } from '@/features/today/nextMeal';
import { strings } from '@/i18n/strings';
import type { NumbersMode } from '@/profile/profile';
import { makeStyles } from '@/theme';

const m = strings.meals;

/** "Cardápio de hoje" (seção 12.1): proteína e carboidratos do dia e a próxima refeição. */
export function TodayMealsCard({ day, mode }: { day: Extract<MealsDay, { status: 'ready' }>; mode: NumbersMode }) {
  const styles = useStyles();
  const next = nextMeal(day.slots, new Date());
  const label = next ? m.nextMeal(m.slots[next.slot], next.time, next.options.length) : m.openMenu;
  return (
    <Card title={m.todayCard}>
      <MacroBar eaten={day.eaten} target={day.targets.day} mode={mode} />
      <Pressable
        onPress={() => router.push(next ? `/meals/meal/${next.id}` : '/meals')}
        accessibilityRole="link"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        <Text variant="label" color="primary" style={styles.flex}>
          {label}
        </Text>
        <Icon name="chevron-right" color="primary" />
      </Pressable>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  link: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: t.sizes.touchTarget },
  flex: { flex: 1 },
  pressed: { opacity: t.opacity.pressed },
}));
