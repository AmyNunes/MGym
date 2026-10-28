import { useState } from 'react';
import { View } from 'react-native';

import { Card, Chip, Notice } from '@/components/ui';
import { saveFeedback } from '@/features/summary/useWorkoutSummary';
import { strings } from '@/i18n/strings';
import { makeStyles } from '@/theme';
import type { Feeling, Pain } from '@/training/workoutModel';

const s = strings.summary;
const FEELINGS: Feeling[] = ['light', 'good', 'hard'];
const PAINS: Pain[] = ['none', 'muscle', 'joint'];

type Props = { workoutId: string; feeling: Feeling | null; pain: Pain | null };

/** "Como foi?" e "Sentiu alguma dor?" (seção 9.5). Dor em articulação mostra a orientação da seção 16. */
export function SummaryFeedback({ workoutId, feeling: initialFeeling, pain: initialPain }: Props) {
  const styles = useStyles();
  const [feeling, setFeeling] = useState(initialFeeling);
  const [pain, setPain] = useState(initialPain);

  return (
    <>
      <Card title={s.feelingTitle}>
        <View style={styles.chips}>
          {FEELINGS.map((f) => (
            <Chip
              key={f}
              label={s.feelings[f]}
              selected={feeling === f}
              onPress={() => {
                setFeeling(f);
                void saveFeedback(workoutId, { feeling: f });
              }}
            />
          ))}
        </View>
      </Card>
      <Card title={s.painTitle}>
        <View style={styles.chips}>
          {PAINS.map((p) => (
            <Chip
              key={p}
              label={s.pains[p]}
              selected={pain === p}
              onPress={() => {
                setPain(p);
                void saveFeedback(workoutId, { pain: p });
              }}
            />
          ))}
        </View>
        {pain === 'joint' && <Notice tone="warning">{s.jointPain}</Notice>}
      </Card>
    </>
  );
}

const useStyles = makeStyles((t) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
