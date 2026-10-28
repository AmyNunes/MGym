/**
 * Metas do dia (seção 10.1). Não existe equação validada para mulheres trans em terapia
 * hormonal: o app usa uma faixa entre as duas versões de Mifflin–St Jeor (diferença de 166 kcal)
 * e começa no meio, puxando para a feminina com mais tempo de estrogênio e para a masculina
 * sem terapia hormonal (proposta da pesquisa, PESQUISA 3.1).
 */

export type WeightGoal = 'maintain' | 'lose' | 'gain';

export type TargetInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  /** 'none' = não faz; 'estrogen' = qualquer esquema com estrogênio; null = não disse. */
  hrt: 'none' | 'estrogen' | null;
  hrtMonths: number | null;
  daysPerWeek: number;
  goal: WeightGoal;
  /** Sinais que bloqueiam o déficit (seção 16.4: IMC < 18,5, cintura/altura < 0,40, alerta ativo). */
  blockDeficit?: boolean;
};

export type DayTargets = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** O objetivo que valeu (perder vira manter quando o déficit está bloqueado). */
  goal: WeightGoal;
  bmr: number;
  tdee: number;
  /** A meta bateu no piso (1.500 kcal ou o metabolismo basal). */
  atFloor: boolean;
};

/** Diferença fixa entre as versões masculina e feminina de Mifflin–St Jeor. */
export const MIFFLIN_GAP = 166;
export const KCAL_FLOOR = 1500;
export const MAX_DEFICIT_KCAL = 500;
export const MAX_DEFICIT_SHARE = 0.2;
export const LOSE_SHARE = 0.15;
export const GAIN_SHARE = 0.075;
/** Gordura: 25–30% da energia (nunca abaixo de 20%). */
export const FAT_SHARE = 0.275;
export const FAT_MIN_SHARE = 0.2;
/** Proteína em g/kg: 1,6 (1,8 em déficit). */
export const PROTEIN_PER_KG = 1.6;
export const PROTEIN_PER_KG_DEFICIT = 1.8;
/** Meses de estrogênio para puxar de vez para a versão feminina. */
export const HRT_FULL_MONTHS = 24;

