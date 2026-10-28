/**
 * Tendência do peso (seção 11.1): média suavizada exponencial, Tₜ = Tₜ₋₁ + α·(Wₜ − Tₜ₋₁), α = 0,1.
 * Em dias sem registro, α_ef = 1 − (1 − α)^Δdias. Vários registros no mesmo dia viram a média do dia.
 * O app mostra a tendência e o ritmo semanal; nunca destaca a diferença de um dia para o outro.
 */

export const TREND_ALPHA = 0.1;
const DAY_MS = 86_400_000;

/** Um registro de peso já com a chave do dia (virando às 04:00). */
export type WeightEntry = { day: string; kg: number };

export type TrendPoint = {
  day: string;
  /** Meia-noite local do dia, em ms (para o gráfico). */
  t: number;
  /** Média dos registros do dia. */
  kg: number;
  trend: number;
};

const dayTime = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function weightTrend(entries: readonly WeightEntry[]): TrendPoint[] {
  const byDay = new Map<string, number[]>();
  for (const e of entries) byDay.set(e.day, [...(byDay.get(e.day) ?? []), e.kg]);
  const days = [...byDay.keys()].sort();
  const points: TrendPoint[] = [];
  for (const day of days) {
    const values = byDay.get(day) ?? [];
    const kg = values.reduce((a, b) => a + b, 0) / values.length;
    const t = dayTime(day);
    const prev = points.at(-1);
    if (!prev) {
      points.push({ day, t, kg: round2(kg), trend: round2(kg) });
      continue;
    }
    const gap = Math.max(1, Math.round((t - prev.t) / DAY_MS));
    const alpha = 1 - (1 - TREND_ALPHA) ** gap;
    points.push({ day, t, kg: round2(kg), trend: round2(prev.trend + alpha * (kg - prev.trend)) });
  }
  return points;
}

/** A tendência num dia (o último ponto até ele), ou null se não há registro antes. */
export function trendOn(points: readonly TrendPoint[], day: string): number | null {
  let value: number | null = null;
  for (const p of points) {
    if (p.day > day) break;
    value = p.trend;
  }
  return value;
}

const shiftDay = (day: string, days: number) => {
  const d = new Date(dayTime(day));
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export type WeeklyRate = { kg: number; pct: number };

/** Ritmo semanal: Tₜ − Tₜ₋₇ (kg e % do peso). Precisa de registro de pelo menos 7 dias atrás. */
export function weeklyRate(points: readonly TrendPoint[], today: string, weeksAgo = 0): WeeklyRate | null {
  const end = shiftDay(today, -7 * weeksAgo);
  const now = trendOn(points, end);
  const before = trendOn(points, shiftDay(end, -7));
  if (now == null || before == null) return null;
  const kg = round2(now - before);
  return { kg, pct: round2((kg / before) * 100) };
}

export type TrendDirection = 'stable' | 'upSlow' | 'up' | 'downSlow' | 'down';

/** Direção para o modo "Esconder meu peso": estável abaixo de 0,1%/semana; devagar até 0,5%. */
export function trendDirection(rate: WeeklyRate | null): TrendDirection {
  if (!rate || Math.abs(rate.pct) < 0.1) return 'stable';
  if (rate.pct > 0) return rate.pct < 0.5 ? 'upSlow' : 'up';
  return rate.pct > -0.5 ? 'downSlow' : 'down';
}

export const CHART_RANGES = ['4w', '3m', '1y', 'all'] as const;
export type ChartRange = (typeof CHART_RANGES)[number];
const RANGE_DAYS: Record<ChartRange, number> = { '4w': 28, '3m': 91, '1y': 365, all: Infinity };

/** Os pontos dentro do intervalo do TrendChart (4 sem, 3 meses, 1 ano, tudo). */
export function inRange<T extends { t: number }>(points: readonly T[], range: ChartRange, now: Date): T[] {
  const from = now.getTime() - RANGE_DAYS[range] * DAY_MS;
  return points.filter((p) => p.t >= from);
}
