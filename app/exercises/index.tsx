import { FlashList } from '@shopify/flash-list';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ExerciseFilterBar } from '@/components/exercises/ExerciseFilterBar';
import { ExerciseRow } from '@/components/exercises/ExerciseRow';
import { Button, EmptyState, Screen, SearchField, Text } from '@/components/ui';
import { strings } from '@/i18n/strings';
import { finishExercisePick, useExercisePicker } from '@/stores/pickerStore';
import { makeStyles } from '@/theme';
import { EMPTY_FILTERS, filterExercises, hasActiveFilters, type ExerciseFilters } from '@/training/catalog';

const x = strings.exercises;

/** Catálogo com busca e filtros (seção 12.4). Com `?pick=1`, escolhe exercícios para um treino. */
export default function ExercisesScreen() {
  const styles = useStyles();
  const picking = useLocalSearchParams<{ pick?: string }>().pick === '1';
  const [filters, setFilters] = useState<ExerciseFilters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<string[]>([]);
  const visible = filterExercises(filters);

  // Saiu sem escolher (Voltar): ninguém fica esperando a resposta.
  useEffect(() => () => useExercisePicker.setState({ onPick: null }), []);

  const toggle = (id: string) =>
    setSelected((list) => (list.includes(id) ? list.filter((s) => s !== id) : [...list, id]));

  const header = (
    <View style={styles.header}>
      <SearchField value={filters.query} onChangeText={(query) => setFilters({ ...filters, query })} placeholder={x.search} />
      <ExerciseFilterBar filters={filters} onChange={setFilters} />
      {(hasActiveFilters(filters) || filters.query !== '') && visible.length > 0 && (
        <Text variant="caption" color="textMuted" accessibilityLiveRegion="polite">
          {x.count(visible.length)}
        </Text>
      )}
    </View>
  );

  return (
    <Screen
      edges={[]}
      scroll={false}
      footer={
        picking ? (
          <Button
            label={x.pickAdd(selected.length)}
            icon="plus"
            size="main"
            disabled={selected.length === 0}
            onPress={() => {
              finishExercisePick(selected);
              router.back();
            }}
          />
        ) : undefined
      }
    >
      <Stack.Screen options={{ title: picking ? x.pickTitle : x.title }} />
      <FlashList
        data={visible}
        keyExtractor={(e) => e.id}
        extraData={selected}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState icon="search" message={x.empty} action={{ label: x.clearFilters, onPress: () => setFilters(EMPTY_FILTERS) }} />
        }
        renderItem={({ item }) =>
          picking ? (
            <ExerciseRow
              exercise={item}
              selected={selected.includes(item.id)}
              onPress={() => toggle(item.id)}
              onInfo={() => router.push(`/exercises/${item.id}`)}
            />
          ) : (
            <ExerciseRow exercise={item} onPress={() => router.push(`/exercises/${item.id}`)} />
          )
        }
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  content: { paddingHorizontal: t.spacing.screen, paddingBottom: t.spacing.huge },
  header: { gap: t.spacing.md, paddingTop: t.spacing.sm, paddingBottom: t.spacing.md },
}));
