import { Stack } from 'expo-router';

import { ListGroup, ListRow, Screen, Toggle } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { useSettings } from '@/stores/settingsStore';

const c = strings.settings.celebrations;

/** Configurações › Celebrações (seção 12.7, item 4): tudo desligável. */
export default function CelebrationsSettingsScreen() {
  const celebrations = useSettings((s) => s.celebrations);
  const update = useSettings((s) => s.update);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: c.title }} />
      <ListGroup>
        <ListRow
          icon="award"
          iconColor="record"
          title={c.recordGlow}
          subtitle={c.recordGlowHint}
          right={
            <Toggle
              value={celebrations.recordGlow}
              onValueChange={(recordGlow) => void update('celebrations', { recordGlow })}
              accessibilityLabel={c.recordGlow}
            />
          }
        />
        <ListRow
          icon="smartphone"
          title={c.haptics}
          subtitle={c.hapticsHint}
          right={
            <Toggle
              value={celebrations.haptics}
              onValueChange={(haptics) => void update('celebrations', { haptics })}
              accessibilityLabel={c.haptics}
            />
          }
        />
      </ListGroup>
    </Screen>
  );
}
