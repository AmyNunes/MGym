import foods from '../foods-v1.json';

describe('foods-v1.json (TACO 4ª ed.)', () => {
  it('tem os 597 alimentos, com ids únicos de 1 a 597', () => {
    expect(foods.rows).toHaveLength(597);
    const ids = foods.rows.map((r) => r[0]);
    expect(new Set(ids).size).toBe(597);
    expect(Math.min(...(ids as number[]))).toBe(1);
    expect(Math.max(...(ids as number[]))).toBe(597);
  });

  it('nenhum valor negativo; nulos só onde a TACO não tem dado', () => {
    for (const row of foods.rows) {
      for (const v of row.slice(3)) {
        if (v !== null) expect(v as number).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('colunas, categorias e fonte', () => {
    expect(foods.columns).toEqual(['id', 'name', 'category', 'kcal', 'protein', 'carbs', 'fat', 'fiber', 'sodium', 'potassium']);
    expect(foods.categories).toHaveLength(15);
    expect(foods.source).toMatch(/TACO/);
    expect(foods.rows.find((r) => r[0] === 3)).toEqual([3, 'Arroz, tipo 1, cozido', 0, 128, 2.5, 28.1, 0.2, 1.6, 1, 15]);
    // Erro de digitação da planilha oficial corrigido no script (o nome era "L").
    expect(foods.rows.find((r) => r[0] === 540)?.[1]).toBe('Feijoada');
  });
});
