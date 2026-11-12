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
export const SAISONS_PRETES: Saison[] = ['automne', 'hiver', 'printemps', 'ete'];

export const NOM_SAISON: Record<Saison, string> = { hiver: '❄️ Hiver', printemps: '🌸 Printemps', ete: '☀️ Été', automne: '🍂 Automne' };
export const DATES_SAISON: Record<Saison, string> = { hiver: '1/12 → fin février', printemps: '1/03 → 31/05', ete: '1/06 → 31/08', automne: '1/09 → 30/11' };

export interface ReglagesAutomne {
  arbre: boolean; oiseaux: boolean; feuilles: boolean; devantDerriere: boolean;
  erable: boolean; chene: boolean; ginkgo: boolean; simple: boolean;
  vent: boolean; eclate: boolean; son: boolean; messageSemaine: boolean;
  cheminee: boolean; petitFeuJour: boolean; grandFeuSoir: boolean; transparente: boolean;
  bougies: boolean; feuillesPoutre: boolean; courge: boolean; buches: boolean; braises: boolean;
  images: boolean; couleurs: boolean;
  /** Tapis de feuilles en bas (à côté de la cheminée) + écureuil / hérisson qui alternent à chaque connexion (2026-11-04) */
  tapis: boolean; personnage: boolean; plongeon: boolean;
  /** Feuilles soufflées quand on fait défiler, pluie de glands/pommes de pin/feuilles à chaque validation, feuille dorée rare (2026-11-04) */
  ventDefile: boolean; pluieValidation: boolean; feuilleDoree: boolean;
  /** 🍁 7 grandes feuilles devant les cartes, lentes, faciles à attraper (2026-11-04) */
  grandesFeuilles: boolean;
}

/** ❄️ Hiver (maquette validée par Nadia le 2026-11-04 + effets 14 à 20) */
export interface ReglagesHiver {
  flocons: boolean; devantDerriere: boolean; eclate: boolean; son: boolean; messageSemaine: boolean;
  chalet: boolean; cheminee: boolean; petitFeuJour: boolean; grandFeuSoir: boolean; transparente: boolean; chocolat: boolean;
  neigeBas: boolean; lanternes: boolean; ours: boolean; personnage: boolean; traces: boolean; glissade: boolean;
  givre: boolean; givreMatin: boolean; neigeCartes: boolean; cielSoir: boolean; images: boolean; couleurs: boolean;
  /** 14 plongeon · 15 vent au défilement · 16 vitre givrée · 17 pluie dorée · 18 mot de l'ours · 19 neige sur le titre · 20 flocon doré */
  plongeon: boolean; ventDefile: boolean; vitre: boolean; pluieDoree: boolean; motOurs: boolean; neigeTitre: boolean; floconDore: boolean;
}

export const HIVER_DEFAUT: ReglagesHiver = {
  flocons: true, devantDerriere: true, eclate: true, son: true, messageSemaine: true,
  chalet: true, cheminee: true, petitFeuJour: true, grandFeuSoir: true, transparente: true, chocolat: true,
  neigeBas: true, lanternes: true, ours: true, personnage: true, traces: true, glissade: true,
  givre: true, givreMatin: true, neigeCartes: true, cielSoir: true, images: true, couleurs: true,
  plongeon: true, ventDefile: true, vitre: true, pluieDoree: true, motOurs: true, neigeTitre: true, floconDore: true,
};

