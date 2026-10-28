import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { z } from 'zod';

import { clearApiKey } from '@/ai/keyStore';
import { dumpTables, replaceTables, schemaVersion, wipeAllTables } from '@/db/backupRepo';
import { deleteAllWeights } from '@/db/bodyRepo';
import { readSetting, writeSetting } from '@/db/settingsRepo';
import { strings } from '@/i18n/strings';
import { parseJsonWith } from '@/lib/json';
import { loadFoods } from '@/stores/foodsStore';
import { loadProfile } from '@/stores/profileStore';
import { skipRest } from '@/stores/restStore';
import { useSettings } from '@/stores/settingsStore';
import { resumeWorkout, useWorkout } from '@/stores/workoutStore';

import { backupFileName, buildBackupJson, parseBackup, stripSecrets, type Backup } from './backupFormat';

const LAST_BACKUP_KEY = 'lastBackupAt';

/** Exporta tudo para um JSON (sem a chave da IA) e abre o "Compartilhar" do Android. */
export async function exportBackup(): Promise<void> {
  const json = buildBackupJson(stripSecrets(await dumpTables()), await schemaVersion());
  const file = new File(Paths.cache, backupFileName());
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: strings.settings.data.shareTitle });
  await writeSetting(LAST_BACKUP_KEY, new Date().toISOString());
}

/** Escolhe e valida um arquivo. `null` = cancelei. */
export async function pickBackup(): Promise<Backup | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return null;
  const text = await new File(result.assets[0].uri).text();
  return parseBackup(text, await schemaVersion());
}

/** Depois de trocar os dados: recarrega configurações, perfil, alimentos e o treino em andamento. */
async function afterDataChange(): Promise<void> {
  await skipRest().catch(() => {});
  useWorkout.setState({ workout: null, context: {}, records: {}, endedId: null, intro: null });
  await useSettings.getState().load();
  await loadProfile();
  await loadFoods(true);
  await resumeWorkout().catch(() => null);
}

/** "Substituir tudo?" → sim. */
export async function restoreBackup(backup: Backup): Promise<void> {
  await replaceTables(backup.tables);
  await afterDataChange();
}

/** "Apagar tudo": dados, configurações e a chave da IA (seção 15). */
export async function wipeEverything(): Promise<void> {
  await wipeAllTables();
  await clearApiKey();
  await afterDataChange();
}

/** "Apagar histórico de peso" (seção 15), separado do resto. */
export async function wipeWeightHistory(): Promise<void> {
  await deleteAllWeights();
}

export async function lastBackupAt(): Promise<string | null> {
  return parseJsonWith<string | null>(await readSetting(LAST_BACKUP_KEY), z.string().nullable(), null);
}
