import { describe, it, expect } from 'vitest';
import { elevesVises, resumeCible, separerPourProf, suiviLecture, texteCarnetPartage, trierCarnet, type MessageCarnet } from './carnet';

const msg = (o: Partial<MessageCarnet>): MessageCarnet => ({
  id: 'm', emoji: '📒', titre: 'T', texte: 'x', cible: 'tous', group_ids: [], student_ids: [], piece_url: null, piece_nom: null, piece_type: null,
  epingle: false, signature: false, relance: true, envoyer_le: '2026-11-10T10:00:00Z', created_at: '2026-11-10T10:00:00Z', ...o,
});
const eleves = [
  { id: 'a', nom: 'Amine', groupes: ['g1'], parents: ['pa'] },
  { id: 'b', nom: 'Bilal', groupes: ['g2'], parents: [] },
  { id: 'c', nom: 'Chaïma', groupes: ['g1', 'g2'], parents: [] },
];

describe('carnet de liaison', () => {
  it('le plus récent en haut, les épinglés avant', () => {
    const t = trierCarnet([msg({ id: '1', envoyer_le: '2026-11-01T00:00:00Z' }), msg({ id: '2', envoyer_le: '2026-11-09T00:00:00Z' }), msg({ id: '3', envoyer_le: '2026-10-01T00:00:00Z', epingle: true })]);
    expect(t.map((m) => m.id)).toEqual(['3', '2', '1']);
  });
  it('vise tout le monde, des groupes ou des élèves', () => {
    expect(elevesVises(msg({ cible: 'groupes', group_ids: ['g2'] }), eleves).map((e) => e.id)).toEqual(['b', 'c']);
    expect(elevesVises(msg({ cible: 'eleves', student_ids: ['a'] }), eleves).map((e) => e.id)).toEqual(['a']);
    expect(resumeCible(msg({ cible: 'groupes', group_ids: ['g1'] }), [{ id: 'g1', name: 'Groupe 1' }])).toBe('👥 Groupe 1');
  });
  it('lu par l\'élève OU son parent, signé par un parent, réponse', () => {
    const s = suiviLecture(msg({ id: 'm' }), eleves, [
      { message_id: 'm', user_id: 'pa', role: 'eleve', lu_le: '', reponse: 'ok' },
      { message_id: 'm', user_id: 'c', role: 'parent', lu_le: '', reponse: null },
      { message_id: 'autre', user_id: 'b', role: 'eleve', lu_le: '', reponse: null },
    ]);
    expect([s.lus, s.total, s.signes]).toEqual([2, 3, 2]);
    expect(s.pasLu.map((e) => e.id)).toEqual(['b']);
    expect(s.lignes[0].reponse).toBe('ok');
  });
  it('texte WhatsApp / SMS', () => {
    expect(texteCarnetPartage({ emoji: '🕌', titre: 'Sortie', texte: 'Mercredi', signature: true })).toContain('✍️');
    expect(texteCarnetPartage({ emoji: '🕌', titre: 'Sortie', texte: 'Mercredi', signature: false })).toBe('📒 Carnet de liaison — 🕌 Sortie\n\nMercredi');
  });
});

describe('bilan de la semaine', () => {
  it('texte et proposition le mardi à 16 h', async () => {
    const { texteBilanSemaine, bilanAProposer, cleSemaine } = await import('./bilanSemaine');
    const t = texteBilanSemaine('Réda Ben', { devoirsDonnes: 3, devoirsFaits: 3, lignes: 4, lecons: [], sourates: ['Al-Fil'], invocations: [] });
    expect(t).toContain('Bilan de la semaine de Réda');
    expect(t).toContain('💎 Devoirs faits : 3 / 3');
    expect(t).toContain('📖 Sourate validée : Al-Fil');
    expect(t).toContain('bravo');
    expect(bilanAProposer(new Date(2026, 10, 17, 15, 0), null)).toBe(false); // mardi 15 h
    expect(bilanAProposer(new Date(2026, 10, 17, 16, 5), null)).toBe(true);  // mardi 16 h
    expect(bilanAProposer(new Date(2026, 10, 18, 9, 0), cleSemaine(new Date(2026, 10, 18)))).toBe(false); // déjà fait
    expect(bilanAProposer(new Date(2026, 10, 16, 20, 0), null)).toBe(false); // lundi
  });
});

describe('carnet côté élève', () => {
  it('à lire déplié ; lu → historique (le plus récent en tête) ; signature attendue reste en haut', async () => {
    const { separerPourEleve } = await import('./carnet');
    const l = (id: string, role = 'eleve') => ({ message_id: id, user_id: 'u', role, lu_le: '', reponse: null });
    const { aLire, historique } = separerPourEleve([
      msg({ id: 'nouveau', envoyer_le: '2026-11-12T00:00:00Z' }),
      msg({ id: 'lu1', envoyer_le: '2026-11-01T00:00:00Z' }),
      msg({ id: 'lu2', envoyer_le: '2026-11-05T00:00:00Z' }),
      msg({ id: 'signe?', signature: true, envoyer_le: '2026-11-03T00:00:00Z' }),
      msg({ id: 'signe', signature: true, envoyer_le: '2026-11-02T00:00:00Z' }),
      msg({ id: 'vieux', envoyer_le: '2026-04-01T00:00:00Z' }),
    ], [l('lu1'), l('lu2'), l('signe?'), l('signe'), l('signe', 'parent'), l('vieux')], 'u', false, new Date('2026-11-12T12:00:00Z'));
    expect(aLire.map((m) => m.id)).toEqual(['nouveau', 'signe?']);
    expect(historique.map((m) => m.id)).toEqual(['lu2', 'signe', 'lu1']);
  });
});

describe('carnet côté enseignante', () => {
  it('en haut : le dernier envoyé, les épinglés, les programmés ; le reste en historique', () => {
    const { enHaut, historique } = separerPourProf([
      msg({ id: 'ancien', envoyer_le: '2026-10-01T00:00:00Z' }),
      msg({ id: 'dernier', envoyer_le: '2026-11-10T00:00:00Z' }),
      msg({ id: 'programme', envoyer_le: '2026-12-18T17:00:00Z' }),
      msg({ id: 'epingle', envoyer_le: '2026-09-01T00:00:00Z', epingle: true }),
      msg({ id: 'moyen', envoyer_le: '2026-11-01T00:00:00Z' }),
    ], new Date('2026-11-12T12:00:00Z'));
    expect(enHaut.map((m) => m.id).sort()).toEqual(['dernier', 'epingle', 'programme']);
    expect(historique.map((m) => m.id)).toEqual(['moyen', 'ancien']);
  });
});
