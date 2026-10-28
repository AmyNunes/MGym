import { requireOptionalNativeModule } from 'expo';

type RestCountdownNative = {
  show(endsAtMs: number, title: string, body: string, channelName: string): void;
  hide(): void;
};

/**
 * Módulo nativo (Kotlin) da contagem regressiva na notificação (seção 2.2).
 * Num development build antigo (sem o módulo) ou nos testes, não faz nada.
 */
const native = requireOptionalNativeModule<RestCountdownNative>('RestCountdown');

export const restCountdownAvailable = native != null;

export function showRestCountdown(endsAtMs: number, title: string, body: string, channelName: string): void {
  try {
    native?.show(endsAtMs, title, body, channelName);
  } catch {
    // Sem a contagem, o fim do descanso continua agendado.
  }
}

export function hideRestCountdown(): void {
  try {
    native?.hide();
  } catch {
    // nada a fazer
  }
}
