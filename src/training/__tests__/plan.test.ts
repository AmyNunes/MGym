import { recoveryState } from '@/safety/recovery';

import { findExercise } from '../catalog';
import { estimateMinutes, exerciseSeconds } from '../duration';
import type { Pattern } from '../exerciseModel';
import { gluteAim, generatePlan, planWarnings, volumeTargets, weeklyVolume, type PlanInput } from '../plan';
import { chooseTemplate } from '../templates';

const base: PlanInput = {
  daysPerWeek: 4,
  sessionMinutes: 60,
  experience: 'experienced',
  goal: 'feminineShape',
  priorities: ['glutes'],
  limitations: [],
  recoveryAvoid: [],
};

const ids = (p: ReturnType<typeof generatePlan>) => p.days.flatMap((d) => d.exercises.map((e) => e.exerciseId));
const exercises = (p: ReturnType<typeof generatePlan>) => ids(p).map((id) => findExercise(id)!);

describe('modelo pelo número de dias e experiência (tabela 9.2)', () => {
  it.each([
    [2, true, 'fullBodyLean'],
    [2, false, 'fullBodyLean'],
    [3, true, 'fullBodyAB'],
    [3, false, 'lowerUpperLower'],
    [4, true, 'upperLower4'],
    [5, false, 'upperLower5'],
  ] as const)('%i dias, iniciante=%s → %s', (days, beginner, template) => {
    expect(chooseTemplate(days, beginner)).toBe(template);
  });

  it('o plano tem os dias do modelo, com nome', () => {
    const plan = generatePlan(base);
    expect(plan.template).toBe('upperLower4');
    expect(plan.days.map((d) => d.name)).toEqual(['Inferior A', 'Superior', 'Inferior B', 'Superior + glúteo']);
  });
});

describe('cabe no tempo escolhido', () => {
  it.each([45, 60, 75])('%i min, em todos os modelos', (minutes) => {
    for (const daysPerWeek of [2, 3, 4, 5]) {
      for (const experience of ['beginner', 'experienced'] as const) {
        const plan = generatePlan({ ...base, daysPerWeek, experience, sessionMinutes: minutes });
        for (const day of plan.days) {
          expect(estimateMinutes(day.exercises, findExercise)).toBeLessThanOrEqual(minutes);
          expect(day.exercises.length).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it('duração = séries × (repetições × 3 s + descanso)', () => {
    const item = { exerciseId: 'barbell-hip-thrust', sets: 3, repMin: 8, repMax: 12, restSec: 120 };
    expect(exerciseSeconds(item, findExercise('barbell-hip-thrust'))).toBe(3 * (10 * 3 + 120));
  });
});

describe('receita de glúteos e volume', () => {
  it('toda semana tem agachamento ou afundo, elevação pélvica, dobradiça e abdução', () => {
    for (const daysPerWeek of [2, 3, 4, 5]) {
      const patterns = new Set<Pattern>(exercises(generatePlan({ ...base, daysPerWeek })).map((e) => e.pattern));
      expect(patterns.has('squat') || patterns.has('lunge')).toBe(true);
      expect(patterns.has('hipThrust')).toBe(true);
      expect(patterns.has('hinge')).toBe(true);
      expect(patterns.has('abduction')).toBe(true);
    }
  });

  it('glúteos chegam pelo menos à meta, sem avisos, e a parte superior não some', () => {
    for (const daysPerWeek of [2, 3, 4, 5]) {
      const plan = generatePlan({ ...base, daysPerWeek });
      const volume = weeklyVolume(plan.days, daysPerWeek);
      expect(volume.glutes).toBeGreaterThanOrEqual(gluteAim(base) - 1);
      expect(volume.back).toBeGreaterThan(0);
      expect(volume.chest).toBeGreaterThan(0);
      expect(plan.warnings).toEqual([]);
    }
  });

  it('iniciante começa em ~10 séries de glúteo e não recebe exercícios avançados', () => {
    const input = { ...base, experience: 'beginner' as const, daysPerWeek: 3 };
    expect(volumeTargets(input).glutes).toEqual({ min: 10, max: 14 });
    expect(exercises(generatePlan(input)).some((e) => e.level === 'advanced')).toBe(false);
  });

  it('"ombros sem alargar": sem elevação lateral e meta de 0–4', () => {
    const input = { ...base, priorities: ['narrowShoulders' as const] };
    expect(ids(generatePlan(input))).not.toContain('lateral-raise');
    expect(volumeTargets(input).shoulders).toEqual({ min: 0, max: 4 });
  });

  it('volume do rodízio: 3 dias por semana com 2 dias de plano vale 1,5×', () => {
    const day = { exercises: [{ exerciseId: 'barbell-hip-thrust', sets: 4, repMin: 8, repMax: 12, restSec: 120 }] };
    expect(weeklyVolume([day, { exercises: [] }], 3).glutes).toBe(6);
  });
});

describe('limitações e modo recuperação trocam exercícios', () => {
  it('joelho: nenhum exercício com restrição de joelho', () => {
    const plan = generatePlan({ ...base, limitations: ['knee'] });
    expect(exercises(plan).some((e) => e.restrictions.includes('knee'))).toBe(false);
    expect(exercises(plan).some((e) => e.pattern === 'hipThrust')).toBe(true);
  });

  it('lombar e ombro ao mesmo tempo', () => {
    const plan = generatePlan({ ...base, limitations: ['lowerBack', 'shoulder'] });
    expect(exercises(plan).some((e) => e.restrictions.includes('lowerBack') || e.restrictions.includes('shoulder'))).toBe(false);
  });

  it('pós-mama: sem empurrar, peito e dorsais até a liberação', () => {
    const recovery = recoveryState({ kind: 'breast', date: '2026-10-01', clearedOn: '2026-11-15' }, '2026-10-26');
    expect(recovery.active).toBe(true);
    const plan = generatePlan({ ...base, recoveryAvoid: recovery.avoid });
    expect(exercises(plan).some((e) => e.restrictions.includes('postBreast'))).toBe(false);
  });

  it('pós-vaginoplastia: sem elevação pélvica com barra', () => {
    const recovery = recoveryState({ kind: 'vaginoplasty', date: null, clearedOn: null }, '2026-10-26');
    expect(recovery).toMatchObject({ active: true, lightOnly: true, noBike: true });
    expect(ids(generatePlan({ ...base, recoveryAvoid: recovery.avoid }))).not.toContain('barbell-hip-thrust');
  });

  it('depois da liberação o modo recuperação desliga', () => {
    expect(recoveryState({ kind: 'breast', date: null, clearedOn: '2026-10-20' }, '2026-10-26').active).toBe(false);
  });
});

describe('avisos ao editar (sem bloquear)', () => {
  it('avisa quando glúteos ficam abaixo da meta ou um grupo some', () => {
    const plan = generatePlan(base);
    const noGlutes = plan.days.map((d) => ({
      exercises: d.exercises.filter((e) => !findExercise(e.exerciseId)!.primary.some((m) => m.startsWith('glute'))),
    }));
    const warnings = planWarnings(noGlutes, 4, plan.targets);
    expect(warnings.some((w) => w.kind === 'glutesLow')).toBe(true);
    const noChest = plan.days.map((d) => ({ exercises: d.exercises.filter((e) => findExercise(e.exerciseId)!.group !== 'chest') }));
    expect(planWarnings(noChest, 4, plan.targets)).toContainEqual({ kind: 'groupMissing', group: 'chest' });
  });
});
