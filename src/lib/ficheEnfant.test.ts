import { describe, expect, it } from 'vitest';
import fichesEnfants from '../../supabase/data/allah_names_fiches_enfants_2026-11-27.json';
import { ageDe, lireFicheEnfant, versionPourEleve } from './ficheEnfant';

describe('version des 99 noms pour un élève', () => {
  it('suit l’âge : 3-6 petit, 7-12 enfant, 13+ adulte, inconnu = enfant', () => {
    expect(versionPourEleve(4, 'auto')).toBe('petit');
    expect(versionPourEleve(6, null)).toBe('petit');
    expect(versionPourEleve(7, 'auto')).toBe('enfant');
    expect(versionPourEleve(12, 'auto')).toBe('enfant');
    expect(versionPourEleve(13, 'auto')).toBe('adulte');
    expect(versionPourEleve(null, 'auto')).toBe('enfant');
  });
  it('le choix de l’enseignante passe avant l’âge', () => {
    expect(versionPourEleve(35, 'enfant')).toBe('enfant');
    expect(versionPourEleve(8, 'adulte')).toBe('adulte');
  });
  it('calcule l’âge avec la date de naissance, sinon l’âge saisi', () => {
    const jour = new Date(2026, 10, 27);
    expect(ageDe({ date_of_birth: '2016-11-28' }, jour)).toBe(9);
    expect(ageDe({ date_of_birth: '2016-11-27' }, jour)).toBe(10);
    expect(ageDe({ age: 14 }, jour)).toBe(14);
    expect(ageDe({}, jour)).toBeNull();
  });
});

describe('fiches enfant (copie de la migration)', () => {
  const fiches = fichesEnfants as Record<string, unknown>[];
  it('98 fiches lisibles, toutes à relire, Al-Ahad absent', () => {
    expect(fiches).toHaveLength(98);
    expect(fiches.some((f) => f.numero_appli === 67)).toBe(false);
    for (const f of fiches) {
      const e = lireFicheEnfant(f);
      expect(e).not.toBeNull();
      expect(e!.a_relire).toBe(true);
    }
  });
  it('nom discuté = phrase de prudence et « Je dis » sans « Ô Allah, Al-… »', () => {
    for (const f of fiches) {
      const e = lireFicheEnfant(f)!;
      if (e.statut === 'etabli') expect(e.prudence).toBeNull();
      else {
        expect(e.prudence).toMatch(/pas tous d'accord/);
        expect(e.dire.startsWith('Ô Allah,')).toBe(true);
        expect(e.dire).not.toContain(e.translit);
      }
    }
  });
  it('jamais « Allah est comme » ni de nombre de répétitions', () => {
    for (const f of fiches) {
      const e = lireFicheEnfant(f)!;
      const tout = `${e.sens} ${e.comme} ${e.faire} ${e.dire}`;
      expect(tout).not.toMatch(/Allah est comme|fois par jour|\d+ fois/i);
    }
  });
});
