import type { MealSlotRecord } from '@/db/mealsRepo';

/** Até quanto tempo depois do horário uma refeição ainda conta como "a próxima". */
const GRACE_MINUTES = 90;
const ROLLOVER_HOUR = 4;

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h < ROLLOVER_HOUR ? h + 24 : h) * 60 + m;
};

/**
 * A próxima refeição do dia (seção 12.1): a primeira ainda não marcada cujo horário não passou
 * (com 1h30 de folga). Esquecer de marcar não cobra nada: refeições que já passaram ficam em branco.
 */
export function nextMeal(slots: readonly MealSlotRecord[], now: Date): MealSlotRecord | null {
  const hour = now.getHours();
  const current = (hour < ROLLOVER_HOUR ? hour + 24 : hour) * 60 + now.getMinutes();
  return slots.find((s) => !s.eatenAt && minutesOf(s.time) + GRACE_MINUTES >= current) ?? null;
}
