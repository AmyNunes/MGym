import { View } from 'react-native';

import { Chip } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { useFoodNames } from '@/features/foods/useFoods';
import { makeStyles } from '@/theme';

/** Alimentos escolhidos ("Não como", "Amo") em chips removíveis. */
export function FoodChips({ ids, onRemove }: { ids: readonly string[]; onRemove: (id: string) => void }) {
  const styles = useStyles();
  const names = useFoodNames(ids);
  if (!ids.length) return null;
  return (
    <View style={styles.chips}>
      {ids.map((id) => (
        <Chip
          key={id}
          label={names[id] ?? '…'}
          trailingIcon="x"
          accessibilityLabel={strings.guide.food.restrictions.remove(names[id] ?? '')}
          onPress={() => onRemove(id)}
        />
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
