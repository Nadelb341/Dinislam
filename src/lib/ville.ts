import type { CityOption } from '@/hooks/usePrayerTimesCity';

/**
 * 📍 Ville de l'élève (Nadia, 2026-11-15) : tapée à l'inscription ou dans « Paramètres du profil », cherchée dans le service
 * GRATUIT et sans clé d'Open-Meteo (nom, région, pays, coordonnées, fuseau). Les horaires de prière suivent cette ville tout seuls.
 * Recherche = Internet nécessaire ; ensuite tout est gardé (horaires calculés dans l'appli).
 */
export type VilleTrouvee = { label: string; nom: string; region: string; pays: string; lat: number; lon: number; fuseau: string };

// Pays des élèves d'abord (une recherche « Tanger » propose sinon une ville d'Indonésie en premier)
const PAYS_D_ABORD = ['FR', 'MA', 'BE', 'CH', 'DZ', 'TN', 'ES', 'GB', 'DE', 'NL', 'IT', 'CA'];
const NOM_PAYS: Record<string, string> = { FR: 'France', MA: 'Maroc', BE: 'Belgique', CH: 'Suisse', DZ: 'Algérie', TN: 'Tunisie', ES: 'Espagne', GB: 'Royaume-Uni', DE: 'Allemagne', NL: 'Pays-Bas', IT: 'Italie', CA: 'Canada' };

type Resultat = { name: string; admin1?: string; admin2?: string; country_code: string; country?: string; latitude: number; longitude: number; timezone?: string; population?: number };

export function rangerVilles(res: Resultat[]): VilleTrouvee[] {
  const rang = (r: Resultat) => { const i = PAYS_D_ABORD.indexOf(r.country_code); return i === -1 ? 99 : i; };
  return [...res]
    .sort((a, b) => rang(a) - rang(b) || (b.population ?? 0) - (a.population ?? 0))
    .map((r) => {
      const region = r.admin2 || r.admin1 || '';
      const pays = r.country_code;
      const suffixe = pays === 'FR' ? region : [region, NOM_PAYS[pays] ?? r.country ?? pays].filter(Boolean).join(', ');
      return { label: suffixe ? `${r.name} (${suffixe})` : r.name, nom: r.name, region, pays, lat: r.latitude, lon: r.longitude, fuseau: r.timezone || 'Europe/Paris' };
    });
}

export async function chercherVilles(texte: string): Promise<VilleTrouvee[]> {
  const t = texte.trim();
  if (t.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(t)}&count=8&language=fr&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('recherche');
  const json = (await res.json()) as { results?: Resultat[] };
  return rangerVilles(json.results ?? []).slice(0, 5);
}

/** Ville du profil utilisable pour la prière (null = pas de ville, ou ville introuvable) */
export function villeDuProfil(p: { city?: string | null; ville_lat?: number | null; ville_lon?: number | null; ville_pays?: string | null } | null | undefined): CityOption | null {
  if (!p?.city || p.ville_lat == null || p.ville_lon == null) return null;
  return { label: p.city, country: p.ville_pays || 'FR', lat: p.ville_lat, lon: p.ville_lon };
}

/** Champs à enregistrer dans le profil pour une ville choisie */
export const champsVille = (v: VilleTrouvee) => ({ city: v.label, ville_lat: v.lat, ville_lon: v.lon, ville_pays: v.pays, ville_fuseau: v.fuseau });
