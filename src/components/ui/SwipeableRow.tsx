import type { ReactNode } from 'react';
import { View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { GESTURES } from '@/gestures/thresholds';
import { makeStyles, useTheme, type ColorTokens } from '@/theme';

import { Icon, type IconName } from './Icon';

type SwipeAction = { icon: IconName; color: keyof ColorTokens; onCommit: () => void };

type Props = {
  children: ReactNode;
  /** Deslizar para a esquerda (←): normalmente "excluir". */
  left?: SwipeAction;
  /** Deslizar para a direita (→). */
  right?: SwipeAction;
};

/**
 * Linha com deslize horizontal (seção 7). Só ativa depois de mover na horizontal
 * (`activeOffsetX`) e desiste se o dedo for para cima ou para baixo (`failOffsetY`),
 * para não atrapalhar a rolagem. Toda ação daqui tem um botão ou menu visível.
 */
export function SwipeableRow({ children, left, right }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const x = useSharedValue(0);
  const commit = GESTURES.swipeCommit;

  const pan = usePanGesture({
    activeOffsetX: GESTURES.swipeActivateX,
    failOffsetY: GESTURES.swipeFailY,
    runOnJS: true,
    onUpdate: (e) => {
      const dx = e.translationX;
      if ((dx < 0 && !left) || (dx > 0 && !right)) return;
      x.set(dx);
    },
    onDeactivate: (e) => {
      const dx = e.translationX;
      x.set(withSpring(0, theme.springs.drag));
      if (dx <= -commit && left) left.onCommit();
      else if (dx >= commit && right) right.onCommit();
    },
  });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const leftStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, -x.get() / commit)) }));
  const rightStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, x.get() / commit)) }));

  return (
    <View style={styles.wrap}>
      {right && (
        <Animated.View style={[styles.under, styles.underLeft, rightStyle]}>
          <Icon name={right.icon} color={right.color} />
        </Animated.View>
      )}
      {left && (
        <Animated.View style={[styles.under, styles.underRight, leftStyle]}>
          <Icon name={left.icon} color={left.color} />
        </Animated.View>
      )}
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { justifyContent: 'center' },
  under: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: t.spacing.xl },
  underLeft: { left: 0 },
  underRight: { right: 0 },
}));
