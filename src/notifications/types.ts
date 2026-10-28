import { z } from 'zod';

/**
 * Central de Notificações (seção 13): os lembretes agendados, na ordem padrão de prioridade.
 * O fim do descanso é à parte (agendado na hora, pelo treino em andamento).
 */
export const NOTIFICATION_TYPES = ['training', 'checkin', 'weighIn', 'measurements', 'meals'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const time = z.string().regex(/^\d{2}:\d{2}$/);
const weekday = z.number().int().min(0).max(6);

const defaults = {
  enabled: true,
  pausedUntil: null,
  pausedForever: false,
  quiet: { enabled: true, start: '22:00', end: '07:00' },
  maxPerDay: 3,
  order: [...NOTIFICATION_TYPES],
  discreet: false,
  rest: { enabled: true },
  training: { enabled: true, leadMinutes: 60 },
  meals: { enabled: false },
  weighIn: { enabled: true, frequency: 'weekly' as const, weekday: 1, time: '07:30' },
  measurements: { enabled: true, everyDays: 14, time: '08:00' },
  checkin: { enabled: true, weekday: 0, time: '18:00' },
};

const settingsObject = z.object({
  /** Interruptor mestre. */
  enabled: z.boolean().catch(defaults.enabled),
  /** Pausar até esta data (ISO). */
  pausedUntil: z.string().nullable().catch(null),
  /** "Até eu voltar". */
  pausedForever: z.boolean().catch(false),
  /** Silêncio (pode atravessar a meia-noite). */
  quiet: z.object({ enabled: z.boolean(), start: time, end: time }).catch(defaults.quiet),
  maxPerDay: z.number().int().min(1).max(10).catch(defaults.maxPerDay),
  /** Prioridade: quando passar do limite do dia, ficam os primeiros. */
  order: z.array(z.enum(NOTIFICATION_TYPES)).catch(defaults.order),
  /** "Texto discreto": não cita corpo, peso nem objetivo. */
  discreet: z.boolean().catch(false),
  rest: z.object({ enabled: z.boolean() }).catch(defaults.rest),
  /** Dia de treino: tanto tempo antes do horário preferido (pergunta 10). */
  training: z.object({ enabled: z.boolean(), leadMinutes: z.number().int().min(0).max(240) }).catch(defaults.training),
  meals: z.object({ enabled: z.boolean() }).catch(defaults.meals),
  weighIn: z
    .object({ enabled: z.boolean(), frequency: z.enum(['weekly', 'daily']), weekday, time })
    .catch(defaults.weighIn),
  measurements: z.object({ enabled: z.boolean(), everyDays: z.number().int().min(7).max(28), time }).catch(defaults.measurements),
  checkin: z.object({ enabled: z.boolean(), weekday, time }).catch(defaults.checkin),
});

export const notificationSettingsSchema = settingsObject.catch(() => settingsObject.parse({}));
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

/** Garante que a ordem tenha todos os tipos, sem repetir. */
export function normalizedOrder(order: readonly NotificationType[]): NotificationType[] {
  return [...new Set([...order, ...NOTIFICATION_TYPES])];
}

/** Destino (link interno, seção 6.3) de cada tipo. */
export function urlFor(type: NotificationType, planDayId?: string): string {
  switch (type) {
    case 'training':
      return planDayId ? `/session/start?day=${planDayId}` : '/workout';
    case 'meals':
      return '/meals';
    case 'weighIn':
      return '/quick-add?type=weight';
    case 'measurements':
      return '/quick-add?type=measurements';
    case 'checkin':
      return '/checkin';
  }
}
