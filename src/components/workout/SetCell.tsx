import { Pressable } from 'react-native';

import { Text } from '@/components/ui';
import { makeStyles } from '@/theme';

/** Valor tocável da série (kg, repetições ou segundos): abre o teclado grande. */
export function SetCell({ text, label, onPress }: { text: string; label: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
    >
      <Text variant="metric" numberOfLines={1} adjustsFontSizeToFit>
        {text}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  cell: {
    flex: 1,
    height: t.sizes.touchTargetWorkout,
    borderRadius: t.radii.sm,
    backgroundColor: t.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.spacing.xs,
  },
  pressed: { opacity: t.opacity.pressed },
}));
