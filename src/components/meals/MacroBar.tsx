import { View } from 'react-native';

import { ProgressBar, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatInt } from '@/lib/format';
import type { Macros } from '@/nutrition/macros';
import type { MacroTargets } from '@/nutrition/targets';
import type { NumbersMode } from '@/profile/profile';
import { makeStyles, type ColorTokens } from '@/theme';

const m = strings.meals;

type Props = { eaten: Macros; target: MacroTargets; mode: NumbersMode };

/**
 * O dia enchendo conforme marco (seção 4.4): proteína e carboidratos em destaque;
 * energia e gordura menores (ou escondidas). No modo "Sem números", só as barras.
 */
export function MacroBar({ eaten, target, mode }: Props) {
  const styles = useStyles();
  const showNumbers = mode !== 'none';
  return (
    <View style={styles.wrap}>
      <Row name={m.protein} value={eaten.protein} goal={target.protein} unit=" g" color="protein" numbers={showNumbers} />
      <Row name={m.carbs} value={eaten.carbs} goal={target.carbs} unit=" g" color="carbs" numbers={showNumbers} />
      {mode === 'all' && (
        <>
          <Row name={m.energy} value={eaten.kcal} goal={target.kcal} unit=" kcal" color="primary" numbers />
          <Row name={m.fat} value={eaten.fat} goal={target.fat} unit=" g" color="fat" numbers />
        </>
      )}
      {mode === 'proteinCarbs' && (
        <Text variant="caption" color="textMuted">
          {m.smallMacros(Math.round(eaten.kcal), Math.round(eaten.fat))}
        </Text>
      )}
    </View>
  );
}

function Row({
  name,
  value,
  goal,
  unit,
  color,
  numbers,
}: {
  name: string;
  value: number;
  goal: number;
  unit: string;
  color: keyof ColorTokens;
  numbers: boolean;
}) {
  const styles = useStyles();
  const v = formatInt(value);
  const g = formatInt(goal);
  return (
    <View style={styles.row}>
      <Text variant="label" style={styles.name}>
        {name}
      </Text>
      <View style={styles.bar}>
        <ProgressBar progress={goal > 0 ? value / goal : 0} color={color} height={styles.track.height as number} accessibilityLabel={m.macroLabel(name, `${v}${unit}`, `${g}${unit}`)} />
      </View>
      {numbers && (
        <Text variant="caption" color="textMuted" style={styles.value}>
          {m.ofGoal(v, g, unit)}
        </Text>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  name: { width: t.sizes.badge.lg + t.spacing.xl },
  bar: { flex: 1 },
  track: { height: t.spacing.sm },
  value: { minWidth: t.sizes.badge.lg * 2, textAlign: 'right' },
}));
