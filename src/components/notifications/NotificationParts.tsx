import { View } from 'react-native';

import { Button, Card, IconButton, ListRow, Notice, Stepper, Text, Toggle } from '@/components/ui';
import type { NotificationLog } from '@/db/notificationLogRepo';
import { strings } from '@/i18n/strings';
import { formatShortDate, formatTime, formatTimeOfDay, parseTimeOfDay, weekdayShort } from '@/lib/dates';
import { openSystemSettings, type PermissionState } from '@/notifications/permissions';
import type { NotificationSettings, NotificationType } from '@/notifications/types';
import { makeStyles } from '@/theme';

const c = strings.notifications.center;
const TIME_STEP = 15;

/** Um horário com o Stepper (de 15 em 15 min). */
export function TimeStepper({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const styles = useStyles();
  return (
    <View style={styles.inline}>
      <Text style={styles.flex}>{label}</Text>
      <Stepper
        accessibilityLabel={label}
        value={parseTimeOfDay(value)}
        min={0}
        max={24 * 60 - TIME_STEP}
        step={TIME_STEP}
        format={formatTimeOfDay}
        onChange={(m) => onChange(formatTimeOfDay(m))}
      />
    </View>
  );
}

/** Permissão do Android: pedir, ou abrir as configurações se foi bloqueada. */
export function PermissionCard({ permission, onAsk }: { permission: PermissionState | null; onAsk: () => void }) {
  if (!permission || permission === 'granted') return null;
  return (
    <Notice
      tone="warning"
      action={
        permission === 'blocked' ? (
          <Button label={c.openSettings} variant="secondary" onPress={openSystemSettings} />
        ) : (
          <Button label={c.allow} variant="secondary" onPress={onAsk} />
        )
      }
    >
      {c.permissionOff}
    </Notice>
  );
}

/** Resumo de cada tipo (horário/dia), na lista da Central. */
export function typeSummary(type: NotificationType, s: NotificationSettings, preferredTime: string | null): string {
  const sum = c.summaries;
  switch (type) {
    case 'training':
      return sum.training(s.training.leadMinutes, preferredTime);
    case 'meals':
      return sum.meals;
    case 'weighIn':
      return sum.weighIn(s.weighIn.frequency === 'daily', weekdayShort(s.weighIn.weekday), s.weighIn.time);
    case 'measurements':
      return sum.measurements(s.measurements.everyDays, s.measurements.time);
    case 'checkin':
      return sum.checkin(weekdayShort(s.checkin.weekday), s.checkin.time);
  }
}

type RowProps = {
  type: NotificationType;
  settings: NotificationSettings;
  preferredTime: string | null;
  first: boolean;
  last: boolean;
  onOpen: () => void;
  onToggle: (enabled: boolean) => void;
  onMove: (delta: number) => void;
};

/** Uma linha de tipo: ligar/desligar, abrir o detalhe e mudar a prioridade (↑ ↓). */
export function NotificationTypeRow({ type, settings, preferredTime, first, last, onOpen, onToggle, onMove }: RowProps) {
  const styles = useStyles();
  const name = strings.notifications.channels[type];
  return (
    <View style={styles.typeRow}>
      <View style={styles.flex}>
        <ListRow title={name} subtitle={typeSummary(type, settings, preferredTime)} onPress={onOpen} />
      </View>
      <IconButton icon="arrow-up" color={first ? 'border' : 'textMuted'} accessibilityLabel={c.moveUp(name)} onPress={() => !first && onMove(-1)} />
      <IconButton icon="arrow-down" color={last ? 'border' : 'textMuted'} accessibilityLabel={c.moveDown(name)} onPress={() => !last && onMove(1)} />
      <Toggle accessibilityLabel={name} value={settings[type].enabled} onValueChange={onToggle} />
    </View>
  );
}

/** Histórico: o que foi mostrado e se abri. */
export function NotificationHistory({ logs }: { logs: NotificationLog[] }) {
  return (
    <Card title={c.history} flat>
      {logs.length === 0 ? (
        <ListRow title={c.historyEmpty} />
      ) : (
        logs.map((log) => {
          const at = new Date(log.scheduledFor);
          const name = strings.notifications.channels[log.type as NotificationType] ?? log.type;
          return (
            <ListRow
              key={log.id}
              icon={log.openedAt ? 'check' : 'bell'}
              iconColor={log.openedAt ? 'success' : 'textMuted'}
              title={name}
              subtitle={`${formatShortDate(at)} · ${formatTime(at)} · ${log.openedAt ? c.opened : c.notOpened}`}
            />
          );
        })
      )}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  typeRow: { flexDirection: 'row', alignItems: 'center', paddingRight: t.spacing.md },
}));
