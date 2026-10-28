/**
 * Calculadora de anilhas (seção 9.8): quanto pôr de cada lado da barra para chegar à carga.
 * Anilhas comuns de academia, em kg; a barra é configurável (20 kg por padrão).
 */
export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] as const;

export type PlateResult = {
  /** Anilhas de um lado, da maior para a menor. */
  perSide: number[];
  /** O que não deu para montar com as anilhas (kg no total), 0 se fechou. */
  remainder: number;
  /** A carga é menor que a barra. */
  belowBar: boolean;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function platesFor(totalKg: number, barKg: number, plates: readonly number[] = PLATES): PlateResult {
  if (totalKg < barKg) return { perSide: [], remainder: 0, belowBar: true };
  let side = round2((totalKg - barKg) / 2);
  const perSide: number[] = [];
  for (const plate of plates) {
    while (side + 1e-9 >= plate) {
      perSide.push(plate);
      side = round2(side - plate);
    }
  }
  return { perSide, remainder: round2(side * 2), belowBar: false };
}
