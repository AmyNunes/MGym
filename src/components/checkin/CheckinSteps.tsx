import { router } from 'expo-router';
import { View } from 'react-native';

import { trendDirection } from '@/body/trend';
import { BulletList, Button, Card, Chip, ListGroup, ListRow, Notice, Segmented, Text, Toggle } from '@/components/ui';
import { signed } from '@/components/progress/WeightCard';
import { RATINGS, type CheckinAnswers, type CheckinStats, type DecisionKind } from '@/features/checkin/model';
import { strings } from '@/i18n/strings';
import { formatKgNumber } from '@/lib/format';
import type { NumbersMode, WeightVisibility } from '@/profile/profile';
import { CARE_QUESTIONS, suggestProfessional, type CareQuestion, type WarningSignal } from '@/safety/warnings';
import { makeStyles } from '@/theme';

const c = strings.checkin;

/** 1. Números da semana. */
export function NumbersStep({ stats, visibility }: { stats: CheckinStats; visibility: WeightVisibility }) {
  const weight =
    visibility === 'show' && stats.weightRate
      ? strings.weight.rate(signed(stats.weightRate.kg), signed(stats.weightRate.pct))
      : visibility === 'direction'
        ? strings.weight.directions[trendDirection(stats.weightRate)]
        : null;
  const lines = [
    c.workouts(stats.workouts, stats.planned),
    c.glutes(formatKgNumber(stats.glutes), stats.glutesGoal),
    c.records(stats.records),
    c.cardio(stats.cardioMinutes),
    ...(stats.mealsMarkedPct != null ? [c.meals(stats.mealsMarkedPct)] : []),
    ...(weight ? [c.weight(weight)] : []),
  ];
  return (
    <Card title={c.numbersTitle}>
      <BulletList items={lines} />
    </Card>
  );
}

/** 2. Como foi (1–5). */
export function RatingsStep({ ratings, onChange }: { ratings: CheckinAnswers['ratings']; onChange: (r: CheckinAnswers['ratings']) => void }) {
  const styles = useStyles();
  return (
    <Card title={c.howTitle}>
      <Text variant="caption" color="textMuted">
        {c.howHelp}
      </Text>
      {RATINGS.map((key) => {
        const meta = c.ratings[key];
        return (
          <View key={key} style={styles.rating}>
            <Text variant="label">{meta.label}</Text>
            <View style={styles.chips}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip
                  key={n}
                  label={String(n)}
                  selected={ratings[key] === n}
                  accessibilityLabel={c.ratingValue(meta.label, n)}
                  onPress={() => onChange({ ...ratings, [key]: n })}
                />
              ))}
            </View>
            <Text variant="caption" color="textMuted">
              {c.ratingEnds(meta.low, meta.high)}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}

type CareAnswers = Partial<Record<CareQuestion, boolean>>;

/** 4. Cuidado gentil (16.4): só aparece com um sinal de alerta. Não é diagnóstico. */
export function CareStep({ signals, answers, onChange }: { signals: WarningSignal[]; answers: CareAnswers; onChange: (a: CareAnswers) => void }) {
  const styles = useStyles();
  const answered = CARE_QUESTIONS.every((q) => answers[q] != null);
  return (
    <Card title={c.careTitle}>
      <Text>{c.careIntro}</Text>
      <BulletList items={signals.map((s) => c.careSignals[s])} />
      {CARE_QUESTIONS.map((q) => (
        <View key={q} style={styles.rating}>
          <Text variant="label">{c.questions[q]}</Text>
          <Segmented
            accessibilityLabel={c.questions[q]}
            options={[
              { value: 'yes', label: c.yes },
              { value: 'no', label: c.no },
            ]}
            value={answers[q] == null ? null : answers[q] ? 'yes' : 'no'}
            onChange={(v) => onChange({ ...answers, [q]: v === 'yes' })}
          />
        </View>
      ))}
      {(answered || suggestProfessional(answers)) && (
        <Notice icon="heart">{suggestProfessional(answers) ? c.careProfessional : c.careOk}</Notice>
      )}
      <Text variant="caption" color="textMuted">
        {c.careDeficit}
      </Text>
      <Button label={c.seeContacts} icon="life-buoy" variant="secondary" onPress={() => router.push('/safety')} />
    </Card>
  );
}

/** 3. Decisões sugeridas: nada muda sem eu confirmar. */
export function DecisionsStep({
  offered,
  accepted,
  onToggle,
  adjustment,
  mode,
}: {
  offered: DecisionKind[];
  accepted: DecisionKind[];
  onToggle: (kind: DecisionKind) => void;
  adjustment: number | null;
  mode: NumbersMode;
}) {
  const title = (kind: DecisionKind) => {
    if (kind !== 'adjustFood') return c.decisions[kind].title;
    const up = (adjustment ?? 0) > 0;
    if (mode === 'none') return up ? c.portionsUp : c.portionsDown;
    return up ? c.adjustUp(Math.abs(adjustment ?? 0)) : c.adjustDown(Math.abs(adjustment ?? 0));
  };
  return (
    <ListGroup title={c.decisionsTitle} footer={c.decisionsHelp}>
      {offered.map((kind) => (
        <ListRow
          key={kind}
          title={title(kind)}
          subtitle={kind === 'adjustFood' ? c.adjustBody : c.decisions[kind].body}
          right={<Toggle value={accepted.includes(kind)} onValueChange={() => onToggle(kind)} accessibilityLabel={title(kind)} />}
        />
      ))}
    </ListGroup>
  );
}

const useStyles = makeStyles((t) => ({
  rating: { gap: t.spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
