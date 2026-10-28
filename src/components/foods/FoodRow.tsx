import { Pressable, View } from 'react-native';

import { IconButton, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { friendlyName } from '@/nutrition/display';
import type { Food } from '@/nutrition/models';
import { makeStyles } from '@/theme';

type Props = { food: Food; onPress: () => void; onToggleFavorite: () => void };

/** Um alimento na busca: nome, P e C por 100 g e a estrela de favorito. */
export function FoodRow({ food, onPress, onToggleFavorite }: Props) {
  const styles = useStyles();
  const name = friendlyName(food.name);
  const detail = strings.foods.per100(Math.round(food.protein ?? 0), Math.round(food.carbs ?? 0));
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${detail}`}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <Text variant="label">{name}</Text>
        <Text variant="caption" color="textMuted">
          {detail}
        </Text>
      </Pressable>
      <IconButton
        icon="star"
        color={food.favorite ? 'record' : 'textMuted'}
        accessibilityLabel={food.favorite ? strings.foods.unfavorite : strings.foods.favorite}
        onPress={onToggleFavorite}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: t.spacing.sm,
    borderRadius: t.radii.md,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.hairline,
    borderColor: t.colors.border,
  },
  main: { flex: 1, minHeight: t.sizes.listRowHeight, justifyContent: 'center', paddingHorizontal: t.spacing.lg, gap: t.spacing.xs / 2 },
  pressed: { opacity: t.opacity.pressed },
}));
