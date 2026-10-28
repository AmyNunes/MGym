import { create } from 'zustand';

/** Qual folha do registro rápido (botão +) está aberta (seção 6.1). Cada fase acrescenta as suas. */
export type QuickAddSheet = 'menu' | 'cardio' | 'meal' | 'weight';

export const useQuickAdd = create<{ sheet: QuickAddSheet | null }>()(() => ({ sheet: null }));

export const openQuickAdd = (sheet: QuickAddSheet) => useQuickAdd.setState({ sheet });
export const closeQuickAdd = () => useQuickAdd.setState({ sheet: null });
