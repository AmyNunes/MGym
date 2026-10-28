/** "US$ 0,0021" para valores pequenos; "US$ 1,25" para os demais. */
export function formatUsd(value: number): string {
  const digits = value > 0 && value < 0.01 ? 4 : 2;
  return `US$ ${value.toFixed(digits).replace('.', ',')}`;
}

/** Lê "0,15" ou "0.15". Vazio vira `null`; texto inválido vira `NaN`. */
export function parseDecimal(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : Number.NaN;
}

/** Mostra um número decimal com vírgula ("0,15"). */
export function formatDecimal(value: number | null): string {
  return value == null ? '' : String(value).replace('.', ',');
}

/** "1 card", "3 cards" */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "0:07", "2:35" a partir de segundos. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** "~8 min" a partir de segundos. */
export function formatMinutes(seconds: number): string {
  return `~${Math.max(1, Math.round(seconds / 60))} min`;
}

/** "62,5" (uma casa só quando precisa), seção "pesos em kg com uma casa decimal". */
export function formatKgNumber(kg: number): string {
  const rounded = Math.round(kg * 10) / 10;
  return String(rounded).replace('.', ',');
}

/** "62,5 kg" */
export function formatKg(kg: number): string {
  return `${formatKgNumber(kg)} kg`;
}

/** Descanso: "45 s", "1:30", "2 min". */
export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  if (seconds % 60 === 0) return `${seconds / 60} min`;
  return formatClock(seconds);
}

/** Duração de um treino: "48 min", "1 h 05". */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}

/** "1.240" (milhar com ponto). */
export function formatInt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Tempo de treino: "32:15" ou "1:02:15". */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
