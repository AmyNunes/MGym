import { adjustRest, remainingSec, restProgress } from '../rest';

const now = 1_000_000;

describe('descanso pelo relógio', () => {
  it('tempo restante arredonda para cima e não fica negativo', () => {
    expect(remainingSec(now + 89_100, now)).toBe(90);
    expect(remainingSec(now - 5_000, now)).toBe(0);
  });

  it('progresso vai de 0 a 1', () => {
    expect(restProgress({ endsAt: now + 90_000, totalSec: 90 }, now)).toBe(0);
    expect(restProgress({ endsAt: now + 45_000, totalSec: 90 }, now)).toBe(0.5);
    expect(restProgress({ endsAt: now - 1, totalSec: 90 }, now)).toBe(1);
  });

  it('+15 s aumenta o fim e o total', () => {
    expect(adjustRest({ endsAt: now + 30_000, totalSec: 90 }, 15, now)).toEqual({ endsAt: now + 45_000, totalSec: 105 });
  });

  it('−15 s com menos de 15 s restantes termina o descanso', () => {
    expect(adjustRest({ endsAt: now + 10_000, totalSec: 90 }, -15, now)).toBeNull();
    expect(adjustRest({ endsAt: now + 60_000, totalSec: 90 }, -15, now)).toEqual({ endsAt: now + 45_000, totalSec: 75 });
  });
});
