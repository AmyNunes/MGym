import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';

import { ErrorState, SnackbarHost } from '@/components/ui';
import { StartConflictHost } from '@/components/workout/StartConflictHost';
import { onAppReady } from '@/features/app/startup';
import { useBootstrap } from '@/features/app/useBootstrap';
import { strings } from '@/i18n/strings';
import { listenNotificationResponses } from '@/notifications/handlers';
import { startNotificationService } from '@/notifications/service';
import { useSettings } from '@/stores/settingsStore';
import { ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { state, retry } = useBootstrap();
  const preference = useSettings((s) => s.appearance.themePreference);

  useEffect(() => {
    if (state !== 'loading') SplashScreen.hideAsync();
    if (state === 'ready') void onAppReady();
  }, [state]);

  useEffect(() => listenNotificationResponses(), []);
  useEffect(() => (state === 'ready' ? startNotificationService() : undefined), [state]);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider preference={preference}>
        <BottomSheetModalProvider>
          {state === 'ready' && (
            <>
              <RootStack />
              <StartConflictHost />
              <SnackbarHost />
            </>
          )}
          {state === 'error' && <BootError onRetry={retry} />}
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const theme = useTheme();
  // "Reduzir movimento": telas cheias entram com fade em vez de deslizar (seção 4.3).
  const reducedMotion = useReducedMotion();

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontSize: theme.typography.heading.fontSize,
          fontWeight: theme.typography.heading.fontWeight,
        },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Telas cheias, sem cabeçalho nem tab bar (seção 6.1). */}
      {['session/[id]', 'session/summary/[id]'].map((name) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{ headerShown: false, animation: reducedMotion ? 'fade' : 'slide_from_bottom' }}
        />
      ))}
    </Stack>
  );
}

function BootError({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.flex, styles.center, { backgroundColor: theme.colors.bg }]}>
      <ErrorState message={strings.boot.error} onRetry={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: 'center' },
});
