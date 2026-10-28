import type { WeeklyRate } from '@/body/trend';

/**
 * Sinais de alerta (seção 16.4, item 8), detectados no aparelho. Não é diagnóstico: um sinal
 * abre uma conversa curta e acolhedora no check-in e bloqueia o déficit de calorias.
 */

export type WarningSignal = 'fastLoss' | 'belowFloor' | 'longTraining' | 'trainingHurt' | 'repeatedWeighing' | 'repeatedDeleting';

export type SignalInput = {
  /** Ritmo semanal das últimas 3 semanas (esta, 1 atrás, 2 atrás). */
  weeklyRates: readonly (WeeklyRate | null)[];
  /** Energia dos dias completos (tudo marcado) dos últimos 7 dias. */
  completeDayIntakes: readonly number[];
  floor: number;
  /** Minutos de treino por dia nos últimos 7 dias. */
  trainingMinutesByDay: readonly number[];
  /** Treinos com dor na articulação nos últimos 14 dias. */
  hurtWorkouts: number;
  /** Pesagens por dia nos últimos 7 dias. */
  weighInsByDay: readonly number[];
  /** Registros de peso ou medidas apagados nos últimos 14 dias. */
  deletions: number;
};

/** Perda acima disso (%/semana) por 3 semanas seguidas. */
export const FAST_LOSS_PCT = 1;
export const BELOW_FLOOR_DAYS = 3;
export const LONG_TRAINING_MIN = 120;
export const HURT_WORKOUTS = 2;
export const WEIGH_INS_PER_DAY = 3;
export const DELETIONS = 5;

export function detectSignals(input: SignalInput): WarningSignal[] {
  const signals: WarningSignal[] = [];
  const rates = input.weeklyRates.slice(0, 3);
  if (rates.length === 3 && rates.every((r) => r != null && r.pct < -FAST_LOSS_PCT)) signals.push('fastLoss');
  if (input.completeDayIntakes.filter((k) => k < input.floor).length >= BELOW_FLOOR_DAYS) signals.push('belowFloor');
  if (input.trainingMinutesByDay.some((m) => m > LONG_TRAINING_MIN)) signals.push('longTraining');
  if (input.hurtWorkouts >= HURT_WORKOUTS) signals.push('trainingHurt');
  if (input.weighInsByDay.some((n) => n >= WEIGH_INS_PER_DAY)) signals.push('repeatedWeighing');
  if (input.deletions >= DELETIONS) signals.push('repeatedDeleting');
  return signals;
}

/** Déficit bloqueado (16.4, item 4): IMC < 18,5 (já nas metas), cintura/altura < 0,40 ou um sinal ativo. */
export function deficitBlocked(signals: readonly WarningSignal[], waistHeightRatio: number | null): boolean {
  return signals.length > 0 || (waistHeightRatio != null && waistHeightRatio < 0.4);
}

/** Perguntas no estilo SCOFF, escritas por nós. Duas ou mais respostas "sim" → sugerir um profissional. */
export const CARE_QUESTIONS = ['compensate', 'control', 'lostWeight', 'needLess', 'dominates'] as const;
export type CareQuestion = (typeof CARE_QUESTIONS)[number];
export const CARE_YES_THRESHOLD = 2;

export function suggestProfessional(answers: Partial<Record<CareQuestion, boolean>>): boolean {
  return Object.values(answers).filter(Boolean).length >= CARE_YES_THRESHOLD;
}
