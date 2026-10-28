import { Button, Card, Segmented, Stepper, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatTimeOfDay, parseTimeOfDay } from '@/lib/dates';
import { DAYS_PER_WEEK, EXPERIENCE, LIMITATIONS, SESSION_MINUTES, type Profile } from '@/profile/profile';
import { patchProfile, useProfile } from '@/stores/profileStore';

import { ChipSelect, ChoiceCards } from './Choices';
import { DateField, NumberField } from './Fields';

const g = strings.guide;
const o = g.options;

/** Passo do horário (min) e o horário que aparece ao escolher um. */
const TIME_STEP = 15;
const DEFAULT_TIME = '18:00';

const useAnswers = () => useProfile((s) => s.profile);
const save = (patch: Partial<Profile>) => void patchProfile(patch);

export function ExperienceStep() {
  const p = useAnswers();
  return (
    <ChoiceCards
      label={g.steps.experience.title}
      options={EXPERIENCE.map((v) => ({ value: v, label: o.experience[v] }))}
      value={p.experience}
      onChange={(experience) => save({ experience })}
    />
  );
}

export function ScheduleStep() {
  const p = useAnswers();
  const days = String(p.daysPerWeek ?? '') as `${(typeof DAYS_PER_WEEK)[number]}`;
  const minutes = String(p.sessionMinutes ?? '') as `${(typeof SESSION_MINUTES)[number]}`;
  return (
    <>
      <Card title={g.steps.schedule.days}>
        <Segmented
          accessibilityLabel={g.steps.schedule.days}
          options={DAYS_PER_WEEK.map((n) => ({ value: `${n}` as const, label: o.days(n) }))}
          value={days}
          onChange={(v) => save({ daysPerWeek: Number(v), weekdays: [] })}
        />
      </Card>
      <Card title={g.steps.schedule.minutes}>
        <Segmented
          accessibilityLabel={g.steps.schedule.minutes}
          options={SESSION_MINUTES.map((n) => ({ value: `${n}` as const, label: o.minutes(n) }))}
          value={minutes}
          onChange={(v) => save({ sessionMinutes: Number(v) })}
        />
      </Card>
      <Card title={g.steps.schedule.time}>
        <Text variant="caption" color="textMuted">
          {g.steps.schedule.timeHelp}
        </Text>
        {p.preferredTime ? (
          <>
            <Stepper
              accessibilityLabel={g.steps.schedule.time}
              value={parseTimeOfDay(p.preferredTime)}
              min={0}
              max={24 * 60 - TIME_STEP}
              step={TIME_STEP}
              format={formatTimeOfDay}
              onChange={(minutes) => save({ preferredTime: formatTimeOfDay(minutes) })}
            />
            <Button label={g.steps.schedule.noTime} variant="ghost" onPress={() => save({ preferredTime: null })} />
          </>
        ) : (
          <Button label={g.steps.schedule.setTime} icon="clock" variant="secondary" onPress={() => save({ preferredTime: DEFAULT_TIME })} />
        )}
      </Card>
    </>
  );
}

export function LimitationsStep() {
  const p = useAnswers();
  return (
    <ChipSelect
      options={LIMITATIONS.map((v) => ({ value: v, label: o.limitations[v] }))}
      values={p.limitations}
      onChange={(limitations) => save({ limitations })}
    />
  );
}

export function BodyStep() {
  const p = useAnswers();
  const b = g.steps.body;
  return (
    <>
      <NumberField label={b.height} value={p.heightCm} unit="cm" decimals={false} step={1} onChange={(heightCm) => save({ heightCm })} />
      <DateField label={b.birth} value={p.birthDate} onChange={(birthDate) => save({ birthDate })} />
      <NumberField label={b.weight} value={p.weightKg} unit="kg" decimals step={0.5} onChange={(weightKg) => save({ weightKg })} />
    </>
  );
}
