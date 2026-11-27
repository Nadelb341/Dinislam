import { useEffect, useState } from 'react';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import {
  ajouterAuCarnet, cleCarnet, cleJour, cleJournee, ecrireLocal, EVT_DHIKR, lireLocal, marquerJournee,
  type Carnet, type JourneeDhikr, type MomentCarnet,
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
export async function noterDhikr(uid: string | null | undefined, o: { moment: MomentCarnet; nombre: number; journee?: string; serie?: 'matin' | 'soir' | 'reveil' }) {
  if (!uid) return;
  const maintenant = new Date();
  ecrireLocal(cleCarnet(uid), ajouterAuCarnet(lireLocal<Carnet>(cleCarnet(uid)), maintenant, o.moment, o.nombre));
  if (o.journee) ecrireLocal(cleJournee(uid), marquerJournee(lireLocal<JourneeDhikr>(cleJournee(uid)), maintenant, o.journee));
  if (o.serie) {
    try {
      await ecrireOuGarder({ table: 'dhikr_series_faites', op: 'upsert', rows: [{ user_id: uid, serie: o.serie, jour: cleJour(maintenant) }] });
    } catch (e) { console.error('[Dhikr] série non enregistrée', e); }
  }
}
