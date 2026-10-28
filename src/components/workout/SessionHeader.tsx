import { View } from 'react-native';

import { IconButton, ProgressBar, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatElapsed } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { makeStyles } from '@/theme';

const w = strings.workout;

type Props = {
  name: string;
  startedAt: string;
  done: number;
  total: number;
  onMinimize: () => void;
  onMenu: () => void;
};

/** ✕ · nome · tempo · ⋯, e a barra "3 de 7" (seção 9.5). */
export function SessionHeader({ name, startedAt, done, total, onMinimize, onMenu }: Props) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <IconButton icon="x" accessibilityLabel={w.minimize} onPress={onMinimize} />
        <Text variant="heading" numberOfLines={1} style={styles.title} accessibilityRole="header">
          {name}
        </Text>
        <ElapsedClock startedAt={startedAt} />
        <IconButton icon="more-vertical" accessibilityLabel={w.menu} onPress={onMenu} />
      </View>
      <View style={styles.progress}>
        <View style={styles.flex}>
          <ProgressBar progress={total ? done / total : 0} accessibilityLabel={w.progressLabel(done, total)} />
        </View>
        <Text variant="caption" color="textMuted">
          {w.progress(done, total)}
        </Text>
      </View>
    </View>
  );
}

/** Só o relógio atualiza a cada segundo (o resto da tela não). */
function ElapsedClock({ startedAt }: { startedAt: string }) {
  const now = useNow(1000);
  const time = formatElapsed(now - Date.parse(startedAt));
  return (
    <Text variant="label" color="textMuted" accessibilityLabel={w.elapsedLabel(time)}>
      {time}
    </Text>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.xs, paddingBottom: t.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  title: { flex: 1 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingHorizontal: t.spacing.md },
  flex: { flex: 1 },
}));
