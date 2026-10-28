import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { profileTargets } from '@/features/nutrition/profileTargets';
import { strings } from '@/i18n/strings';
import { formatInt } from '@/lib/format';
import type { Profile } from '@/profile/profile';
import { makeStyles } from '@/theme';

const r = strings.result;
const m = strings.meals;

/** Resultado do Guia (seção 8.2): proteína e carboidratos do dia; energia só se o modo mostrar. */
export function FoodTargetsCard({ profile }: { profile: Profile }) {
  const styles = useStyles();
  const targets = profileTargets(profile);
  if (!targets) return null;
  const nutri = profile.nutritionistMode && profile.nutriTargets != null;

  if (profile.numbersMode === 'none') {
    return (
      <Card title={r.foodTitle}>
        <Text>{r.foodHands}</Text>
      </Card>
    );
  }
  const rows = [
    { name: m.protein, value: r.perDay(formatInt(targets.protein), 'g'), color: 'protein' as const },
    { name: m.carbs, value: r.perDay(formatInt(targets.carbs), 'g'), color: 'carbs' as const },
    ...(profile.numbersMode === 'all'
      ? [
          { name: m.energy, value: r.perDay(formatInt(targets.kcal), 'kcal'), color: 'primary' as const },
          { name: m.fat, value: r.perDay(formatInt(targets.fat), 'g'), color: 'fat' as const },
        ]
      : []),
  ];

  return (
    <Card title={r.foodTitle}>
      {rows.map((row) => (
        <View key={row.name} style={styles.row}>
          <Text variant="label" style={styles.flex}>
            {row.name}
          </Text>
          <Text variant="heading" color={row.color}>
            {row.value}
          </Text>
        </View>
      ))}
      <Text variant="caption" color="textMuted">
        {nutri ? r.foodNutri : r.foodNote}
      </Text>
      {!nutri && targets.atFloor && (
        <Text variant="caption" color="textMuted">
          {r.floorNote}
        </Text>
      )}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: t.spacing.md },
  flex: { flex: 1 },
}));
