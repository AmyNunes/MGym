import { ListRow } from '@/components/ui';
import type { PersonalRecord } from '@/db/recordsRepo';
import { strings } from '@/i18n/strings';
import { formatDayMonth } from '@/lib/dates';
import { formatKg } from '@/lib/format';
import { findExercise } from '@/training/catalog';

/** "maior carga: 80 kg × 8" ou "maior 1RM estimado: 95 kg". */
export function recordValue(r: PersonalRecord): string {
  const kind = strings.workout.recordKinds[r.kind];
  return r.kind === 'weight' ? `${kind}: ${formatKg(r.weightKg)} × ${r.reps}` : `${kind}: ${formatKg(r.value)}`;
}

/** Recordes recentes (seção 11.4), com o selo dourado. */
export function RecordRows({ records }: { records: PersonalRecord[] }) {
  return (
    <>
      {records.map((r) => (
        <ListRow
          key={r.id}
          icon="award"
          iconColor="record"
          title={findExercise(r.exerciseId)?.name ?? r.exerciseId}
          subtitle={strings.strength.record(recordValue(r), formatDayMonth(new Date(r.achievedAt)))}
        />
      ))}
    </>
  );
}
