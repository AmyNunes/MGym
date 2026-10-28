import { memoryDbHolder } from '@/db/__tests__/memoryDb';
import { describeCandidates, optionCandidates } from '@/features/meals/aiMeals';
import { sumMacros } from '@/nutrition/macros';
import { emptyProfile, type Profile } from '@/profile/profile';
import { findFood, loadFoods, portionsOf, useFoods } from '@/stores/foodsStore';

import { callAI } from '../client';
import { explainExercise } from '../functions/explainExercise';
import { describeMeal, suggestMealOptions } from '../functions/meals';
import { profileContext } from '../prompts/common';
import { findExercise } from '@/training/catalog';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));
jest.mock('../client', () => ({ callAI: jest.fn() }));
jest.mock('../cache', () => ({
  withCache: async (_f: string, _i: unknown, _s: unknown, compute: () => Promise<unknown>) => ({ data: await compute(), cached: false }),
}));

const mockCall = callAI as jest.MockedFunction<typeof callAI>;
const reply = (data: unknown) => mockCall.mockResolvedValueOnce({ data, model: 'm', usage: { inputTokens: 1, outputTokens: 1, estimatedCost: 0 } } as never);

const profile: Profile = {
  ...emptyProfile(),
  goal: 'feminineShape',
  experience: 'beginner',
  hrt: 'estrogenSpiro',
  hrtMonths: 10,
  weightKg: 65,
  heightCm: 170,
  restrictions: ['vegetarian'],
  dislikes: ['taco-88'],
};

beforeAll(async () => {
  mockDb.reset();
  useFoods.setState({ foods: new Map(), portions: new Map(), loaded: false });
  await loadFoods(true);
});
beforeEach(() => mockCall.mockReset());

describe('privacidade (14.4)', () => {
  it('sem permissão, a IA não vê terapia hormonal, peso nem medidas', () => {
    const text = profileContext(profile, { waistCm: 80 });
    expect(text).toContain('Silhueta mais feminina');
    expect(text).not.toMatch(/hormonal|Estrogênio|65 kg|Cintura/);
  });

  it('com permissão, vê o contexto, mas nunca doses', () => {
    const text = profileContext({ ...profile, includeContextInAi: true }, { waistCm: 80 });
    expect(text).toContain('Terapia hormonal: Estrogênio + espironolactona há 10 meses (não fale de doses)');
    expect(text).toContain('peso 65 kg');
    expect(text).toContain('Cintura: 80 cm');
  });

  it('a identidade escolhida no Guia vai como está (com permissão)', () => {
    expect(profileContext({ ...profile, context: 'cisMan', includeContextInAi: true })).toContain('Identidade: Homem cis.');
    expect(profileContext({ ...profile, context: 'transMan', includeContextInAi: true })).toContain('Identidade: Homem trans.');
    expect(profileContext({ ...profile, context: 'cisWoman' })).not.toContain('Identidade');
  });
});

describe('explicar exercício', () => {
  it('manda o exercício do catálogo e devolve a explicação validada', async () => {
    reply({ overviewPt: 'Ponte com apoio', steps: [{ titlePt: 'Subir', instructionPt: 'Empurre', feelPt: 'Glúteo apertando' }], mistakes: [], focusTipsPt: [], safetyPt: 'Sem dor' });
    const hipThrust = findExercise('barbell-hip-thrust');
    expect(hipThrust).toBeDefined();
    const { data } = await explainExercise({ exercise: hipThrust!, profile, doubt: 'onde sentir?' });
    expect(data.steps[0].feelPt).toBe('Glúteo apertando');
    const [feature, messages] = mockCall.mock.calls[0];
    expect(feature).toBe('explainExercise');
    expect(messages[1].content).toContain(hipThrust!.name);
    expect(messages[1].content).toContain('onde sentir?');
  });
});

describe('opções de refeição', () => {
  it('a lista respeita restrições e "não como"', () => {
    const ids = optionCandidates(profile).map((c) => c.id);
    expect(ids).not.toContain('taco-88');
    expect(ids.some((id) => findFood(id)?.category === 'Carnes e derivados')).toBe(false);
    expect(ids.length).toBeGreaterThan(50);
  });

  it('descarta ids desconhecidos e recalcula as quantidades pela TACO', async () => {
    const foods = optionCandidates(profile);
    const egg = foods.find((f) => /^Ovo/.test(f.name) && f.role === 'protein');
    const rice = foods.find((f) => f.name.startsWith('Arroz') && f.role === 'carb');
    expect(egg && rice).toBeTruthy();
    reply({
      options: [
        { namePt: 'Arroz com ovo', items: [{ foodId: rice!.id, grams: 150 }, { foodId: egg!.id, grams: 100 }, { foodId: 'taco-99999', grams: 100 }] },
        { namePt: 'Só inventado', items: [{ foodId: 'inventado', grams: 100 }] },
      ],
    });
    const target = { kcal: 600, protein: 30, carbs: 70, fat: 18 };
    const options = await suggestMealOptions(
      { slotName: 'Almoço', target, context: '', likes: [], current: [], foods },
      { find: findFood, portionsOf },
    );
    expect(options).toHaveLength(1);
    expect(options[0].items.map((i) => i.foodId)).toEqual([rice!.id, egg!.id]);
    // As gramas da IA (150 g e 100 g) foram escaladas pela TACO para a meta da refeição.
    const macros = sumMacros(options[0].items, findFood);
    expect(macros.protein).toBeGreaterThan(24);
    expect(macros.carbs).toBeGreaterThan(56);
  });
});

describe('descrever refeição', () => {
  it('"prato feito" vira alimentos do banco; ids fora da lista saem', async () => {
    const candidates = describeCandidates('prato feito com arroz, feijão e frango');
    const rice = candidates.find((c) => c.name.startsWith('Arroz'));
    const beans = candidates.find((c) => c.name.startsWith('Feijão'));
    reply({
      items: [
        { foodId: rice!.id, grams: 152, confidence: 0.9 },
        { foodId: beans!.id, grams: 98, confidence: 0.8 },
        { foodId: 'taco-0', grams: 100, confidence: 0.9 },
      ],
    });
    const items = await describeMeal('prato feito', candidates);
    expect(items).toEqual([
      { foodId: rice!.id, grams: 150, confidence: 0.9 },
      { foodId: beans!.id, grams: 100, confidence: 0.8 },
    ]);
  });
});
