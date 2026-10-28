import { create } from 'zustand';

import { insertRecords, type PersonalRecord } from '@/db/recordsRepo';
import {
  deleteSet as deleteSetRow,
  deleteWorkoutExercise,
  getActiveWorkout,
  historySetsFor,
  insertSet,
  insertWorkoutExercise,
  insertWorkoutTree,
  lastSetsFor,
  updateSet as updateSetRow,
  updateWorkout,
  updateWorkoutExercise,
  type HistorySet,
} from '@/db/workoutsRepo';
import { stepFor, trainingPrefs } from '@/features/workout/prefs';
import { moveItem } from '@/lib/arrays';
import { nowIso } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { findExercise } from '@/training/catalog';
import { plannedFrom } from '@/training/planned';
import { bestsOf, epley, recordsInWorkout, type RecordKind } from '@/training/records';
import { suggestNext, type PastSession, type Suggestion } from '@/training/progression';
import { isFirstCompoundOfGroup, warmupLoads } from '@/training/schedule';
import { nextSet, prefillSets } from '@/training/session';
import {
  isDone,
  isHardSet,
  type PlannedExercise,
  type Workout,
  type WorkoutExercise,
  type WorkoutSet,
} from '@/training/workoutModel';

/**
 * Treino em andamento (seção 9.5). Cada toque muda a memória na hora (resposta em < 100 ms)
 * e entra numa fila que grava no banco em ordem: "nunca perder nada".
 */

/** O que o app já sabe de cada exercício: as séries da última vez e o histórico (recordes e progressão). */
export type ExerciseContext = { previous: WorkoutSet[]; history: HistorySet[] };

/** Os treinos anteriores do exercício, do mais antigo ao mais novo (para a progressão). */
function sessionsOf(history: readonly HistorySet[]): PastSession[] {
  const byWorkout = new Map<string, HistorySet[]>();
  for (const s of history) byWorkout.set(s.workoutId, [...(byWorkout.get(s.workoutId) ?? []), s]);
  return [...byWorkout.values()].map((sets) => ({ sets }));
}

/** A sugestão de carga para este exercício hoje (seção 9.4). */
export function suggestionFor(
  item: Pick<WorkoutExercise, 'exerciseId' | 'repMin' | 'repMax'>,
  ctx: ExerciseContext | undefined,
): Suggestion | null {
  const exercise = findExercise(item.exerciseId);
  if (!exercise || !ctx) return null;
  const range = { repMin: item.repMin ?? exercise.repMin, repMax: item.repMax ?? exercise.repMax };
  return suggestNext(sessionsOf(ctx.history), exercise, range, stepFor(exercise));
}

type State = {
  workout: Workout | null;
  context: Record<string, ExerciseContext>;
  /** Recordes batidos neste treino, por id da série. */
  records: Record<string, RecordKind[]>;
  /** O último treino terminado ou descartado (a tela do treino some sem piscar "não encontrado"). */
  endedId: string | null;
  /** Aviso do começo (semanas 1–2, semana leve, dia leve). Só na memória. */
  intro: string | null;
};

export const useWorkout = create<State>()(() => ({ workout: null, context: {}, records: {}, endedId: null, intro: null }));

let queue: Promise<void> = Promise.resolve();
function persist(task: () => Promise<void>) {
  queue = queue.then(task).catch(() => {});
}
/** Espera as gravações pendentes (antes de terminar o treino e nos testes). */
export const flushWorkoutWrites = () => queue;

const get = () => useWorkout.getState();

async function loadContext(exerciseId: string, workoutId: string): Promise<ExerciseContext> {
  const [last, history] = await Promise.all([lastSetsFor(exerciseId, workoutId), historySetsFor(exerciseId, workoutId)]);
  return { previous: (last?.sets ?? []).filter(isHardSet), history };
}

async function loadContexts(exerciseIds: string[], workoutId: string, base: Record<string, ExerciseContext> = {}) {
  const missing = [...new Set(exerciseIds)].filter((id) => !base[id]);
  const loaded = await Promise.all(missing.map((id) => loadContext(id, workoutId)));
  return { ...base, ...Object.fromEntries(missing.map((id, i) => [id, loaded[i]])) };
}

const repMinOf = (e: WorkoutExercise) => e.repMin ?? findExercise(e.exerciseId)?.repMin ?? 1;

/** Recordes de um exercício neste treino (só exercícios com carga). */
function recordsOf(e: WorkoutExercise, ctx: ExerciseContext | undefined): Map<string, RecordKind[]> {
  if (!ctx || findExercise(e.exerciseId)?.tracking !== 'load') return new Map();
  const repMin = repMinOf(e);
  return recordsInWorkout(e.sets.filter(isDone), bestsOf(ctx.history, repMin), repMin);
}

