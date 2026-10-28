/**
 * Teclado numérico do treino (seção 4.4): a digitação vira texto ("62,5") e só no fim vira número.
 * Pesos com uma casa decimal; repetições e segundos inteiros.
 */

export type PadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | 'back';

export const PAD_MAX = 999;

/** `fresh`: o primeiro toque substitui o valor que veio preenchido. */
export function pressKey(text: string, key: PadKey, decimals: boolean, fresh: boolean): string {
  const base = fresh ? '' : text;
  if (key === 'back') return fresh ? '' : base.slice(0, -1);
  if (key === ',') {
    if (!decimals || base.includes(',')) return base;
    return base === '' ? '0,' : `${base},`;
  }
  const [, frac] = base.split(',');
  if (frac !== undefined && frac.length >= 1) return base;
  const next = base === '0' ? key : `${base}${key}`;
  return parsePad(next) != null && parsePad(next)! > PAD_MAX ? base : next;
}

export function parsePad(text: string): number | null {
  if (!text || text === ',') return null;
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

export function formatPad(value: number | null): string {
  return value == null ? '' : String(Math.round(value * 10) / 10).replace('.', ',');
}

/** −/+ incremento a partir do que está escrito (vazio conta como 0), sem passar de 0 a 999. */
export function stepPad(text: string, delta: number): string {
  const current = parsePad(text) ?? 0;
  const next = Math.min(PAD_MAX, Math.max(0, Math.round((current + delta) * 10) / 10));
  return formatPad(next);
}
