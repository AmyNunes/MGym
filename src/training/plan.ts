import { strings } from '@/i18n/strings';
import type { Experience, Goal, Limitation, Priority } from '@/profile/profile';

import { findExercise, substitutesOf } from './catalog';
import { estimateMinutes } from './duration';
import type { Exercise, Restriction, VolumeGroup } from './exerciseModel';
import { plannedFrom, type RestOverride } from './planned';
import type { PlanTargets, TemplateId } from './planModel';
import { chooseTemplate, DAY_TEMPLATES, TEMPLATE_DAYS, type DayKey, type Slot } from './templates';
import { volumeByGroup, type GroupVolume } from './volume';
import type { PlannedExercise } from './workoutModel';

/**
 * Plano gerado por regras (seção 9.2), sem IA: modelo por dias e experiência,
 * receita de glúteos, limitações e recuperação, volume semanal e tempo de cada dia.
 */

export type PlanInput = {
  daysPerWeek: number;
  sessionMinutes: number;
  experience: Experience;
  goal: Goal | null;
  priorities: Priority[];
  limitations: Limitation[];
  /** Restrições do modo recuperação (seção 16.5). */
  recoveryAvoid: Restriction[];
  /** Descanso padrão por tipo (Configurações › Treino), se escolhido. */
  restOverride?: RestOverride | null;
};

export type GeneratedDay = { key: DayKey; name: string; exercises: PlannedExercise[]; note: string | null };

export type PlanWarning = { kind: 'glutesLow'; sets: number; min: number } | { kind: 'groupMissing'; group: VolumeGroup };

export type GeneratedPlan = {
  template: TemplateId;
  targets: PlanTargets;
  days: GeneratedDay[];
  warnings: PlanWarning[];
};

/** Séries máximas de um exercício no plano gerado. */
const MAX_SETS = 5;

const LIMITATION_RESTRICTIONS: Record<Limitation, Restriction | null> = {
  knee: 'knee',
  lowerBack: 'lowerBack',
  shoulder: 'shoulder',
  wrist: 'wrist',
  other: null,
};

/** "Cintura" prioriza antirrotação e antiextensão (seção 9.2). */
const WAIST_CORE = ['pallof-press', 'dead-bug', 'plank', 'side-plank'];

/** Metas semanais de séries difíceis (seção 9.2). */
export function volumeTargets(input: Pick<PlanInput, 'experience' | 'priorities'>): PlanTargets {
  const beginner = input.experience === 'beginner';
  return {
    glutes: beginner ? { min: 10, max: 14 } : { min: 12, max: 20 },
    quads: { min: 10, max: 14 },
    hamstrings: { min: 8, max: 10 },
    back: { min: 6, max: 10 },
    chest: { min: 6, max: 10 },
    shoulders: input.priorities.includes('narrowShoulders') ? { min: 0, max: 4 } : { min: 4, max: 8 },
    arms: { min: 4, max: 8 },
    core: { min: 4, max: 6 },
  };
}

/** Quanto de glúteo o gerador procura alcançar por semana. */
export function gluteAim(input: Pick<PlanInput, 'experience' | 'goal' | 'priorities'>): number {
  if (input.experience === 'beginner') return 10;
  return input.goal === 'feminineShape' || input.priorities.includes('glutes') ? 16 : 14;
}

const entriesOf = (items: readonly PlannedExercise[]) =>
  items.flatMap((i) => {
    const exercise = findExercise(i.exerciseId);
    return exercise ? [{ exercise, sets: i.sets }] : [];
  });

/** Volume semanal do plano: cada dia vale `daysPerWeek / número de dias` vezes por semana (rodízio). */
export function weeklyVolume(days: readonly { exercises: readonly PlannedExercise[] }[], daysPerWeek: number): GroupVolume {
  const perDay = days.length ? daysPerWeek / days.length : 0;
  const total = volumeByGroup(days.flatMap((d) => entriesOf(d.exercises)));
  return Object.fromEntries(Object.entries(total).map(([g, v]) => [g, Math.round(v * perDay * 2) / 2])) as GroupVolume;
}

/** Avisos (sem bloquear, seção 9.2): glúteos abaixo da meta ou um grupo que sumiu. */
export function planWarnings(
  days: readonly { exercises: readonly PlannedExercise[] }[],
  daysPerWeek: number,
  targets: PlanTargets,
  ignoreMissing = false,
): PlanWarning[] {
  const volume = weeklyVolume(days, daysPerWeek);
  const warnings: PlanWarning[] = [];
  const glutes = targets.glutes;
  if (glutes && volume.glutes < glutes.min) warnings.push({ kind: 'glutesLow', sets: volume.glutes, min: glutes.min });
  if (!ignoreMissing) {
    for (const [group, target] of Object.entries(targets) as [VolumeGroup, { min: number }][]) {
      if (target.min > 0 && volume[group] === 0) warnings.push({ kind: 'groupMissing', group });
    }
  }
  return warnings;
}

type Built = { item: PlannedExercise; exercise: Exercise; slot: Slot };

const isGlutePrimary = (e: Exercise) => e.primary.some((m) => m === 'gluteMax' || m === 'gluteMed');

