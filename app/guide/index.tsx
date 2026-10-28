import { router, Stack } from 'expo-router';

import { Button, Card, IconBadge, Notice, Screen, Text } from '@/components/ui';
import { STEP_IDS } from '@/features/guide/steps';
import { strings } from '@/i18n/strings';

const g = strings.guide;

/** Antes da primeira pergunta (seção 8.1): o app ajuda, quem orienta é o profissional. */
export default function GuideIntroScreen() {
  return (
    <Screen edges={[]} footer={<Button label={g.start} size="main" onPress={() => router.push(`/guide/${STEP_IDS[0]}`)} />}>
      <Stack.Screen options={{ title: g.title }} />
      <Card>
        <IconBadge icon="compass" size="lg" />
        <Text variant="title" accessibilityRole="header">
          {g.introTitle}
        </Text>
        <Text>{g.introBody}</Text>
      </Card>
      <Notice icon="shield">{g.introNoHormones}</Notice>
    </Screen>
  );
}
