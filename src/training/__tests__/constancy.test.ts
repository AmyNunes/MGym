import { constancyGrid, weeksMet } from '../constancy';

describe('constância', () => {
  it('semanas de segunda a domingo, com os dias treinados e a meta da semana', () => {
    const grid = constancyGrid(['2026-10-19', '2026-10-21', '2026-10-23', '2026-10-26'], '2026-10-28', 2, 3);
    expect(grid.map((w) => w.start)).toEqual(['2026-10-19', '2026-10-26']);
    expect(grid[0]).toMatchObject({ trained: 3, met: true });
    expect(grid[1]).toMatchObject({ trained: 1, met: false });
    expect(grid[1].days.filter((d) => d.future).map((d) => d.key)).toEqual(['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
    expect(weeksMet(grid)).toBe(1);
  });
});
