import { describe, expect, it, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { VOIX_FABRIQUEES } from '@/data/voixFabriquees';
import { fichierVoix, jouerFichier, normaliserTexteVoix } from '@/lib/voixFabriquees';

describe('voix fabriquées', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('retire les emojis et resserre les espaces', () => {
    expect(normaliserTexteVoix('🐘  Un   éléphant ')).toBe('Un éléphant');
    expect(normaliserTexteVoix('🌧️ La pluie')).toBe('La pluie');
    expect(normaliserTexteVoix('بِسْمِ اللَّهِ')).toBe('بِسْمِ اللَّهِ');
  });

  it('la règle du script de fabrication est la même que celle de l’appli', () => {
    const lire = (f: string) => fs.readFileSync(path.resolve(__dirname, f), 'utf8');
    const motif = (src: string) => src.split('\n').find((l) => l.includes('Extended_Pictographic'))?.trim();
    const appli = motif(lire('./voixFabriquees.ts'));
    expect(appli).toBeTruthy();
    expect(motif(lire('../../scripts/fabriquer-voix.mjs'))).toBe(appli);
  });

  it('chaque clé de l’index est déjà normalisée et chaque fichier existe', () => {
    for (const [voix, langues] of Object.entries(VOIX_FABRIQUEES)) {
      for (const table of Object.values(langues)) {
        for (const [cle, nom] of Object.entries(table)) {
          expect(normaliserTexteVoix(cle)).toBe(cle);
          expect(fs.existsSync(path.resolve(__dirname, `../../public/sons/voix/${voix}/${nom}`))).toBe(true);
        }
      }
    }
  });

  it('trouve le fichier d’un texte connu, même avec un emoji, et rien sinon', () => {
    const [cle, nom] = Object.entries(VOIX_FABRIQUEES.jamal.fr)[0] ?? [];
    if (cle) expect(fichierVoix(`⭐ ${cle}`, 'fr', 'jamal')).toBe(`/sons/voix/jamal/${nom}`);
    expect(fichierVoix('Une phrase jamais fabriquée', 'fr', 'jamal')).toBeNull();
    if (cle) expect(fichierVoix(cle, 'fr', null)).toBeNull();
  });

  it('passe à la suite une seule fois si le son ne se lit pas (hors ligne, jamais entendu)', async () => {
    const ecouteurs: Record<string, () => void> = {};
    class FauxAudio {
      addEventListener(n: string, f: () => void) { ecouteurs[n] = f; }
      pause() {}
      play() { return Promise.reject(new Error('hors ligne')); }
    }
    vi.stubGlobal('Audio', FauxAudio);
    const suite = vi.fn();
    jouerFichier('/sons/voix/jamal/x.mp3', suite);
    ecouteurs.error?.();
    await Promise.resolve(); await Promise.resolve();
    expect(suite).toHaveBeenCalledTimes(1);
  });
});
