import { Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatDecimal, formatKgNumber } from '@/lib/format';
import { platesFor } from '@/training/plates';

const p = strings.workout.pad;

/** Calculadora de anilhas (seção 9.8): o que pôr de cada lado. */
export function PlateLine({ total, barKg }: { total: number | null; barKg: number }) {
  if (total == null) return null;
  const bar = formatKgNumber(barKg);
  const r = platesFor(total, barKg);
  const text = r.belowBar
    ? p.belowBar(bar)
    : r.perSide.length
      ? p.plates(r.perSide.map((x) => formatDecimal(x)).join(' + '), bar) + (r.remainder ? p.platesMissing(formatDecimal(r.remainder)) : '')
      : p.onlyBar(bar);
  return (
    <Text variant="label" color="textMuted" align="center" accessibilityLiveRegion="polite">
      {text}
    </Text>
  );
}
