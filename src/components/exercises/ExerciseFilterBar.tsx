import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Chip, Sheet, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { makeStyles } from '@/theme';
import type { ExerciseFilters } from '@/training/catalog';
import { EQUIPMENT, EXERCISE_GROUPS, LEVELS } from '@/training/exerciseModel';

const x = strings.exercises;

type Props = {
  filters: ExerciseFilters;
  onChange: (next: ExerciseFilters) => void;
};

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

/** "Bom para glúteos" e os grupos numa linha rolável; equipamento e nível num sheet ("Filtros"). */
export function ExerciseFilterBar({ filters, onChange }: Props) {
  const styles = useStyles();
  const [sheet, setSheet] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip label={x.filters} icon="sliders" onPress={() => setSheet(true)} />
        <Chip
          label={x.goodForGlutes}
          icon="star"
          selected={filters.goodForGlutes}
          onPress={() => onChange({ ...filters, goodForGlutes: !filters.goodForGlutes })}
        />
        {filters.equipment.map((e) => (
          <Chip
            key={e}
            label={strings.equipment[e]}
            selected
            trailingIcon="x"
            onPress={() => onChange({ ...filters, equipment: toggle(filters.equipment, e) })}
          />
        ))}
        {filters.levels.map((level) => (
          <Chip
            key={level}
            label={strings.levels[level]}
            selected
            trailingIcon="x"
            onPress={() => onChange({ ...filters, levels: toggle(filters.levels, level) })}
          />
        ))}
        {EXERCISE_GROUPS.map((group) => (
          <Chip
            key={group}
            label={strings.groups[group]}
            selected={filters.groups.includes(group)}
            onPress={() => onChange({ ...filters, groups: toggle(filters.groups, group) })}
          />
        ))}
      </ScrollView>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title={x.filters}>
        <Text variant="label" color="textMuted">
          {x.equipmentLabel}
        </Text>
        <View style={styles.wrap}>
          {EQUIPMENT.map((e) => (
            <Chip
              key={e}
              label={strings.equipment[e]}
              selected={filters.equipment.includes(e)}
              onPress={() => onChange({ ...filters, equipment: toggle(filters.equipment, e) })}
            />
          ))}
        </View>
        <Text variant="label" color="textMuted">
          {x.levelsLabel}
        </Text>
        <View style={styles.wrap}>
          {LEVELS.map((level) => (
            <Chip
              key={level}
              label={strings.levels[level]}
              selected={filters.levels.includes(level)}
              onPress={() => onChange({ ...filters, levels: toggle(filters.levels, level) })}
            />
          ))}
        </View>
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { marginHorizontal: -t.spacing.screen },
  row: { gap: t.spacing.sm, paddingHorizontal: t.spacing.screen },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
