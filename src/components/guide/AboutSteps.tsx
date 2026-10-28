import { View } from 'react-native';

import { Chip, Notice } from '@/components/ui';
import { strings } from '@/i18n/strings';
import {
  ADDRESS_FORMS,
  CONTEXTS,
  GOALS,
  HRT,
  PRIORITIES,
  SCREENING,
  SURGERIES,
  type Profile,
  type Surgery,
} from '@/profile/profile';
import { patchProfile, useProfile } from '@/stores/profileStore';
import { makeStyles } from '@/theme';

import { CheckCards, ChoiceCards, YesNo } from './Choices';
import { DateField, NumberField } from './Fields';

const g = strings.guide;
const o = g.options;

const useAnswers = () => useProfile((s) => s.profile);
const save = (patch: Partial<Profile>) => void patchProfile(patch);

export function AddressStep() {
  const p = useAnswers();
  return (
    <ChoiceCards
      label={g.steps.address.title}
      options={ADDRESS_FORMS.map((v) => ({ value: v, label: o.address[v] }))}
      value={p.address}
      onChange={(address) => save({ address })}
    />
  );
}

export function GoalStep() {
  const p = useAnswers();
  return (
    <ChoiceCards
      label={g.steps.goal.title}
      options={GOALS.map((v) => ({ value: v, label: o.goal[v], description: o.goalHelp[v] }))}
      value={p.goal}
      onChange={(goal) => save({ goal })}
    />
  );
}

export function PrioritiesStep() {
  const p = useAnswers();
  return (
    <CheckCards
      label={g.steps.priorities.title}
      options={PRIORITIES.map((v) => ({ value: v, label: o.priorities[v], description: o.prioritiesHelp[v] }))}
      values={p.priorities}
      onChange={(priorities) => save({ priorities })}
    />
  );
}

export function ContextStep() {
  const p = useAnswers();
  return (
    <ChoiceCards
      label={g.steps.context.title}
      options={CONTEXTS.map((v) => ({ value: v, label: o.context[v] }))}
      value={p.context}
      onChange={(context) => save({ context })}
    />
  );
}

export function HrtStep() {
  const p = useAnswers();
  const onTherapy = p.hrt != null && p.hrt !== 'none' && p.hrt !== 'preferNot';
  return (
    <>
      <ChoiceCards
        label={g.steps.hrt.title}
        options={HRT.map((v) => ({ value: v, label: o.hrt[v] }))}
        value={p.hrt}
        onChange={(hrt) => save({ hrt })}
      />
      {onTherapy && (
        <NumberField
          label={g.steps.hrt.months}
          value={p.hrtMonths}
          unit={g.steps.hrt.monthsUnit}
          decimals={false}
          step={1}
          onChange={(hrtMonths) => save({ hrtMonths: hrtMonths == null ? null : Math.round(hrtMonths) })}
        />
      )}
    </>
  );
}

export function FollowUpStep() {
  const p = useAnswers();
  return (
    <>
      <YesNo label={g.steps.followUp.endo} value={p.endocrinologist} onChange={(endocrinologist) => save({ endocrinologist })} />
      <YesNo label={g.steps.followUp.nutri} value={p.nutritionist} onChange={(nutritionist) => save({ nutritionist })} />
      {p.endocrinologist === false && <Notice>{g.susNotice}</Notice>}
    </>
  );
}

export function SurgeryStep() {
  const styles = useStyles();
  const p = useAnswers();
  const pick = (kind: Surgery | null) =>
    save({ surgery: kind ? { kind, date: p.surgery?.date ?? null, clearedOn: p.surgery?.clearedOn ?? null } : null });
  return (
    <>
      <View style={styles.chips}>
        <Chip label={g.steps.surgery.none} selected={p.surgery == null} onPress={() => pick(null)} />
        {SURGERIES.map((s) => (
          <Chip key={s} label={o.surgery[s]} selected={p.surgery?.kind === s} onPress={() => pick(s)} />
        ))}
      </View>
      {p.surgery && (
        <>
          <DateField
            label={g.steps.surgery.date}
            value={p.surgery.date}
            onChange={(date) => p.surgery && save({ surgery: { ...p.surgery, date } })}
          />
          <DateField
            label={g.steps.surgery.cleared}
            helper={g.steps.surgery.clearedHelp}
            value={p.surgery.clearedOn}
            onChange={(clearedOn) => p.surgery && save({ surgery: { ...p.surgery, clearedOn } })}
          />
        </>
      )}
    </>
  );
}

export function ScreeningStep() {
  const p = useAnswers();
  const toggle = (item: (typeof SCREENING)[number], yes: boolean) =>
    save({ screening: yes ? [...new Set([...p.screening, item])] : p.screening.filter((s) => s !== item) });
  return (
    <>
      {SCREENING.map((item) => (
        <YesNo
          key={item}
          label={o.screening[item]}
          value={p.screening.includes(item) ? true : p.screeningAnswered ? false : null}
          onChange={(yes) => toggle(item, yes)}
        />
      ))}
      {p.screening.length > 0 && <Notice tone="warning">{g.screeningNotice}</Notice>}
    </>
  );
}

const useStyles = makeStyles((t) => ({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
