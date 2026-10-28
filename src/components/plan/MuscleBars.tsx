import { View } from 'react-native';

import { ProgressBar, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatKgNumber } from '@/lib/format';
import { makeStyles } from '@/theme';
import { VOLUME_GROUPS, type VolumeGroup } from '@/training/exerciseModel';
import type { GroupVolume } from '@/training/volume';

type Props = {
  volume: GroupVolume;
  /** Meta de cada grupo (glúteos: o alvo; os outros: o mínimo da faixa). */
  goals: Partial<Record<VolumeGroup, number>>;
  /** Mostrar só alguns grupos (ex.: no resumo da aba Treino). */
  groups?: readonly VolumeGroup[];
};

/** Séries da semana por grupo × meta (seção 4.4), glúteos em destaque. */
export function MuscleBars({ volume, goals, groups = VOLUME_GROUPS }: Props) {
  const styles = useStyles();
  return (
    <View style={styles.list}>
      {groups.map((group) => {
        const goal = goals[group] ?? 0;
        const value = volume[group];
        const highlight = group === 'glutes';
        const label = strings.volumeGroups[group];
        const text = goal > 0 ? `${formatKgNumber(value)}/${goal}` : formatKgNumber(value);
        return (
          <View key={group} style={styles.row}>
            <Text variant={highlight ? 'label' : 'caption'} color={highlight ? 'primary' : 'text'} style={styles.label}>
              {label}
            </Text>
            <View style={styles.bar}>
              <ProgressBar
                progress={goal > 0 ? value / goal : value > 0 ? 1 : 0}
                color={highlight ? 'primary' : 'textMuted'}
                accessibilityLabel={`${label}: ${text}`}
              />
            </View>
            <Text variant="caption" color="textMuted" style={styles.value}>
              {text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  label: { width: t.sizes.badge.lg * 2 },
  bar: { flex: 1 },
  value: { minWidth: t.sizes.touchTarget, textAlign: 'right' },
}));
