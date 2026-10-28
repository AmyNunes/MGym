import { Pressable } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { makeStyles } from '@/theme';

type Props = {
  label?: string;
  icon?: 'delete';
  a11y?: string;
  big?: boolean;
  onPress: () => void;
};

/** Tecla do NumberPad: alvo de toque do treino em andamento (56 dp). */
export function PadButton({ label, icon, a11y, big, onPress }: Props) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      style={({ pressed }) => [styles.key, big && styles.bigKey, pressed && styles.pressed]}
    >
      {icon ? <Icon name={icon} /> : <Text variant={big ? 'metric' : 'label'}>{label}</Text>}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  key: {
    flex: 1,
    minHeight: t.sizes.touchTargetWorkout,
    borderRadius: t.radii.md,
    backgroundColor: t.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.spacing.xs,
  },
  bigKey: { minHeight: t.sizes.touchTargetWorkout + t.spacing.sm },
  pressed: { opacity: t.opacity.pressed },
}));
