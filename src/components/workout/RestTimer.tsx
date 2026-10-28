import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Button, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { formatClock } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useNow } from '@/lib/useNow';
import { adjustCurrentRest, clearFinishedRest, skipRest, useRest } from '@/stores/restStore';
import { makeStyles, useTheme } from '@/theme';
import { REST_STEP_SEC, REST_WARNING_SEC, remainingSec, restProgress } from '@/training/rest';

const r = strings.workout.rest;
/** Atualiza 4× por segundo: o número não "pula" segundos. */
const TICK_MS = 250;

/**
 * Pílula flutuante do descanso (seção 4.4): anel de progresso e tempo.
 * Toque expande (−15 s, +15 s, Pular). No fim: vibração média e aviso para o leitor de tela.
 */
export function RestTimer() {
  const rest = useRest((s) => s.rest);
  if (!rest) return null;
  return <RestPill key={rest.label} />;
}

function RestPill() {
  const theme = useTheme();
  const styles = useStyles();
  const rest = useRest((s) => s.rest)!;
  const [expanded, setExpanded] = useState(false);
  const now = useNow(TICK_MS);
  const remaining = remainingSec(rest.endsAt, now);
  const warned = useRef(false);

  useEffect(() => {
    if (remaining === 0) {
      haptics.medium();
      AccessibilityInfo.announceForAccessibility(r.over);
      clearFinishedRest();
    } else if (remaining <= REST_WARNING_SEC && !warned.current) {
      warned.current = true;
      AccessibilityInfo.announceForAccessibility(r.tenSeconds);
    } else if (remaining > REST_WARNING_SEC) {
      warned.current = false;
    }
  }, [remaining]);

  const size = theme.sizes.badge.md;
  const stroke = theme.sizes.chartStroke + 1;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = restProgress(rest, now);
  const time = formatClock(remaining);

  return (
    <Animated.View
      entering={FadeIn.duration(theme.durations.transition)}
      exiting={FadeOut.duration(theme.durations.micro)}
      style={styles.wrap}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        <Pressable
          onPress={() => setExpanded((e) => !e)}
          accessibilityRole="button"
          accessibilityLabel={r.pill(time)}
          accessibilityState={{ expanded }}
          style={styles.main}
        >
          <Svg width={size} height={size}>
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.border} strokeWidth={stroke} fill="none" />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.colors.primary}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * progress}
              strokeLinecap="round"
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          <View>
            <Text variant="caption" color="textMuted">
              {r.title}
            </Text>
            <Text variant="metric">{time}</Text>
          </View>
        </Pressable>
        {expanded && (
          <View style={styles.controls}>
            <Text variant="caption" color="textMuted" numberOfLines={2}>
              {rest.label}
            </Text>
            <View style={styles.buttons}>
              <View style={styles.flex}>
                <Button label={r.minus} variant="secondary" accessibilityHint={r.minusLabel} onPress={() => void adjustCurrentRest(-REST_STEP_SEC)} />
              </View>
              <View style={styles.flex}>
                <Button label={r.plus} variant="secondary" accessibilityHint={r.plusLabel} onPress={() => void adjustCurrentRest(REST_STEP_SEC)} />
              </View>
              <View style={styles.flex}>
                <Button label={r.skip} accessibilityHint={r.skipLabel} onPress={() => void skipRest()} />
              </View>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { alignItems: 'center', paddingBottom: t.spacing.sm },
  pill: {
    minWidth: t.sizes.badge.lg * 3,
    maxWidth: '100%',
    gap: t.spacing.sm,
    padding: t.spacing.sm,
    paddingRight: t.spacing.lg,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.hairline,
    borderColor: t.colors.border,
    elevation: t.elevation.fab,
  },
  main: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, minHeight: t.sizes.touchTargetWorkout },
  controls: { gap: t.spacing.sm },
  buttons: { flexDirection: 'row', gap: t.spacing.sm },
  flex: { flex: 1 },
}));
