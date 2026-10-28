import { z } from 'zod';
import { create } from 'zustand';

import { readSetting, writeSetting } from '@/db/settingsRepo';
import { strings } from '@/i18n/strings';
import { parseJsonWith } from '@/lib/json';
import { cancelRestEnd, scheduleRestEnd } from '@/notifications/rest';
import { hideRestCountdown, showRestCountdown } from '@/notifications/restCountdown';
import { useSettings } from '@/stores/settingsStore';
import { adjustRest, type RestState } from '@/training/rest';

/** O descanso em andamento fica numa chave própria da tabela `settings` (sobrevive ao app fechado). */
const KEY = 'activeRest';

const restSchema = z
  .object({
    endsAt: z.number(),
    totalSec: z.number(),
    label: z.string(),
    body: z.string(),
    notificationId: z.string().nullable(),
  })
  .nullable();

type RestStore = { rest: RestState | null };

/** Descanso entre séries (seção 9.5): começa ao concluir a série, avisa no fim mesmo com a tela bloqueada. */
export const useRest = create<RestStore>()(() => ({ rest: null }));

/** Cada mudança ganha um número: uma notificação agendada "atrasada" é cancelada se o descanso já mudou. */
let version = 0;

function save(rest: RestState | null) {
  useRest.setState({ rest });
  void writeSetting(KEY, rest).catch(() => {});
  // Contagem regressiva ao vivo na notificação (módulo nativo, seção 2.2).
  if (rest && useSettings.getState().notifications.rest.enabled) {
    showRestCountdown(rest.endsAt, strings.notifications.countdownTitle, rest.label, strings.notifications.channels.restCountdown);
  } else {
    hideRestCountdown();
  }
}

async function schedule(rest: RestState) {
  const mine = ++version;
  save({ ...rest, notificationId: null });
  const id = await scheduleRestEnd(new Date(rest.endsAt), strings.notifications.restTitle, rest.body);
  if (mine !== version) {
    await cancelRestEnd(id);
    return;
  }
  save({ ...rest, notificationId: id });
}

/** Começa (ou recomeça) o descanso da próxima série. */
export async function startRest(totalSec: number, setNumber: number, exerciseName: string) {
  const old = useRest.getState().rest?.notificationId ?? null;
  const rest: RestState = {
    endsAt: Date.now() + totalSec * 1000,
    totalSec,
    label: strings.workout.rest.next(setNumber, exerciseName),
    body: strings.notifications.restBody(setNumber, exerciseName),
    notificationId: null,
  };
  const scheduled = schedule(rest);
  void cancelRestEnd(old);
  await scheduled;
}

/** −15 s / +15 s: reagenda a notificação. */
export async function adjustCurrentRest(deltaSec: number) {
  const current = useRest.getState().rest;
  if (!current) return;
  const next = adjustRest(current, deltaSec, Date.now());
  if (!next) {
    version++;
    save(null);
    await cancelRestEnd(current.notificationId);
    return;
  }
  const scheduled = schedule(next);
  void cancelRestEnd(current.notificationId);
  await scheduled;
}

/** "Pular" ou treino encerrado: cancela a notificação. */
export async function skipRest() {
  const current = useRest.getState().rest;
  version++;
  save(null);
  await cancelRestEnd(current?.notificationId ?? null);
}

/** O tempo acabou com o app aberto: a notificação já tocou (ou foi silenciada); só limpa. */
export function clearFinishedRest() {
  const current = useRest.getState().rest;
  version++;
  save(null);
  void cancelRestEnd(current?.notificationId ?? null);
}

/** Ao abrir o app: volta o descanso que estava correndo (se ainda não acabou). */
export async function restoreRest() {
  const stored = parseJsonWith(await readSetting(KEY), restSchema, null);
  if (stored && stored.endsAt > Date.now()) useRest.setState({ rest: stored });
  else if (stored) save(null);
}
