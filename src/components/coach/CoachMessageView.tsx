import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Chip, Notice, Text } from '@/components/ui';
import type { CoachMessage } from '@/db/coachRepo';
import { strings } from '@/i18n/strings';
import { makeStyles } from '@/theme';
import { findExercise } from '@/training/catalog';

const c = strings.ai.coach;

/** Uma mensagem da conversa: minha (à direita) ou da IA, com exercícios sugeridos e o aviso de segurança. */
export function CoachMessageView({ message }: { message: CoachMessage }) {
  const styles = useStyles();
  const mine = message.role === 'user';
  const suggested = (message.suggestedExerciseIds ?? []).flatMap((id) => {
    const e = findExercise(id);
    return e ? [e] : [];
  });
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]} accessible accessibilityLabel={`${mine ? c.you : c.ai}: ${message.text}`}>
      <Text variant="caption" color="textMuted">
        {mine ? c.you : c.ai}
      </Text>
      <Text>{message.text}</Text>
      {suggested.length > 0 && (
        <>
          <Text variant="caption" color="textMuted">
            {c.suggested}
          </Text>
          <View style={styles.chips}>
            {suggested.map((e) => (
              <Chip key={e.id} label={e.name} icon="activity" onPress={() => router.push(`/exercises/${e.id}`)} />
            ))}
          </View>
        </>
      )}
      {message.safetyFlag && (
        <Notice tone="warning" action={<Button label={c.seeSafety} variant="ghost" onPress={() => router.push('/safety')} />}>
          {c.safety}
        </Notice>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bubble: { gap: t.spacing.xs, padding: t.spacing.md, borderRadius: t.radii.lg, maxWidth: '92%' },
  mine: { alignSelf: 'flex-end', backgroundColor: t.colors.surfaceAlt },
  theirs: { alignSelf: 'flex-start', backgroundColor: t.colors.surface, borderWidth: t.sizes.hairline, borderColor: t.colors.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
