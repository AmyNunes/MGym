import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { Button, Card, Screen, Text, TextField } from '@/components/ui';
import { insertCustomFood } from '@/db/foodsRepo';
import { strings } from '@/i18n/strings';
import { parseDecimal } from '@/lib/format';
import { pluralizeMeasure } from '@/lib/plural';
import { loadFoods } from '@/stores/foodsStore';
import { showSnackbar } from '@/stores/snackbarStore';

const f = strings.foods;
const FIELDS = ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'sodium', 'potassium'] as const;
type Field = (typeof FIELDS)[number];

/** Criar um alimento com os valores do rótulo, por 100 g (seção 10.2). */
export default function NewFoodScreen() {
  const [name, setName] = useState('');
  const [values, setValues] = useState<Record<Field, string>>({ kcal: '', protein: '', carbs: '', fat: '', fiber: '', sodium: '', potassium: '' });
  const [portionLabel, setPortionLabel] = useState('');
  const [portionGrams, setPortionGrams] = useState('');

  const parsed = Object.fromEntries(FIELDS.map((k) => [k, parseDecimal(values[k])])) as Record<Field, number | null>;
  const grams = parseDecimal(portionGrams);
  const invalid = FIELDS.some((k) => Number.isNaN(parsed[k])) || Number.isNaN(grams);
  const canSave = name.trim().length >= 2 && parsed.kcal != null && parsed.protein != null && parsed.carbs != null && parsed.fat != null && !invalid;

  const save = async () => {
    await insertCustomFood({
      name: name.trim(),
      ...parsed,
      portion:
        portionLabel.trim() && grams ? { label: portionLabel.trim(), plural: pluralizeMeasure(portionLabel), grams } : null,
    });
    await loadFoods(true);
    showSnackbar(f.saved);
    router.back();
  };

  return (
    <Screen edges={[]} footer={<Button label={strings.common.save} size="main" disabled={!canSave} onPress={() => void save()} />}>
      <Stack.Screen options={{ title: f.newTitle }} />
      <TextField label={f.name} value={name} onChangeText={setName} maxLength={60} />
      <Card title={f.per100Title}>
        <Text variant="caption" color="textMuted">
          {f.newHelp}
        </Text>
        {FIELDS.map((k) => (
          <TextField
            key={k}
            label={f.values[k]}
            value={values[k]}
            onChangeText={(t) => setValues((v) => ({ ...v, [k]: t }))}
            keyboardType="decimal-pad"
            error={Number.isNaN(parsed[k]) ? f.invalidNumber : undefined}
          />
        ))}
      </Card>
      <Card title={f.portions}>
        <TextField label={f.portionLabel} value={portionLabel} onChangeText={setPortionLabel} maxLength={30} />
        <TextField
          label={f.portionGrams}
          value={portionGrams}
          onChangeText={setPortionGrams}
          keyboardType="decimal-pad"
          error={Number.isNaN(grams) ? f.invalidNumber : undefined}
        />
      </Card>
    </Screen>
  );
}
