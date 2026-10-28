import { useState } from 'react';
import { View } from 'react-native';

import type { PlanSuggestion } from '@/ai/functions/adjustPlan';
import { AIStatus } from '@/components/ai/AIStatus';
import { Button, Notice, Sheet, Text, TextField } from '@/components/ui';
import { useAIRequest } from '@/features/ai/useAIRequest';
import { applyPlanSuggestion, suggestPlanChanges } from '@/features/plan/aiAdjust';
import { strings } from '@/i18n/strings';
import { haptics } from '@/lib/haptics';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles } from '@/theme';
import type { ResolvedChange } from '@/training/aiPlan';

const a = strings.ai.adjust;

type Props = { visible: boolean; onClose: () => void; onApplied: () => void };

/** "Ajustar o plano com IA" (seção 14.3): a IA sugere, o app valida e eu confirmo. */
export function AdjustPlanSheet({ visible, onClose, onApplied }: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title={a.title} snapPoints={['85%']}>
      {visible && <AdjustBody onApplied={onApplied} />}
    </Sheet>
  );
}

export function changeLabel(c: ResolvedChange): string {
  if (c.action === 'replace') return a.replace(c.from.name, c.to.name, c.day.name);
  if (c.action === 'remove') return a.remove(c.from.name, c.day.name);
  return a.add(c.to.name, c.day.name);
}

function AdjustBody({ onApplied }: { onApplied: () => void }) {
  const styles = useStyles();
  const [text, setText] = useState('');
  const { state, run, retry } = useAIRequest(suggestPlanChanges);
  const [suggestion, setSuggestion] = useState<PlanSuggestion | null>(null);

  const send = async () => {
    const result = await run(text);
    if (result) setSuggestion(result);
  };

  const apply = async () => {
    if (!suggestion) return;
    await applyPlanSuggestion(suggestion);
    haptics.light();
    showSnackbar(a.applied);
    onApplied();
  };

  return (
    <View style={styles.body}>
      <TextField label={a.label} placeholder={a.placeholder} value={text} onChangeText={setText} multiline />
      <Button label={a.send} icon="cpu" variant="secondary" disabled={!text.trim() || state.status === 'loading'} onPress={() => void send()} />
      <AIStatus state={state} onRetry={retry} loadingText={a.loading} />
      {suggestion && state.status === 'success' && (
        <>
          {suggestion.explanationPt !== '' && <Text>{suggestion.explanationPt}</Text>}
          {suggestion.changes.length === 0 ? (
            <Notice icon="info">{a.none}</Notice>
          ) : (
            <>
              <Text variant="label" color="textMuted">
                {a.review}
              </Text>
              {suggestion.changes.map((c, i) => (
                <View key={i} style={styles.change}>
                  <Text variant="label">{changeLabel(c)}</Text>
                  <Text variant="caption" color="textMuted">
                    {c.reasonPt}
                  </Text>
                </View>
              ))}
            </>
          )}
          {suggestion.dropped > 0 && (
            <Text variant="caption" color="textMuted">
              {a.dropped(suggestion.dropped)}
            </Text>
          )}
          {suggestion.changes.length > 0 && <Button label={a.apply} icon="check" onPress={() => void apply()} />}
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.md },
  change: { gap: t.spacing.xs },
}));
