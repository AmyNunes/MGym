import { averageReadings, readingsDisagree, siteChange } from '../measurements';
import { waistHeight, waistHeightApplies, waistHeightBand, waistHip } from '../ratios';

describe('medidas', () => {
  it('guarda a média das duas leituras, com uma casa', () => {
    expect(averageReadings(80.2, 80.5)).toBe(80.4);
    expect(averageReadings(80, null)).toBe(80);
    expect(readingsDisagree(80, 81.5)).toBe(true);
    expect(readingsDisagree(80, 80.6)).toBe(false);
  });

  it('compara desde o início e nas últimas 4 semanas', () => {
    const entries = [
      { measuredAt: '2026-08-01T10:00:00.000Z', values: { waist: 84 } },
      { measuredAt: '2026-10-01T10:00:00.000Z', values: { waist: 82.5, hips: 100 } },
      { measuredAt: '2026-10-15T10:00:00.000Z', values: { waist: 81.8 } },
    ];
    expect(siteChange(entries, 'waist')).toEqual({ latest: 81.8, sinceStart: -2.2, last4Weeks: -0.7 });
    expect(siteChange(entries, 'hips')).toEqual({ latest: 100, sinceStart: null, last4Weeks: null });
    expect(siteChange(entries, 'calf')).toBeNull();
  });
});

describe('relações', () => {
  it('cintura/altura com as faixas, válidas com IMC < 35', () => {
    expect(waistHeight(78, 170)).toBe(0.46);
    expect(waistHeightBand(0.46)).toBe('healthy');
    expect(waistHeightBand(0.52)).toBe('attention');
    expect(waistHeightBand(0.61)).toBe('high');
    expect(waistHeightBand(0.38)).toBe('low');
    expect(waistHeightApplies(110, 170)).toBe(false);
  });

  it('cintura/quadril só como número de tendência', () => {
    expect(waistHip(80, 100)).toBe(0.8);
  });
});