/** 🌸☀️ Printemps et été (même principe que l'automne et l'hiver, demande de Nadia du 2026-11-04) */
export interface ReglagesClair {
  /** papillons et abeilles (printemps) / bulles (été) */
  volants: boolean;
  /** feuilles vertes et pétales qui tombent (printemps) / mouettes au loin (été) */
  tombants: boolean;
  devantDerriere: boolean; attraper: boolean; son: boolean; messageSemaine: boolean;
  soleil: boolean; nuages: boolean; lune: boolean;
  /** grand arbre (printemps) / palmiers et transat (été), en bas à droite */
  decor: boolean; transparente: boolean;
  /** prairie fleurie (printemps) / plage (été), en bas */
  bas: boolean; animal: boolean; plongeon: boolean; motDuJour: boolean;
  lucioles: boolean; cielSoir: boolean; rosee: boolean;
  images: boolean; couleurs: boolean; ventDefile: boolean; pluieValidation: boolean; rare: boolean;
  /** Ancien réglage « objet sur le logo » (remplacé le 2026-11-04 par `logo` dans ReglagesSaisons, gardé pour les anciennes données) */
  titre: boolean;
  /** Idée 2 (2026-11-04) : 1 minute sans toucher → petites fleurs qui poussent dans les coins (printemps) / reflets de soleil (été) */
  repos: boolean;
  /** Idée 4 : une coccinelle se promène sur le bord d'une carte de temps en temps (printemps) */
  coccinelle: boolean;
  /** Idée 5 : château de sable que le crabe construit petit à petit pendant la semaine (été) */
  chateau: boolean;
}
export const CLAIR_DEFAUT: ReglagesClair = {
  volants: true, tombants: true, devantDerriere: true, attraper: true, son: true, messageSemaine: true,
  soleil: true, nuages: true, lune: true, decor: true, transparente: true,
  bas: true, animal: true, plongeon: true, motDuJour: true, lucioles: true, cielSoir: true, rosee: true,
  images: true, couleurs: true, ventDefile: true, pluieValidation: true, rare: true, titre: true,
  repos: true, coccinelle: true, chateau: true,
};

/**
 * 🌧️🌈 Averse puis arc-en-ciel (idée 1, demande de Nadia du 2026-11-04, pour les 4 saisons).
 * - « parfois » : une petite averse de temps en temps (fréquence réglable), suivie d'un arc-en-ciel derrière le titre ;
 * - « periode » : il pleut en continu entre deux dates (ex. une semaine pluvieuse d'automne) ;
 * - « meteo » : il pleut dans l'appli quand il pleut VRAIMENT dans la ville des horaires de prière (Open-Meteo, sans clé),
 *   l'arc-en-ciel apparaît quand la pluie s'arrête et qu'il fait jour.
 */
export type ModeMeteo = 'parfois' | 'periode' | 'meteo';
export interface ReglagesMeteo {
  averse: boolean; arcEnCiel: boolean; mode: ModeMeteo;
  /** 1 rarement (≈ toutes les 30 min) · 2 de temps en temps (≈ 15 min) · 3 souvent (≈ 6 min) */
  frequence: number;
  /** 1 petite bruine · 2 averse · 3 grosse pluie */
  intensite: number;
  /** durée d'une averse « parfois » en secondes (15 à 90) */
  duree: number;
  /** période de pluie continue (AAAA-MM-JJ) */
  du: string; au: string;
  /** l'arc-en-ciel reste combien de secondes (10 à 60) */
  dureeArc: number;
  /** Hiver : tempête de flocons au lieu de la pluie */
  neige: boolean;
  /** Nuages un peu plus gris pendant l'averse */
  ciel: boolean;
  /** 💧 Nombre de gouttes : 1 très peu · 2 peu (défaut, « c'est trop » d'après Nadia le 2026-11-04) · 3 normal · 4 beaucoup · 5 énormément */
  gouttes: number;
  /** 💨 Vitesse de chute : 1 très lente · 2 lente (défaut) · 3 normale · 4 rapide · 5 très rapide */
  vitesseGouttes: number;
}
const METEO_BASE: ReglagesMeteo = { averse: true, arcEnCiel: true, mode: 'parfois', frequence: 1, intensite: 2, duree: 35, du: '', au: '', dureeArc: 25, neige: false, ciel: true, gouttes: 2, vitesseGouttes: 2 };
export const METEO_DEFAUT: Record<Saison, ReglagesMeteo> = {
  printemps: METEO_BASE, automne: METEO_BASE, hiver: METEO_BASE,
  // L'été : pas demandé par Nadia, prêt mais éteint
  ete: { ...METEO_BASE, averse: false },
};

