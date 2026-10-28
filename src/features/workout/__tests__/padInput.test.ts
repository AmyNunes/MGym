import { formatPad, parsePad, pressKey, stepPad } from '../padInput';

describe('teclado numérico', () => {
  it('o primeiro toque substitui o valor preenchido', () => {
    expect(pressKey('60', '6', true, true)).toBe('6');
    expect(pressKey('6', '2', true, false)).toBe('62');
  });

  it('vírgula só em peso, uma vez, com uma casa decimal', () => {
    expect(pressKey('62', ',', true, false)).toBe('62,');
    expect(pressKey('62,', '5', true, false)).toBe('62,5');
    expect(pressKey('62,5', '5', true, false)).toBe('62,5');
    expect(pressKey('62,5', ',', true, false)).toBe('62,5');
    expect(pressKey('10', ',', false, false)).toBe('10');
    expect(pressKey('', ',', true, false)).toBe('0,');
  });

  it('apagar, zero à esquerda e limite de 999', () => {
    expect(pressKey('62,5', 'back', true, false)).toBe('62,');
    expect(pressKey('0', '7', false, false)).toBe('7');
    expect(pressKey('999', '9', false, false)).toBe('999');
  });

  it('converte e formata com vírgula', () => {
    expect(parsePad('62,5')).toBe(62.5);
    expect(parsePad('')).toBeNull();
    expect(formatPad(62.5)).toBe('62,5');
    expect(formatPad(null)).toBe('');
  });

  it('−/+ incremento, sem ficar negativo', () => {
    expect(stepPad('60', 2.5)).toBe('62,5');
    expect(stepPad('1', -2.5)).toBe('0');
    expect(stepPad('', 1)).toBe('1');
  });
});
