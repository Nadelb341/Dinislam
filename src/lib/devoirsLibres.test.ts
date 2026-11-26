import { describe, expect, it } from 'vitest';
import {
  colonnesDuFormulaire, compterEnCours, estEnCours, etiquetteLibre, formLibreVide, formesManquantes, lotsDuGroupe,
  manquesFormulaire, ordreLignesEleve, phraseReponse, questionsDe, regleReponse,
} from './devoirsLibres';

const NOW = new Date('2026-11-26T12:00:00Z');
const G = 'groupe-1';
const libre = (id: string, modele: string, lot: string | null, date: string | null, groupe: string | null = G) =>
  ({ id, type: 'libre', libre_modele: modele, libre_lot: lot, libre_groupe: groupe, date_limite: date });

describe('pastilles des tuiles (devoirs libres en cours)', () => {
  it('un devoir est en cours tant que sa date à rendre n’est pas passée', () => {
    expect(estEnCours({ date_limite: '2026-11-27T10:00:00Z' }, NOW)).toBe(true);
    expect(estEnCours({ date_limite: '2026-11-25T10:00:00Z' }, NOW)).toBe(false);
    expect(estEnCours({ date_limite: null }, NOW)).toBe(true);
  });

  it('compte chaque devoir UNE fois (pas une fois par élève), par modèle, pour le groupe', () => {
    const n = compterEnCours([
      libre('a1', 'dictee', 'L1', '2026-12-02T14:00:00Z'), libre('a2', 'dictee', 'L1', '2026-12-02T14:00:00Z'), libre('a3', 'dictee', 'L1', '2026-12-02T14:00:00Z'),
      libre('b1', 'dictee', 'L2', '2026-12-09T14:00:00Z'),
      libre('c1', 'video', 'L3', '2026-12-02T14:00:00Z'),
      libre('d1', 'fiche', 'L4', '2026-11-20T14:00:00Z'), // date passée
      libre('e1', 'texte', 'L5', '2026-12-02T14:00:00Z', 'autre-groupe'), // autre groupe
      { id: 'f1', type: 'sourate', libre_modele: null, libre_lot: null, libre_groupe: G, date_limite: '2026-12-02T14:00:00Z' }, // pas libre
    ], G, NOW);
    expect(n).toEqual({ dictee: 2, texte: 0, video: 1, fiche: 0, ecriture: 0, libre: 0 });
  });

  it('écran « Général » : seulement les devoirs libres donnés sans groupe', () => {
    const n = compterEnCours([libre('a', 'ecriture', 'L1', null, null), libre('b', 'ecriture', 'L2', null, G)], null, NOW);
    expect(n.ecriture).toBe(1);
  });

  it('un devoir sans lot compte seul', () => {
    expect(compterEnCours([libre('a', 'libre', null, null), libre('b', 'libre', null, null)], G, NOW).libre).toBe(2);
  });

  it('les lots du groupe, le plus récent d’abord', () => {
    const lots = lotsDuGroupe([
      { ...libre('a1', 'dictee', 'L1', null), created_at: '2026-11-20T10:00:00Z' },
      { ...libre('b1', 'video', 'L2', null), created_at: '2026-11-25T10:00:00Z' },
      { ...libre('a2', 'dictee', 'L1', null), created_at: '2026-11-20T10:00:00Z' },
    ], G);
    expect(lots.map((l) => [l.cle, l.copies.length])).toEqual([['L2', 1], ['L1', 2]]);
  });
});

describe('ordre des lignes côté élève', () => {
  it('les devoirs libres passent en premier, au-dessus des sourates ; le reste garde son ordre', () => {
    const l = ordreLignesEleve([
      { id: 1, type: 'sourate' }, { id: 2, type: 'nourania' }, { id: 3, type: 'libre' }, { id: 4, type: 'invocations' }, { id: 5, type: 'libre' },
    ]);
    expect(l.map((x) => x.id)).toEqual([3, 5, 1, 2, 4]);
  });
  it('ne change rien sans devoir libre', () => {
    expect(ordreLignesEleve([{ type: 'b' }, { type: 'a' }]).map((x) => x.type)).toEqual(['b', 'a']);
  });
});