function recomputeRecords(workout: Workout, context: Record<string, ExerciseContext>) {
  const all: Record<string, RecordKind[]> = {};
  for (const e of workout.exercises) {
    for (const [setId, kinds] of recordsOf(e, context[e.exerciseId])) all[setId] = kinds;
  }
  return all;
}

function commit(workout: Workout, context = get().context) {
  useWorkout.setState({ workout, context, records: recomputeRecords(workout, context) });
}

function buildExercise(workoutId: string, item: PlannedExercise, position: number, ctx: ExerciseContext): WorkoutExercise {
  const suggestion = suggestionFor(item, ctx);
  const sets = prefillSets(item.sets, ctx.previous, newId).map((s) =>
    suggestion?.weightKg != null
      ? { ...s, weightKg: suggestion.weightKg, reps: suggestion.trend === 'same' ? s.reps : suggestion.reps }
      : s,
  );
  return {
    id: newId(),
    workoutId,
    exerciseId: item.exerciseId,
    position,
    notes: null,
    restSec: item.restSec,
    repMin: item.repMin,
    repMax: item.repMax,
    sets,
  };
}

/** As 3 séries de aproximação (seção 9.3) antes das séries de trabalho; devolve as séries renumeradas. */
function withWarmup(e: WorkoutExercise): WorkoutExercise | null {
  const exercise = findExercise(e.exerciseId);
  const work = e.sets.find((s) => s.kind !== 'warmup')?.weightKg;
  if (!exercise || !work || e.sets.some((s) => s.kind === 'warmup')) return null;
  const warmups: WorkoutSet[] = warmupLoads(work, stepFor(exercise)).map((w) => ({
    id: newId(),
    position: 0,
    kind: 'warmup',
    weightKg: w.weightKg,
    reps: w.reps,
    rir: null,
    completedAt: null,
  }));
  return { ...e, sets: [...warmups, ...e.sets].map((s, position) => ({ ...s, position })) };
}

const findEx = (weId: string) => get().workout?.exercises.find((e) => e.id === weId);

function mapExercise(weId: string, fn: (e: WorkoutExercise) => WorkoutExercise) {
  const w = get().workout;
  if (!w) return;
  commit({ ...w, exercises: w.exercises.map((e) => (e.id === weId ? fn(e) : e)) });
}

function renumber(exercises: WorkoutExercise[]): WorkoutExercise[] {
  return exercises.map((e, position) => ({ ...e, position }));
}

function persistPositions(exercises: WorkoutExercise[]) {
  persist(async () => {
    for (const e of exercises) await updateWorkoutExercise(e.id, { position: e.position });
  });
}

// ——— Começar, continuar ———

export type StartInput = {
  name: string;
  items: PlannedExercise[];
  intro?: string | null;
  routineId?: string | null;
  planDayId?: string | null;
};

/** Começa um treino (com as séries já preenchidas). Se já houver um em andamento, devolve ele. */
export async function startWorkout(input: StartInput): Promise<string> {
  const active = get().workout ?? (await getActiveWorkout());
  if (active) {
    if (!get().workout) await resumeWorkout();
    return active.id;
  }
  const id = newId();
  const context = await loadContexts(
    input.items.map((i) => i.exerciseId),
    id,
  );
  const workout: Workout = {
    id,
    planDayId: input.planDayId ?? null,
    routineId: input.routineId ?? null,
    name: input.name,
    startedAt: nowIso(),
    endedAt: null,
    status: 'active',
    notes: null,
    feeling: null,
    pain: null,
    warmupDone: false,
    exercises: input.items.map((item, i) => buildExercise(id, item, i, context[item.exerciseId])),
  };
  if (trainingPrefs().autoWarmup) {
    workout.exercises = workout.exercises.map((e, i) =>
      isFirstCompoundOfGroup(workout, i, findExercise) ? (withWarmup(e) ?? e) : e,
    );
  }
  commit(workout, context);
  useWorkout.setState({ intro: input.intro ?? null });
  persist(() => insertWorkoutTree(workout));
  await flushWorkoutWrites();
  return id;
}

/** Volta para o treino em andamento (ex.: o app fechou no meio). Devolve o id ou `null`. */
export async function resumeWorkout(): Promise<string | null> {
  const current = get().workout;
  if (current) return current.id;
  const workout = await getActiveWorkout();
  if (!workout) return null;
  const context = await loadContexts(
    workout.exercises.map((e) => e.exerciseId),
    workout.id,
  );
  commit(workout, context);
  return workout.id;
}

