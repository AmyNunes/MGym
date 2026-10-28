import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { usePlannedRowHeight } from '@/components/routines/PlannedExerciseRow';
import { PlannedEditorList } from '@/components/routines/PlannedEditorList';
import { Button, EmptyState, ErrorState, IconButton, MenuSheet, Screen, Skeleton, TextField } from '@/components/ui';
import { useRoutineEditor } from '@/features/routines/useRoutineEditor';
import { startRoutine } from '@/features/workout/start';
import { strings } from '@/i18n/strings';
import { useTheme } from '@/theme';

const r = strings.routines;

/** Montar/editar um treino ("Meus treinos"). */
export default function RoutineScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const editor = useRoutineEditor(id);
  const rowHeight = usePlannedRowHeight();
  const [menu, setMenu] = useState(false);

  const header = (
    <Stack.Screen
      options={{
        title: editor.name || r.name,
        headerRight: () => <IconButton icon="more-vertical" accessibilityLabel={r.menu} onPress={() => setMenu(true)} />,
      }}
    />
  );

  if (editor.status !== 'ready') {
    return (
      <Screen edges={[]}>
        {header}
        {editor.status === 'loading' && <Skeleton height={theme.sizes.touchTarget} />}
        {editor.status === 'loading' && <Skeleton height={rowHeight * 3} />}
        {editor.status === 'error' && <ErrorState onRetry={editor.reload} />}
        {editor.status === 'missing' && <EmptyState icon="alert-circle" message={r.notFound} />}
      </Screen>
    );
  }

  const start = async () => {
    await editor.flush();
    await startRoutine({ id, name: editor.name, items: editor.items });
  };

  return (
    <Screen
      edges={[]}
      footer={editor.items.length > 0 ? <Button label={strings.workout.start} icon="play" size="main" onPress={() => void start()} /> : undefined}
    >
      {header}
      <TextField label={r.name} value={editor.name} onChangeText={editor.rename} maxLength={40} />
      <PlannedEditorList editor={editor} />
      <MenuSheet
        visible={menu}
        onClose={() => setMenu(false)}
        actions={[
          {
            label: r.deleteRoutine,
            icon: 'trash-2',
            destructive: true,
            onPress: () => {
              void editor.remove();
              router.back();
            },
          },
        ]}
      />
    </Screen>
  );
}
