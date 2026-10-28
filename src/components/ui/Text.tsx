import { Text as RNText, type TextProps } from 'react-native';

import { useTheme, type ColorTokens, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: keyof ColorTokens;
  align?: 'left' | 'center' | 'right';
};

/**
 * Texto base do app: aplica a tipografia e a cor dos tokens,
 * usa algarismos de largura fixa (números não "dançam", seção 4.2)
 * e limita a escala de fonte do sistema a 130%.
 */
export function Text({ variant = 'body', color = 'text', align, style, ...rest }: Props) {
  const theme = useTheme();

  return (
    <RNText
      maxFontSizeMultiplier={theme.maxFontScale}
      style={[
        theme.typography[variant],
        { color: theme.colors[color], fontVariant: ['tabular-nums'] },
        align && { textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}
