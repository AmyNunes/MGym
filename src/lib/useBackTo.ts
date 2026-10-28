import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

/**
 * Enquanto a tela está aberta, o "voltar" do Android (botão ou gesto) vai para `href` e tira da pilha
 * as telas do caminho. Ex.: no resultado do Guia, voltar vai para Hoje, não para as perguntas já respondidas.
 */
export function useBackTo(href: Href) {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.dismissTo(href);
        return true;
      });
      return () => sub.remove();
    }, [href]),
  );
}
