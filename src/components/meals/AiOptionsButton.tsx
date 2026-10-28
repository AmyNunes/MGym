import { AIStatus } from '@/components/ai/AIStatus';
import { Button } from '@/components/ui';
import { useAIRequest } from '@/features/ai/useAIRequest';
import { aiOptionsForSlot } from '@/features/meals/aiMeals';
import { strings } from '@/i18n/strings';
import { showSnackbar } from '@/stores/snackbarStore';

const m = strings.ai.meals;

/** "Novas opções com IA" (seção 14.3): só alimentos do banco; as quantidades vêm da TACO. */
export function AiOptionsButton({ slotId, onDone }: { slotId: string; onDone: () => void }) {
  const { state, run, retry } = useAIRequest(aiOptionsForSlot);

  const ask = async () => {
    const count = await run(slotId);
    if (count == null) return;
    showSnackbar(count > 0 ? m.replaced : m.noneValid);
    if (count > 0) onDone();
  };

  return (
    <>
      <AIStatus state={state} onRetry={retry} loadingText={m.newOptionsLoading} />
      {state.status !== 'loading' && <Button label={m.newOptions} icon="cpu" variant="ghost" onPress={() => void ask()} />}
    </>
  );
}
