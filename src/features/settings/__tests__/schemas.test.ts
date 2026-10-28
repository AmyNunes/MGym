import { aiSettingsSchema, appearanceSchema } from '../schemas';

describe('schemas de configurações', () => {
  it('objeto vazio vira os padrões', () => {
    expect(appearanceSchema.parse({}).themePreference).toBe('system');
    expect(aiSettingsSchema.parse({})).toMatchObject({ provider: 'gemini', model: '', monthlyLimit: null });
  });

  it('um campo inválido volta ao padrão sem perder os outros', () => {
    const parsed = aiSettingsSchema.parse({ provider: 'nao-existe', model: 'meu-modelo' });
    expect(parsed.provider).toBe('gemini');
    expect(parsed.model).toBe('meu-modelo');
  });

  it('limite mensal zero ou negativo volta a "sem limite"', () => {
    expect(aiSettingsSchema.parse({ monthlyLimit: 0 }).monthlyLimit).toBeNull();
    expect(aiSettingsSchema.parse({ monthlyLimit: -3 }).monthlyLimit).toBeNull();
  });

  it('lixo no lugar do objeto vira os padrões', () => {
    expect(appearanceSchema.parse('lixo').themePreference).toBe('system');
    expect(aiSettingsSchema.parse(42).provider).toBe('gemini');
  });
});
