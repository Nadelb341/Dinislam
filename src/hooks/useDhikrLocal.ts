import { useEffect, useState } from 'react';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import {
  ajouterAuCarnet, carnetALHeure, cleCarnet, cleJour, cleJournee, ecrireLocal, EVT_DHIKR, lireLocal, marquerJournee, resumeSemaine, semaineVide,
  type Carnet, type JourneeDhikr, type MomentCarnet, type SemaineCarnet,
} from '@/lib/dhikr';

/**
 * 📿 Petits outils de la carte Dhikr SANS le contenu (léger : utilisé aussi par la petite carte de l'accueil).
 * Tout est lu sur l'appareil (marche sans réseau).
 */

/** Une valeur gardée sur l'appareil, relue quand elle change (même onglet ou autre onglet) */
export function useLocal<T>(cle: string | null): T | null {
  const [v, setV] = useState<T | null>(() => (cle ? lireLocal<T>(cle) : null));
  useEffect(() => {
    if (!cle) { setV(null); return; }
    setV(lireLocal<T>(cle));
    const relire = (e: Event) => {
      const k = (e as CustomEvent<string>).detail ?? (e as StorageEvent).key;
      if (!k || k === cle) setV(lireLocal<T>(cle));
    };
    window.addEventListener(EVT_DHIKR, relire);
    window.addEventListener('storage', relire);
    return () => { window.removeEventListener(EVT_DHIKR, relire); window.removeEventListener('storage', relire); };
  }, [cle]);
  return v;
}

/** L'heure, rafraîchie chaque minute (pour la remise à zéro et la carte de l'accueil) */
export function useMaintenant(pas = 60_000) {
  const [m, setM] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setM(new Date()), pas); return () => clearInterval(t); }, [pas]);
  return m;
}

/** Ce qui est fait aujourd'hui (séries, dhikr du quotidien) */
export function useJournee(uid: string | null | undefined) {
  return useLocal<JourneeDhikr>(uid ? cleJournee(uid) : null);
}

/**
 * Un dhikr terminé : ajouté au carnet de la semaine, noté dans la journée (petite carte de l'accueil),
 * et pour une SÉRIE du matin / du soir terminée : une ligne en base (une par jour) qui donne les points du barème.
 * Sans réseau : la ligne est gardée et envoyée au retour du réseau (`ecrireOuGarder`).
 */
export async function noterDhikr(uid: string | null | undefined, o: {
  moment: MomentCarnet; nombre: number; journee?: string; serie?: 'matin' | 'soir' | 'reveil';
  /** Quel dhikr (pour les totaux par dhikr que voit l'enseignante) */
  dhikr?: { cle: string; titre: string } | null;
}) {
  if (!uid) return;
  const maintenant = new Date();
  const carnet = ajouterAuCarnet(lireLocal<Carnet>(cleCarnet(uid)), maintenant, o.moment, o.nombre, o.dhikr);
  ecrireLocal(cleCarnet(uid), carnet);
  void envoyerSemaine(uid, carnet.courante);
  if (o.journee) ecrireLocal(cleJournee(uid), marquerJournee(lireLocal<JourneeDhikr>(cleJournee(uid)), maintenant, o.journee));
  if (o.serie) {
    try {
      await ecrireOuGarder({ table: 'dhikr_series_faites', op: 'upsert', rows: [{ user_id: uid, serie: o.serie, jour: cleJour(maintenant) }] });
    } catch (e) { console.error('[Dhikr] série non enregistrée', e); }
  }
}

/**
 * 📒 Le carnet de la semaine envoyé EN BASE (Nadia, 27/11 : l'enseignante le voit dans la fiche de l'élève).
 * Une ligne par élève et par semaine (`dhikr_carnet_semaines`), remplacée à chaque dhikr par la photo complète de la semaine.
 * Sans réseau : gardée sur l'appareil (UNE seule écriture en attente par semaine) et envoyée au retour du réseau.
 * N'a aucun effet sur les points.
 */
export async function envoyerSemaine(uid: string, s: SemaineCarnet | null | undefined) {
  if (!s || semaineVide(s)) return;
  const r = resumeSemaine(s);
  try {
    await ecrireOuGarder({
      table: 'dhikr_carnet_semaines', op: 'upsert', cle: `${uid}|${r.semaine}`,
      rows: [{ user_id: uid, ...r, updated_at: new Date().toISOString() }],
    });
  } catch (e) { console.error('[Dhikr] carnet non envoyé', e); }
}

/** Au 1er affichage de la carte (une fois par visite) : envoie aussi ce qui était déjà dans le carnet de l'appareil (cette semaine + la passée) */
export function envoyerCarnetUneFois(uid: string | null | undefined) {
  if (!uid) return;
  const cle = `dinislam_dhikr_carnet_envoye_${uid}`;
  try { if (sessionStorage.getItem(cle)) return; sessionStorage.setItem(cle, '1'); } catch { /* stockage indisponible : on envoie quand même */ }
  const c = carnetALHeure(lireLocal<Carnet>(cleCarnet(uid)), new Date());
  void envoyerSemaine(uid, c.precedente);
  void envoyerSemaine(uid, c.courante);
}
