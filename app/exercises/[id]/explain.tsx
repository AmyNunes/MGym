import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AIStatus } from '@/components/ai/AIStatus';
import { BulletList, Button, Card, EmptyState, Notice, Screen, Text, TextField } from '@/components/ui';
import { useExplanation } from '@/features/ai/useExplanation';
import { strings } from '@/i18n/strings';
import { makeStyles } from '@/theme';
import { findExercise } from '@/training/catalog';
import type { Exercise } from '@/training/exerciseModel';

const x = strings.ai.explain;

/** "Explicar com IA" (seção 14.3): passo a passo, o que sentir, erros, foco e cuidado. */
export default function ExplainScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = findExercise(id);
  if (!exercise) {
    return (
      <Screen edges={[]}>
        <EmptyState icon="alert-circle" message={strings.common.genericError} />
      </Screen>
    );
  }
  return <Explanation exercise={exercise} />;
}

function Explanation({ exercise }: { exercise: Exercise }) {
  const styles = useStyles();
  const { state, ask, retry, doubt } = useExplanation(exercise);
  const [draft, setDraft] = useState('');

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: exercise.name }} />
      <AIStatus state={state} onRetry={retry} loadingText={x.loading} />
      {state.status === 'success' && (
        <>
          {doubt !== '' && <Text color="textMuted">“{doubt}”</Text>}
          <Card title={x.overview}>
            <Text>{state.data.overviewPt}</Text>
          </Card>
          <Card title={x.steps}>
            {state.data.steps.map((step, i) => (
              <View key={i} style={styles.step}>
                <Text variant="label">
                  {i + 1}. {step.titlePt}
                </Text>
                <Text>{step.instructionPt}</Text>
                <Text color="primary">
                  {x.feel}: {step.feelPt}
                </Text>
              </View>
            ))}
          </Card>
          {state.data.mistakes.length > 0 && (
            <Card title={x.mistakes}>
              {state.data.mistakes.map((m, i) => (
                <View key={i} style={styles.step}>
                  <Text variant="label">{m.mistakePt}</Text>
                  <Text color="textMuted">
                    {x.fix}: {m.fixPt}
                  </Text>
                </View>
              ))}
            </Card>
          )}
          {state.data.focusTipsPt.length > 0 && (
            <Card title={x.focus}>
              <BulletList items={state.data.focusTipsPt} />
            </Card>
          )}
          <Notice tone="warning">{`${x.safety}: ${state.data.safetyPt}`}</Notice>
          <Text variant="caption" color="textMuted">
            {strings.ai.aiNote}
          </Text>
          <TextField label={x.doubtLabel} placeholder={x.doubtPlaceholder} value={draft} onChangeText={setDraft} multiline />
          <Button
            label={x.ask}
            icon="send"
            variant="secondary"
            disabled={draft.trim() === ''}
            onPress={() => {
              ask(draft);
              setDraft('');
            }}
          />
        </>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  step: { gap: t.spacing.xs },
}));
