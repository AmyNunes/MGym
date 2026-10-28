import { useSettings } from '../settingsStore';

/** Banco de mentira: a tabela `settings` vira um objeto em memória. */
const table: Record<string, string> = {};

jest.mock('@/db/settingsRepo', () => ({
  readAllSettings: jest.fn(async () => ({ ...table })),
  writeSetting: jest.fn(async (key: string, value: unknown) => {
    table[key] = JSON.stringify(value);
  }),
}));

describe('settingsStore', () => {
  it('salva a mudança e a recupera ao "reabrir" o app', async () => {
    await useSettings.getState().load();
    expect(useSettings.getState().appearance.themePreference).toBe('system');

    await useSettings.getState().update('appearance', { themePreference: 'dark' });
    expect(JSON.parse(table.appearance)).toEqual({ themePreference: 'dark' });

    // "Reabrir": volta aos padrões e carrega de novo do banco.
    useSettings.setState({ appearance: { themePreference: 'system' }, loaded: false });
    await useSettings.getState().load();
    expect(useSettings.getState().appearance.themePreference).toBe('dark');
    expect(useSettings.getState().loaded).toBe(true);
  });

  it('um valor corrompido no banco vira o padrão sem quebrar', async () => {
    table.ai = '{isso não é json';
    await useSettings.getState().load();
    expect(useSettings.getState().ai.provider).toBe('gemini');
  });
});
