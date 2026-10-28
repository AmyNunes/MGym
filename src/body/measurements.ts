/** Medidas do corpo (seção 11.2), em cm com uma casa decimal. */

export const MEASURE_SITES = ['waist', 'hips', 'bust', 'underbust', 'thigh', 'arm', 'calf'] as const;
export type MeasureSite = (typeof MEASURE_SITES)[number];
export type MeasureValues = Partial<Record<MeasureSite, number>>;

/** Locais usados por padrão (dá para escolher outros). */
export const DEFAULT_SITES: readonly MeasureSite[] = ['waist', 'hips', 'bust', 'thigh'];

/** Faixa aceitável de uma leitura, em cm. */
export const MEASURE_LIMITS = { min: 10, max: 250 } as const;

/** Duas leituras que diferem mais que isto pedem uma terceira (a fita escorregou?). */
export const READINGS_TOLERANCE_CM = 1;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** O app guarda a média das duas leituras. */
export function averageReadings(a: number, b: number | null): number {
  return round1(b == null ? a : (a + b) / 2);
}

export function readingsDisagree(a: number, b: number): boolean {
  return Math.abs(a - b) > READINGS_TOLERANCE_CM;
}

export type MeasureEntry = { measuredAt: string; values: MeasureValues };

export type SiteChange = {
  latest: number;
  /** Diferença desde a primeira medida (null se só há uma). */
  sinceStart: number | null;
  /** Diferença para a primeira medida das últimas 4 semanas (null se não há). */
  last4Weeks: number | null;
};

const FOUR_WEEKS_MS = 31 * 86_400_000;

/** Última medida de um local e as comparações "desde o início" e "últimas 4 semanas". */
export function siteChange(entries: readonly MeasureEntry[], site: MeasureSite): SiteChange | null {
  const series = entries
    .filter((e) => e.values[site] != null)
    .map((e) => ({ t: Date.parse(e.measuredAt), v: e.values[site] as number }))
    .sort((a, b) => a.t - b.t);
  const last = series.at(-1);
  if (!last) return null;
  const first = series[0];
  const window = series.filter((p) => p.t < last.t && p.t >= last.t - FOUR_WEEKS_MS);
  return {
    latest: last.v,
    sinceStart: series.length > 1 ? round1(last.v - first.v) : null,
    last4Weeks: window.length ? round1(last.v - window[0].v) : null,
  };
}

/** A série de um local para o gráfico. */
export function siteSeries(entries: readonly MeasureEntry[], site: MeasureSite) {
  return entries
    .filter((e) => e.values[site] != null)
    .map((e) => ({ t: Date.parse(e.measuredAt), v: e.values[site] as number }))
    .sort((a, b) => a.t - b.t);
}

/** A medida mais recente de um local (para as relações). */
export function latestValue(entries: readonly MeasureEntry[], site: MeasureSite): number | null {
  return siteChange(entries, site)?.latest ?? null;
}
