import { describe, it, expect } from 'vitest';
import {
  accesDe, carteOuverte, dansLaPeriode, elevesQuiVoient, fermerAEleve, fermerAGroupe, ouvrirAEleve, ouvrirAGroupe,
  raisonAcces, reserverSauf, texteChangement, versBase, memeAcces, type Acces,
} from '@/lib/cartesAcces';

// 🗂️ « Qui voit quoi » (2026-11-11)
const actif = { is_active: true }, masque = { is_active: false };
const nom = (x: string) => x.toUpperCase();

describe('carteOuverte (règle unique accueil + Classement)', () => {
  it("l'admin voit tout", () => expect(carteOuverte(masque, undefined, 'u', [], true)).toBe(true));
  it('carte active sans ciblage : ouverte, masquée : fermée', () => {
    expect(carteOuverte(actif, undefined, 'u', [], false)).toBe(true);
    expect(carteOuverte(masque, undefined, 'u', [], false)).toBe(false);
    expect(carteOuverte(masque, { visibility_type: 'all', user_ids: [], group_ids: [] }, 'u', [], false)).toBe(false);
  });
  it('ciblage personnes / groupes prioritaire sur « masquée » (comme avant)', () => {
    expect(carteOuverte(masque, { visibility_type: 'users', user_ids: ['u'], group_ids: null }, 'u', [], false)).toBe(true);
    expect(carteOuverte(actif, { visibility_type: 'users', user_ids: ['u'], group_ids: null }, 'autre', [], false)).toBe(false);
    expect(carteOuverte(masque, { visibility_type: 'groups', user_ids: null, group_ids: ['g1'] }, 'u', ['g1'], false)).toBe(true);
    expect(carteOuverte(actif, { visibility_type: 'groups', user_ids: null, group_ids: ['g1'] }, 'u', ['g2'], false)).toBe(false);
  });
  it('idée 1 : groupes ET élèves sur la même carte', () => {
    const v = { visibility_type: 'mixed', user_ids: ['wiam'], group_ids: ['g2'] };
    expect(carteOuverte(masque, v, 'wiam', ['g1'], false)).toBe(true);
    expect(carteOuverte(masque, v, 'yacine', ['g2'], false)).toBe(true);
    expect(carteOuverte(masque, v, 'sofia', ['g3'], false)).toBe(false);
  });
  it('idée 5 : dates d\'ouverture', () => {
    const now = Date.parse('2026-11-11T12:00:00Z');
    const futur = { is_active: true, ouverte_du: '2026-11-12T00:00:00Z' };
    const fini = { is_active: true, ouverte_jusquau: '2026-11-11T00:00:00Z' };
    const enCours = { is_active: true, ouverte_du: '2026-11-01T00:00:00Z', ouverte_jusquau: '2026-12-01T00:00:00Z' };
    expect(carteOuverte(futur, undefined, 'u', [], false, now)).toBe(false);
    expect(carteOuverte(fini, undefined, 'u', [], false, now)).toBe(false);
    expect(carteOuverte(enCours, undefined, 'u', [], false, now)).toBe(true);
    expect(carteOuverte(futur, undefined, 'u', [], true, now)).toBe(true);
    expect(dansLaPeriode({ is_active: true, ouverte_jusquau: '2026-11-11T12:00:00Z' }, now)).toBe(false);
  });
});

describe('changements', () => {
  const tous: Acces = { mode: 'tous', groupes: [], eleves: [] };
  const personne: Acces = { mode: 'personne', groupes: [], eleves: [] };
  it('accesDe lit les 3 états', () => {
    expect(accesDe(actif, undefined).mode).toBe('tous');
    expect(accesDe(masque, null).mode).toBe('personne');
    expect(accesDe(masque, { visibility_type: 'groups', user_ids: [], group_ids: [] }).mode).toBe('personne');
    expect(accesDe(actif, { visibility_type: 'users', user_ids: ['u'], group_ids: [] })).toEqual({ mode: 'certains', groupes: [], eleves: ['u'] });
  });
  it('ouvrir / fermer à un groupe, à un élève', () => {
    const a = ouvrirAGroupe(personne, 'g2');
    expect(a).toEqual({ mode: 'certains', groupes: ['g2'], eleves: [] });
    const b = ouvrirAEleve(a, 'wiam');
    expect(b).toEqual({ mode: 'certains', groupes: ['g2'], eleves: ['wiam'] });
    expect(fermerAGroupe(fermerAEleve(b, 'wiam'), 'g2').mode).toBe('personne');
    expect(ouvrirAGroupe(tous, 'g2')).toBe(tous);
    expect(ouvrirAGroupe(ouvrirAGroupe(personne, 'g2'), 'g2').groupes).toEqual(['g2']);
  });
  it('réserver à tous les groupes sauf un', () => {
    expect(reserverSauf(['g1', 'g2', 'g3'], 'g2')).toEqual({ mode: 'certains', groupes: ['g1', 'g3'], eleves: [] });
    expect(reserverSauf(['g2'], 'g2').mode).toBe('personne');
  });
  it('versBase garde la compatibilité avec les anciennes versions', () => {
    expect(versBase(tous)).toEqual({ is_active: true, visibility_type: 'all', user_ids: [], group_ids: [] });
    expect(versBase(personne).is_active).toBe(false);
    expect(versBase({ mode: 'certains', groupes: ['g'], eleves: [] }).visibility_type).toBe('groups');
    expect(versBase({ mode: 'certains', groupes: [], eleves: ['u'] }).visibility_type).toBe('users');
    expect(versBase({ mode: 'certains', groupes: ['g'], eleves: ['u'] }).visibility_type).toBe('mixed');
    // aller-retour : ce qu'on écrit se relit à l'identique
    for (const a of [tous, personne, { mode: 'certains' as const, groupes: ['g'], eleves: ['u'] }]) {
      const b = versBase(a);
      expect(memeAcces(accesDe({ is_active: b.is_active }, b), a)).toBe(true);
    }
  });
  it('raison et élèves qui voient', () => {
    const a: Acces = { mode: 'certains', groupes: ['g2'], eleves: ['wiam'] };
    expect(raisonAcces(a, 'wiam', ['g1'])).toBe('lui');
    expect(raisonAcces(a, 'yacine', ['g2'])).toBe('groupe');
    expect(raisonAcces(a, 'sofia', ['g3'])).toBeNull();
    expect(raisonAcces(tous, 'x', [])).toBe('tous');
    const eleves = [{ id: 'wiam', nom: 'W', groupes: ['g1'] }, { id: 'yacine', nom: 'Y', groupes: ['g2'] }, { id: 'sofia', nom: 'S', groupes: ['g3'] }];
    expect([...elevesQuiVoient(masque, a, eleves)].sort()).toEqual(['wiam', 'yacine']);
  });
  it('texte du journal', () => {
    expect(texteChangement(personne, tous, nom, nom)).toBe('🌍 Ouverte à tout le monde');
    expect(texteChangement(tous, personne, nom, nom)).toBe('🔒 Fermée à tout le monde');
    expect(texteChangement(personne, { mode: 'certains', groupes: ['g2'], eleves: [] }, nom, nom)).toBe('➕ G2');
    expect(texteChangement({ mode: 'certains', groupes: ['g2'], eleves: ['w'] }, { mode: 'certains', groupes: ['g3'], eleves: ['w'] }, nom, nom)).toBe('➕ G3 · ➖ G2');
    expect(texteChangement(tous, tous, nom, nom)).toBe('');
  });
});
