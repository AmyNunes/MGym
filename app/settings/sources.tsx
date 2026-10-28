import { Stack } from 'expo-router';

import { Card, Screen, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';

const s = strings.settings.sources;

const SOURCES = [
  { title: s.tacoTitle, body: s.taco },
  { title: s.ibgeTitle, body: s.ibge },
  { title: s.mineTitle, body: s.mine },
];

/** Configurações › Fontes dos dados (seção 2.1): de onde vêm os números da comida. */
export default function SourcesScreen() {
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: s.title }} />
      <Text color="textMuted">{s.intro}</Text>
      {SOURCES.map((source) => (
        <Card key={source.title}>
          <Text variant="heading" accessibilityRole="header">
            {source.title}
          </Text>
          <Text>{source.body}</Text>
        </Card>
      ))}
      <Text variant="caption" color="textMuted">
        {s.appNote}
      </Text>
    </Screen>
  );
}
