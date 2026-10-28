import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button, ProgressBar, Screen, Text } from '@/components/ui';
import { STEP_IDS, STEP_META, stepIndex, type StepId } from '@/features/guide/steps';
import { strings } from '@/i18n/strings';
import { makeStyles } from '@/theme';

const g = strings.guide;

type Props = {
  step: StepId;
  title: string;
  help?: string;
  canContinue: boolean;
  continueLabel: string;
  onContinue: () => void;
  onSkip?: () => void;
  children: ReactNode;
};

/** Uma pergunta por tela, com barra de progresso e "Pular" nas opcionais (seção 8.1). */
export function GuideScaffold({ step, title, help, canContinue, continueLabel, onContinue, onSkip, children }: Props) {
  const styles = useStyles();
  const index = stepIndex(step);
  const meta = STEP_META[step];

  return (
    <Screen
      edges={[]}
      footer={
        <View style={styles.footer}>
          <Button label={continueLabel} size="main" disabled={!canContinue} onPress={onContinue} />
          {meta.optional && onSkip && <Button label={g.skip} variant="ghost" onPress={onSkip} />}
        </View>
      }
    >
      <View style={styles.progress}>
        <ProgressBar progress={(index + 1) / STEP_IDS.length} accessibilityLabel={g.progress(index + 1, STEP_IDS.length)} />
        <Text variant="caption" color="textMuted">
          {g.parts[meta.part]} · {g.progress(index + 1, STEP_IDS.length)}
          {meta.optional ? ` · ${g.optional}` : ''}
        </Text>
      </View>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {help && <Text color="textMuted">{help}</Text>}
      {children}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  progress: { gap: t.spacing.xs },
  footer: { gap: t.spacing.xs },
}));
