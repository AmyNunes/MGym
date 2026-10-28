import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AiSummaryCard } from '@/components/checkin/AiSummaryCard';
import { CareStep, DecisionsStep, NumbersStep, RatingsStep } from '@/components/checkin/CheckinSteps';
import { Button, ErrorState, Notice, ProgressBar, Screen, Skeleton } from '@/components/ui';
import { decisionsFor, loadCheckinDraft, saveCheckin } from '@/features/checkin/checkinService';
import type { CheckinAnswers, DecisionKind } from '@/features/checkin/model';
import { strings } from '@/i18n/strings';
import { haptics } from '@/lib/haptics';
import { useLoader } from '@/lib/useLoader';
import { useProfile } from '@/stores/profileStore';
import { showSnackbar } from '@/stores/snackbarStore';
import { makeStyles, useTheme } from '@/theme';

const c = strings.checkin;
type Step = 'numbers' | 'how' | 'care' | 'decisions';

/** Check-in semanal (seção 11.5): ~2 minutos, uma parte por vez. Nada muda sem eu confirmar. */
export default function CheckinScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const profile = useProfile((s) => s.profile);
  const { state, reload } = useLoader(() => loadCheckinDraft(profile));
  const draft = state.status === 'success' ? state.data : null;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<CheckinAnswers>({ ratings: {} });
  const [accepted, setAccepted] = useState<DecisionKind[]>(['keep']);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const steps: Step[] = ['numbers', 'how', ...(draft?.safety.signals.length ? (['care'] as const) : []), 'decisions'];
  const step = steps[index];
  const last = index === steps.length - 1;
  const offered = draft ? decisionsFor(draft, answers, profile) : [];

  const toggle = (kind: DecisionKind) =>
    setAccepted((old) => {
      if (kind === 'keep') return ['keep'];
      const next = old.includes(kind) ? old.filter((k) => k !== kind) : [...old.filter((k) => k !== 'keep'), kind];
      return next.length ? next : ['keep'];
    });

  const finish = async () => {
    if (!draft) return;
    setSaving(true);
    await saveCheckin(draft, answers, offered, accepted.filter((k) => offered.includes(k)), new Date(), summary);
    haptics.light();
    showSnackbar(c.saved);
    router.back();
  };

  return (
    <Screen
      edges={[]}
      footer={
        draft && (
          <View style={styles.footer}>
            {index > 0 && (
              <View style={styles.flex}>
                <Button label={strings.measures.back} variant="secondary" size="main" onPress={() => setIndex((i) => i - 1)} />
              </View>
            )}
            <View style={styles.flex}>
              <Button
                label={last ? c.save : c.next}
                icon={last ? 'check' : undefined}
                size="main"
                loading={saving}
                onPress={() => (last ? void finish() : setIndex((i) => i + 1))}
              />
            </View>
          </View>
        )
      }
    >
      <Stack.Screen options={{ title: c.title }} />
      {state.status === 'loading' && <Skeleton height={theme.sizes.chartHeight * 2} radius="lg" />}
      {state.status === 'error' && <ErrorState message={c.loadError} onRetry={reload} />}
      {draft && (
        <>
          <ProgressBar progress={(index + 1) / steps.length} accessibilityLabel={strings.guide.progress(index + 1, steps.length)} />
          {draft.done && index === 0 && <Notice icon="check">{c.alreadyDone}</Notice>}
          {step === 'numbers' && <NumbersStep stats={draft.stats} visibility={profile.weightVisibility} />}
          {step === 'how' && <RatingsStep ratings={answers.ratings} onChange={(ratings) => setAnswers((a) => ({ ...a, ratings }))} />}
          {step === 'care' && (
            <CareStep signals={draft.safety.signals} answers={answers.care ?? {}} onChange={(care) => setAnswers((a) => ({ ...a, care }))} />
          )}
          {step === 'decisions' && (
            <>
              <DecisionsStep offered={offered} accepted={accepted} onToggle={toggle} adjustment={draft.adjustment} mode={profile.numbersMode} />
              <AiSummaryCard draft={draft} answers={answers} onSummary={setSummary} />
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  footer: { flexDirection: 'row', gap: t.spacing.md },
  flex: { flex: 1 },
}));
