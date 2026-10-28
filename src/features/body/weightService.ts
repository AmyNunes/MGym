import { trendDirection, weeklyRate, weightTrend, type TrendPoint, type WeeklyRate } from '@/body/trend';
import { countWeights, insertWeight, listWeights, type WeightRecord } from '@/db/bodyRepo';
import { appDayKey } from '@/lib/dates';
import { patchProfile, useProfile } from '@/stores/profileStore';

/** Peso (seção 11.1): registros, tendência e ritmo semanal. */

export type WeightView = {
  records: WeightRecord[];
  points: TrendPoint[];
  /** A tendência de hoje (o número em destaque). */
  trend: number | null;
  rate: WeeklyRate | null;
  direction: ReturnType<typeof trendDirection>;
};

export function weightView(records: WeightRecord[], now = new Date()): WeightView {
  const points = weightTrend(records.map((r) => ({ day: appDayKey(new Date(r.measuredAt)), kg: r.kg })));
  const rate = weeklyRate(points, appDayKey(now));
  return { records, points, trend: points.at(-1)?.trend ?? null, rate, direction: trendDirection(rate) };
}

export async function loadWeightView(now = new Date()): Promise<WeightView> {
  return weightView(await listWeights(), now);
}

/**
 * Registra o peso e deixa o perfil com a tendência (as metas de comida usam o peso do perfil).
 * Guarda kg com uma casa decimal.
 */
export async function addWeight(kg: number): Promise<string> {
  const id = await insertWeight(Math.round(kg * 10) / 10);
  const view = await loadWeightView();
  if (view.trend != null) await patchProfile({ weightKg: Math.round(view.trend * 10) / 10 });
  return id;
}

/** O peso do Guia vira o primeiro registro (decisão do plano), se ainda não há nenhum. */
export async function syncFirstWeight(): Promise<void> {
  const kg = useProfile.getState().profile.weightKg;
  if (kg != null && (await countWeights()) === 0) await insertWeight(kg);
}