// ——— Exercícios ———

export async function addExercises(exerciseIds: string[]) {
  const w = get().workout;
  if (!w) return;
  const context = await loadContexts(exerciseIds, w.id, get().context);
  const latest = get().workout ?? w;
  const added = exerciseIds.flatMap((exerciseId, i) => {
    const exercise = findExercise(exerciseId);
    if (!exercise) return [];
    const planned = plannedFrom(exercise, undefined, trainingPrefs().restOverride);
    return [buildExercise(w.id, planned, latest.exercises.length + i, context[exerciseId])];
  });
  commit({ ...latest, exercises: [...latest.exercises, ...added] }, context);
  persist(async () => {
    for (const e of added) {
      await insertWorkoutExercise(e);
      for (const s of e.sets) await insertSet(e.id, s);
    }
  });
}

/** Tira um exercício e devolve como estava (para o "Desfazer"). */
export function removeExercise(weId: string): { exercise: WorkoutExercise; index: number } | null {
  const w = get().workout;
  const index = w?.exercises.findIndex((e) => e.id === weId) ?? -1;
  if (!w || index < 0) return null;
  const exercise = w.exercises[index];
  const exercises = renumber(w.exercises.filter((e) => e.id !== weId));
  commit({ ...w, exercises });
  persist(() => deleteWorkoutExercise(weId));
  persistPositions(exercises);
  return { exercise, index };
}

export function restoreExercise(exercise: WorkoutExercise, index: number) {
  const w = get().workout;
  if (!w) return;
  const exercises = renumber([...w.exercises.slice(0, index), exercise, ...w.exercises.slice(index)]);
  commit({ ...w, exercises });
  persist(async () => {
    await insertWorkoutExercise({ ...exercise, position: index });
    for (const s of exercise.sets) await insertSet(exercise.id, s);
  });
  persistPositions(exercises);
}

export function moveExercise(from: number, to: number) {
  const w = get().workout;
  if (!w || from === to) return;
  const exercises = renumber(moveItem(w.exercises, from, to));
  commit({ ...w, exercises });
  persistPositions(exercises);
}

/** Troca o exercício por outro (mantém o número de séries; os valores vêm da última vez do novo). */
export async function replaceExercise(weId: string, newExerciseId: string) {
  const w = get().workout;
  const exercise = findExercise(newExerciseId);
  const current = findEx(weId);
  if (!w || !exercise || !current) return;
  const context = await loadContexts([newExerciseId], w.id, get().context);
  const planned = plannedFrom(exercise, Math.max(1, current.sets.length), trainingPrefs().restOverride);
  const sets = prefillSets(planned.sets, context[newExerciseId].previous, newId);
  const replaced: WorkoutExercise = {
    ...current,
    exerciseId: newExerciseId,
    restSec: planned.restSec,
    repMin: planned.repMin,
    repMax: planned.repMax,
    sets,
  };
  const latest = get().workout ?? w;
  commit({ ...latest, exercises: latest.exercises.map((e) => (e.id === weId ? replaced : e)) }, context);
  persist(async () => {
    await updateWorkoutExercise(weId, {
      exerciseId: newExerciseId,
      restSec: replaced.restSec,
      repMin: replaced.repMin,
      repMax: replaced.repMax,
    });
    for (const s of current.sets) await deleteSetRow(s.id);
    for (const s of sets) await insertSet(weId, s);
  });
}

export function setExerciseNotes(weId: string, notes: string) {
  mapExercise(weId, (e) => ({ ...e, notes: notes || null }));
  persist(() => updateWorkoutExercise(weId, { notes: notes || null }));
}

/** "Séries de aproximação" em um toque (seção 9.3). */
export function addWarmupSets(weId: string) {
  const e = findEx(weId);
  const next = e && withWarmup(e);
  if (!next) return;
  mapExercise(weId, () => next);
  persist(async () => {
    for (const s of next.sets) {
      if (e.sets.some((old) => old.id === s.id)) await updateSetRow(s.id, { position: s.position });
      else await insertSet(weId, s);
    }
  });
}

/** Card "5–10 min de cardio leve e mobilidade" feito (seção 9.3). */
export function setWarmupDone(done: boolean) {
  const w = get().workout;
  if (!w) return;
  commit({ ...w, warmupDone: done });
  persist(() => updateWorkout(w.id, { warmupDone: done }));
}

export function setWorkoutNotes(notes: string) {
  const w = get().workout;
  if (!w) return;
  commit({ ...w, notes: notes || null });
  persist(() => updateWorkout(w.id, { notes: notes || null }));
}

// ——— Séries ———

