import {
  daysBetweenKeys,
  formatBrDate,
  formatShortDate,
  maskBrDate,
  parseBrDate,
  startOfAppDay,
  startOfWeek,
  appDayKey,
} from '../dates';
import { formatUsd, parseDecimal } from '../format';

describe('dia (vira às 04:00)', () => {
  it('03:59 ainda conta como o dia anterior', () => {
    expect(appDayKey(new Date(2026, 9, 20, 3, 59))).toBe('2026-10-19');
  });

  it('04:00 já é o dia novo', () => {
    expect(appDayKey(new Date(2026, 9, 20, 4, 0))).toBe('2026-10-20');
  });

  it('respeita outra hora de virada', () => {
    expect(appDayKey(new Date(2026, 9, 20, 5, 0), 6)).toBe('2026-10-19');
  });

  it('o início do dia é às 04:00', () => {
    const start = startOfAppDay(new Date(2026, 9, 20, 1, 0));
    expect(start).toEqual(new Date(2026, 9, 19, 4, 0));
  });
});

describe('formatação de datas', () => {
  it('"seg, 19 out"', () => {
    expect(formatShortDate(new Date(2026, 9, 19))).toBe('seg, 19 out');
  });

  it('semana começa na segunda', () => {
    expect(startOfWeek(new Date(2026, 9, 25))).toEqual(new Date(2026, 9, 19));
  });

  it('diferença em dias entre chaves', () => {
    expect(daysBetweenKeys('2026-10-19', '2026-10-22')).toBe(3);
  });
});

describe('números', () => {
  it('aceita vírgula ou ponto', () => {
    expect(parseDecimal('0,15')).toBe(0.15);
    expect(parseDecimal('0.15')).toBe(0.15);
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNaN();
  });

  it('mostra US$ com vírgula', () => {
    expect(formatUsd(1.5)).toBe('US$ 1,50');
    expect(formatUsd(0.0021)).toBe('US$ 0,0021');
  });
});

describe('datas no formato brasileiro', () => {
  it('lê e escreve dd/mm/aaaa', () => {
    expect(parseBrDate('27/10/1995')).toBe('1995-10-27');
    expect(parseBrDate('31/02/2026')).toBeNull();
    expect(parseBrDate('1995-10-27')).toBeNull();
    expect(formatBrDate('1995-10-27')).toBe('27/10/1995');
  });

  it('põe as barras enquanto digita só números', () => {
    expect(maskBrDate('2')).toBe('2');
    expect(maskBrDate('22')).toBe('22');
    expect(maskBrDate('221')).toBe('22/1');
    expect(maskBrDate('2211')).toBe('22/11');
    expect(maskBrDate('22111')).toBe('22/11/1');
    expect(maskBrDate('22111999')).toBe('22/11/1999');
    expect(maskBrDate('221119990')).toBe('22/11/1999');
    expect(parseBrDate(maskBrDate('22111999'))).toBe('1999-11-22');
  });

  it('apagar não trava na barra', () => {
    expect(maskBrDate('22/11/')).toBe('22/11');
    expect(maskBrDate('22/')).toBe('22');
  });

  it('aceita barras digitadas, dia ou mês com um número e colar com traços', () => {
    expect(maskBrDate('22/11/1999')).toBe('22/11/1999');
    expect(maskBrDate('1/')).toBe('01');
    expect(maskBrDate('1/5/1999')).toBe('01/05/1999');
    expect(maskBrDate('22-11-1999')).toBe('22/11/1999');
    expect(maskBrDate('')).toBe('');
  });
});