/** Mifflin–St Jeor feminina (a masculina é esta + 166). */
export function mifflinFemale(weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

/**
 * Onde ficar na faixa (0 = versão feminina, 1 = masculina).
 * Meio (0,5) por padrão; sem terapia hormonal, 0,75; com estrogênio, vai de 0,5 a 0,25 em 24 meses.
 */
export function rangePosition(hrt: TargetInput['hrt'], hrtMonths: number | null): number {
  if (hrt === 'none') return 0.75;
  if (hrt === 'estrogen') {
    const months = Math.max(0, Math.min(HRT_FULL_MONTHS, hrtMonths ?? 0));
    return 0.5 - 0.25 * (months / HRT_FULL_MONTHS);
  }
  return 0.5;
}

/** Fator de atividade (seção 10.1): 1,4 (2–3 dias) · 1,5 (4) · 1,6 (5). */
export function activityFactor(daysPerWeek: number): number {
  if (daysPerWeek >= 5) return 1.6;
  if (daysPerWeek === 4) return 1.5;
  return 1.4;
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Com IMC ≥ 30, a proteína é calculada sobre o peso de referência (IMC 25 para a altura). */
export function proteinWeight(weightKg: number, heightCm: number): number {
  if (bmi(weightKg, heightCm) < 30) return weightKg;
  const m = heightCm / 100;
  return 25 * m * m;
}

export function dayTargets(input: TargetInput): DayTargets {
  const female = mifflinFemale(input.weightKg, input.heightCm, input.age);
  const bmr = female + MIFFLIN_GAP * rangePosition(input.hrt, input.hrtMonths);
  const tdee = bmr * activityFactor(input.daysPerWeek);
  const goal: WeightGoal = input.goal === 'lose' && (input.blockDeficit || bmi(input.weightKg, input.heightCm) < 18.5) ? 'maintain' : input.goal;

  let kcal = tdee;
  if (goal === 'gain') kcal = tdee * (1 + GAIN_SHARE);
  if (goal === 'lose') kcal = tdee - Math.min(tdee * LOSE_SHARE, MAX_DEFICIT_KCAL, tdee * MAX_DEFICIT_SHARE);
  const floor = Math.max(KCAL_FLOOR, bmr);
  const atFloor = kcal < floor;
  kcal = Math.round(Math.max(kcal, floor));

  const perKg = goal === 'lose' ? PROTEIN_PER_KG_DEFICIT : PROTEIN_PER_KG;
  const protein = Math.round(perKg * proteinWeight(input.weightKg, input.heightCm));
  const fat = Math.round((kcal * Math.max(FAT_SHARE, FAT_MIN_SHARE)) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat, goal, bmr: Math.round(bmr), tdee: Math.round(tdee), atFloor };
}

/** Peso de cada refeição no dia (proposta): café 25%, almoço 30%, jantar 25%, lanches e ceia 10%. */
export const SLOT_WEIGHTS = {
  breakfast: 0.25,
  morningSnack: 0.1,
  lunch: 0.3,
  afternoonSnack: 0.1,
  dinner: 0.25,
  supper: 0.1,
} as const;
export type SlotKey = keyof typeof SLOT_WEIGHTS;

export type MacroTargets = { kcal: number; protein: number; carbs: number; fat: number };

/** Divide as metas do dia entre as refeições escolhidas, proporcionalmente aos pesos. */
export function splitTargets(day: MacroTargets, slots: readonly SlotKey[]): Record<string, MacroTargets> {
  const total = slots.reduce((s, k) => s + SLOT_WEIGHTS[k], 0) || 1;
  return Object.fromEntries(
    slots.map((k) => {
      const w = SLOT_WEIGHTS[k] / total;
      return [
        k,
        {
          kcal: Math.round(day.kcal * w),
          protein: Math.round(day.protein * w),
          carbs: Math.round(day.carbs * w),
          fat: Math.round(day.fat * w),
        },
      ];
    }),
  );
}

/** Refeições do dia pela quantidade escolhida no Guia (pergunta 16). */
export const SLOTS_BY_COUNT: Record<number, SlotKey[]> = {
  3: ['breakfast', 'lunch', 'dinner'],
  4: ['breakfast', 'lunch', 'afternoonSnack', 'dinner'],
  5: ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner'],
  6: ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'supper'],
};

/** Horários padrão (editáveis em Configurações › Alimentação). */
export const DEFAULT_MEAL_TIMES: Record<SlotKey, string> = {
  breakfast: '07:30',
  morningSnack: '10:00',
  lunch: '12:30',
  afternoonSnack: '16:00',
  dinner: '19:30',
  supper: '22:00',
};

/**
 * Aplica o ajuste da adaptação (10.1) às metas calculadas: a proteína fica, a gordura acompanha
 * a energia e os carboidratos ficam com o resto. Nunca abaixo do piso.
 */
export function withAdjustment(targets: DayTargets, delta: number): DayTargets {
  if (!delta) return targets;
  const floor = Math.max(KCAL_FLOOR, targets.bmr);
  const kcal = Math.round(Math.max(floor, targets.kcal + delta));
  const fat = Math.round((kcal * FAT_SHARE) / 9);
  const carbs = Math.max(0, Math.round((kcal - targets.protein * 4 - fat * 9) / 4));
  return { ...targets, kcal, fat, carbs, atFloor: targets.kcal + delta < floor };
}

/** O piso de energia (16.4): o maior entre 1.500 kcal e o metabolismo basal estimado. */
export const kcalFloor = (targets: Pick<DayTargets, 'bmr'>) => Math.max(KCAL_FLOOR, targets.bmr);
