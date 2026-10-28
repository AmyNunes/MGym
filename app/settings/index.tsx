import { router, Stack } from 'expo-router';

import { ListGroup, ListRow, Screen } from '@/components/ui';
import { useSettingsSummary } from '@/features/settings/useSettingsSummary';
import { strings } from '@/i18n/strings';

const s = strings.settings;

/** Configurações (seção 12.7), na ordem da spec; cada fase acrescenta as suas. */
export default function SettingsScreen() {
  const summary = useSettingsSummary();

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: s.title }} />
      <ListGroup>
        <ListRow icon="user" title={s.rows.profile} onPress={() => router.push('/settings/profile')} />
        <ListRow icon="activity" title={s.rows.training} onPress={() => router.push('/settings/training')} />
        <ListRow icon="coffee" title={s.rows.nutrition} onPress={() => router.push('/settings/nutrition')} />
        <ListRow
          icon="award"
          iconColor="record"
          title={s.rows.celebrations}
          onPress={() => router.push('/settings/celebrations')}
        />
      </ListGroup>
      <ListGroup>
        <ListRow icon="bell" title={s.rows.notifications} onPress={() => router.push('/settings/notifications')} />
        <ListRow icon="cpu" title={s.rows.ai} value={summary.ai} onPress={() => router.push('/settings/ai')} />
        <ListRow
          icon="moon"
          iconColor="textMuted"
          title={s.rows.appearance}
          value={summary.appearance}
          onPress={() => router.push('/settings/appearance')}
        />
      </ListGroup>
      <ListGroup>
        <ListRow icon="life-buoy" iconColor="danger" title={s.rows.safety} onPress={() => router.push('/safety')} />
        <ListRow icon="book-open" iconColor="textMuted" title={s.rows.sources} onPress={() => router.push('/settings/sources')} />
      </ListGroup>
      <ListGroup>
        <ListRow icon="database" iconColor="textMuted" title={s.rows.data} onPress={() => router.push('/settings/data')} />
      </ListGroup>
    </Screen>
  );
}
