import { router } from 'expo-router';

import { EmptyState, ErrorState, Skeleton, Text } from '@/components/ui';
import type { AIState } from '@/features/ai/useAIRequest';
import { strings } from '@/i18n/strings';
import { useTheme } from '@/theme';

type Props<T> = { state: AIState<T>; onRetry: () => void; loadingText?: string };

/**
 * Estados de uma tela com IA (seção 17): carregando, sem configurar (com atalho), erro amigável
 * e sem conexão (com "Tentar de novo"). Em sucesso ou parado, não mostra nada.
 */
export function AIStatus<T>({ state, onRetry, loadingText = strings.ai.thinking }: Props<T>) {
  const theme = useTheme();
  if (state.status === 'loading') {
    return (
      <>
        <Text color="textMuted" accessibilityLiveRegion="polite">
          {loadingText}
        </Text>
        <Skeleton height={theme.sizes.listRowHeight * 2} radius="lg" />
      </>
    );
  }
  if (state.status !== 'error') return null;
  if (state.error.kind === 'notConfigured') {
    return (
      <EmptyState
        icon="cpu"
        message={state.error.messagePt}
        action={{ label: strings.ai.configure, onPress: () => router.push('/settings/ai') }}
      />
    );
  }
  return <ErrorState message={state.error.messagePt} onRetry={state.error.retryable ? onRetry : undefined} />;
}
