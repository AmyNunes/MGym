import { router } from 'expo-router';
import { View } from 'react-native';

import { MEASURE_SITES, siteChange, type MeasureSite } from '@/body/measurements';
import { Button, Card, Text } from '@/components/ui';
import type { MeasurementRecord } from '@/db/bodyRepo';
import { strings } from '@/i18n/strings';
import { formatKgNumber } from '@/lib/format';
import { makeStyles } from '@/theme';

import { signed } from './WeightCard';

const e = strings.evolution;
const s = strings.measures;

/** Medidas na Evolução (seção 12.6): as últimas e a variação desde o início. */
export function MeasuresCard({ entries, sites }: { entries: MeasurementRecord[]; sites: readonly MeasureSite[] }) {
  const styles = useStyles();
  const rows = MEASURE_SITES.filter((site) => sites.includes(site)).flatMap((site) => {
    const change = siteChange(entries, site);
    return change ? [{ site, change }] : [];
  });

  return (
    <Card title={e.measuresTitle}>
      {rows.length === 0 && <Text color="textMuted">{e.measuresEmpty}</Text>}
      {rows.map(({ site, change }) => (
        <View key={site} style={styles.row}>
          <Text variant="label" style={styles.flex}>
            {s.sites[site]}
          </Text>
          <Text variant="label">{s.cm(formatKgNumber(change.latest))}</Text>
          <Text variant="caption" color="textMuted" style={styles.change}>
            {change.sinceStart == null ? s.firstOne : s.sinceStart(signed(change.sinceStart))}
          </Text>
        </View>
      ))}
      <View style={styles.actions}>
        <View style={styles.flex}>
          <Button label={e.measureNow} icon="maximize-2" variant="secondary" onPress={() => router.push('/progress/measure')} />
        </View>
        {rows.length > 0 && <Button label={e.seeMeasures} variant="ghost" onPress={() => router.push('/progress/measurements')} />}
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  flex: { flex: 1 },
  change: { minWidth: t.sizes.badge.lg * 3, textAlign: 'right' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: t.spacing.sm },
}));