describe('réponse de l’élève', () => {
  const vide = { texte: '', nbPhotos: 0, audio: false, reponses: [] as string[] };
  it('dictée : une photo OU le texte suffit', () => {
    const r = regleReponse({ libre_modele: 'dictee', reponses_attendues: ['photo', 'texte'] });
    expect(formesManquantes(r, vide, 0)).toEqual(['photo', 'texte']);
    expect(formesManquantes(r, { ...vide, nbPhotos: 1 }, 0)).toEqual([]);
    expect(formesManquantes(r, { ...vide, texte: 'le chat' }, 0)).toEqual([]);
    expect(phraseReponse(r)).toBe('Envoie une photo de ton travail ou ton texte');
  });
  it('vidéo : toutes les questions doivent avoir une réponse', () => {
    const r = regleReponse({ libre_modele: 'video', reponses_attendues: ['questions'] });
    expect(formesManquantes(r, { ...vide, reponses: ['oui', ' '] }, 2)).toEqual(['questions']);
    expect(formesManquantes(r, { ...vide, reponses: ['oui', 'non'] }, 2)).toEqual([]);
  });
  it('libre : toutes les formes choisies par Nadia sont demandées', () => {
    const r = regleReponse({ libre_modele: 'libre', reponses_attendues: ['texte', 'audio'] });
    expect(formesManquantes(r, { ...vide, texte: 'x' }, 0)).toEqual(['audio']);
    expect(phraseReponse(r)).toBe('Envoie ton texte et ton audio');
  });
  it('texte à lire : l’audio est demandé', () => {
    expect(regleReponse({ libre_modele: 'texte', reponses_attendues: [] }).formes).toEqual(['audio']);
  });
});

describe('formulaire de Nadia', () => {
  it('ce qui manque selon le modèle', () => {
    expect(manquesFormulaire(formLibreVide('dictee'))).toEqual(["l'audio de la dictée"]);
    expect(manquesFormulaire(formLibreVide('video'))).toEqual(['la vidéo (lien ou fichier)', 'au moins une question']);
    expect(manquesFormulaire(formLibreVide('fiche'))).toEqual(['la fiche (PDF ou image)']);
    expect(manquesFormulaire(formLibreVide('libre'))).toEqual(['le texte du devoir']);
    expect(manquesFormulaire(formLibreVide('ecriture'))).toEqual([]);
  });
  it('les colonnes : audio demandé pour le texte à lire, questions nettoyées', () => {
    const c = colonnesDuFormulaire({ ...formLibreVide('texte'), consigne: 'Le petit chat' });
    expect(c).toMatchObject({ libre_modele: 'texte', reponses_attendues: ['audio'], audio_requis: true, description: 'Le petit chat' });
    const v = colonnesDuFormulaire({ ...formLibreVide('video'), video_lien: 'https://youtu.be/abcdefghijk', questions: [' Qui ? ', '', 'Où ?'] });
    expect(v.questions).toEqual(['Qui ?', 'Où ?']);
    expect(v.reponses_attendues).toEqual(['questions']);
    const l = colonnesDuFormulaire({ ...formLibreVide('libre'), titre: 'x', formes: ['photo'], questions: ['Pourquoi ?'] });
    expect(l.reponses_attendues).toEqual(['photo', 'questions']);
  });
  it('questionsDe : 5 au plus', () => {
    expect(questionsDe(['a', 'b', 'c', 'd', 'e', 'f'])).toHaveLength(5);
  });
  it('étiquette dans les corrections', () => {
    expect(etiquetteLibre('dictee')).toBe('📝 Devoirs libres · Dictée');
  });
});
