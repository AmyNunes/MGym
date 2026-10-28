import { View } from 'react-native';

import { Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { makeStyles } from '@/theme';

/** Legenda do mapa muscular: ● principal ● secundário. */
export function MuscleLegend({ hasSecondary }: { hasSecondary: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.row} importantForAccessibility="no-hide-descendants">
      <View style={styles.item}>
        <View style={[styles.dot, styles.main]} />
        <Text variant="caption" color="textMuted">
          {strings.muscleMap.main}
        </Text>
      </View>
      {hasSecondary && (
        <View style={styles.item}>
          <View style={[styles.dot, styles.secondary]} />
          <Text variant="caption" color="textMuted">
            {strings.muscleMap.secondary}
          </Text>
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', justifyContent: 'center', gap: t.spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  dot: { width: t.spacing.md, height: t.spacing.md, borderRadius: t.radii.full },
  main: { backgroundColor: t.colors.muscleMain },
  secondary: { backgroundColor: t.colors.muscleSecondary, borderWidth: t.sizes.hairline, borderColor: t.colors.border },
}));
