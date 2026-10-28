import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { HistoryRow } from '@/components/history/HistoryRow';
import { EmptyState, ErrorState, MenuSheet, Screen, Skeleton } from '@/components/ui';
import { deleteWorkoutWithUndo, saveWorkoutAsRoutine, useHistoryList } from '@/features/history/history';
import { strings } from '@/i18n/strings';
import { makeStyles, useTheme } from '@/theme';

const h = strings.history;

/** Treinos feitos (seção 12.2), do mais novo para o mais antigo. */
export default function HistoryScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const { state, reload, refresh } = useHistoryList();
  const [menuId, setMenuId] = useState<string | null>(null);

  return (
    <Screen edges={[]} scroll={false}>
      <Stack.Screen options={{ title: h.title }} />
      {state.status === 'loading' && <Skeleton height={theme.sizes.listRowHeight * 3} radius="lg" />}
      {state.status === 'error' && <ErrorState onRetry={reload} />}
      {state.status === 'success' && state.data.length === 0 && <EmptyState icon="calendar" message={h.empty} />}
      {state.status === 'success' && state.data.length > 0 && (
        <FlashList
          data={state.data}
          keyExtractor={(row) => row.id}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <HistoryRow
              row={item}
              onPress={() => router.push(`/history/${item.id}`)}
              onDelete={() => void deleteWorkoutWithUndo(item.id, refresh)}
              onMenu={() => setMenuId(item.id)}
            />
          )}
        />
      )}
      <MenuSheet
        visible={menuId != null}
        onClose={() => setMenuId(null)}
        actions={
          menuId
            ? [
                { label: h.saveAsRoutine, icon: 'save', onPress: () => void saveWorkoutAsRoutine(menuId) },
                {
                  label: h.deleteWorkout,
                  icon: 'trash-2',
                  destructive: true,
                  onPress: () => void deleteWorkoutWithUndo(menuId, refresh),
                },
              ]
            : []
        }
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  content: { paddingHorizontal: t.spacing.screen, paddingTop: t.spacing.sm, paddingBottom: t.spacing.huge },
}));
