import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { insertCustomFood, searchFoods } from '@/db/foodsRepo';
import { entriesForDate, getMealPlan, shoppingList, slotsForDate } from '@/db/mealsRepo';
import { emptyProfile, type Profile } from '@/profile/profile';
import { findFood, loadFoods, useFoods } from '@/stores/foodsStore';
import { useProfile } from '@/stores/profileStore';
import { weekKey } from '@/training/schedule';

import { ensureWeek, generateShopping, regenerateDay, swapItem, toggleAte } from '../menuService';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));

const profile: Profile = {
  ...emptyProfile(),
  weightKg: 65,
  heightCm: 170,
  birthDate: '1996-05-10',
  hrt: 'estrogen',
  hrtMonths: 12,
  daysPerWeek: 3,
  weightGoal: 'maintain',
  mealsPerDay: 4,
  dislikes: ['taco-410'],
};

const monday = new Date(2026, 9, 26, 10);

beforeEach(() => {
  mockDb.reset();
  useFoods.setState({ foods: new Map(), portions: new Map(), loaded: false });
  useProfile.setState({ profile, completed: true, loaded: true });
});

describe('alimentos no banco', () => {
  it('a migration traz os 597 da TACO com as medidas, e a busca é sem acento', async () => {
    await loadFoods(true);
    expect(useFoods.getState().foods.size).toBe(597);
    expect(useFoods.getState().portions.get('taco-3')?.[0]).toEqual({ label: 'colher de sopa cheia', plural: 'colheres de sopa cheias', grams: 25 });
    expect((await searchFoods('acai')).some((f) => f.name.startsWith('Açaí'))).toBe(true);
    expect((await searchFoods('frango peito grelhado')).map((f) => f.id)).toContain('taco-410');
  });

  it('alimento meu, com os valores do rótulo', async () => {
    const id = await insertCustomFood({ name: 'Whey de baunilha', kcal: 380, protein: 75, carbs: 8, fat: 5, fiber: null, sodium: null, potassium: null });
    expect((await searchFoods('whey'))[0].id).toBe(id);
  });
});

describe('cardápio da semana', () => {
  it('gera 7 dias com 3 opções por refeição, respeitando o que eu não como', async () => {
    const result = await ensureWeek(monday);
    expect(result.status).toBe('ready');
    const slots = await slotsForDate('2026-10-26');
    expect(slots.map((s) => s.slot)).toEqual(['breakfast', 'lunch', 'afternoonSnack', 'dinner']);
    for (const s of slots) {
      expect(s.options).toHaveLength(3);
      for (const o of s.options) expect(o.items.some((i) => i.foodId === 'taco-410')).toBe(false);
    }
    expect((await slotsForDate('2026-11-01')).length).toBe(4);
    // Abrir de novo não gera outra semana.
    const again = await ensureWeek(monday);
    expect(again.status === 'ready' && result.status === 'ready' && again.plan.id).toBe(result.status === 'ready' && result.plan.id);
  });

  it('sem altura, nascimento e peso: pede o Guia', async () => {
    useProfile.setState({ profile: { ...profile, weightKg: null } });
    expect((await ensureWeek(monday)).status).toBe('needsProfile');
  });

  it('"Comi" registra o que comi pela TACO; tocar de novo desmarca', async () => {
    await ensureWeek(monday);
    const [breakfast] = await slotsForDate('2026-10-26');
    expect(await toggleAte(breakfast, 1)).toBe(true);
    const entries = await entriesForDate('2026-10-26');
    expect(entries).toHaveLength(1);
    expect(entries[0].items).toEqual(breakfast.options[1].items);
    const [marked] = await slotsForDate('2026-10-26');
    expect(marked.chosenIndex).toBe(1);
    expect(await toggleAte(marked, 1)).toBe(false);
    expect(await entriesForDate('2026-10-26')).toEqual([]);
  });

  it('trocar um alimento muda só aquele item', async () => {
    await ensureWeek(monday);
    const [, lunch] = await slotsForDate('2026-10-26');
    await swapItem(lunch.id, 0, 0, 'taco-377', 120);
    const [, after] = await slotsForDate('2026-10-26');
    expect(after.options[0].items[0]).toEqual({ foodId: 'taco-377', grams: 120 });
    expect(after.options[0].items.slice(1)).toEqual(lunch.options[0].items.slice(1));
  });

  it('"Gerar de novo" um dia troca só aquele dia', async () => {
    await ensureWeek(monday);
    const tuesday = await slotsForDate('2026-10-27');
    await regenerateDay(monday);
    expect(await slotsForDate('2026-10-27')).toEqual(tuesday);
    expect((await slotsForDate('2026-10-26')).length).toBe(4);
  });

  it('modo da nutri: o app não monta as opções sozinho', async () => {
    useProfile.setState({ profile: { ...profile, nutritionistMode: true, nutriTargets: { kcal: 1900, protein: 110, carbs: 220, fat: 60 } } });
    await ensureWeek(monday);
    expect((await slotsForDate('2026-10-26')).every((s) => s.options.length === 0)).toBe(true);
    expect((await getMealPlan(weekKey(monday)))?.targets.day.protein).toBe(110);
  });
});

describe('lista de compras', () => {
  it('3 dias, agrupada por seção, em medidas práticas', async () => {
    await generateShopping(monday, 3);
    const list = await shoppingList();
    expect(list.length).toBeGreaterThan(5);
    expect(list.every((i) => i.quantity.length > 0)).toBe(true);
    expect(findFood('taco-3')).toBeDefined();
  });
});
