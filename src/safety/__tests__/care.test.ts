import { emptyProfile } from '@/profile/profile';

import { careItems } from '../care';

const today = '2026-10-26';

describe('cuidados para você (16.2)', () => {
  it('sem terapia hormonal e sem cirurgia: nada além do necessário', () => {
    expect(careItems({ ...emptyProfile(), hrt: 'none' }, today)).toEqual([]);
  });

  it('espironolactona: levantar devagar, sal light, anti-inflamatório, sinais de trombose e exames', () => {
    const items = careItems({ ...emptyProfile(), hrt: 'estrogenSpiro' }, today);
    expect(items).toEqual(
      expect.arrayContaining(['spiroStandUp', 'spiroSalt', 'spiroNsaid', 'estrogenClots', 'estrogenSmoking', 'bloodTests']),
    );
    expect(items).not.toContain('cpaLightDays');
  });

  it('ciproterona: dias leves e álcool', () => {
    expect(careItems({ ...emptyProfile(), hrt: 'estrogenCpa' }, today)).toEqual(
      expect.arrayContaining(['cpaLightDays', 'cpaAlcohol']),
    );
  });

  it('sem endocrinologista: mensagem dos ambulatórios do SUS; triagem com "sim": liberação médica', () => {
    const items = careItems({ ...emptyProfile(), endocrinologist: false, screening: ['joint'] }, today);
    expect(items).toEqual(expect.arrayContaining(['susClinics', 'screening']));
  });

  it('cirurgia sem liberação: modo recuperação', () => {
    const p = { ...emptyProfile(), surgery: { kind: 'breast' as const, date: '2026-10-10', clearedOn: null } };
    expect(careItems(p, today)).toContain('recovery');
  });

  it('"prefiro não dizer" não gera cuidados de hormônio', () => {
    expect(careItems({ ...emptyProfile(), hrt: 'preferNot' }, today)).toEqual([]);
  });
});
