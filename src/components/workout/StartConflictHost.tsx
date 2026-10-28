import { Button, Sheet, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { answerStartConflict, useStartConflict } from '@/stores/startConflictStore';

const c = strings.workout.conflict;

/** Começar um treino com outro em andamento (com séries feitas): continuar o que está aberto ou salvá-lo e começar o novo. */
export function StartConflictHost() {
  const request = useStartConflict((s) => s.request);
  return (
    <Sheet visible={request != null} onClose={() => answerStartConflict(null)} title={c.title} snapPoints={['45%']}>
      {request && (
        <>
          <Text>{c.message(request.activeName, request.doneSets)}</Text>
          <Button label={c.continue} icon="play" size="main" onPress={() => answerStartConflict('continue')} />
          <Button label={c.saveAndStart(request.nextName)} icon="save" variant="secondary" onPress={() => answerStartConflict('saveAndStart')} />
          <Text variant="caption" color="textMuted">
            {c.saveHint}
          </Text>
        </>
      )}
    </Sheet>
  );
}
