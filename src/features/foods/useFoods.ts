import { useEffect } from 'react';

import { loadFoods, useFoods } from '@/stores/foodsStore';

/** Nomes de alguns alimentos (carrega o cache se precisar). */
export function useFoodNames(ids: readonly string[]): Record<string, string> {
  const foods = useFoods((s) => s.foods);
  const loaded = useFoods((s) => s.loaded);
  useEffect(() => {
    if (!loaded) void loadFoods().catch(() => {});
  }, [loaded]);
  return Object.fromEntries(ids.map((id) => [id, foods.get(id)?.name ?? '']));
}
