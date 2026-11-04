/**
 * 🍂 Décorations de saison (2026-11-03, choix de Nadia, maquette https://claude.ai/artifact/R93KL8MeNpQtmC82qfjK5z).
 * Réglages pour tout le monde dans `app_appearance` (clé « saisons »), modifiables dans le bouclier › 🔧 Apparence appli ›
 * « Décorations saisons ». « Ambiance neutre » = l'appli exactement comme avant (aucun décor).
 * Saisons : hiver 1/12 → fin février, printemps 1/03 → 31/05, été 1/06 → 31/08, automne 1/09 → 30/11.
 * Pour l'instant seul l'automne est dessiné ; les autres saisons restent neutres tant qu'elles ne sont pas validées.
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { estRamadan } from '@/lib/apparence';

export type Saison = 'hiver' | 'printemps' | 'ete' | 'automne';
export const SAISONS_PRETES: Saison[] = ['automne'];

export const NOM_SAISON: Record<Saison, string> = { hiver: '❄️ Hiver', printemps: '🌸 Printemps', ete: '☀️ Été', automne: '🍂 Automne' };
export const DATES_SAISON: Record<Saison, string> = { hiver: '1/12 → fin février', printemps: '1/03 → 31/05', ete: '1/06 → 31/08', automne: '1/09 → 30/11' };

export interface ReglagesAutomne {
  arbre: boolean; oiseaux: boolean; feuilles: boolean; devantDerriere: boolean;
  erable: boolean; chene: boolean; ginkgo: boolean; simple: boolean;
  vent: boolean; eclate: boolean; son: boolean; messageSemaine: boolean;
  cheminee: boolean; petitFeuJour: boolean; grandFeuSoir: boolean; transparente: boolean;
  bougies: boolean; feuillesPoutre: boolean; courge: boolean; buches: boolean; braises: boolean;
  images: boolean; couleurs: boolean;
}

export interface ReglagesSaisons {
  /** « Ambiance neutre » : aucun décor, l'appli comme avant */
  neutre: boolean;
  /** Change de saison tout seul selon la date (sinon : `saisonChoisie`) */
  auto: boolean;
  saisonChoisie: Saison;
  annonce: boolean;
  elevesPeuventCouper: boolean;
  ramadanDabord: boolean;
  themeSombre: boolean;
  /** Pluie d'étoiles du titre pendant une saison décorée (non par défaut : « ça fait chargé avec les feuilles », Nadia 2026-11-04) */
  pluieEtoiles: boolean;
  /** Feuilles : 5 à 40 (18 = « Normal ») */
  quantite: number;
  /** 1 (très lente) à 5 (très rapide) */
  vitesse: number;
  /** 1 petit, 2 moyen, 3 grand */
  tailleArbre: number;
  automne: ReglagesAutomne;
}

export const AUTOMNE_DEFAUT: ReglagesAutomne = {
  arbre: true, oiseaux: true, feuilles: true, devantDerriere: true,
  erable: true, chene: true, ginkgo: true, simple: true,
  vent: true, eclate: true, son: true, messageSemaine: true,
  cheminee: true, petitFeuJour: true, grandFeuSoir: true, transparente: true,
  bougies: true, feuillesPoutre: true, courge: true, buches: true, braises: true,
  images: true, couleurs: true,
};

export const SAISONS_DEFAUT: ReglagesSaisons = {
  neutre: false, auto: true, saisonChoisie: 'automne', annonce: true, elevesPeuventCouper: true, ramadanDabord: true, themeSombre: false, pluieEtoiles: false,
  quantite: 18, vitesse: 3, tailleArbre: 2, automne: AUTOMNE_DEFAUT,
};

export function fusionner(v: Partial<ReglagesSaisons> | null | undefined): ReglagesSaisons {
  return { ...SAISONS_DEFAUT, ...(v ?? {}), automne: { ...AUTOMNE_DEFAUT, ...(v?.automne ?? {}) } };
}

/** La saison d'une date (mois 0 = janvier) */
export function saisonDuJour(d = new Date()): Saison {
  const m = d.getMonth();
  if (m === 11 || m <= 1) return 'hiver';
  if (m <= 4) return 'printemps';
  if (m <= 7) return 'ete';
  return 'automne';
}

export function useReglagesSaisons() {
  return useQuery({
    queryKey: ['app-appearance', 'saisons'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ReglagesSaisons> => {
      const { data } = await supabase.from('app_appearance').select('value').eq('key', 'saisons').maybeSingle();
      return fusionner(data?.value as Partial<ReglagesSaisons> | null);
    },
  });
}

/* ---------- Préférences de CE téléphone (élève ou admin) ---------- */
const CLE_COUPE = 'dinislam_deco_saison_off';
const CLE_APERCU = 'dinislam_deco_saison_apercu';
const EVT = 'dinislam-deco-saison';
const lire = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* stockage bloqué */ }
  window.dispatchEvent(new Event(EVT));
};
export const decorCoupe = () => lire(CLE_COUPE) === '1';
export const couperDecor = (off: boolean) => ecrire(CLE_COUPE, off ? '1' : null);
/** Admin : voir une autre saison sur son téléphone seulement */
export const apercuSaison = () => (lire(CLE_APERCU) as Saison | null) || null;
export const choisirApercu = (s: Saison | null) => ecrire(CLE_APERCU, s);

function usePrefsLocales() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const f = () => setN((x) => x + 1);
    window.addEventListener(EVT, f); window.addEventListener('storage', f);
    return () => { window.removeEventListener(EVT, f); window.removeEventListener('storage', f); };
  }, []);
  return n;
}

/** La saison à afficher maintenant (null = ambiance neutre) */
export function useSaisonActive(): { saison: Saison | null; r: ReglagesSaisons } {
  const { data: r = SAISONS_DEFAUT } = useReglagesSaisons();
  usePrefsLocales();
  const apercu = apercuSaison();
  let saison: Saison | null = apercu ?? (r.auto ? saisonDuJour() : r.saisonChoisie);
  if (!apercu) {
    if (r.neutre) saison = null;
    else if (r.ramadanDabord && estRamadan()) saison = null;
    else if (r.elevesPeuventCouper && decorCoupe()) saison = null;
  }
  const sombre = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  if (sombre && !r.themeSombre) saison = null;
  if (saison && !SAISONS_PRETES.includes(saison)) saison = null;
  return { saison, r };
}

/** Lundi (00:00) de la semaine d'une date : sert au message « attrape les feuilles », une fois par semaine */
export function lundiDeLaSemaine(d = new Date()): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

