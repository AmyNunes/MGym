import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text, TextField } from '@/components/ui';
import { NumberPad } from '@/components/workout/NumberPad';
import { strings } from '@/i18n/strings';
import { formatBrDate, maskBrDate, parseBrDate } from '@/lib/dates';
import { formatKgNumber } from '@/lib/format';
import { makeStyles } from '@/theme';

/** Data em dd/mm/aaaa, digitando só os números (as barras entram sozinhas); salva só quando a data é válida (vazio = sem data). */
export function DateField({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper?: string;
  value: string | null;
  onChange: (key: string | null) => void;
}) {
  const [text, setText] = useState(formatBrDate(value));
  const invalid = text.length >= 10 && parseBrDate(text) == null;
  return (
    <TextField
      label={label}
      value={text}
      helper={helper}
      error={invalid ? strings.guide.invalidDate : undefined}
      keyboardType="number-pad"
      placeholder={strings.guide.datePlaceholder}
      maxLength={10}
      onChangeText={(t) => {
        const masked = maskBrDate(t);
        setText(masked);
        if (!masked) onChange(null);
        else {
          const key = parseBrDate(masked);
          if (key) onChange(key);
        }
      }}
    />
  );
}

/** Número grande que abre o NumberPad (seção 5, regra 7: escolher em vez de digitar). */
export function NumberField({
  label,
  value,
  unit,
  decimals,
  step,
  onChange,
}: {
  label: string;
  value: number | null;
  unit: string;
  decimals: boolean;
  step: number;
  onChange: (v: number | null) => void;
}) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const shown = value == null ? strings.guide.steps.body.tapToFill : `${formatKgNumber(value)} ${unit}`;
  return (
    <View style={styles.field}>
      <Text variant="label">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${shown}`}
        style={({ pressed }) => [styles.box, pressed && styles.pressed]}
      >
        <Text variant={value == null ? 'body' : 'metric'} color={value == null ? 'textMuted' : 'text'}>
          {shown}
        </Text>
      </Pressable>
      <NumberPad
        request={open ? { title: label, label, value, decimals, step, same: null, hasNext: false } : null}
        onClose={() => setOpen(false)}
        onSubmit={(v) => {
          onChange(v);
          setOpen(false);
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  field: { gap: t.spacing.xs },
  box: {
    minHeight: t.sizes.touchTargetWorkout,
    justifyContent: 'center',
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radii.sm,
    borderWidth: t.sizes.hairline,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surfaceAlt,
  },
  pressed: { opacity: t.opacity.pressed },
}));
