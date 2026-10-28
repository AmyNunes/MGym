/**
 * Constância (seção 11.4): calendário de treinos e semanas com a meta cumprida.
 * Não conta sequência de dias: faltar um dia não "quebra" nada.
 */

export type ConstancyDay = { key: string; done: boolean; future: boolean };
export type ConstancyWeek = { start: string; days: ConstancyDay[]; trained: number; met: boolean };

const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** As últimas `weeks` semanas (segunda a domingo), da mais antiga para a atual. */
export function constancyGrid(trainedDays: readonly string[], today: string, weeks: number, target: number): ConstancyWeek[] {
  const done = new Set(trainedDays);
  const [y, m, d] = today.split('-').map(Number);
  const monday = new Date(y, m - 1, d);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: weeks }, (_, w) => {
    const start = new Date(monday);
    start.setDate(start.getDate() - 7 * (weeks - 1 - w));
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      const key = keyOf(day);
      return { key, done: done.has(key), future: key > today };
    });
    const trained = days.filter((x) => x.done).length;
    return { start: keyOf(start), days, trained, met: trained >= target };
  });
}

/** Semanas com a meta cumprida (a semana atual só conta quando já cumpriu). */
export const weeksMet = (grid: readonly ConstancyWeek[]) => grid.filter((w) => w.met).length;
