import { describe, expect, it } from 'vitest';
import { rangerVilles, villeDuProfil } from './ville';

describe('📍 Ville', () => {
  it('Tanger : le Maroc avant l\'Indonésie, libellés clairs', () => {
    const v = rangerVilles([
      { name: 'Tangerang', admin2: 'Kota Tangerang', country_code: 'ID', latitude: -6, longitude: 106, timezone: 'Asia/Jakarta' },
      { name: 'Tanger', admin1: 'Tanger-Tétouan-Al Hoceïma', admin2: 'Tanger-Assilah', country_code: 'MA', latitude: 35.7, longitude: -5.8, timezone: 'Africa/Casablanca' },
    ]);
    expect(v[0].label).toBe('Tanger (Tanger-Assilah, Maroc)');
    expect(v[0].fuseau).toBe('Africa/Casablanca');
  });
  it('France : « Nébian (Hérault) »', () => {
    expect(rangerVilles([{ name: 'Nébian', admin1: 'Occitanie', admin2: 'Hérault', country_code: 'FR', latitude: 43.6, longitude: 3.43 }])[0].label).toBe('Nébian (Hérault)');
  });
  it('ville sans coordonnées = introuvable', () => {
    expect(villeDuProfil({ city: 'Paulan', ville_lat: null, ville_lon: null })).toBeNull();
    expect(villeDuProfil({ city: 'Nébian (Hérault)', ville_lat: 43.6, ville_lon: 3.43, ville_pays: 'FR' })).toEqual({ label: 'Nébian (Hérault)', country: 'FR', lat: 43.6, lon: 3.43 });
  });
});
