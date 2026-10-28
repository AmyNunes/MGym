import type { MealSlotRecord } from '@/db/mealsRepo';

import { nextMeal } from '../nextMeal';

const slot = (id: string, time: string, eaten = false): MealSlotRecord => ({
  id,
  mealPlanId: 'p',
  date: '2026-10-26',
  slot: 'lunch',
  time,
  options: [],
  chosenIndex: null,
  eatenAt: eaten ? '2026-10-26T12:00:00.000Z' : null,
});

const slots = [slot('cafe', '07:30', true), slot('almoco', '12:30'), slot('lanche', '16:00'), slot('ceia', '23:30')];

describe('próxima refeição', () => {
  it('a primeira não marcada que ainda não passou', () => {
    expect(nextMeal(slots, new Date(2026, 9, 26, 10))?.id).toBe('almoco');
    expect(nextMeal(slots, new Date(2026, 9, 26, 13, 30))?.id).toBe('almoco');
  });

  it('refeição esquecida fica para trás, sem cobrança', () => {
    expect(nextMeal(slots, new Date(2026, 9, 26, 14, 30))?.id).toBe('lanche');
  });

  it('depois da meia-noite ainda é o mesmo dia (vira às 4h)', () => {
    expect(nextMeal(slots, new Date(2026, 9, 27, 0, 30))?.id).toBe('ceia');
    expect(nextMeal(slots, new Date(2026, 9, 27, 2))).toBeNull();
  });
});
