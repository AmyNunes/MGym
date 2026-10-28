import { useState } from 'react';
import { View } from 'react-native';

import { Button, IconButton, SwipeableRow, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { makeStyles } from '@/theme';

const PAGE = 30;

type Props<T> = {
  items: readonly T[];
  keyOf: (item: T) => string;
  title: (item: T) => string;
  subtitle: (item: T) => string;
  removeLabel: (item: T) => string;
  onRemove: (item: T) => void;
};

/** Lista de registros (peso, medidas): deslizar ← apaga, com o botão ✕ como alternativa visível (seção 7). */
export function HistoryRows<T>({ items, keyOf, title, subtitle, removeLabel, onRemove }: Props<T>) {
  const styles = useStyles();
  const [shown, setShown] = useState(PAGE);
  return (
    <View style={styles.list}>
      {items.slice(0, shown).map((item) => (
        <SwipeableRow key={keyOf(item)} left={{ icon: 'trash-2', color: 'danger', onCommit: () => onRemove(item) }}>
          <View style={styles.row}>
            <View style={styles.texts}>
              <Text variant="label">{title(item)}</Text>
              <Text variant="caption" color="textMuted">
                {subtitle(item)}
              </Text>
            </View>
            <IconButton icon="x" color="textMuted" accessibilityLabel={removeLabel(item)} onPress={() => onRemove(item)} />
          </View>
        </SwipeableRow>
      ))}
      {items.length > shown && <Button label={strings.common.showMore} variant="ghost" onPress={() => setShown((n) => n + PAGE)} />}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: t.sizes.listRowHeight,
    paddingLeft: t.spacing.lg,
    borderRadius: t.radii.md,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.hairline,
    borderColor: t.colors.border,
  },
  texts: { flex: 1 },
}));
