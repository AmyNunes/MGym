import { router } from 'expo-router';
import { View } from 'react-native';

import { expectations } from '@/body/expectations';
import { MuscleBars } from '@/components/plan/MuscleBars';
import { Button, Card, Text } from '@/components/ui';
import type { CheckinRecord } from '@/db/checkinsRepo';
import type { PersonalRecord } from '@/db/recordsRepo';
import { strings } from '@/i18n/strings';
import { formatShortDate } from '@/lib/dates';
import type { Profile } from '@/profile/profile';
import { makeStyles } from '@/theme';
import type { GroupVolume } from '@/training/volume';
import type { VolumeGroup } from '@/training/exerciseModel';

import { CardioRing } from './CardioRing';
import { RecordRows } from './RecordRows';

const e = strings.evolution;
const x = strings.expectations;

/** Check-in da semana: pendente no domingo; sempre dá para fazer pela Evolução. */
export function CheckinCard({ pending, last }: { pending: boolean; last: CheckinRecord | null }) {
  return (
    <Card title={strings.checkin.title}>
      <Text color="textMuted">{pending || !last ? e.checkinBody : e.checkinDone(formatShortDate(new Date(last.createdAt)))}</Text>
      <Button
        label={e.doCheckin}
        icon="clipboard"
        variant={pending ? 'primary' : 'secondary'}
        onPress={() => router.push('/checkin')}
      />
    </Card>
  );
}

/** Força (seção 12.6): recordes recentes. */
export function StrengthCard({ records }: { records: PersonalRecord[] }) {
  const styles = useStyles();
  return (
    <Card title={e.strengthTitle} flat>
      {records.length > 0 && <RecordRows records={records} />}
      <View style={styles.pad}>
        {records.length === 0 && <Text color="textMuted">{e.strengthEmpty}</Text>}
        <Button label={e.seeStrength} variant="ghost" onPress={() => router.push('/progress/strength')} />
      </View>
    </Card>
  );
}

/** Semana (seção 12.6): séries por grupo × meta e o anel do cardio. */
export function WeekVolumeCard({
  volume,
  goals,
  cardioMinutes,
}: {
  volume: GroupVolume;
  goals: Partial<Record<VolumeGroup, number>>;
  cardioMinutes: number;
}) {
  return (
    <Card title={e.weekTitle}>
      <MuscleBars volume={volume} goals={goals} />
      <CardioRing minutes={cardioMinutes} />
    </Card>
  );
}

/** O que esperar (seção 11.6), adaptado ao objetivo e ao tempo de terapia hormonal. */
export function ExpectationsCard({ profile }: { profile: Profile }) {
  const styles = useStyles();
  return (
    <Card title={x.title}>
      {expectations(profile).map(({ row, now }) => (
        <View key={row} style={styles.row}>
          <Text variant="label">{x.rows[row].what}</Text>
          <Text variant="caption" color="textMuted">
            {x.rows[row].when}
          </Text>
          {now && (
            <Text variant="caption" color="primary">
              {x.now}
            </Text>
          )}
        </View>
      ))}
      <Text variant="label" color="primary">
        {x.closing}
      </Text>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  row: { gap: t.spacing.xs },
  pad: { padding: t.spacing.lg, gap: t.spacing.sm },
}));
