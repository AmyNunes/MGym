import { router, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { TimeStepper } from '@/components/notifications/NotificationParts';
import { Button, Card, EmptyState, Notice, Screen, Segmented, Stepper, Text, Toggle } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { weekdayShort } from '@/lib/dates';
import { sendTestNotification } from '@/notifications/scheduler';
import { NOTIFICATION_TYPES, urlFor, type NotificationSettings, type NotificationType } from '@/notifications/types';
import { useProfile } from '@/stores/profileStore';
import { useSettings } from '@/stores/settingsStore';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles } from '@/theme';

const c = strings.notifications.center;
const content = strings.notifications.content;
/** Segunda a domingo. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAYS = WEEK.map((d) => ({ value: String(d) as `${number}`, label: weekdayShort(d) }));

/** Um exemplo do texto para o "Enviar um teste agora". */
function sample(type: NotificationType): { title: string; body: string } {
  switch (type) {
    case 'training':
      return content.trainingGeneric;
    case 'meals':
      return content.mealsGeneric(strings.meals.slots.lunch);
    case 'weighIn':
      return content.weighIn;
    case 'measurements':
      return content.measurements;
    case 'checkin':
      return content.checkinGeneric;
  }
}

/** Detalhe de um lembrete: ligar, horário, dia e frequência, e o teste. */
export default function NotificationTypeScreen() {
  const styles = useStyles();
  const { type } = useLocalSearchParams<{ type: string }>();
  const s = useSettings((st) => st.notifications);
  const update = useSettings((st) => st.update);
  const preferredTime = useProfile((p) => p.profile.preferredTime);
  const t = NOTIFICATION_TYPES.find((x) => x === type);
  if (!t) {
    return (
      <Screen edges={[]}>
        <EmptyState icon="alert-circle" message={strings.common.genericError} />
      </Screen>
    );
  }
  const set = (patch: Partial<NotificationSettings>) => void update('notifications', patch);
  const name = strings.notifications.channels[t];

  const test = async () => {
    const text = s.discreet ? content.discreet : sample(t);
    await sendTestNotification(t, text.title, text.body, urlFor(t));
    showSnackbar(c.testSent);
  };

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: name }} />
      <Text color="textMuted">{c.typeHints[t]}</Text>
      <Card>
        <View style={styles.inline}>
          <Text style={styles.flex}>{c.enabled}</Text>
          <Toggle accessibilityLabel={name} value={s[t].enabled} onValueChange={(enabled) => set({ [t]: { ...s[t], enabled } } as Partial<NotificationSettings>)} />
        </View>

        {t === 'training' && (
          <>
            {preferredTime ? (
              <Text variant="label">{`${c.preferredTime}: ${preferredTime}`}</Text>
            ) : (
              <Notice icon="clock" action={<Button label={strings.guide.steps.schedule.setTime} variant="ghost" onPress={() => router.push('/guide/schedule?edit=1')} />}>
                {c.noPreferredTime}
              </Notice>
            )}
            <View style={styles.inline}>
              <Text style={styles.flex}>{c.lead}</Text>
              <Stepper
                accessibilityLabel={c.lead}
                value={s.training.leadMinutes}
                min={0}
                max={180}
                step={15}
                format={c.leadValue}
                onChange={(leadMinutes) => set({ training: { ...s.training, leadMinutes } })}
              />
            </View>
          </>
        )}

        {t === 'weighIn' && (
          <>
            <Segmented
              accessibilityLabel={c.frequency}
              options={(['weekly', 'daily'] as const).map((value) => ({ value, label: c.frequencies[value] }))}
              value={s.weighIn.frequency}
              onChange={(frequency) => set({ weighIn: { ...s.weighIn, frequency } })}
            />
            {s.weighIn.frequency === 'weekly' && (
              <Segmented
                accessibilityLabel={c.weekday}
                options={WEEKDAYS}
                value={String(s.weighIn.weekday) as `${number}`}
                onChange={(v) => set({ weighIn: { ...s.weighIn, weekday: Number(v) } })}
              />
            )}
            <TimeStepper label={c.time} value={s.weighIn.time} onChange={(time) => set({ weighIn: { ...s.weighIn, time } })} />
          </>
        )}

        {t === 'measurements' && (
          <>
            <View style={styles.inline}>
              <Text style={styles.flex}>{c.everyDays}</Text>
              <Stepper
                accessibilityLabel={c.everyDays}
                value={s.measurements.everyDays}
                min={7}
                max={28}
                step={7}
                format={c.everyDaysValue}
                onChange={(everyDays) => set({ measurements: { ...s.measurements, everyDays } })}
              />
            </View>
            <TimeStepper label={c.time} value={s.measurements.time} onChange={(time) => set({ measurements: { ...s.measurements, time } })} />
          </>
        )}

        {t === 'checkin' && (
          <>
            <Segmented
              accessibilityLabel={c.weekday}
              options={WEEKDAYS}
              value={String(s.checkin.weekday) as `${number}`}
              onChange={(v) => set({ checkin: { ...s.checkin, weekday: Number(v) } })}
            />
            <TimeStepper label={c.time} value={s.checkin.time} onChange={(time) => set({ checkin: { ...s.checkin, time } })} />
          </>
        )}
      </Card>
      <Button label={c.test} icon="send" variant="secondary" onPress={() => void test()} />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
}));