export function addSet(weId: string) {
  const e = findEx(weId);
  if (!e) return;
  const set = nextSet(e.sets, newId);
  mapExercise(weId, (ex) => ({ ...ex, sets: [...ex.sets, set] }));
  persist(() => insertSet(weId, set));
}

export function updateSet(weId: string, setId: string, patch: Partial<Pick<WorkoutSet, 'weightKg' | 'reps' | 'kind' | 'rir'>>) {
  mapExercise(weId, (e) => ({ ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }));
  persist(() => updateSetRow(setId, patch));
}

/** Marca (ou desmarca) a série. Devolve se ficou feita e os recordes que ela bateu. */
export function toggleSet(weId: string, setId: string): { completed: boolean; records: RecordKind[] } {
  const set = findEx(weId)?.sets.find((s) => s.id === setId);
  if (!set) return { completed: false, records: [] };
  const completedAt = set.completedAt ? null : nowIso();
  mapExercise(weId, (e) => ({ ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, completedAt } : s)) }));
  persist(() => updateSetRow(setId, { completedAt }));
  return { completed: completedAt != null, records: completedAt ? (get().records[setId] ?? []) : [] };
}

/** Exclui a série e devolve como estava (para o "Desfazer"). */
export function deleteSet(weId: string, setId: string): { set: WorkoutSet; index: number } | null {
  const e = findEx(weId);
  const index = e?.sets.findIndex((s) => s.id === setId) ?? -1;
  if (!e || index < 0) return null;
  const set = e.sets[index];
  mapExercise(weId, (ex) => ({ ...ex, sets: ex.sets.filter((s) => s.id !== setId) }));
  persist(() => deleteSetRow(setId));
  return { set, index };
}

export function restoreSet(weId: string, set: WorkoutSet, index: number) {
  mapExercise(weId, (e) => ({ ...e, sets: [...e.sets.slice(0, index), set, ...e.sets.slice(index)] }));
  persist(() => insertSet(weId, set));
}

/** "Igual à anterior": copia a série de cima (ou, na primeira, a da última vez). */
export function copyPreviousSet(weId: string, setId: string) {
  const e = findEx(weId);
  if (!e) return;
  const index = e.sets.findIndex((s) => s.id === setId);
  const source = index > 0 ? e.sets[index - 1] : get().context[e.exerciseId]?.previous[0];
  if (!source) return;
  updateSet(weId, setId, { weightKg: source.weightKg, reps: source.reps });
}

// ——— Terminar ———

/** Termina o treino: séries não marcadas saem, os recordes são gravados. Devolve o id. */
export async function finishWorkout(): Promise<string | null> {
  const { workout, context } = get();
  if (!workout) return null;
  const endedAt = nowIso();

  const pendingSets = workout.exercises.flatMap((e) => e.sets.filter((s) => !isDone(s)).map((s) => s.id));
  const kept = renumber(
    workout.exercises.map((e) => ({ ...e, sets: e.sets.filter(isDone) })).filter((e) => e.sets.length > 0),
  );
  const emptyExercises = workout.exercises.filter((e) => !kept.some((k) => k.id === e.id)).map((e) => e.id);

  const records: Omit<PersonalRecord, 'id'>[] = [];
  for (const e of kept) {
    for (const [setId, kinds] of recordsOf(e, context[e.exerciseId])) {
      const s = e.sets.find((x) => x.id === setId);
      if (!s || s.weightKg == null || s.reps == null) continue;
      for (const kind of kinds) {
        records.push({
          exerciseId: e.exerciseId,
          kind,
          value: kind === 'weight' ? s.weightKg : epley(s.weightKg, s.reps),
          weightKg: s.weightKg,
          reps: s.reps,
          setId,
          workoutId: workout.id,
          achievedAt: s.completedAt ?? endedAt,
        });
      }
    }
  }

  persist(async () => {
    for (const id of pendingSets) await deleteSetRow(id);
    for (const id of emptyExercises) await deleteWorkoutExercise(id);
    for (const e of kept) await updateWorkoutExercise(e.id, { position: e.position });
    await updateWorkout(workout.id, { status: 'done', endedAt });
    await insertRecords(records);
  });
  await flushWorkoutWrites();
  useWorkout.setState({ workout: null, context: {}, records: {}, endedId: workout.id });
  return workout.id;
}

/** Descarta o treino em andamento (não entra no histórico). */
export async function discardWorkout() {
  const workout = get().workout;
  if (!workout) return;
  persist(() => updateWorkout(workout.id, { status: 'discarded', endedAt: nowIso() }));
  await flushWorkoutWrites();
  useWorkout.setState({ workout: null, context: {}, records: {}, endedId: workout.id });
}
