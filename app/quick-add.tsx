import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { openQuickAdd, type QuickAddSheet } from '@/stores/quickAddStore';

const SHEETS: Record<string, QuickAddSheet> = { weight: 'weight', meal: 'meal', cardio: 'cardio' };

/**
 * Links `mgym://quick-add?type=...` (seção 6.3): abre a folha do registro rápido sobre Hoje.
 * Medidas abrem a tela de medir.
 */
export default function QuickAddLink() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const sheet = type ? SHEETS[type] : undefined;

  useEffect(() => {
    if (sheet) openQuickAdd(sheet);
  }, [sheet]);

  if (type === 'measurements') return <Redirect href="/progress/measure" />;
  return <Redirect href="/" />;
}
