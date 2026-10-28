import { ActivityIndicator, Pressable, View } from 'react-native';

import { makeStyles, useTheme, type ColorTokens } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** `main` (56) para a ação principal da tela; `regular` (48) para as demais. */
  size?: 'main' | 'regular';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
};

// O variante `danger` entra junto com a primeira ação destrutiva.
const VARIANTS: Record<Variant, { bg: keyof ColorTokens | null; fg: keyof ColorTokens }> = {
  primary: { bg: 'primary', fg: 'onPrimary' },
  secondary: { bg: 'surfaceAlt', fg: 'text' },
  ghost: { bg: null, fg: 'primary' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  icon,
  loading = false,
  disabled = false,
  accessibilityHint,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { bg, fg } = VARIANTS[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'main' ? styles.main : styles.regular,
        bg && { backgroundColor: theme.colors[bg] },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={theme.colors[fg]} />
        ) : (
          icon && <Icon name={icon} size={theme.sizes.iconSmall} color={fg} />
        )}
        <Text variant="label" color={fg} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    borderRadius: t.radii.md,
    paddingHorizontal: t.spacing.xl,
    justifyContent: 'center',
  },
  main: { minHeight: t.sizes.buttonHeightMain },
  regular: { minHeight: t.sizes.buttonHeight },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
  },
  pressed: { opacity: t.opacity.pressed },
  disabled: { opacity: t.opacity.disabled },
}));
