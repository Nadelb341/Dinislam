import { describe, it, expect } from 'vitest';
import { libelleHeure, lienSms, lienWhatsApp, numeroPour, prenomDe, rendreConvocation } from '@/lib/convocations';

describe('convocations', () => {
  it('remplace les variables (avec ou sans accent)', () => {
    expect(rendreConvocation('Salam {prénom}, cours {jour} à {heure} ({groupe}). {prenom} !', { prenom: 'Bilal', groupe: 'Groupe 2', jour: 'mercredi 18 novembre', heure: '14 h' }))
      .toBe('Salam Bilal, cours mercredi 18 novembre à 14 h (Groupe 2). Bilal !');
  });
  it('frise de la saison en haut et en bas (11 images, 2 qui alternent)', () => {
    const v = { prenom: 'Bilal', groupe: 'G', jour: 'j', heure: 'h' };
    expect(rendreConvocation('{frise}\nSalam {prénom} {saison}\n{frise}', v, new Date(2026, 10, 11)))
      .toBe('🪵🍂🪵🍂🪵🍂🪵🍂🪵🍂🪵\nSalam Bilal 🍂\n🪵🍂🪵🍂🪵🍂🪵🍂🪵🍂🪵');
    expect(rendreConvocation('{frise}', v, new Date(2026, 11, 25))).toBe('❄️⛄❄️⛄❄️⛄❄️⛄❄️⛄❄️');
    expect(rendreConvocation('{saison}', v, new Date(2026, 3, 1))).toBe('🌸');
    expect(rendreConvocation('{saison}', v, new Date(2026, 6, 1))).toBe('☀️');
  });
  it('heure et prénom', () => {
    expect(libelleHeure(new Date(2026, 10, 18, 13, 30))).toBe('13 h 30');
    expect(libelleHeure(new Date(2026, 10, 18, 14, 0))).toBe('14 h');
    expect(prenomDe('Wiam ELB')).toBe('Wiam');
  });
  it('liens WhatsApp et SMS avec le message', () => {
    expect(lienWhatsApp('06 12 34 56 78', 'Salam !')).toBe('https://wa.me/33612345678?text=Salam%20!');
    expect(lienSms('06 12 34 56 78', 'Salam !')).toBe('sms:0612345678?&body=Salam%20!');
  });
  it('numéro du bon destinataire, rien si vide', () => {
    const p = { phone: '', parent_phone: '06 11 22 33 44', parent2_phone: null };
    expect(numeroPour(p, 'eleve')).toBeNull();
    expect(numeroPour(p, 'parent1')).toBe('06 11 22 33 44');
    expect(numeroPour(p, 'parent2')).toBeNull();
  });
});
