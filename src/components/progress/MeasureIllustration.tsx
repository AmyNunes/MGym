import Svg, { Ellipse, G, Line, Path } from 'react-native-svg';

import { BODY_HEIGHT, BODY_WIDTH, SILHOUETTE, type Shape } from '@/components/muscles/bodyShapes';
import type { MeasureSite } from '@/body/measurements';
import { strings } from '@/i18n/strings';
import { useTheme } from '@/theme';

/** Onde a fita passa em cada local, nas coordenadas da silhueta (120 × 250). */
const TAPE: Record<MeasureSite, { y: number; x1: number; x2: number }> = {
  bust: { y: 62, x1: 36, x2: 84 },
  underbust: { y: 74, x1: 38, x2: 82 },
  waist: { y: 98, x1: 41, x2: 79 },
  hips: { y: 128, x1: 33, x2: 87 },
  thigh: { y: 168, x1: 34, x2: 61 },
  arm: { y: 74, x1: 23, x2: 37 },
  calf: { y: 210, x1: 38, x2: 56 },
};

function ShapeEl({ shape, fill }: { shape: Shape; fill: string }) {
  if (shape.kind === 'ellipse') {
    return (
      <Ellipse
        cx={shape.cx}
        cy={shape.cy}
        rx={shape.rx}
        ry={shape.ry}
        rotation={shape.rot ?? 0}
        origin={`${shape.cx}, ${shape.cy}`}
        fill={fill}
      />
    );
  }
  return <Path d={shape.d} fill={fill} />;
}

/** Silhueta com a linha de onde passar a fita (seção 4.4), desenhada por nós. */
export function MeasureIllustration({ site, width }: { site: MeasureSite; width: number }) {
  const theme = useTheme();
  const tape = TAPE[site];
  const fill = theme.colors.surfaceAlt;
  return (
    <Svg
      width={width}
      height={(width * BODY_HEIGHT) / BODY_WIDTH}
      viewBox={`0 0 ${BODY_WIDTH} ${BODY_HEIGHT}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel={strings.measures.illustration(strings.measures.sites[site])}
    >
      {SILHOUETTE.map((s, i) => (
        <ShapeEl key={`l${i}`} shape={s} fill={fill} />
      ))}
      <G transform={`translate(${BODY_WIDTH}, 0) scale(-1, 1)`}>
        {SILHOUETTE.filter((s) => !s.center).map((s, i) => (
          <ShapeEl key={`r${i}`} shape={s} fill={fill} />
        ))}
      </G>
      <Line
        x1={tape.x1}
        x2={tape.x2}
        y1={tape.y}
        y2={tape.y}
        stroke={theme.colors.primary}
        strokeWidth={theme.sizes.chartStroke}
        strokeLinecap="round"
        strokeDasharray="3 2"
      />
    </Svg>
  );
}
