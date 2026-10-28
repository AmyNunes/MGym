import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { LinearTransition, useReducedMotion } from 'react-native-reanimated';

import { GESTURES } from '@/gestures/thresholds';
import { strings } from '@/i18n/strings';
import { makeStyles, useTheme } from '@/theme';

import { Icon } from './Icon';

/** Para onde vai um item arrastado `dy` pixels, com linhas de altura `rowHeight`. */
export function dropIndex(from: number, dy: number, rowHeight: number, count: number): number {
  const to = from + Math.round(dy / rowHeight);
  return Math.max(0, Math.min(count - 1, to));
}

type Props<T> = {
  items: readonly T[];
  keyOf: (item: T) => string;
  /** Altura (com o espaço entre linhas) de cada linha: as linhas são de altura fixa. */
  rowHeight: number;
  /** `handle` é a alça ≡ para arrastar; coloque-a na linha. */
  renderRow: (item: T, index: number, handle: ReactNode) => ReactNode;
  onMove: (from: number, to: number) => void;
};

/**
 * Lista reordenável pela alça ≡ (seção 7). Enquanto arrasta, a linha segue o dedo;
 * ao soltar, as outras deslizam para o lugar. A alternativa visível é o menu
 * "Mover para cima/baixo" de cada linha.
 */
export function DraggableList<T>({ items, keyOf, rowHeight, renderRow, onMove }: Props<T>) {
  const styles = useStyles();
  const reducedMotion = useReducedMotion();
  const [drag, setDrag] = useState<{ index: number; dy: number } | null>(null);

  return (
    <View style={styles.list}>
      {items.map((item, index) => {
        const dragging = drag?.index === index;
        return (
          <Animated.View
            key={keyOf(item)}
            layout={reducedMotion ? undefined : LinearTransition}
            style={drag && dragging ? [styles.dragging, { transform: [{ translateY: drag.dy }] }] : undefined}
          >
            {renderRow(
              item,
              index,
              <Handle
                onDrag={(dy) => setDrag({ index, dy })}
                onDrop={(dy) => {
                  setDrag(null);
                  const to = dropIndex(index, dy, rowHeight, items.length);
                  if (to !== index) onMove(index, to);
                }}
              />,
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

function Handle({ onDrag, onDrop }: { onDrag: (dy: number) => void; onDrop: (dy: number) => void }) {
  const theme = useTheme();
  const styles = useStyles();
  const pan = usePanGesture({
    runOnJS: true,
    activeOffsetY: GESTURES.dragActivate,
    onUpdate: (e) => onDrag(e.translationY),
    onDeactivate: (e) => onDrop(e.translationY),
  });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.handle} accessible accessibilityLabel={strings.common.dragHandle}>
        <Icon name="menu" color="textMuted" size={theme.sizes.iconSmall} />
      </View>
    </GestureDetector>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.sm },
  dragging: { zIndex: 1, elevation: t.elevation.fab, opacity: t.opacity.pressed },
  handle: {
    width: t.sizes.touchTarget,
    height: t.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