/**
 * 🌼 Petit objet en haut à droite du logo (demande de Nadia du 2026-11-04) : pour chaque saison, on coche un ou plusieurs
 * objets ; s'il y en a plusieurs, ils ALTERNENT au rythme choisi (à chaque connexion, chaque jour, chaque semaine, chaque mois).
 * Aucun objet coché = rien sur le logo. Les dessins sont dans `src/components/saisons/objetsLogo.ts`.
 */
export type RythmeLogo = 'connexion' | 'jour' | 'semaine' | 'mois';
export interface ReglagesLogo { objets: string[]; rythme: RythmeLogo }
export const LOGO_DEFAUT: Record<Saison, ReglagesLogo> = {
  printemps: { objets: ['marguerite'], rythme: 'jour' },
  ete: { objets: ['lunettes'], rythme: 'jour' },
  automne: { objets: ['erable'], rythme: 'jour' },
  hiver: { objets: ['flocon'], rythme: 'jour' },
};

/**
 * 🎠 Petits jeux des décors (Nadia, 2026-11-11 : idées 2, 4, 6, 7, 9, 10 ; RIEN À GAGNER, juste des animations).
 * Mêmes jeux à chaque saison, avec le décor de la saison (src/components/saisons/JeuxSaison.tsx).
 */
export interface ReglagesJeux {
  /** 🦔 Le compagnon grandit à la 1ʳᵉ connexion du jour (1 fois par 24 h) */
  compagnon: boolean;
  /** 💬 … et parle : on touche le personnage qui se promène, il s'arrête 10 s et dit un message (2026-11-11) */
  parle: boolean;
  /** 🌳 L'arbre de la semaine : un fruit par devoir / lettre / leçon / sourate validé cette semaine */
  arbreSemaine: boolean;
  /** 🎁 Secoue l'arbre : une fois par jour, un fruit-surprise (un nom d'Allah à découvrir) */
  secoue: boolean;
  /** ❓ La question du coin du feu : une question par jour */
  questionFeu: boolean;
  /** 🔥 La flamme suit la semaine du cours (max mercredi 18 h, baisse chaque jour sans connexion) — automne et hiver */
  feuSemaine: boolean;
  /** 🪵 Une bûche par devoir validé de la semaine ; tous faits = grand feu */
  feuDevoirs: boolean;
  /** 🐈 Le chat et la théière autour du feu */
  feuDecor: boolean;
  /** ✨ Étincelles à la 1ʳᵉ visite du jour */
  feuEtincelles: boolean;
  /** 🙈 Cache-cache : l'animal se cache derrière une carte de l'accueil */
  cacheCache: boolean;
  /** Groupes concernés (vide = tout le monde) */
  groupes: string[];
}
export const JEUX_DEFAUT: ReglagesJeux = {
  compagnon: true, parle: true, arbreSemaine: true, secoue: true, questionFeu: true,
  feuSemaine: true, feuDevoirs: true, feuDecor: true, feuEtincelles: true, cacheCache: true, groupes: [],
};

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
  /** 🍂 Petit décor léger dans les pages autres que l'accueil (Nadia, 2026-11-12) */
  decorPages: boolean;
  /** Animer même si le téléphone a « Réduire les animations » (Nadia 2026-11-04 : tout était figé sur son iPhone) */
  animerToujours: boolean;
  /** Feuilles : 5 à 40 (18 = « Normal ») */
  quantite: number;
  /** 1 (très lente) à 5 (très rapide) */
  vitesse: number;
  /** 1 petit, 2 moyen, 3 grand */
  tailleArbre: number;
  automne: ReglagesAutomne;
  hiver: ReglagesHiver;
  printemps: ReglagesClair;
  ete: ReglagesClair;
  meteo: Record<Saison, ReglagesMeteo>;
  logo: Record<Saison, ReglagesLogo>;
  jeux: ReglagesJeux;
}

