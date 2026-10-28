import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { NotificationHistory, NotificationTypeRow, PermissionCard, TimeStepper } from '@/components/notifications/NotificationParts';
import { Button, Card, Chip, ListGroup, ListRow, Notice, Screen, Stepper, Text, Toggle } from '@/components/ui';
import { pauseState, useNotificationCenter, type PauseOption } from '@/features/notifications/useNotificationCenter';
import { strings } from '@/i18n/strings';
import { formatWeekdayDayMonth } from '@/lib/dates';
import { useProfile } from '@/stores/profileStore';
import { makeStyles } from '@/theme';

const c = strings.notifications.center;
const PAUSES: PauseOption[] = ['day', 'week', 'forever'];

/** Central de Notificações (seção 13): mestre, pausa, silêncio, limite, prioridade, texto discreto e histórico. */
export default function NotificationCenterScreen() {
  const styles = useStyles();
  const center = useNotificationCenter();
  const { settings, set } = center;
  const preferredTime = useProfile((s) => s.profile.preferredTime);
  const paused = pauseState(settings);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: c.title }} />
      <ListGroup>
        <ListRow
          icon="bell"
          title={c.master}
          subtitle={settings.enabled ? undefined : c.masterHint}
          right={<Toggle accessibilityLabel={c.master} value={settings.enabled} onValueChange={(enabled) => void set({ enabled })} />}
        />
        <ListRow
          icon="clock"
          title={c.rest}
          subtitle={c.restHint}
          right={<Toggle accessibilityLabel={c.rest} value={settings.rest.enabled} onValueChange={(enabled) => void set({ rest: { enabled } })} />}
        />
      </ListGroup>

      <PermissionCard permission={center.permission} onAsk={() => void center.askPermission()} />

      {settings.enabled && (
        <>
          <Card title={c.pause}>
            {paused ? (
              <Notice icon="pause-circle" action={<Button label={c.resume} icon="play" variant="secondary" onPress={() => void center.resume()} />}>
                {paused === 'forever' ? c.pausedForever : c.paused(formatWeekdayDayMonth(paused))}
              </Notice>
            ) : (
              <View style={styles.chips}>
                {PAUSES.map((p) => (
                  <Chip key={p} label={c.pauseOptions[p]} onPress={() => void center.pause(p)} />
                ))}
              </View>
            )}
          </Card>

          <Card>
            <View style={styles.inline}>
              <Text style={styles.flex}>{c.quiet}</Text>
              <Toggle accessibilityLabel={c.quiet} value={settings.quiet.enabled} onValueChange={(enabled) => void set({ quiet: { ...settings.quiet, enabled } })} />
            </View>
            {settings.quiet.enabled && (
              <>
                <TimeStepper label={c.quietStart} value={settings.quiet.start} onChange={(start) => void set({ quiet: { ...settings.quiet, start } })} />
                <TimeStepper label={c.quietEnd} value={settings.quiet.end} onChange={(end) => void set({ quiet: { ...settings.quiet, end } })} />
              </>
            )}
            <View style={styles.inline}>
              <Text style={styles.flex}>{c.maxPerDay}</Text>
              <Stepper accessibilityLabel={c.maxPerDay} value={settings.maxPerDay} min={1} max={10} onChange={(maxPerDay) => void set({ maxPerDay })} />
            </View>
            <View style={styles.inline}>
              <View style={styles.flex}>
                <Text>{c.discreet}</Text>
                <Text variant="caption" color="textMuted">
                  {c.discreetHint}
                </Text>
              </View>
              <Toggle accessibilityLabel={c.discreet} value={settings.discreet} onValueChange={(discreet) => void set({ discreet })} />
            </View>
          </Card>

          <Card title={c.types} flat>
            <Text variant="caption" color="textMuted" style={styles.hint}>
              {c.priorityHint}
            </Text>
            {center.order.map((type, i) => (
              <NotificationTypeRow
                key={type}
                type={type}
                settings={settings}
                preferredTime={preferredTime}
                first={i === 0}
                last={i === center.order.length - 1}
                onOpen={() => router.push(`/settings/notifications/${type}`)}
                onToggle={(enabled) => void center.toggleType(type, enabled)}
                onMove={(delta) => center.move(type, delta)}
              />
            ))}
          </Card>
        </>
      )}

      <NotificationHistory logs={center.history.state.status === 'success' ? center.history.state.data : []} />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  hint: { paddingHorizontal: t.spacing.lg },
}));
