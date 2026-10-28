import { AIStatus } from '@/components/ai/AIStatus';
import { Button, Card, Text } from '@/components/ui';
import { useAIRequest } from '@/features/ai/useAIRequest';
import { aiWeekSummary, type CheckinDraft } from '@/features/checkin/checkinService';
import type { CheckinAnswers } from '@/features/checkin/model';
import { strings } from '@/i18n/strings';

const s = strings.ai.summary;

type Props = { draft: CheckinDraft; answers: CheckinAnswers; onSummary: (text: string) => void };

/** Check-in, item 5 (seção 11.5): resumo da IA, opcional, com os números da semana. */
export function AiSummaryCard({ draft, answers, onSummary }: Props) {
  const { state, run, retry } = useAIRequest(aiWeekSummary);

  const ask = async () => {
    const result = await run({ draft, answers });
    if (result) onSummary(`${result.summaryPt}\n\n${s.focus}: ${result.focusNextWeekPt}`);
  };

  if (state.status === 'success') {
    return (
      <Card title={s.title}>
        <Text>{state.data.summaryPt}</Text>
        <Text variant="label" color="primary">
          {s.focus}: {state.data.focusNextWeekPt}
        </Text>
      </Card>
    );
  }
  return (
    <>
      <AIStatus state={state} onRetry={retry} loadingText={s.loading} />
      {state.status !== 'loading' && <Button label={s.button} icon="cpu" variant="ghost" onPress={() => void ask()} />}
    </>
  );
}
