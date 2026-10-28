import { addDays, localDateKey, startOfWeek } from '@/lib/dates';

/**
 * "Sua semana" em Hoje (seção 12.1): S T Q Q S S D, com ● treinou, ○ dia de treino
 * planejado (ainda por fazer ou que passou) e · os outros dias. Não há "sequência" que quebra.
 */
export type WeekDot = { key: string; weekday: number; state: 'done' | 'planned' | 'rest'; today: boolean };

export function weekDots(now: Date, trainedDayKeys: readonly string[], trainingWeekdays: readonly number[]): WeekDot[] {
  const monday = startOfWeek(now);
  const todayKey = localDateKey(now);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const key = localDateKey(date);
    const weekday = date.getDay();
    const state = trainedDayKeys.includes(key) ? 'done' : trainingWeekdays.includes(weekday) ? 'planned' : 'rest';
    return { key, weekday, state, today: key === todayKey };
  });
}
