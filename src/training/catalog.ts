import { EXERCISES } from '@/data/exercises';
import { matchesSearch } from '@/lib/text';

import type { Equipment, Exercise, ExerciseGroup, Level, Restriction } from './exerciseModel';

/** Catálogo (seção 9.1): busca por id, filtros e trocas. */

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function findExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

export const isCatalogId = (id: string) => BY_ID.has(id);

export type ExerciseFilters = {
  query: string;
  groups: ExerciseGroup[];
  equipment: Equipment[];
  levels: Level[];
  /** "Bom para glúteos": ênfase ★★ ou mais. */
  goodForGlutes: boolean;
  /** Tira os exercícios com estas restrições (minhas limitações, modo recuperação). */
  avoid: Restriction[];
};

export const EMPTY_FILTERS: ExerciseFilters = {
  query: '',
  groups: [],
  equipment: [],
  levels: [],
  goodForGlutes: false,
  avoid: [],
};

export const hasActiveFilters = (f: ExerciseFilters) =>
  f.groups.length > 0 || f.equipment.length > 0 || f.levels.length > 0 || f.goodForGlutes || f.avoid.length > 0;

export const GOOD_FOR_GLUTES = 2;

export function filterExercises(filters: ExerciseFilters, list: readonly Exercise[] = EXERCISES): Exercise[] {
  return list.filter(
    (e) =>
      matchesSearch(`${e.name} ${e.nameEn}`, filters.query) &&
      (!filters.groups.length || filters.groups.includes(e.group)) &&
      (!filters.equipment.length || e.equipment.some((q) => filters.equipment.includes(q))) &&
      (!filters.levels.length || filters.levels.includes(e.level)) &&
      (!filters.goodForGlutes || e.glute >= GOOD_FOR_GLUTES) &&
      !e.restrictions.some((r) => filters.avoid.includes(r)),
  );
}

/** Trocas de um exercício que existem no catálogo e não têm as restrições pedidas, na ordem de preferência. */
export function substitutesOf(exercise: Exercise, avoid: readonly Restriction[] = []): Exercise[] {
  return exercise.substitutes
    .map((id) => BY_ID.get(id))
    .filter((e): e is Exercise => e != null && !e.restrictions.some((r) => avoid.includes(r)));
}
