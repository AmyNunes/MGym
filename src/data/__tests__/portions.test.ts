import foods from '../foods-v1.json';
import portions from '../portions-v1.json';
import { portionsFileSchema } from '@/nutrition/models';

const parsed = portionsFileSchema.parse(portions);

describe('portions-v1.json (IBGE POF 2008–2009)', () => {
  it('passa no schema e cita a fonte', () => {
    expect(portionsFileSchema.safeParse(portions).success).toBe(true);
    expect(portions.source).toMatch(/IBGE/);
  });

  it('~200 alimentos da TACO, todos existentes, com 1 a 4 medidas sem repetição', () => {
    const ids = new Set(foods.rows.map((r) => String(r[0])));
    const keys = Object.keys(parsed.portions);
    expect(keys.length).toBeGreaterThanOrEqual(150);
    for (const key of keys) {
      expect(ids.has(key)).toBe(true);
      const list = parsed.portions[key];
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.length).toBeLessThanOrEqual(4);
      expect(new Set(list.map((p) => p[0])).size).toBe(list.length);
    }
  });

  it('arroz cozido: colher de sopa cheia = 25 g', () => {
    expect(parsed.portions['3'][0]).toEqual(['colher de sopa cheia', 'colheres de sopa cheias', 25]);
  });
});
