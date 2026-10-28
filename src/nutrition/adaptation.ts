import { GAIN_SHARE, LOSE_SHARE, MAX_DEFICIT_KCAL, MAX_DEFICIT_SHARE, type WeightGoal } from './targets';

/**
 * Adaptação das metas (seção 10.1): a cada 2–3 semanas, com a tendência do peso e as refeições
 * marcadas, o app reestima o gasto (média ingerida − Δtendência × 7.700 kcal ÷ dias) e ajusta
 * a meta em passos de 100–150 kcal. Eu confirmo no check-in.
 */

export const KCAL_PER_KG = 7700;
/** Dias completos (todas as refeições marcadas) necessários na janela. */
export const MIN_COMPLETE_DAYS = 7;
/** Intervalo mínimo entre dois ajustes. */
export const ADJUST_EVERY_DAYS = 14;
export const ADJUST_STEP_MIN = 100;
export const ADJUST_STEP_MAX = 150;

export type AdaptInput = {
  goal: WeightGoal;
  currentKcal: number;
  /** Piso: o maior entre 1.500 kcal e o metabolismo basal estimado. */
  floor: number;
  /** Energia (kcal) de cada dia completo da janela. */
  intakeDays: readonly number[];
  /** Variação da tendência do peso na janela (kg). */
  trendDeltaKg: number;
  windowDays: number;
  blockDeficit: boolean;
};

export type Adaptation = { delta: number; estimatedTdee: number };

export function estimateTdee(meanIntake: number, trendDeltaKg: number, days: number): number {
  return meanIntake - (trendDeltaKg * KCAL_PER_KG) / days;
}

/** O ajuste sugerido (em kcal), ou null quando faltam dados ou a meta já está perto do certo. */
export function adaptTargets(input: AdaptInput): Adaptation | null {
  if (input.intakeDays.length < MIN_COMPLETE_DAYS || input.windowDays <= 0) return null;
  const mean = input.intakeDays.reduce((a, b) => a + b, 0) / input.intakeDays.length;
  const tdee = estimateTdee(mean, input.trendDeltaKg, input.windowDays);
  let desired = tdee;
  if (input.goal === 'gain') desired = tdee * (1 + GAIN_SHARE);
  if (input.goal === 'lose' && !input.blockDeficit) desired = tdee - Math.min(tdee * LOSE_SHARE, MAX_DEFICIT_KCAL, tdee * MAX_DEFICIT_SHARE);
  desired = Math.max(desired, input.floor);

  const diff = desired - input.currentKcal;
  if (Math.abs(diff) < ADJUST_STEP_MIN) return null;
  const step = Math.min(ADJUST_STEP_MAX, Math.round(Math.abs(diff) / 10) * 10);
  let delta = Math.sign(diff) * step;
  if (input.currentKcal + delta < input.floor) delta = input.floor - input.currentKcal;
  return delta === 0 ? null : { delta, estimatedTdee: Math.round(tdee) };
}
