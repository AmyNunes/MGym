import { create } from 'zustand';

import { listAllFoods, listAllPortions } from '@/db/foodsRepo';
import type { Food, Portion } from '@/nutrition/models';

/**
 * Todos os alimentos e porções na memória (~600 + ~200): as contas de macros, as trocas e a lista
 * de compras são instantâneas e funcionam sem esperar o banco a cada toque.
 */
type State = {
  foods: Map<string, Food>;
  portions: Map<string, Portion[]>;
  loaded: boolean;
};

export const useFoods = create<State>()(() => ({ foods: new Map(), portions: new Map(), loaded: false }));

let loading: Promise<void> | null = null;

/** Carrega (ou recarrega, depois de criar um alimento ou favoritar). */
export function loadFoods(force = false): Promise<void> {
  if (!force && useFoods.getState().loaded) return Promise.resolve();
  if (loading && !force) return loading;
  const current = (async () => {
    const [foods, rows] = await Promise.all([listAllFoods(), listAllPortions()]);
    const portions = new Map<string, Portion[]>();
    for (const r of rows) portions.set(r.foodId, [...(portions.get(r.foodId) ?? []), { label: r.label, plural: r.plural, grams: r.grams }]);
    useFoods.setState({ foods: new Map(foods.map((f) => [f.id, f])), portions, loaded: true });
  })().finally(() => {
    if (loading === current) loading = null;
  });
  loading = current;
  return current;
}

export const findFood = (id: string) => useFoods.getState().foods.get(id);
export const portionsOf = (id: string) => useFoods.getState().portions.get(id);