export const AUTOMNE_DEFAUT: ReglagesAutomne = {
  arbre: true, oiseaux: true, feuilles: true, devantDerriere: true,
  erable: true, chene: true, ginkgo: true, simple: true,
  vent: true, eclate: true, son: true, messageSemaine: true,
  cheminee: true, petitFeuJour: true, grandFeuSoir: true, transparente: true,
  bougies: true, feuillesPoutre: true, courge: true, buches: true, braises: true,
  images: true, couleurs: true, tapis: true, personnage: true, plongeon: true, ventDefile: true, pluieValidation: true, feuilleDoree: true, grandesFeuilles: true,
};

export const SAISONS_DEFAUT: ReglagesSaisons = {
  neutre: false, auto: true, saisonChoisie: 'automne', annonce: true, elevesPeuventCouper: true, ramadanDabord: true, themeSombre: false, pluieEtoiles: false, decorPages: true, animerToujours: true,
  quantite: 18, vitesse: 3, tailleArbre: 2, automne: AUTOMNE_DEFAUT, hiver: HIVER_DEFAUT, printemps: CLAIR_DEFAUT, ete: CLAIR_DEFAUT,
  meteo: METEO_DEFAUT, logo: LOGO_DEFAUT, jeux: JEUX_DEFAUT,
};

const TOUTES: Saison[] = ['hiver', 'printemps', 'ete', 'automne'];
function fusionParSaison<T extends object>(defaut: Record<Saison, T>, v: Partial<Record<Saison, Partial<T>>> | undefined): Record<Saison, T> {
  return Object.fromEntries(TOUTES.map((s) => [s, { ...defaut[s], ...(v?.[s] ?? {}) }])) as Record<Saison, T>;
}

export function fusionner(v: Partial<ReglagesSaisons> | null | undefined): ReglagesSaisons {
  return { ...SAISONS_DEFAUT, ...(v ?? {}), automne: { ...AUTOMNE_DEFAUT, ...(v?.automne ?? {}) }, hiver: { ...HIVER_DEFAUT, ...(v?.hiver ?? {}) },
    printemps: { ...CLAIR_DEFAUT, ...(v?.printemps ?? {}) }, ete: { ...CLAIR_DEFAUT, ...(v?.ete ?? {}) },
    meteo: fusionParSaison(METEO_DEFAUT, v?.meteo),
    jeux: { ...JEUX_DEFAUT, ...(v?.jeux ?? {}) },
    // Ancien réglage : si la marguerite / les lunettes avaient été décochées, on garde « rien sur le logo »
    logo: fusionParSaison(LOGO_DEFAUT, v?.logo ?? {
      ...(v?.printemps?.titre === false ? { printemps: { objets: [] } } : {}),
      ...(v?.ete?.titre === false ? { ete: { objets: [] } } : {}),
    }),
  };
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
      const { data, error } = await supabase.from('app_appearance').select('value').eq('key', 'saisons').maybeSingle();
      // ⚠️ 2026-11-07 (audit DETTE) : lecture ratée = erreur, JAMAIS des « valeurs par défaut » qu'un enregistrement écraserait ensuite
      if (error) throw error;
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


/** 🌧️ Admin : « ▶️ Essayer maintenant » l'averse sur CE téléphone (marche aussi si l'accueil n'est pas encore ouvert : il regarde au démarrage) */
export const EVT_ESSAI_AVERSE = 'dinislam:averse-essai';
export const CLE_ESSAI_AVERSE = 'dinislam_averse_essai';
export function essayerAverse() {
  try { localStorage.setItem(CLE_ESSAI_AVERSE, String(Date.now())); } catch { /* */ }
  window.dispatchEvent(new Event(EVT_ESSAI_AVERSE));
}
