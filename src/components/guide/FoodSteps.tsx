import { router } from 'expo-router';
import { View } from 'react-native';

import { Card, Chip, Notice, Segmented, Stepper, Text } from '@/components/ui';
import { mealSlots, recommendedWeightGoal } from '@/features/nutrition/profileTargets';
import { strings } from '@/i18n/strings';
import { formatTimeOfDay, parseTimeOfDay } from '@/lib/dates';
import { bmi } from '@/nutrition/targets';
import {
  COOKING_TIME,
  DIET_RESTRICTIONS,
  LUNCH_PLACES,
  MEALS_PER_DAY,
  NUMBERS_MODES,
  usesSpironolactone,
  WEIGHT_GOALS,
  type Profile,
} from '@/profile/profile';
import { patchProfile, useProfile } from '@/stores/profileStore';
import { makeStyles } from '@/theme';

import { ChipSelect, ChoiceCards, YesNo } from './Choices';
import { FoodChips } from './FoodChips';

const f = strings.guide.food;
const o = strings.guide.foodOptions;

const useAnswers = () => useProfile((s) => s.profile);
const save = (patch: Partial<Profile>) => void patchProfile(patch);
/** Horários de 15 em 15 minutos. */
const TIME_STEP = 15;

export function NumbersStep() {
  const p = useAnswers();
  return (
    <ChoiceCards
      label={f.numbers.title}
      options={NUMBERS_MODES.map((v) => ({ value: v, label: o.numbers[v], description: o.numbersHelp[v] }))}
      value={p.numbersMode}
      onChange={(numbersMode) => save({ numbersMode })}
    />
  );
}

export function WeightGoalStep() {
  const p = useAnswers();
  const recommended = recommendedWeightGoal(p);
  const lowWeight = p.weightKg != null && p.heightCm != null && bmi(p.weightKg, p.heightCm) < 18.5;
  return (
    <>
      {recommended && <Notice>{f.weightGoal.recommended(o.weightGoal[recommended])}</Notice>}
      <ChoiceCards
        label={f.weightGoal.title}
        options={WEIGHT_GOALS.map((v) => ({ value: v, label: o.weightGoal[v], description: o.weightGoalHelp[v] }))}
        value={p.weightGoal}
        onChange={(weightGoal) => save({ weightGoal })}
      />
      {lowWeight && p.weightGoal === 'lose' && <Notice tone="warning">{strings.guide.lowWeightNoDeficit}</Notice>}
    </>
  );
}

export function MealsStep() {
  const styles = useStyles();
  const p = useAnswers();
  return (
    <>
      <Segmented
        accessibilityLabel={f.meals.title}
        options={MEALS_PER_DAY.map((n) => ({ value: `${n}` as const, label: o.mealsPerDay(n) }))}
        value={(p.mealsPerDay ? `${p.mealsPerDay}` : '') as `${(typeof MEALS_PER_DAY)[number]}`}
        onChange={(v) => save({ mealsPerDay: Number(v) })}
      />
      {p.mealsPerDay != null &&
        mealSlots(p).map(({ slot, time }) => (
          <View key={slot} style={styles.row}>
            <Text style={styles.flex}>{strings.meals.slots[slot]}</Text>
            <Stepper
              accessibilityLabel={f.meals.time(strings.meals.slots[slot])}
              value={parseTimeOfDay(time)}
              min={0}
              max={24 * 60 - TIME_STEP}
              step={TIME_STEP}
              format={formatTimeOfDay}
              onChange={(minutes) => save({ mealTimes: { ...p.mealTimes, [slot]: formatTimeOfDay(minutes) } })}
            />
          </View>
        ))}
    </>
  );
}

export function DietRestrictionsStep() {
  const p = useAnswers();
  return (
    <>
      <ChipSelect
        options={DIET_RESTRICTIONS.map((v) => ({ value: v, label: o.restrictions[v] }))}
        values={p.restrictions}
        onChange={(restrictions) => save({ restrictions })}
      />
      <Card title={f.restrictions.dislikes}>
        <FoodChips ids={p.dislikes} onRemove={(id) => save({ dislikes: p.dislikes.filter((x) => x !== id) })} />
        <Chip label={f.restrictions.add} icon="plus" onPress={() => router.push('/foods?pick=dislikes')} />
      </Card>
      <Card title={f.restrictions.likes}>
        <FoodChips ids={p.likes} onRemove={(id) => save({ likes: p.likes.filter((x) => x !== id) })} />
        <Chip label={f.restrictions.add} icon="plus" onPress={() => router.push('/foods?pick=likes')} />
      </Card>
    </>
  );
}

export function RoutineStep() {
  const p = useAnswers();
  return (
    <>
      <Text variant="label">{f.routine.cooking}</Text>
      <ChoiceCards
        label={f.routine.cooking}
        options={COOKING_TIME.map((v) => ({ value: v, label: o.cooking[v] }))}
        value={p.cookingTime}
        onChange={(cookingTime) => save({ cookingTime })}
      />
      <Text variant="label">{f.routine.lunch}</Text>
      <ChoiceCards
        label={f.routine.lunch}
        options={LUNCH_PLACES.map((v) => ({ value: v, label: o.lunch[v] }))}
        value={p.lunchPlace}
        onChange={(lunchPlace) => save({ lunchPlace })}
      />
    </>
  );
}

export function PotassiumStep() {
  const p = useAnswers();
  return (
    <>
      <YesNo label={f.potassium.title} value={p.limitPotassium} onChange={(limitPotassium) => save({ limitPotassium })} />
      {usesSpironolactone(p) && <Notice>{f.potassium.spiro}</Notice>}
    </>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  flex: { flex: 1 },
}));
