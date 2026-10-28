import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Icon, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { useSettings } from '@/stores/settingsStore';
import { makeStyles, TINT, useTheme, withAlpha } from '@/theme';
import type { RecordKind } from '@/training/records';

type Props = { kinds: readonly RecordKind[] };

/**
 * Selo dourado de recorde pessoal (seção 4.4), com um brilho curto ao aparecer.
 * Com "reduzir movimento" ou o brilho desligado (Celebrações), fica só o selo.
 */
export function RecordBadge({ kinds }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const reducedMotion = useReducedMotion();
  const glow = useSettings((s) => s.celebrations.recordGlow);
  const scale = useSharedValue(1);
  const shine = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion || !glow) return;
    const half = theme.durations.celebration / 2;
    scale.set(withSequence(withTiming(theme.scales.pop, { duration: half }), withTiming(1, { duration: half })));
    shine.set(withSequence(withTiming(1, { duration: half }), withTiming(0, { duration: half })));
  }, [reducedMotion, glow, scale, shine, theme]);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const shineStyle = useAnimatedStyle(() => ({ opacity: shine.get() }));

  return (
    <Animated.View
      style={[styles.badge, { backgroundColor: withAlpha(theme.colors.record, TINT) }, badgeStyle]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={strings.workout.recordLabel(kinds.map((k) => strings.workout.recordKinds[k]).join(', '))}
      accessibilityLiveRegion="polite"
    >
      <Animated.View style={[styles.shine, { backgroundColor: withAlpha(theme.colors.record, TINT * 2) }, shineStyle]} />
      <View style={styles.content}>
        <Icon name="award" color="record" size={theme.sizes.iconSmall} />
        <Text variant="caption" color="text">
          {strings.workout.record}
        </Text>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: t.radii.full,
    borderWidth: t.sizes.hairline,
    borderColor: t.colors.record,
    overflow: 'hidden',
  },
  shine: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xs / 2,
  },
}));
