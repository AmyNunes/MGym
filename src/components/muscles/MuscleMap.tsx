import { Fragment } from 'react';
import { View } from 'react-native';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { makeStyles, useTheme, withAlpha } from '@/theme';
import type { Muscle } from '@/training/exerciseModel';

import {
  BODY_HEIGHT,
  BODY_WIDTH,
  MUSCLE_SHAPES,
  OUTLINE_WIDTH,
  SILHOUETTE,
  type Shape,
  type View as BodyView,
} from './bodyShapes';

type Props = {
  /** Músculos principais (cor `muscleMain`). */
  primary?: readonly Muscle[];
  /** Músculos secundários (cor `muscleSecondary` com contorno). */
  secondary?: readonly Muscle[];
  /** `sm` cabe ao lado do nome do exercício; `md` é o do detalhe. */
  size?: 'sm' | 'md';
  /** Rótulos "Frente" e "Costas" embaixo de cada figura. */
  labels?: boolean;
  /** Intensidade da semana por músculo (0–1), no lugar de principal/secundário (Evolução). */
  intensity?: Partial<Record<Muscle, number>>;
  /** Rótulo de acessibilidade no lugar da lista de músculos. */
  accessibilityLabel?: string;
};

/** Músculo pouco treinado ainda aparece de leve. */
const MIN_INTENSITY = 0.25;

function ShapeEl({ shape, fill, stroke }: { shape: Shape; fill: string; stroke?: string }) {
  const strokeProps = stroke ? { stroke, strokeWidth: OUTLINE_WIDTH } : {};
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
        {...strokeProps}
      />
    );
  }
  return <Path d={shape.d} fill={fill} {...strokeProps} />;
}

/** Desenha as formas do lado esquerdo e o espelho no direito (as do centro, uma vez só). */
function Mirrored({ shapes, fill, stroke }: { shapes: readonly Shape[]; fill: string; stroke?: string }) {
  return (
    <>
      {shapes.map((s, i) => (
        <ShapeEl key={`l${i}`} shape={s} fill={fill} stroke={stroke} />
      ))}
      <G transform={`translate(${BODY_WIDTH}, 0) scale(-1, 1)`}>
        {shapes
          .filter((s) => !s.center)
          .map((s, i) => (
            <ShapeEl key={`r${i}`} shape={s} fill={fill} stroke={stroke} />
          ))}
      </G>
    </>
  );
}

/**
 * Mapa muscular (seção 4.4): silhueta de frente e de costas com os músculos
 * principais e secundários destacados. Desenhado por nós, igual para todos os exercícios.
 */
export function MuscleMap({ primary = [], secondary = [], size = 'md', labels = false, intensity, accessibilityLabel }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const width = theme.sizes.muscleMap[size];
  const height = (width * BODY_HEIGHT) / BODY_WIDTH;
  const c = theme.colors;

  const label =
    accessibilityLabel ??
    strings.muscleMap.label(
    primary.map((m) => strings.muscles[m]).join(', '),
    secondary.map((m) => strings.muscles[m]).join(', '),
  );

  const figure = (view: BodyView) => (
    <View style={styles.figure}>
      <Svg width={width} height={height} viewBox={`0 0 ${BODY_WIDTH} ${BODY_HEIGHT}`}>
        <Mirrored shapes={SILHOUETTE} fill={c.surfaceAlt} />
        {(Object.entries(MUSCLE_SHAPES[view]) as [Muscle, Shape[]][]).map(([muscle, shapes]) => {
          const level = intensity?.[muscle];
          if (intensity) {
            const fill = level ? withAlpha(c.muscleMain, MIN_INTENSITY + (1 - MIN_INTENSITY) * Math.min(1, level)) : c.border;
            return <Mirrored key={muscle} shapes={shapes} fill={fill} />;
          }
          const isMain = primary.includes(muscle);
          const isSecondary = !isMain && secondary.includes(muscle);
          return (
            <Fragment key={muscle}>
              <Mirrored
                shapes={shapes}
                fill={isMain ? c.muscleMain : isSecondary ? c.muscleSecondary : c.border}
                stroke={isSecondary ? c.border : undefined}
              />
            </Fragment>
          );
        })}
      </Svg>
      {labels && (
        <Text variant="caption" color="textMuted">
          {view === 'front' ? strings.muscleMap.front : strings.muscleMap.back}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel={label}>
      {figure('front')}
      {figure('back')}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', justifyContent: 'center', gap: t.spacing.xs },
  figure: { alignItems: 'center', gap: t.spacing.xs },
}));
