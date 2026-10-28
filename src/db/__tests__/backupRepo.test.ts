import { BackupError, buildBackupJson, parseBackup, stripSecrets } from '@/features/data/backupFormat';
import { emptyProfile } from '@/profile/profile';

import { dumpTables, replaceTables, schemaVersion, wipeAllTables } from '../backupRepo';
import { insertMeasurement, insertWeight, listMeasurements, listWeights } from '../bodyRepo';
import { getDb } from '../client';
import { insertCustomFood, searchFoods, setFavorite } from '../foodsRepo';
import { getProfile, saveProfile } from '../profileRepo';
import { readSetting, writeSetting } from '../settingsRepo';

import { memoryDbHolder } from './memoryDb';

const mockDb = memoryDbHolder();
jest.mock('@/db/client', () => ({ getDb: () => mockDb.get() }));

beforeEach(() => mockDb.reset());

describe('backup', () => {
  it('exporta, apaga tudo, importa e tudo volta (sem a TACO e sem segredos)', async () => {
    await writeSetting('appearance', { themePreference: 'dark' });
    await writeSetting('apiKey', 'nao-deveria-ir');
    await saveProfile({ ...emptyProfile(), goal: 'feminineShape' }, true);
    await insertWeight(65.2, '2026-10-20T10:00:00.000Z');
    await insertMeasurement({ waist: 80 }, '2026-10-20T10:00:00.000Z');
    const custom = await insertCustomFood({ name: 'Whey de baunilha', kcal: 380, protein: 75, carbs: 8, fat: 5, fiber: null, sodium: null, potassium: null });
    await setFavorite('taco-3', true);

    const tables = stripSecrets(await dumpTables());
    expect(tables.settings.some((r) => r.key === 'apiKey')).toBe(false);
    expect(tables.foods.map((f) => f.id)).toEqual([custom]);
    const json = buildBackupJson(tables, await schemaVersion());

    await wipeAllTables();
    expect(await listWeights()).toEqual([]);
    expect(await getProfile()).toBeNull();
    expect((await searchFoods('whey')).length).toBe(0);
    // A TACO continua no app.
    expect((await searchFoods('arroz')).length).toBeGreaterThan(0);

    await replaceTables(parseBackup(json, await schemaVersion()).tables);
    expect((await listWeights()).map((w) => w.kg)).toEqual([65.2]);
    expect((await listMeasurements())[0].values).toEqual({ waist: 80 });
    expect((await getProfile())?.answers).toMatchObject({ goal: 'feminineShape' });
    expect(await readSetting('appearance')).toContain('dark');
    expect((await searchFoods('whey'))[0].id).toBe(custom);
    const db = await getDb();
    expect((await db.getFirstAsync<{ favorite: number }>("SELECT favorite FROM foods WHERE id = 'taco-3'"))?.favorite).toBe(1);
  });

  it('arquivo estranho ou de um app mais novo não entra', async () => {
    expect(() => parseBackup('{"app":"outro"}', 7)).toThrow(BackupError);
    const newer = buildBackupJson({}, 99);
    expect(() => parseBackup(newer, 7)).toThrow(BackupError);
  });
});
