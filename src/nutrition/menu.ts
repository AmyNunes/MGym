import type { CookingTime, DietRestriction, LunchPlace } from '@/profile/profile';

import { itemMacros, sumMacros, toHousehold, type Macros } from './macros';
import { SLOT_KIND, type Food, type MealItem, type MealKind, type MealSlot, type MealTemplate, type Portion, type Role } from './models';
import { isHighPotassium } from './swaps';
import type { MacroTargets } from './targets';

/**
 * Montagem do cardápio (seção 10.3), por regras: para cada refeição, 3 opções das refeições-modelo
 * que respeitam restrições e "não como", escaladas por papel até a meta (±10%), em medidas caseiras,
 * variando na semana (a mesma no máximo 2×, salvo as com alimentos que eu amo).
 */

export type MenuPrefs = {
  restrictions: readonly DietRestriction[];
  dislikes: readonly string[];
  likes: readonly string[];
  cookingTime: CookingTime | null;
  lunchPlace: LunchPlace | null;
  limitPotassium: boolean;
};

export type MenuOption = { name: string; templateId: string | null; items: MealItem[] };

export type Lookups = {
  find: (id: string) => Food | undefined;
  portionsOf: (id: string) => Portion[] | undefined;
};

export const OPTIONS_PER_MEAL = 3;
export const MAX_REPEATS_PER_WEEK = 2;
export const TOLERANCE = 0.1;

const foodKey = (tacoNumber: number) => `taco-${tacoNumber}`;
const templateFoods = (t: MealTemplate) => t.items.map((i) => foodKey(i.foodId));

const MAX_PREP: Record<CookingTime, number> = { little: 10, medium: 25, likes: Number.POSITIVE_INFINITY };

function respectsRestrictions(t: MealTemplate, restrictions: readonly DietRestriction[]): boolean {
  return restrictions.every((r) => {
    if (r === 'vegetarian') return t.tags.includes('vegetarian') || t.tags.includes('vegan');
    if (r === 'other') return true;
    return t.tags.includes(r);
  });
}

