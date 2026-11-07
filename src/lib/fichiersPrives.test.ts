import { describe, it, expect } from 'vitest';
import { cheminPrive, lienPretTout } from './fichiersPrives';

const B = 'https://zgnxqhfcmdonvdxqpekl.supabase.co/storage/v1/object';

describe('cheminPrive', () => {
  it('reconnaît une adresse publique des 4 espaces privés', () => {
    expect(cheminPrive(`${B}/public/recitations/abc/12/1700.mp4`)).toEqual({ espace: 'recitations', chemin: 'abc/12/1700.mp4' });
    expect(cheminPrive(`${B}/public/messages-audio/u1/a.webm`)).toEqual({ espace: 'messages-audio', chemin: 'u1/a.webm' });
    expect(cheminPrive(`${B}/public/devoirs-audios/u1/consignes/1.m4a`)).toEqual({ espace: 'devoirs-audios', chemin: 'u1/consignes/1.m4a' });
    expect(cheminPrive(`${B}/public/devoirs-fichiers/prof/x/1-ab-fiche.pdf`)).toEqual({ espace: 'devoirs-fichiers', chemin: 'prof/x/1-ab-fiche.pdf' });
  });

  it('reconnaît aussi un lien signé ou « authenticated » et ignore ce qui suit « ? »', () => {
    expect(cheminPrive(`${B}/sign/recitations/admin/s1/r1-response.webm?token=eyJ.abc`)).toEqual({ espace: 'recitations', chemin: 'admin/s1/r1-response.webm' });
    expect(cheminPrive(`${B}/authenticated/devoirs-audios/u/c/1.mp4?download=1`)).toEqual({ espace: 'devoirs-audios', chemin: 'u/c/1.mp4' });
    expect(cheminPrive(`${B}/public/recitations/a/b.mp4#t=3`)).toEqual({ espace: 'recitations', chemin: 'a/b.mp4' });
  });

  it('décode le chemin (espaces, accents)', () => {
    expect(cheminPrive(`${B}/public/devoirs-fichiers/prof/l/1-x-Fiche%20%C3%A9l%C3%A8ve.pdf`)?.chemin).toBe('prof/l/1-x-Fiche élève.pdf');
    // encodage cassé : chemin gardé tel quel, sans erreur
    expect(cheminPrive(`${B}/public/devoirs-fichiers/a/%E0%A4%A.pdf`)?.chemin).toBe('a/%E0%A4%A.pdf');
  });

  it('laisse de côté les autres espaces et les liens locaux', () => {
    expect(cheminPrive(`${B}/public/sourate-content/x.mp3`)).toBeNull();
    expect(cheminPrive(`${B}/public/module-cards/allah-names/1-audio.mp3`)).toBeNull();
    expect(cheminPrive(`${B}/public/coran-pages/coran_pages/001.webp`)).toBeNull();
    expect(cheminPrive(`${B}/public/alphabet-content/lettres/voix-1.m4a`)).toBeNull();
    expect(cheminPrive(`${B}/public/recitations-old/x.mp4`)).toBeNull();
    expect(cheminPrive('blob:https://dinislam-app.vercel.app/1234')).toBeNull();
    expect(cheminPrive('data:audio/mp4;base64,AAAA')).toBeNull();
    expect(cheminPrive('/audio/ayat-al-kursi/002_e00.mp3')).toBeNull();
    expect(cheminPrive(`${B}/public/recitations/`)).toBeNull();
    expect(cheminPrive(null)).toBeNull();
    expect(cheminPrive('')).toBeNull();
  });
});

describe('lienPretTout', () => {
  it('rend tout de suite une adresse non privée, attend pour une adresse privée', () => {
    expect(lienPretTout(`${B}/public/sourate-content/x.mp3`)).toBe(`${B}/public/sourate-content/x.mp3`);
    expect(lienPretTout(`${B}/public/recitations/a/b.mp4`)).toBeUndefined();
    expect(lienPretTout(null)).toBeUndefined();
  });
});
