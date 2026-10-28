import { router, Stack } from 'expo-router';

import { NutriTargetsCard } from '@/components/settings/NutriTargetsCard';
import { Card, ListGroup, ListRow, Screen, Segmented, Text, Toggle } from '@/components/ui';
import { STEP_IDS, STEP_META } from '@/features/guide/steps';
import { answerSummary } from '@/features/guide/summary';
import { offerMenuUpdate } from '@/features/meals/offerMenuUpdate';
import { strings } from '@/i18n/strings';
import { WEIGHT_VISIBILITY } from '@/profile/profile';
import { patchProfile, useProfile } from '@/stores/profileStore';

const n = strings.settings.nutrition;
const FOOD_STEPS = STEP_IDS.filter((step) => STEP_META[step].part === 'food');

/** Configurações › Alimentação (seção 12.7, item 3). */
export default function NutritionSettingsScreen() {
  const profile = useProfile((s) => s.profile);
  const labels = strings.settings.profile.labels;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: n.title }} />
      <ListGroup title={n.answers} footer={n.answersHint}>
        {FOOD_STEPS.map((step) => (
          <ListRow
            key={step}
            title={labels[step]}
            subtitle={answerSummary(step, profile)}
            onPress={() => router.push(`/guide/${step}?edit=1`)}
          />
        ))}
      </ListGroup>

      <ListGroup>
        <ListRow
          icon="user"
          title={n.nutriMode}
          subtitle={n.nutriModeHint}
          right={
            <Toggle
              value={profile.nutritionistMode}
              onValueChange={(nutritionistMode) => void patchProfile({ nutritionistMode }).then(offerMenuUpdate)}
              accessibilityLabel={n.nutriMode}
            />
          }
        />
      </ListGroup>
      {profile.nutritionistMode && <NutriTargetsCard />}

      <Card title={n.weightVisibility}>
        <Segmented
          accessibilityLabel={n.weightVisibility}
          options={WEIGHT_VISIBILITY.map((value) => ({ value, label: n.visibility[value] }))}
          value={profile.weightVisibility}
          onChange={(weightVisibility) => void patchProfile({ weightVisibility })}
        />
        <Text variant="caption" color="textMuted">
          {n.weightVisibilityHint}
        </Text>
      </Card>
    </Screen>
  );
}
