import { ageOn, usesEstrogen, type Profile } from '@/profile/profile';
import { dayTargets, DEFAULT_MEAL_TIMES, SLOTS_BY_COUNT, withAdjustment, type DayTargets, type SlotKey } from '@/nutrition/targets';

/**
 * Metas do dia pelo perfil (seção 10.1), com o ajuste confirmado no check-in.
 * No modo da nutri, as metas digitadas (seção 10.8), sem ajuste.
 */
export function profileTargets(profile: Profile, now = new Date(), blockDeficit = false): DayTargets | null {
  if (profile.nutritionistMode && profile.nutriTargets) {
    return { ...profile.nutriTargets, goal: 'maintain', bmr: 0, tdee: 0, atFloor: false };
  }
  if (!profile.weightKg || !profile.heightCm || !profile.birthDate) return null;
  const base = dayTargets({
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    age: ageOn(profile.birthDate, now),
    hrt: profile.hrt === 'none' ? 'none' : usesEstrogen(profile) ? 'estrogen' : null,
    hrtMonths: profile.hrtMonths,
    daysPerWeek: profile.daysPerWeek ?? 3,
    goal: profile.weightGoal ?? 'maintain',
    blockDeficit,
  });
  // Com o déficit bloqueado (16.4), ajustes para baixo não valem.
  return withAdjustment(base, blockDeficit ? Math.max(0, profile.kcalAdjustment) : profile.kcalAdjustment);
}

/** As refeições do dia, com horário (pergunta 16). */
export function mealSlots(profile: Pick<Profile, 'mealsPerDay' | 'mealTimes'>): { slot: SlotKey; time: string }[] {
  const slots = SLOTS_BY_COUNT[profile.mealsPerDay ?? 4] ?? SLOTS_BY_COUNT[4];
  return slots.map((slot) => ({ slot, time: profile.mealTimes[slot] ?? DEFAULT_MEAL_TIMES[slot] }));
}

/** Recomendação do objetivo de peso (pergunta 15): iniciante → manter (recomposição). */
export const recommendedWeightGoal = (p: Pick<Profile, 'experience'>) => (p.experience === 'experienced' ? null : 'maintain');
