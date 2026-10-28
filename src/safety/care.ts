import { usesCyproterone, usesEstrogen, usesSpironolactone, type Profile } from '@/profile/profile';

import { recoveryState } from './recovery';

/**
 * "Cuidados para você" (seções 8.2, 16.2, 16.5 e 16.6): só os itens que se aplicam ao perfil.
 * O app nunca orienta sobre hormônios ou doses; aqui ficam cuidados práticos e sinais de alerta.
 */
export type CareItem =
  | 'recovery'
  | 'screening'
  | 'spiroStandUp'
  | 'spiroSalt'
  | 'spiroNsaid'
  | 'cpaLightDays'
  | 'cpaAlcohol'
  | 'estrogenClots'
  | 'estrogenSmoking'
  | 'bloodTests'
  | 'susClinics';

export function careItems(profile: Profile, todayKey: string): CareItem[] {
  const items: CareItem[] = [];
  if (recoveryState(profile.surgery, todayKey).active) items.push('recovery');
  if (profile.screening.length > 0) items.push('screening');
  if (usesSpironolactone(profile)) items.push('spiroStandUp', 'spiroSalt', 'spiroNsaid');
  if (usesCyproterone(profile)) items.push('cpaLightDays', 'cpaAlcohol');
  if (usesEstrogen(profile)) items.push('estrogenClots', 'estrogenSmoking');
  if (profile.hrt && profile.hrt !== 'none' && profile.hrt !== 'preferNot') items.push('bloodTests');
  if (profile.endocrinologist === false) items.push('susClinics');
  return items;
}

/** Exercícios no chão (elevação pélvica, ponte, core): com espironolactona, levantar devagar (16.2). */
export const FLOOR_PATTERNS = ['hipThrust', 'core'] as const;
