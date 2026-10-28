import { strings } from '@/i18n/strings';

import { isInQuietHours, planNotifications, type PlanInput } from '../plan';
import { notificationSettingsSchema } from '../types';

const settings = notificationSettingsSchema.parse({});
// Segunda, 26/10/2026, 6h.
const now = new Date(2026, 9, 26, 6, 0);

const base: PlanInput = {
  now,
  settings,
  preferredTime: '18:00',
  trainingWeekdays: [1, 3, 5],
  planDays: [
    { id: 'a', name: 'Inferior A', minutes: 55 },
    { id: 'b', name: 'Superior', minutes: 50 },
  ],
  nextPlanIndex: 0,
  trainedToday: false,
  meals: {},
  lastMeasurementAt: '2026-10-20T10:00:00.000Z',
  week: { workouts: 2, record: 'Hip thrust' },
};

describe('planejador de notificações', () => {
  it('dia de treino: 1 h antes do horário preferido, com o dia do plano em rodízio e o link para começar', () => {
    const training = planNotifications(base).filter((n) => n.type === 'training');
    expect(training.map((n) => [n.at.getDate(), n.at.getHours(), n.body, n.url])).toEqual([
      [26, 17, 'Hoje é dia de Inferior A (~55 min).', '/session/start?day=a'],
      [28, 17, 'Hoje é dia de Superior (~50 min).', '/session/start?day=b'],
      [30, 17, 'Hoje é dia de Inferior A (~55 min).', '/session/start?day=a'],
    ]);
  });

  it('treinou hoje: o lembrete de hoje some; sem horário preferido, não há lembrete de treino', () => {
    expect(planNotifications({ ...base, trainedToday: true }).filter((n) => n.type === 'training')).toHaveLength(2);
    expect(planNotifications({ ...base, preferredTime: null }).some((n) => n.type === 'training')).toBe(false);
  });

  it('padrões: pesagem na segunda, medidas a cada 14 dias, check-in no domingo às 18h; refeições desligadas', () => {
    const plan = planNotifications(base);
    expect(plan.filter((n) => n.type === 'weighIn').map((n) => n.at.getDate())).toEqual([26]);
    // Última medida em 20/10: a próxima é em 3/11, fora dos 7 dias.
    expect(plan.filter((n) => n.type === 'measurements')).toEqual([]);
    expect(plan.filter((n) => n.type === 'checkin').map((n) => [n.at.getDate(), n.at.getHours()])).toEqual([[1, 18]]);
    expect(plan.some((n) => n.type === 'meals')).toBe(false);
  });

  it('medidas vencidas há tempo: aviso hoje', () => {
    const plan = planNotifications({ ...base, lastMeasurementAt: '2026-09-01T10:00:00.000Z' });
    expect(plan.filter((n) => n.type === 'measurements').map((n) => n.at.getDate())).toEqual([26]);
  });

  it('refeições ligadas: as duas primeiras opções no texto; refeição já marcada não avisa', () => {
    const plan = planNotifications({
      ...base,
      settings: { ...settings, meals: { enabled: true }, maxPerDay: 10 },
      meals: {
        '2026-10-26': [
          { slotName: 'Lanche da tarde', time: '16:00', options: ['Iogurte com aveia', 'Pão com ovo'], eaten: false },
          { slotName: 'Almoço', time: '12:30', options: ['PF'], eaten: true },
        ],
      },
    });
    const meals = plan.filter((n) => n.type === 'meals');
    expect(meals.map((n) => [n.title, n.body])).toEqual([['Lanche da tarde', 'Iogurte com aveia ou Pão com ovo?']]);
  });

  it('silêncio, máximo por dia (pela prioridade), pausa e texto discreto', () => {
    expect(isInQuietHours(new Date(2026, 9, 26, 23), settings.quiet)).toBe(true);
    expect(isInQuietHours(new Date(2026, 9, 26, 6, 30), settings.quiet)).toBe(true);
    expect(isInQuietHours(new Date(2026, 9, 26, 7), settings.quiet)).toBe(false);

    const one = planNotifications({ ...base, settings: { ...settings, maxPerDay: 1 } });
    // Segunda: treino (17h) ganha da pesagem (7h30) pela prioridade.
    expect(one.filter((n) => n.at.getDate() === 26).map((n) => n.type)).toEqual(['training']);

    expect(planNotifications({ ...base, settings: { ...settings, pausedForever: true } })).toEqual([]);
    const discreet = planNotifications({ ...base, settings: { ...settings, discreet: true } });
    expect(discreet.every((n) => n.title === strings.notifications.content.discreet.title)).toBe(true);
    expect(discreet.some((n) => /peso|treino|Inferior/i.test(n.body))).toBe(false);
  });
});
