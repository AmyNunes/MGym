import { MUSCLE_SHAPES } from '@/components/muscles/bodyShapes';
import { EXERCISES } from '@/data/exercises';
import { matchesSearch, normalizeSearch } from '@/lib/text';

import { EMPTY_FILTERS, filterExercises, findExercise, substitutesOf } from '../catalog';
import { exerciseSchema, MUSCLES } from '../exerciseModel';

describe('catálogo de exercícios (src/data/exercises.ts)', () => {
  it('tem os 66 exercícios do docs/EXERCICIOS.md', () => {
    expect(EXERCISES).toHaveLength(66);
  });

  it('todos passam no schema zod', () => {
    for (const e of EXERCISES) {
      const result = exerciseSchema.safeParse(e);
      if (!result.success) throw new Error(`${e.id}: ${result.error.message}`);
    }
  });

  it('ids únicos', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
  });

  it('toda troca existe no catálogo e não aponta para o próprio exercício', () => {
    for (const e of EXERCISES) {
      for (const id of e.substitutes) {
        expect(findExercise(id)).toBeDefined();
        expect(id).not.toBe(e.id);
      }
    }
  });

  it('todo músculo tem desenho no mapa muscular (frente ou costas)', () => {
    for (const m of MUSCLES) {
      expect(MUSCLE_SHAPES.front[m] ?? MUSCLE_SHAPES.back[m]).toBeDefined();
    }
  });

  it('os construtores principais de glúteos têm ênfase máxima', () => {
    for (const id of ['barbell-hip-thrust', 'machine-hip-thrust', 'bulgarian-split-squat', 'romanian-deadlift']) {
      expect(findExercise(id)?.glute).toBe(3);
    }
  });
});

describe('busca e filtros', () => {
  it('busca sem acento e sem diferença de maiúsculas, em português ou inglês', () => {
    expect(normalizeSearch('Elevação Pélvica')).toBe('elevacao pelvica');
    expect(matchesSearch('Agachamento búlgaro', 'BULGARO')).toBe(true);
    expect(filterExercises({ ...EMPTY_FILTERS, query: 'elevacao pelvica' }).map((e) => e.id)).toContain(
      'barbell-hip-thrust',
    );
    expect(filterExercises({ ...EMPTY_FILTERS, query: 'hip thrust' }).length).toBeGreaterThanOrEqual(3);
  });

  it('filtra por grupo, equipamento e "bom para glúteos"', () => {
    const glutesMachine = filterExercises({ ...EMPTY_FILTERS, groups: ['glutes'], equipment: ['machine'] });
    expect(glutesMachine.every((e) => e.group === 'glutes' && e.equipment.includes('machine'))).toBe(true);
    expect(filterExercises({ ...EMPTY_FILTERS, goodForGlutes: true }).every((e) => e.glute >= 2)).toBe(true);
  });

  it('tira exercícios com a limitação escolhida', () => {
    const noKnee = filterExercises({ ...EMPTY_FILTERS, avoid: ['knee'] });
    expect(noKnee.some((e) => e.restrictions.includes('knee'))).toBe(false);
    expect(noKnee.map((e) => e.id)).toContain('barbell-hip-thrust');
  });

  it('trocas sem a restrição pedida', () => {
    const squat = findExercise('back-squat')!;
    const subs = substitutesOf(squat, ['knee']);
    expect(subs.length).toBeGreaterThan(0);
    expect(subs.every((e) => !e.restrictions.includes('knee'))).toBe(true);
  });
});
