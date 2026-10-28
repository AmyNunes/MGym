import { Stack } from 'expo-router';
import { View } from 'react-native';

import { MEASURE_SITES } from '@/body/measurements';
import { MeasureIllustration } from '@/components/progress/MeasureIllustration';
import { BulletList, Card, Screen, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { makeStyles, useTheme } from '@/theme';

const s = strings.measures;

/** Como medir (seção 11.2): as regras da fita e onde medir cada local. */
export default function MeasureGuideScreen() {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: s.guideTitle }} />
      <Card>
        <BulletList items={s.tips} />
        <Text variant="caption" color="textMuted">
          {s.howOften}
        </Text>
      </Card>
      {MEASURE_SITES.map((site) => (
        <Card key={site}>
          <View style={styles.row}>
            <MeasureIllustration site={site} width={theme.sizes.muscleMap.md / 2} />
            <View style={styles.texts}>
              <Text variant="heading" accessibilityRole="header">
                {s.sites[site]}
              </Text>
              <Text color="textMuted">{s.where[site]}</Text>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg },
  texts: { flex: 1, gap: t.spacing.xs },
}));
