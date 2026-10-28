/** Um ponto de um gráfico de tempo: `t` em ms, `v` o valor. */
export type ChartPoint = { t: number; v: number };

/** Projeta os pontos no retângulo do gráfico (tempo no x, valor no y), com uma margem interna `pad`. */
export function projectPoints(points: readonly ChartPoint[], width: number, height: number, pad: number) {
  const ts = points.map((p) => p.t);
  const vs = points.map((p) => p.v);
  const [t0, t1] = [Math.min(...ts), Math.max(...ts)];
  const [v0, v1] = [Math.min(...vs), Math.max(...vs)];
  const spanT = t1 - t0 || 1;
  const spanV = v1 - v0 || 1;
  return points.map((p) => ({
    x: points.length === 1 ? width / 2 : pad + ((p.t - t0) / spanT) * (width - 2 * pad),
    y: v1 === v0 ? height / 2 : pad + (1 - (p.v - v0) / spanV) * (height - 2 * pad),
  }));
}
