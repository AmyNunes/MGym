import { strings } from '@/i18n/strings';
import { formatBrDate } from '@/lib/dates';
import { formatKgNumber } from '@/lib/format';
import type { Profile } from '@/profile/profile';

import type { StepId } from './steps';

const o = strings.guide.options;
const fo = strings.guide.foodOptions;
const p = strings.settings.profile;

const yesNo = (v: boolean | null) => (v == null ? p.notAnswered : v ? o.yes : o.no);

/** Resposta curta de cada pergunta do Guia, para Configurações › Perfil. */
export function answerSummary(step: StepId, profile: Profile): string {
  switch (step) {
    case 'address':
      return profile.address ? o.address[profile.address] : p.notAnswered;
    case 'goal':
      return profile.goal ? o.goal[profile.goal] : p.notAnswered;
    case 'priorities':
      return profile.priorities.length ? profile.priorities.map((x) => o.priorities[x]).join(', ') : p.none;
    case 'context':
      return profile.context ? o.context[profile.context] : p.notAnswered;
    case 'hrt':
      if (!profile.hrt) return p.notAnswered;
      return profile.hrtMonths != null && profile.hrt !== 'none' && profile.hrt !== 'preferNot'
        ? p.hrtMonths(o.hrt[profile.hrt], profile.hrtMonths)
        : o.hrt[profile.hrt];
    case 'followUp':
      return p.followUp(yesNo(profile.endocrinologist), yesNo(profile.nutritionist));
    case 'surgery':
      if (!profile.surgery) return strings.guide.steps.surgery.none;
      return profile.surgery.clearedOn
        ? p.surgeryCleared(o.surgery[profile.surgery.kind], formatBrDate(profile.surgery.clearedOn))
        : o.surgery[profile.surgery.kind];
    case 'screening':
      return profile.screening.length ? p.marked(profile.screening.length) : p.nothingMarked;
    case 'experience':
      return profile.experience ? o.experience[profile.experience] : p.notAnswered;
    case 'schedule':
      if (!profile.daysPerWeek || !profile.sessionMinutes) return p.notAnswered;
      return [p.schedule(profile.daysPerWeek, profile.sessionMinutes), profile.preferredTime].filter(Boolean).join(' · ');
    case 'limitations':
      return profile.limitations.length ? profile.limitations.map((x) => o.limitations[x]).join(', ') : p.none;
    case 'body':
      if (!profile.heightCm || !profile.weightKg) return p.notAnswered;
      // Com "Esconder meu peso", o resumo mostra só a altura.
      return profile.weightVisibility === 'show' ? p.body(formatKgNumber(profile.heightCm), formatKgNumber(profile.weightKg)) : p.height(formatKgNumber(profile.heightCm));
    case 'measurements':
      return strings.guide.measurements.help;
    case 'numbers':
      return fo.numbers[profile.numbersMode];
    case 'weightGoal':
      return profile.weightGoal ? fo.weightGoal[profile.weightGoal] : p.notAnswered;
    case 'meals':
      return profile.mealsPerDay ? p.mealsCount(profile.mealsPerDay) : p.notAnswered;
    case 'dietRestrictions': {
      const parts: string[] = profile.restrictions.map((r) => fo.restrictions[r]);
      if (profile.dislikes.length) parts.push(p.dislikesCount(profile.dislikes.length));
      return parts.length ? parts.join(' · ') : p.none;
    }
    case 'routine':
      return profile.cookingTime && profile.lunchPlace
        ? `${fo.cooking[profile.cookingTime]} · ${fo.lunch[profile.lunchPlace]}`
        : p.notAnswered;
    case 'potassium':
      return yesNo(profile.limitPotassium);
  }
}