/** As refeições-modelo que servem para esta refeição. Restrições e "não como" nunca afrouxam. */
export function eligibleTemplates(templates: readonly MealTemplate[], kind: MealKind, prefs: MenuPrefs): MealTemplate[] {
  const strict = templates.filter(
    (t) =>
      t.kinds.includes(kind) &&
      respectsRestrictions(t, prefs.restrictions) &&
      !templateFoods(t).some((id) => prefs.dislikes.includes(id)),
  );
  const prep = (list: MealTemplate[]) =>
    list.filter((t) => t.prepMinutes <= MAX_PREP[prefs.cookingTime ?? 'likes']);
  const place = (list: MealTemplate[]) =>
    kind !== 'lunch' || !prefs.lunchPlace || prefs.lunchPlace === 'home'
      ? list
      : list.filter((t) => t.tags.includes(prefs.lunchPlace === 'lunchbox' ? 'lunchbox' : 'restaurant'));
  for (const list of [place(prep(strict)), prep(strict), strict]) {
    if (list.length >= OPTIONS_PER_MEAL) return list;
  }
  return strict;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Limites da escala (não vira outra refeição). */
const PROTEIN_SCALE = [0.5, 3] as const;
const CARB_SCALE = [0.3, 3] as const;

/**
 * Fatores para os itens de proteína (fp) e de carboidrato (fc) que acertam as duas metas ao mesmo
 * tempo (o feijão e o arroz também têm proteína): P = fp·Pp + fc·Pc + Po e C = fp·Cp + fc·Cc + Co.
 */
export function solveFactors(
  p: { protein: number; carb: number; other: number },
  c: { protein: number; carb: number; other: number },
  target: { protein: number; carbs: number },
): { fp: number; fc: number } {
  const det = p.protein * c.carb - p.carb * c.protein;
  let fp: number;
  let fc: number;
  if (Math.abs(det) > 1e-6) {
    fp = ((target.protein - p.other) * c.carb - p.carb * (target.carbs - c.other)) / det;
    fc = (p.protein * (target.carbs - c.other) - (target.protein - p.other) * c.protein) / det;
  } else {
    fp = p.protein > 0 ? (target.protein - p.other - p.carb) / p.protein : 1;
    fc = c.carb > 0 ? (target.carbs - c.other - c.protein * fp) / c.carb : 1;
  }
  return {
    fp: p.protein > 0 ? clamp(fp, ...PROTEIN_SCALE) : 1,
    fc: c.carb > 0 ? clamp(fc, ...CARB_SCALE) : 1,
  };
}

/**
 * Escala por papel: os itens de proteína e de carboidrato juntos até as duas metas; o resto
 * (gordura, verduras, fruta) fica na quantidade base. Arredonda para medidas caseiras.
 */
export function scaleTemplate(t: MealTemplate, target: MacroTargets, lookups: Lookups): MenuOption {
  const items = t.items.map((i) => ({ id: foodKey(i.foodId), grams: i.grams, role: i.role }));
  return { ...scaleItems(t.name, items, target, lookups), templateId: t.id };
}

/** A mesma escala para itens soltos (ex.: uma opção sugerida pela IA, com ids do banco). */
export function scaleItems(
  name: string,
  base: readonly { id: string; grams: number; role: Role }[],
  target: MacroTargets,
  { find, portionsOf }: Lookups,
): MenuOption {
  const items = base.map((i) => ({ ...i, food: find(i.id) }));
  const sum = (role: (r: string) => boolean, key: keyof Macros) =>
    items.filter((i) => role(i.role)).reduce((s, i) => s + (i.food ? itemMacros(i.food, i.grams)[key] : 0), 0);
  const isP = (r: string) => r === 'protein';
  const isC = (r: string) => r === 'carb';
  const isO = (r: string) => r !== 'protein' && r !== 'carb';

  const { fp, fc } = solveFactors(
    { protein: sum(isP, 'protein'), carb: sum(isC, 'protein'), other: sum(isO, 'protein') },
    { protein: sum(isP, 'carbs'), carb: sum(isC, 'carbs'), other: sum(isO, 'carbs') },
    target,
  );
  const scaled = items.map((i) => ({ ...i, grams: i.grams * (isP(i.role) ? fp : isC(i.role) ? fc : 1) }));

  return {
    name,
    templateId: null,
    items: scaled.map((i) => ({ foodId: i.id, grams: toHousehold(i.grams, portionsOf(i.id)).grams })),
  };
}

/** Proteína e carboidratos dentro de ±10% da meta? */
export function withinTarget(m: Macros, target: MacroTargets, tolerance = TOLERANCE): boolean {
  const ok = (v: number, goal: number) => goal <= 0 || Math.abs(v - goal) <= tolerance * goal;
  return ok(m.protein, target.protein) && ok(m.carbs, target.carbs);
}

/** Gerador pseudoaleatório com semente (o mesmo dia gera o mesmo cardápio; "Gerar de novo" muda a semente). */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** Escolhe as 3 opções: menos repetidas na semana, com alimentos que eu amo, potássio sob controle. */
export function pickOptions(
  candidates: readonly MealTemplate[],
  usage: Map<string, number>,
  prefs: MenuPrefs,
  lookups: Lookups,
  random: () => number,
): MealTemplate[] {
  const scored = candidates
    .map((t) => {
      const foods = templateFoods(t);
      const loved = foods.filter((id) => prefs.likes.includes(id)).length;
      const used = usage.get(t.id) ?? 0;
      if (used >= MAX_REPEATS_PER_WEEK && loved === 0) return null;
      const potassium = prefs.limitPotassium
        ? foods.filter((id) => {
            const f = lookups.find(id);
            return f != null && isHighPotassium(f);
          }).length
        : 0;
      return { t, score: used * 1.5 + potassium * 1.2 - loved * 1.5 + random() * 2 };
    })
    .filter((x): x is { t: MealTemplate; score: number } => x != null)
    .sort((a, b) => a.score - b.score);
  return scored.slice(0, OPTIONS_PER_MEAL).map((x) => x.t);
}

export type GeneratedSlot = { slot: MealSlot; time: string; options: MenuOption[] };
export type GeneratedDay = { date: string; slots: GeneratedSlot[] };

/** Gera os dias pedidos (a semana, ou um dia no "Gerar de novo"), contando as repetições. */
export function generateDays(input: {
  dates: readonly string[];
  slots: readonly { slot: MealSlot; time: string }[];
  targets: Record<string, MacroTargets>;
  templates: readonly MealTemplate[];
  prefs: MenuPrefs;
  lookups: Lookups;
  seed: string;
  usage?: Map<string, number>;
}): GeneratedDay[] {
  const usage = new Map(input.usage ?? []);
  return input.dates.map((date) => {
    const random = seededRandom(`${input.seed}|${date}`);
    return {
      date,
      slots: input.slots.map(({ slot, time }) => {
        const candidates = eligibleTemplates(input.templates, SLOT_KIND[slot], input.prefs);
        const picked = pickOptions(candidates, usage, input.prefs, input.lookups, random);
        picked.forEach((t) => usage.set(t.id, (usage.get(t.id) ?? 0) + 1));
        return { slot, time, options: picked.map((t) => scaleTemplate(t, input.targets[slot], input.lookups)) };
      }),
    };
  });
}

/** Total de uma opção pela TACO. */
export const optionMacros = (option: MenuOption, find: Lookups['find']) => sumMacros(option.items, find);

/**
 * Ordem de exibição das opções (seção 10.6): no modo "Sem números", da mais proteica para a menos.
 * Devolve os índices originais (o que fica salvo continua sendo o índice da opção).
 */
export function optionOrder(options: readonly MenuOption[], byProtein: boolean, find: (id: string) => Food | undefined): number[] {
  const indices = options.map((_, i) => i);
  if (!byProtein) return indices;
  const protein = options.map((o) => sumMacros(o.items, find).protein);
  return indices.sort((a, b) => protein[b] - protein[a] || a - b);
}
