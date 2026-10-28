import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MEASURE_SITES, type MeasureValues } from '@/body/measurements';
import { MeasureSiteStep, siteAverage, type Readings } from '@/components/progress/MeasureSiteStep';
import { Button, IconButton, ProgressBar, Screen, Text } from '@/components/ui';
import { insertMeasurement } from '@/db/bodyRepo';
import { strings } from '@/i18n/strings';
import { haptics } from '@/lib/haptics';
import { useProfile } from '@/stores/profileStore';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles } from '@/theme';

const s = strings.measures;
const EMPTY: Readings = { a: '', b: '' };

/** Registrar medidas (seção 11.2): um local por vez, com o guia de como medir e a média das duas leituras. */
export default function MeasureScreen() {
  const styles = useStyles();
  const used = useProfile((p) => p.profile.measureSites);
  const sites = MEASURE_SITES.filter((site) => used.includes(site));
  const [index, setIndex] = useState(0);
  const [readings, setReadings] = useState<Partial<Record<(typeof sites)[number], Readings>>>({});
  const site = sites[index];
  const last = index === sites.length - 1;

  const save = async () => {
    const values: MeasureValues = {};
    for (const s2 of sites) {
      const avg = siteAverage(readings[s2] ?? EMPTY);
      if (avg != null) values[s2] = avg;
    }
    if (!Object.keys(values).length) {
      showSnackbar(s.nothing);
      return;
    }
    await insertMeasurement(values);
    haptics.light();
    showSnackbar(s.saved);
    router.back();
  };

  return (
    <Screen
      edges={[]}
      footer={
        <View style={styles.footer}>
          {index > 0 && (
            <View style={styles.flex}>
              <Button label={s.back} variant="secondary" size="main" onPress={() => setIndex((i) => i - 1)} />
            </View>
          )}
          <View style={styles.flex}>
            <Button
              label={last ? s.save : s.next}
              size="main"
              icon={last ? 'check' : undefined}
              onPress={() => (last ? void save() : setIndex((i) => i + 1))}
            />
          </View>
        </View>
      }
    >
      <Stack.Screen
        options={{
          title: s.newTitle,
          headerRight: () => (
            <IconButton icon="help-circle" accessibilityLabel={s.howTo} onPress={() => router.push('/progress/measure-guide')} />
          ),
        }}
      />
      <View style={styles.progress}>
        <Text variant="label" color="textMuted">
          {s.step(index + 1, sites.length)}
        </Text>
        <ProgressBar progress={(index + 1) / sites.length} accessibilityLabel={s.step(index + 1, sites.length)} />
      </View>
      {site && (
        <MeasureSiteStep
          key={site}
          site={site}
          readings={readings[site] ?? EMPTY}
          onChange={(r) => setReadings((old) => ({ ...old, [site]: r }))}
        />
      )}
      {!last && <Button label={s.skip} variant="ghost" onPress={() => setIndex((i) => i + 1)} />}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  footer: { flexDirection: 'row', gap: t.spacing.md },
  flex: { flex: 1 },
  progress: { gap: t.spacing.xs },
}));
