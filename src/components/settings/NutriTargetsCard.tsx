import { useState } from 'react';

import { Button, Card, Text, TextField } from '@/components/ui';
import { updateWeekTargets } from '@/features/meals/menuService';
import { profileTargets } from '@/features/nutrition/profileTargets';
import { strings } from '@/i18n/strings';
import { haptics } from '@/lib/haptics';
import { patchProfile, useProfile } from '@/stores/profileStore';
import { showSnackbar } from '@/stores/snackbarStore';

const n = strings.settings.nutrition;
const FIELDS = ['kcal', 'protein', 'carbs', 'fat'] as const;
type Field = (typeof FIELDS)[number];
const INTEGER = /^\d{1,5}$/;

/** Modo da nutri (seção 10.8): as metas do dia digitadas à mão. O app não ajusta sozinho. */
export function NutriTargetsCard() {
  const profile = useProfile((s) => s.profile);
  const [values, setValues] = useState<Record<Field, string>>(() => {
    const start = profile.nutriTargets ?? profileTargets({ ...profile, nutritionistMode: false });
    return Object.fromEntries(FIELDS.map((f) => [f, start ? String(Math.round(start[f])) : ''])) as Record<Field, string>;
  });
  const invalid = FIELDS.filter((f) => !INTEGER.test(values[f].trim()));

  const save = async () => {
    const targets = Object.fromEntries(FIELDS.map((f) => [f, Number(values[f].trim())])) as Record<Field, number>;
    await patchProfile({ nutriTargets: targets });
    await updateWeekTargets(new Date());
    haptics.light();
    showSnackbar(n.saved);
  };

  return (
    <Card title={n.nutriTargets}>
      <Text variant="caption" color="textMuted">
        {n.nutriTargetsHint}
      </Text>
      {FIELDS.map((f) => (
        <TextField
          key={f}
          label={n[f]}
          value={values[f]}
          onChangeText={(v) => setValues((old) => ({ ...old, [f]: v }))}
          keyboardType="number-pad"
          maxLength={5}
          error={values[f] !== '' && invalid.includes(f) ? n.invalid : undefined}
        />
      ))}
      <Button label={n.save} icon="check" disabled={invalid.length > 0} onPress={() => void save()} />
    </Card>
  );
}
