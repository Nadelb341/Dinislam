import { describe, expect, it } from 'vitest';
import { questionsSansReponse } from './useQuestionsAlphabet';

const m = (id: string, parent_id: string | null, est_admin: boolean, created_at: string) => ({ id, parent_id, particularite_id: 'p', est_admin, auteur: 'X', texte: id, created_at });
const titres = new Map([['p', 'La chadda']]);

describe('questionsSansReponse', () => {
  it('garde une question sans réponse', () => {
    expect(questionsSansReponse([m('q', null, false, '1')], titres).map((q) => q.id)).toEqual(['q']);
  });
  it('retire une question à laquelle l\'enseignante a répondu', () => {
    expect(questionsSansReponse([m('q', null, false, '1'), m('r', 'q', true, '2')], titres)).toEqual([]);
  });
  it('remet une relance de l\'élève après la réponse', () => {
    expect(questionsSansReponse([m('q', null, false, '1'), m('r', 'q', true, '2'), m('s', 'q', false, '3')], titres).map((q) => q.id)).toEqual(['s']);
  });
  it('compte la réponse d\'un élève sous un message de l\'enseignante', () => {
    expect(questionsSansReponse([m('faq', null, true, '1'), m('s', 'faq', false, '2')], titres).map((q) => q.titre)).toEqual(['La chadda']);
  });
});
