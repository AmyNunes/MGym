import { getDb } from './client';

/** Histórico da Central (seção 13): o que foi agendado e se abri. */
export type NotificationLog = { id: string; type: string; scheduledFor: string; notificationId: string | null; openedAt: string | null };

export async function insertNotificationLog(log: NotificationLog): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO notification_log (id, type, scheduledFor, notificationId, openedAt) VALUES (?, ?, ?, ?, ?)',
    log.id,
    log.type,
    log.scheduledFor,
    log.notificationId,
    log.openedAt,
  );
}

/** Ao reagendar, os avisos futuros saem do histórico (só fica o que já foi mostrado). */
export async function deleteFutureNotificationLogs(afterIso: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notification_log WHERE scheduledFor > ?', afterIso);
}

export async function markNotificationOpened(id: string, at: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE notification_log SET openedAt = ? WHERE id = ? AND openedAt IS NULL', at, id);
}

/** Os últimos avisos já mostrados, do mais novo ao mais velho. */
export async function recentNotificationLogs(beforeIso: string, limit = 30): Promise<NotificationLog[]> {
  const db = await getDb();
  return db.getAllAsync<NotificationLog>(
    'SELECT * FROM notification_log WHERE scheduledFor <= ? ORDER BY scheduledFor DESC LIMIT ?',
    beforeIso,
    limit,
  );
}
