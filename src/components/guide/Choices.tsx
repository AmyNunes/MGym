import { Pressable, View } from 'react-native';

import { Chip, Icon, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { makeStyles } from '@/theme';

type Option<T> = { value: T; label: string; description?: string };

/** Escolha única em cartões grandes (seção 8.1: uma pergunta por tela). */
export function ChoiceCards<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
  label: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => (
        <OptionCard key={String(o.value)} option={o} role="radio" selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

/** Várias escolhas em cartões, quando cada opção precisa de uma linha explicando o que faz. */
export function CheckCards<T extends string>({
  options,
  values,
  onChange,
  label,
}: {
  options: readonly Option<T>[];
  values: readonly T[];
  onChange: (v: T[]) => void;
  label: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.list} accessibilityLabel={label}>
      {options.map((o) => {
        const selected = values.includes(o.value);
        return (
          <OptionCard
            key={o.value}
            option={o}
            role="checkbox"
            selected={selected}
            onPress={() => onChange(selected ? values.filter((v) => v !== o.value) : [...values, o.value])}
          />
        );
      })}
    </View>
  );
}

function OptionCard({
  option,
  role,
  selected,
  onPress,
}: {
  option: Option<string | number>;
  role: 'radio' | 'checkbox';
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const icon = role === 'radio' ? (selected ? 'check-circle' : 'circle') : selected ? 'check-square' : 'square';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={option.description ? `${option.label}, ${option.description}` : option.label}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={styles.texts}>
        <Text variant="label">{option.label}</Text>
        {option.description && (
          <Text variant="caption" color="textMuted">
            {option.description}
          </Text>
        )}
      </View>
      <Icon name={icon} color={selected ? 'primary' : 'textMuted'} />
    </Pressable>
  );
}

/** Várias escolhas em chips. */
export function ChipSelect<T extends string>({
  options,
  values,
  onChange,
}: {
  options: readonly Option<T>[];
  values: readonly T[];
  onChange: (v: T[]) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const selected = values.includes(o.value);
        return (
          <Chip
            key={o.value}
            label={o.label}
            selected={selected}
            onPress={() => onChange(selected ? values.filter((v) => v !== o.value) : [...values, o.value])}
          />
        );
      })}
    </View>
  );
}

/** Sim / Não (sem resposta ainda = nenhum marcado). */
export function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  const styles = useStyles();
  const o = strings.guide.options;
  return (
    <View style={styles.yesNo}>
      <Text style={styles.flex}>{label}</Text>
      <Chip label={o.yes} accessibilityLabel={`${label}: ${o.yes}`} selected={value === true} onPress={() => onChange(true)} />
      <Chip label={o.no} accessibilityLabel={`${label}: ${o.no}`} selected={value === false} onPress={() => onChange(false)} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    minHeight: t.sizes.listRowHeight,
    padding: t.spacing.lg,
    borderRadius: t.radii.md,
    backgroundColor: t.colors.surface,
    borderWidth: t.sizes.hairline * 2,
    borderColor: t.colors.border,
  },
  selected: { borderColor: t.colors.primary },
  pressed: { opacity: t.opacity.pressed },
  texts: { flex: 1, gap: t.spacing.xs / 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  yesNo: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: t.sizes.touchTarget },
  flex: { flex: 1 },
}));
