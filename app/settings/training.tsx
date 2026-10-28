import { Stack } from 'expo-router';
import { View } from 'react-native';

import { Card, Chip, ListGroup, ListRow, Screen, Segmented, Stepper, Text, Toggle } from '@/components/ui';
import { INCREMENT_OPTIONS, type WorkoutSettings } from '@/features/settings/schemas';
import { strings } from '@/i18n/strings';
import { weekdayShort } from '@/lib/dates';
import { formatKgNumber, formatRest } from '@/lib/format';
import { trainingWeekdays } from '@/profile/profile';
import { patchProfile, useProfile } from '@/stores/profileStore';
import { useSettings } from '@/stores/settingsStore';
import { makeStyles } from '@/theme';
import { PLANNED_LIMITS } from '@/training/planned';

const t = strings.settings.training;
/** Segunda a domingo. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const INCREMENTS = INCREMENT_OPTIONS.map((v) => ({ value: String(v), label: t.incrementValue(formatKgNumber(v)) }));

/** Configurações › Treino (seção 12.7, item 2). */
export default function TrainingSettingsScreen() {
  const styles = useStyles();
  const workout = useSettings((s) => s.workout);
  const update = useSettings((s) => s.update);
  const profile = useProfile((s) => s.profile);
  const weekdays = trainingWeekdays(profile);
  const set = (patch: Partial<WorkoutSettings>) => void update('workout', patch);

  const toggleRow = (key: 'keepAwake' | 'askRir' | 'autoWarmup', title: string, hint: string, icon: 'sun' | 'help-circle' | 'trending-up') => (
    <ListRow
      icon={icon}
      title={title}
      subtitle={hint}
      right={<Toggle value={workout[key]} onValueChange={(v) => set({ [key]: v })} accessibilityLabel={title} />}
    />
  );

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: t.title }} />
      <ListGroup>
        {toggleRow('keepAwake', t.keepAwake, t.keepAwakeHint, 'sun')}
        {toggleRow('askRir', t.askRir, t.askRirHint, 'help-circle')}
        {toggleRow('autoWarmup', t.autoWarmup, t.autoWarmupHint, 'trending-up')}
      </ListGroup>

      <Card title={t.increments}>
        <Text variant="label">{t.incrementUpper}</Text>
        <Segmented
          accessibilityLabel={t.incrementUpper}
          options={INCREMENTS}
          value={String(workout.incrementUpper)}
          onChange={(v) => set({ incrementUpper: Number(v) })}
        />
        <Text variant="label">{t.incrementLower}</Text>
        <Segmented
          accessibilityLabel={t.incrementLower}
          options={INCREMENTS}
          value={String(workout.incrementLower)}
          onChange={(v) => set({ incrementLower: Number(v) })}
        />
      </Card>

      <Card title={t.bar}>
        <View style={styles.row}>
          <Text style={styles.flex} color="textMuted" variant="caption">
            {t.barHint}
          </Text>
          <Stepper
            accessibilityLabel={t.bar}
            value={workout.barKg}
            min={0}
            max={25}
            step={2.5}
            format={(v) => t.incrementValue(formatKgNumber(v))}
            onChange={(barKg) => set({ barKg })}
          />
        </View>
      </Card>

      <Card title={t.weekdays}>
        <View style={styles.chips}>
          {WEEK.map((d) => {
            const on = weekdays.includes(d);
            return (
              <Chip
                key={d}
                label={weekdayShort(d)}
                selected={on}
                onPress={() => {
                  const next = on ? weekdays.filter((x) => x !== d) : [...weekdays, d];
                  if (next.length) void patchProfile({ weekdays: next });
                }}
              />
            );
          })}
        </View>
        <Text variant="caption" color="textMuted">
          {t.weekdaysHint}
        </Text>
      </Card>

      <Card title={t.customRest}>
        <View style={styles.row}>
          <Text style={styles.flex} color="textMuted" variant="caption">
            {t.customRestHint}
          </Text>
          <Toggle value={workout.customRest} onValueChange={(customRest) => set({ customRest })} accessibilityLabel={t.customRest} />
        </View>
        {workout.customRest &&
          (
            [
              ['restCompound', t.restCompound],
              ['restIsolation', t.restIsolation],
              ['restCore', t.restCore],
            ] as const
          ).map(([key, label]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.flex}>{label}</Text>
              <Stepper
                accessibilityLabel={label}
                value={workout[key]}
                min={PLANNED_LIMITS.restMin}
                max={PLANNED_LIMITS.restMax}
                step={PLANNED_LIMITS.restStep}
                format={formatRest}
                onChange={(v) => set({ [key]: v })}
              />
            </View>
          ))}
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((th) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: th.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: th.spacing.md },
  flex: { flex: 1 },
}));
