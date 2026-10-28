import { useEffect, useState } from 'react';

import { favoriteFoods, recentFoods, searchFoods, setFavorite } from '@/db/foodsRepo';
import { useLoader } from '@/lib/useLoader';
import type { Food } from '@/nutrition/models';
import { loadFoods } from '@/stores/foodsStore';

/** Espera um pouco depois da última tecla antes de buscar. */
const DEBOUNCE_MS = 150;

export type FoodSearchResult = { mode: 'browse'; favorites: Food[]; recents: Food[] } | { mode: 'search'; results: Food[] };

/** Busca na TACO e nos meus alimentos (seção 10.2): sem acento, por categoria; sem busca, favoritos e recentes. */
export function useFoodSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const loader = useLoader<FoodSearchResult>(async () => {
    if (!debounced.trim() && !category) {
      const [favorites, recents] = await Promise.all([favoriteFoods(), recentFoods()]);
      return { mode: 'browse', favorites, recents };
    }
    return { mode: 'search', results: await searchFoods(debounced, { category: category ?? undefined }) };
  }, `${debounced}|${category ?? ''}`);

  const toggleFavorite = async (food: Food) => {
    await setFavorite(food.id, !food.favorite);
    void loadFoods(true).catch(() => {});
    loader.refresh();
  };

  return { query, setQuery, category, setCategory, ...loader, toggleFavorite };
}
