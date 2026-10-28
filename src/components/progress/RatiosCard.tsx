import { latestValue, type MeasureEntry } from '@/body/measurements';
import { waistHeight, waistHeightApplies, waistHeightBand, waistHip } from '@/body/ratios';
import { Card, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatDecimal } from '@/lib/format';

const s = strings.measures;

/** Relações (seção 11.3), opcionais e discretas: cintura/altura com faixas; cintura/quadril só tendência. */
export function RatiosCard({ entries, heightCm, weightKg }: { entries: readonly MeasureEntry[]; heightCm: number | null; weightKg: number | null }) {
  const waist = latestValue(entries, 'waist');
  const hips = latestValue(entries, 'hips');
  if (waist == null || (!heightCm && hips == null)) return null;
  const wh = heightCm ? waistHeight(waist, heightCm) : null;
  const applies = heightCm ? waistHeightApplies(weightKg, heightCm) : false;

  return (
    <Card title={s.ratiosTitle}>
      {wh != null && (
        <>
          <Text variant="label">
            {s.waistHeight(formatDecimal(wh))}
            {applies ? ` · ${s.bands[waistHeightBand(wh)]}` : ''}
          </Text>
          <Text variant="caption" color="textMuted">
            {applies ? s.waistHeightNote : s.waistHeightNA}
          </Text>
        </>
      )}
      {hips != null && (
        <>
          <Text variant="label">{s.waistHip(formatDecimal(waistHip(waist, hips)))}</Text>
          <Text variant="caption" color="textMuted">
            {s.waistHipNote}
          </Text>
        </>
      )}
    </Card>
  );
}
