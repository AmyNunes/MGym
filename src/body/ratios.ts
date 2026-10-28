import { bmi } from '@/nutrition/targets';

/**
 * Relações (seção 11.3), opcionais e discretas.
 * Cintura/altura: medida de saúde que não depende do sexo (faixas válidas com IMC < 35).
 * Cintura/quadril: só tendência de forma, sem "valor ideal". Nada de percentual de gordura.
 */

export type WaistHeightBand = 'low' | 'healthy' | 'attention' | 'high';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function waistHeight(waistCm: number, heightCm: number) {
  return round2(waistCm / heightCm);
}

/** Faixa da cintura/altura: < 0,40 baixa · 0,40–0,49 saudável · 0,50–0,59 atenção · ≥ 0,60 risco alto. */
export function waistHeightBand(ratio: number): WaistHeightBand {
  if (ratio < 0.4) return 'low';
  if (ratio < 0.5) return 'healthy';
  if (ratio < 0.6) return 'attention';
  return 'high';
}

/** As faixas só valem com IMC < 35. */
export function waistHeightApplies(weightKg: number | null, heightCm: number): boolean {
  return weightKg == null || bmi(weightKg, heightCm) < 35;
}

export function waistHip(waistCm: number, hipsCm: number) {
  return round2(waistCm / hipsCm);
}
