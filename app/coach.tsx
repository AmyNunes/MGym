import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AIStatus } from '@/components/ai/AIStatus';
import { CoachMessageView } from '@/components/coach/CoachMessageView';
import { Button, ErrorState, IconButton, Screen, Skeleton, Text, TextField } from '@/components/ui';
import type { Conversation } from '@/db/coachRepo';
import { ask, currentConversation, newConversation } from '@/features/coach/coachService';
import { useAIRequest } from '@/features/ai/useAIRequest';
import { strings } from '@/i18n/strings';
import { useLoader } from '@/lib/useLoader';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles, useTheme } from '@/theme';

const c = strings.ai.coach;

const send = ({ conversation, text }: { conversation: Conversation; text: string }) => ask(conversation, text);

/** "Perguntar à IA" (seção 14.3): conversa com o plano como contexto; sinais de alerta mostram ajuda. */
export default function CoachScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const loaded = useLoader(currentConversation);
  const [updated, setUpdated] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');
  const { state, run, retry, reset } = useAIRequest(send);
  const conversation = updated ?? (loaded.state.status === 'success' ? loaded.state.data : null);
  const busy = state.status === 'loading';

  const submit = async () => {
    if (!conversation || !draft.trim()) return;
    const text = draft;
    setDraft('');
    // Mostra a pergunta na hora; a resposta chega depois.
    setUpdated({ ...conversation, messages: [...conversation.messages, { role: 'user', text: text.trim(), at: new Date().toISOString() }] });
    const result = await run({ conversation, text });
    if (result) setUpdated(result);
  };

  const fresh = async () => {
    setUpdated(await newConversation());
    reset();
    showSnackbar(c.cleared);
  };

  return (
    <Screen
      edges={[]}
      footer={
        conversation && (
          <View style={styles.footer}>
            <View style={styles.flex}>
              <TextField label={c.label} placeholder={c.placeholder} value={draft} onChangeText={setDraft} multiline />
            </View>
            <Button label={c.send} icon="send" disabled={busy || !draft.trim()} onPress={() => void submit()} />
          </View>
        )
      }
    >
      <Stack.Screen
        options={{
          title: c.title,
          headerRight: () => <IconButton icon="plus-circle" accessibilityLabel={c.newChat} onPress={() => void fresh()} />,
        }}
      />
      {loaded.state.status === 'loading' && <Skeleton height={theme.sizes.listRowHeight * 2} radius="lg" />}
      {loaded.state.status === 'error' && <ErrorState onRetry={loaded.reload} />}
      {conversation && conversation.messages.length === 0 && <Text color="textMuted">{c.empty}</Text>}
      {conversation?.messages.map((m, i) => (
        <CoachMessageView key={`${m.at}-${i}`} message={m} />
      ))}
      <AIStatus
        state={state}
        onRetry={() => {
          // A pergunta já foi salva: tenta de novo sem texto novo.
          if (updated) void run({ conversation: { ...updated, messages: updated.messages.slice(0, -1) }, text: updated.messages.at(-1)?.text ?? '' }).then((r) => r && setUpdated(r));
          else retry();
        }}
      />
      {conversation && conversation.messages.length > 0 && (
        <Text variant="caption" color="textMuted">
          {strings.ai.aiNote}
        </Text>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  footer: { flexDirection: 'row', alignItems: 'flex-end', gap: t.spacing.sm },
  flex: { flex: 1 },
}));
