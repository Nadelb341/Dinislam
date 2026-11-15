import { describe, it, expect } from 'vitest';
import { proposerFiche, type FicheAttente } from './fichesAttente';

const f = (prenom: string, o: Partial<FicheAttente> = {}) => ({ id: prenom, prenom, statut: 'attente', refus: [], group_ids: [], ...o }) as unknown as FicheAttente;
const fiches = [f('Rayan'), f('Yous'), f('Maïssa'), f('Lilia', { statut: 'reliee' })];

describe('fiches en attente', () => {
  it('propose la fiche au prénom proche (accents, surnom)', () => {
    expect(proposerFiche('Maissa ELB', 'u', fiches)?.prenom).toBe('Maïssa');
    expect(proposerFiche('Yousra', 'u', fiches)?.prenom).toBe('Yous');
    expect(proposerFiche('rayan b.', 'u', fiches)?.prenom).toBe('Rayan');
  });
  it('rien si refusée pour ce compte, déjà reliée, ou aucun prénom proche', () => {
    expect(proposerFiche('Rayan', 'u', [f('Rayan', { refus: ['u'] })])).toBeNull();
    expect(proposerFiche('Lilia', 'u', fiches)).toBeNull();
    expect(proposerFiche('Adam', 'u', fiches)).toBeNull();
  });
});
