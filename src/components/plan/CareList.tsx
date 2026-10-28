import { View } from 'react-native';

import { Notice } from '@/components/ui';
import { strings } from '@/i18n/strings';
import type { CareItem } from '@/safety/care';
import { makeStyles } from '@/theme';

const WARN: readonly CareItem[] = ['recovery', 'screening', 'estrogenClots'];

/** "Cuidados para você" (seções 8.2 e 16.2). */
export function CareList({ items }: { items: readonly CareItem[] }) {
  const styles = useStyles();
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Notice key={item} tone={WARN.includes(item) ? 'warning' : 'info'}>
          {strings.care[item]}
        </Notice>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.sm },
}));
