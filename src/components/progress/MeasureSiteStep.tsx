import { View } from 'react-native';

import { averageReadings, MEASURE_LIMITS, readingsDisagree, type MeasureSite } from '@/body/measurements';
import { Notice, Text, TextField } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatKgNumber, parseDecimal } from '@/lib/format';
import { makeStyles, useTheme } from '@/theme';

import { MeasureIllustration } from './MeasureIllustration';

const s = strings.measures;

export type Readings = { a: string; b: string };

/** Uma leitura válida (10–250 cm), null se vazia, NaN se inválida. */
export function readingValue(text: string): number | null {
  const n = parseDecimal(text);
  if (n == null) return null;
  return Number.isNaN(n) || n < MEASURE_LIMITS.min || n > MEASURE_LIMITS.max ? Number.NaN : n;
}

/** A média das leituras de um local, ou null (vazio ou inválido). */
export function siteAverage(r: Readings): number | null {
  const a = readingValue(r.a);
  const b = readingValue(r.b);
  if (a == null || Number.isNaN(a) || (b != null && Number.isNaN(b))) return null;
  return averageReadings(a, b);
}

type Props = { site: MeasureSite; readings: Readings; onChange: (r: Readings) => void };

/** Um local por tela: onde passar a fita, as duas leituras e a média (seção 11.2). */
export function MeasureSiteStep({ site, readings, onChange }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const a = readingValue(readings.a);
  const b = readingValue(readings.b);
  const avg = siteAverage(readings);
  const error = (v: number | null) => (v != null && Number.isNaN(v) ? s.invalid : undefined);

  return (
    <View style={styles.wrap}>
      <View style={styles.figure}>
        <MeasureIllustration site={site} width={theme.sizes.muscleMap.md} />
        <View style={styles.texts}>
          <Text variant="title" accessibilityRole="header">
            {s.sites[site]}
          </Text>
          <Text color="textMuted">{s.where[site]}</Text>
        </View>
      </View>
      <TextField
        label={s.reading1}
        value={readings.a}
        onChangeText={(text) => onChange({ ...readings, a: text })}
        keyboardType="decimal-pad"
        maxLength={5}
        error={error(a)}
      />
      <TextField
        label={s.reading2}
        value={readings.b}
        onChangeText={(text) => onChange({ ...readings, b: text })}
        keyboardType="decimal-pad"
        maxLength={5}
        error={error(b)}
      />
      {avg != null && (
        <Text variant="heading" color="primary" accessibilityLiveRegion="polite">
          {s.average(formatKgNumber(avg))}
        </Text>
      )}
      {a != null && b != null && !Number.isNaN(a) && !Number.isNaN(b) && readingsDisagree(a, b) && (
        <Notice tone="warning">
          {s.disagree}
        </Notice>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.lg },
  figure: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg },
  texts: { flex: 1, gap: t.spacing.sm },
}));
