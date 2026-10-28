/**
 * Descanso entre séries (seção 2.2): guardamos o horário de término (`endsAt`)
 * e o tempo restante sai sempre do relógio. Assim ele sobrevive ao app fechado.
 */

export type RestState = {
  /** Fim do descanso, em ms (Date.now()). */
  endsAt: number;
  /** Duração total (para o anel de progresso), em segundos. */
  totalSec: number;
  /** "Próxima: série 3 de Elevação pélvica" (pílula e leitor de tela). */
  label: string;
  /** Texto da notificação do fim. */
  body: string;
  /** Id da notificação agendada, para cancelar. */
  notificationId: string | null;
};

/** "−15 s" e "+15 s" (seção 4.4). */
export const REST_STEP_SEC = 15;

/** Quando faltar isto, o leitor de tela avisa "10 segundos" (seção 17). */
export const REST_WARNING_SEC = 10;

export function remainingSec(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

/** 0 no começo, 1 no fim. */
export function restProgress(rest: Pick<RestState, 'endsAt' | 'totalSec'>, now: number): number {
  if (rest.totalSec <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - remainingSec(rest.endsAt, now) / rest.totalSec));
}

/** −15 s / +15 s. Se acabar o tempo com o −15 s, o descanso termina (`null`). */
export function adjustRest<T extends Pick<RestState, 'endsAt' | 'totalSec'>>(rest: T, deltaSec: number, now: number): T | null {
  const endsAt = rest.endsAt + deltaSec * 1000;
  if (endsAt <= now) return null;
  return { ...rest, endsAt, totalSec: Math.max(remainingSec(endsAt, now), rest.totalSec + deltaSec) };
}
