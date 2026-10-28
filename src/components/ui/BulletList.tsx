import { View } from 'react-native';

import { makeStyles } from '@/theme';

import { Text } from './Text';

/** Lista com marcadores (dicas, erros comuns, cuidados). */
export function BulletList({ items }: { items: readonly string[] }) {
  const styles = useStyles();
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <Text color="textMuted">•</Text>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.sm },
  row: { flexDirection: 'row', gap: t.spacing.md, alignItems: 'flex-start' },
  text: { flex: 1 },
}));
