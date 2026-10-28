/**
 * Tokens do design system (seção 4 da spec).
 * Nenhuma tela usa cor, tamanho ou duração "solta": tudo vem daqui.
 */

export type ColorScheme = 'light' | 'dark';

export type ColorTokens = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  /** Proteína (gráficos, ícones e fundos suaves, sempre com rótulo "P"). */
  protein: string;
  /** Carboidratos ("C"). */
  carbs: string;
  /** Gorduras ("G"). */
  fat: string;
  /** Recorde pessoal (selo dourado). */
  record: string;
  /** Músculo principal no mapa muscular. */
  muscleMain: string;
  /** Músculo secundário no mapa (preenchimento com contorno `border`). */
  muscleSecondary: string;
  /** Série feita, meta batida (sempre com ícone). */
  success: string;
  /** Ícone sobre `success` (o ✓ da série feita). */
  onSuccess: string;
  /** Atenção (sempre com ícone). */
  warning: string;
  /** Excluir, parar. */
  danger: string;
  /** Fundo escurecido atrás de sobreposições. */
  scrim: string;
};

export const palette: Record<ColorScheme, ColorTokens> = {
  light: {
    bg: '#F7F6F3',
    surface: '#FFFFFF',
    surfaceAlt: '#EFEDE8',
    border: '#E3E0DA',
    text: '#1C1B19',
    textMuted: '#6B6862',
    primary: '#C2255C',
    onPrimary: '#FFFFFF',
    protein: '#0B7A75',
    carbs: '#B45309',
    fat: '#6E56CF',
    record: '#B08800',
    muscleMain: '#C2255C',
    muscleSecondary: '#F3C1D3',
    success: '#218358',
    onSuccess: '#FFFFFF',
    warning: '#B45309',
    danger: '#E5484D',
    scrim: '#000000',
  },
  dark: {
    bg: '#111113',
    surface: '#1A1A1D',
    surfaceAlt: '#232326',
    border: '#2E2E33',
    text: '#EDEDEF',
    textMuted: '#A1A1A8',
    primary: '#F06595',
    onPrimary: '#0B0B0C',
    protein: '#38D9C0',
    carbs: '#F5A524',
    fat: '#9E8CFC',
    record: '#FFD43B',
    muscleMain: '#F06595',
    muscleSecondary: '#5C2A3E',
    success: '#3DD68C',
    onSuccess: '#0B0B0C',
    warning: '#F5A524',
    danger: '#F2555A',
    scrim: '#000000',
  },
};

export type TextStyleToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
};

/** Fonte do sistema (Roboto no Android), por isso não há `fontFamily`. */
export const typography = {
  /** Número principal: tendência do peso, cronômetro do descanso. */
  hero: { fontSize: 40, lineHeight: 48, fontWeight: '700' },
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  /** kg × reps no treino, totais de macros. */
  metric: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const satisfies Record<string, TextStyleToken>;

export type TypographyVariant = keyof typeof typography;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  /** Margem lateral das telas. */
  screen: 16,
} as const;

export const radii = {
  /** Chips e campos. */
  sm: 8,
  /** Botões e linhas de lista. */
  md: 14,
  /** Cartões grandes e sheets. */
  lg: 24,
  /** Círculos (ex.: botão +). */
  full: 999,
} as const;

/** Sombra só no botão central e em elementos flutuantes (Android usa `elevation`). */
export const elevation = {
  card: 3,
  fab: 4,
} as const;

export const durations = {
  micro: 150,
  transition: 220,
  /** Recorde, fim do treino (seção 4.3). */
  celebration: 600,
  /** Meio ciclo do "pulsar" do Skeleton (não está na spec; valor calmo). */
  pulse: 900,
} as const;

export const opacity = {
  pressed: 0.7,
  disabled: 0.4,
  skeletonDim: 0.5,
} as const;

/** Escalas de animação (o "pulo" do selo de recorde). */
export const scales = {
  pop: 1.15,
} as const;

export const springs = {
  drag: { damping: 18, stiffness: 180 },
} as const;

export const sizes = {
  /** Alvo de toque mínimo (dp). */
  touchTarget: 48,
  /** Alvo de toque no treino em andamento (mão suada, sem óculos). */
  touchTargetWorkout: 56,
  buttonHeight: 48,
  buttonHeightMain: 56,
  tabBarHeight: 64,
  fab: 56,
  icon: 24,
  iconSmall: 18,
  iconLarge: 40,
  chipHeight: 36,
  listRowHeight: 56,
  multilineHeight: 112,
  /** Contorno fino de formas desenhadas (mapa muscular, gráficos). */
  hairline: 1,
  /** Espessura da linha dos gráficos. */
  chartStroke: 2.5,
  chartDot: 3.5,
  /** Largura de cada figura (frente/costas) do mapa muscular. */
  muscleMap: { sm: 24, md: 104 },
  /** Altura dos gráficos de linha. */
  chartHeight: 160,
  /** Círculo colorido atrás de ícones (IconBadge). */
  badge: { sm: 32, md: 40, lg: 56 },
  badgeIcon: { sm: 18, md: 22, lg: 28 },
} as const;

/** Espaçamento entre letras de títulos em maiúsculas. */
export const tracking = {
  caps: 0.6,
} as const;

/** A escala de fonte do sistema é respeitada até 130%. */
export const maxFontScale = 1.3;
