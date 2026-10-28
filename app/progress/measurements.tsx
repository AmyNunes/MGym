import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MEASURE_SITES, siteChange, siteSeries, type MeasureSite } from '@/body/measurements';
import { LineChart } from '@/components/charts/LineChart';
import { signed } from '@/components/progress/WeightCard';
import { HistoryRows } from '@/components/progress/HistoryRows';
import { RatiosCard } from '@/components/progress/RatiosCard';
import { Button, Card, Chip, EmptyState, ErrorState, IconButton, Screen, Skeleton, Text } from '@/components/ui';
import { deleteMeasurement, listMeasurements, restoreMeasurement, type MeasurementRecord } from '@/db/bodyRepo';
import { strings } from '@/i18n/strings';
import { formatDayMonth, formatShortDate } from '@/lib/dates';
import { formatKgNumber } from '@/lib/format';
import { useLoader } from '@/lib/useLoader';
import { patchProfile, useProfile } from '@/stores/profileStore';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles, useTheme } from '@/theme';

const s = strings.measures;
const cm = (v: number) => s.cm(formatKgNumber(v));

/** Medidas (seção 11.2): gráfico por local, comparações, relações, registros e os locais que eu meço. */
export default function MeasurementsScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const profile = useProfile((p) => p.profile);
  const { state, reload, refresh } = useLoader(listMeasurements);
  const entries = state.status === 'success' ? state.data : [];
  const withData = MEASURE_SITES.filter((site) => entries.some((e) => e.values[site] != null));
  const [picked, setPicked] = useState<MeasureSite | null>(null);
  const site = picked && withData.includes(picked) ? picked : (withData[0] ?? null);
  const series = site ? siteSeries(entries, site) : [];
  const change = site ? siteChange(entries, site) : null;

  const remove = (m: MeasurementRecord) =>
    void deleteMeasurement(m.id).then(() => {
      refresh();
      showSnackbar(s.deleted, { label: strings.common.undo, onPress: () => void restoreMeasurement(m).then(refresh) });
    });

  const toggleSite = (x: MeasureSite) => {
    const has = profile.measureSites.includes(x);
    if (has && profile.measureSites.length === 1) return;
    void patchProfile({ measureSites: has ? profile.measureSites.filter((y) => y !== x) : [...profile.measureSites, x] });
  };

  return (
    <Screen edges={[]} footer={<Button label={strings.evolution.measureNow} icon="maximize-2" size="main" onPress={() => router.push('/progress/measure')} />}>
      <Stack.Screen
        options={{
          title: s.title,
          headerRight: () => <IconButton icon="help-circle" accessibilityLabel={s.howTo} onPress={() => router.push('/progress/measure-guide')} />,
        }}
      />
      {state.status === 'loading' && <Skeleton height={theme.sizes.chartHeight} radius="lg" />}
      {state.status === 'error' && <ErrorState onRetry={reload} />}
      {state.status === 'success' && entries.length === 0 && <EmptyState icon="maximize-2" message={s.empty} />}
      {site && change && (
        <Card>
          <View style={styles.chips}>
            {withData.map((x) => (
              <Chip key={x} label={s.sites[x]} selected={x === site} onPress={() => setPicked(x)} />
            ))}
          </View>
          <Text variant="hero">{cm(change.latest)}</Text>
          <Text variant="label" color="textMuted">
            {change.sinceStart == null ? s.firstOne : s.sinceStart(signed(change.sinceStart))}
            {change.last4Weeks != null ? ` · ${s.last4(signed(change.last4Weeks))}` : ''}
          </Text>
          {series.length > 1 && (
            <LineChart
              points={series}
              formatValue={cm}
              formatTime={(t) => formatDayMonth(new Date(t))}
              accessibilityLabel={s.chartLabel(s.sites[site], cm(series[0].v), cm(series[series.length - 1].v))}
            />
          )}
        </Card>
      )}
      <RatiosCard entries={entries} heightCm={profile.heightCm} weightKg={profile.weightKg} />
      {entries.length > 0 && (
        <>
          <Text variant="label" color="textMuted" accessibilityRole="header">
            {s.records}
          </Text>
          <HistoryRows
            items={[...entries].reverse()}
            keyOf={(m) => m.id}
            title={(m) => formatShortDate(new Date(m.measuredAt))}
            subtitle={(m) =>
              MEASURE_SITES.filter((x) => m.values[x] != null)
                .map((x) => `${s.sites[x]} ${formatKgNumber(m.values[x] as number)}`)
                .join(' · ')
            }
            removeLabel={(m) => s.remove(formatShortDate(new Date(m.measuredAt)))}
            onRemove={remove}
          />
        </>
      )}
      <Card title={s.mySites}>
        <View style={styles.chips}>
          {MEASURE_SITES.map((x) => (
            <Chip key={x} label={s.sites[x]} selected={profile.measureSites.includes(x)} onPress={() => toggleSite(x)} />
          ))}
        </View>
        <Text variant="caption" color="textMuted">
          {s.mySitesHint}
        </Text>
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
