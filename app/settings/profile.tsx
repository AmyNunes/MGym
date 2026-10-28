import { router, Stack } from 'expo-router';

import { Button, Card, ListGroup, ListRow, Screen, Segmented, Toggle } from '@/components/ui';
import { STEP_IDS } from '@/features/guide/steps';
import { answerSummary } from '@/features/guide/summary';
import { strings } from '@/i18n/strings';
import { ADDRESS_FORMS } from '@/profile/profile';
import { patchProfile, useProfile } from '@/stores/profileStore';

const p = strings.settings.profile;

/** Configurações › Perfil (seção 12.7): respostas do Guia, forma de tratamento e contexto na IA. */
export default function ProfileSettingsScreen() {
  const profile = useProfile((s) => s.profile);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: p.title }} />
      <Card title={p.address}>
        <Segmented
          accessibilityLabel={p.address}
          options={ADDRESS_FORMS.map((value) => ({ value, label: strings.guide.options.address[value] }))}
          value={profile.address ?? 'neutral'}
          onChange={(address) => void patchProfile({ address })}
        />
      </Card>

      <ListGroup>
        <ListRow
          icon="cpu"
          title={p.includeContext}
          subtitle={p.includeContextHint}
          right={
            <Toggle
              value={profile.includeContextInAi}
              onValueChange={(includeContextInAi) => void patchProfile({ includeContextInAi })}
              accessibilityLabel={p.includeContext}
            />
          }
        />
      </ListGroup>

      <ListGroup title={p.answers} footer={p.answersHint}>
        {STEP_IDS.filter((step) => step !== 'address' && step !== 'measurements').map((step) => (
          <ListRow
            key={step}
            title={p.labels[step]}
            subtitle={answerSummary(step, profile)}
            onPress={() => router.push(`/guide/${step}?edit=1`)}
          />
        ))}
      </ListGroup>

      <Button label={p.redoGuide} icon="compass" variant="secondary" onPress={() => router.push('/guide')} />
    </Screen>
  );
}