function slotSets(slot: Slot, input: PlanInput, exercise: Exercise): number {
  const p = input.priorities;
  let sets = slot.sets;
  if (p.includes('posture') && slot.role === 'rearDelt') sets++;
  if (p.includes('firmArms') && (slot.role === 'biceps' || slot.role === 'triceps')) sets++;
  if (p.includes('legs') && (slot.role === 'squat' || slot.role === 'hamCurl')) sets++;
  if (input.goal === 'gainMass' && exercise.compound) sets++;
  if (p.includes('narrowShoulders') && slot.role === 'vPush') sets = Math.min(sets, 2);
  if (input.experience === 'beginner') sets = Math.min(sets, 3);
  return Math.min(sets, MAX_SETS);
}

function candidatesFor(slot: Slot, input: PlanInput): string[] {
  const list = (input.experience === 'beginner' && slot.beginner) || slot.candidates;
  if (slot.role === 'core' && input.priorities.includes('waist')) {
    return [...list].sort((a, b) => WAIST_CORE.indexOf(a) - WAIST_CORE.indexOf(b));
  }
  return list;
}

function pickExercise(slot: Slot, input: PlanInput, avoid: Restriction[], used: Set<string>): Exercise | null {
  const ok = (e: Exercise | undefined): e is Exercise =>
    e != null &&
    !used.has(e.id) &&
    !e.restrictions.some((r) => avoid.includes(r)) &&
    !(input.experience === 'beginner' && e.level === 'advanced');
  const candidates = candidatesFor(slot, input).map(findExercise);
  const direct = candidates.find(ok);
  if (direct) return direct;
  for (const c of candidates) {
    const sub = c ? substitutesOf(c, avoid).find(ok) : undefined;
    if (sub) return sub;
  }
  return null;
}

function buildDay(key: DayKey, input: PlanInput, avoid: Restriction[]): Built[] {
  const used = new Set<string>();
  const built: Built[] = [];
  for (const slot of DAY_TEMPLATES[key]) {
    if (slot.role === 'lateral' && input.priorities.includes('narrowShoulders')) continue;
    const exercise = pickExercise(slot, input, avoid, used);
    if (!exercise) continue;
    used.add(exercise.id);
    built.push({ item: plannedFrom(exercise, slotSets(slot, input, exercise), input.restOverride), exercise, slot });
  }
  return built;
}

/** Sobe séries de glúteo (elevação pélvica primeiro) até a meta da semana. */
function balanceGlutes(days: Built[][], input: PlanInput) {
  const aim = gluteAim(input);
  const perDay = input.daysPerWeek / days.length;
  const glute = days.flat().filter((b) => isGlutePrimary(b.exercise));
  const weekly = () => weeklyVolume(days.map((d) => ({ exercises: d.map((b) => b.item) })), input.daysPerWeek).glutes;
  let guard = 50;
  while (weekly() + perDay / 2 <= aim && guard-- > 0) {
    const next = [...glute]
      .filter((b) => b.item.sets < MAX_SETS)
      .sort((a, b) => a.item.sets - b.item.sets || b.slot.priority - a.slot.priority)[0];
    if (!next) break;
    next.item = { ...next.item, sets: next.item.sets + 1 };
  }
}

/** Corta séries (isoladores primeiro, glúteo por último) até o dia caber no tempo escolhido. */
function fitTime(day: Built[], minutes: number): Built[] {
  let list = [...day];
  const duration = () => estimateMinutes(list.map((b) => b.item), findExercise);
  const byPriority = (a: Built, b: Built) =>
    Number(isGlutePrimary(a.exercise)) - Number(isGlutePrimary(b.exercise)) || a.slot.priority - b.slot.priority;
  let guard = 100;
  while (duration() > minutes && guard-- > 0) {
    const iso = list.filter((b) => !b.exercise.compound).sort(byPriority);
    const reducible = iso.find((b) => b.item.sets > 1);
    if (reducible) {
      reducible.item = { ...reducible.item, sets: reducible.item.sets - 1 };
      continue;
    }
    if (iso.length) {
      list = list.filter((b) => b !== iso[0]);
      continue;
    }
    const compound = list.filter((b) => b.item.sets > 2).sort(byPriority)[0];
    if (!compound) break;
    compound.item = { ...compound.item, sets: compound.item.sets - 1 };
  }
  return list;
}

export function avoidList(limitations: readonly Limitation[], recoveryAvoid: readonly Restriction[]): Restriction[] {
  const fromLimits = limitations.map((l) => LIMITATION_RESTRICTIONS[l]).filter((r): r is Restriction => r != null);
  return [...new Set([...fromLimits, ...recoveryAvoid])];
}

export function generatePlan(input: PlanInput): GeneratedPlan {
  const template = chooseTemplate(input.daysPerWeek, input.experience === 'beginner');
  const avoid = avoidList(input.limitations, input.recoveryAvoid);
  const keys = TEMPLATE_DAYS[template];
  const built = keys.map((key) => buildDay(key, input, avoid));
  balanceGlutes(built, input);
  const fitted = built.map((day) => fitTime(day, input.sessionMinutes));

  const days: GeneratedDay[] = keys.map((key, i) => ({
    key,
    name: strings.plan.dayNames[key],
    exercises: fitted[i].map((b) => b.item),
    note: key === 'gluteCardio' ? strings.plan.cardioNote : null,
  }));
  const targets = volumeTargets(input);
  return { template, targets, days, warnings: planWarnings(days, input.daysPerWeek, targets, input.recoveryAvoid.length > 0) };
}
