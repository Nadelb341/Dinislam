import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccesPetits, useReglage } from '@/hooks/usePetits';
import { useVillePriere } from '@/hooks/useVillePriere';
import { getSavedMethod, usePrayerTimesCity } from '@/hooks/usePrayerTimesCity';
import { calques, EVT_MODE_FOND, fondDuJour, lireModeFond, REGLAGE_FONDS_DEFAUT, svgFond, type Fond, type ReglageFonds } from '@/lib/fondsEcran';

/** Voile du couchant (pêche → rose → violet) et de l'aube (rose → crème) */
export const VOILE_COUCHANT = 'linear-gradient(180deg, #ffb38a 0%, #f7a8a8 45%, #9b7fd6 100%)';
export const VOILE_AUBE = 'linear-gradient(180deg, #f5c3b4 0%, #fff0d6 100%)';

/** Les calques d'un fond (jour, nuit, voile) : sert au vrai fond ET aux aperçus de l'enseignante */
export function CalquesFond({ jour, nuit, opNuit, voile, aube, uid, vendredi }: {
  jour: Fond | null; nuit: Fond | null; opNuit: number; voile: number; aube: boolean; uid: string; vendredi: boolean;
}) {
  const svgJour = useMemo(() => (jour ? svgFond(jour, `${uid}j`, vendredi) : ''), [jour, uid, vendredi]);
  const svgNuit = useMemo(() => (nuit ? svgFond(nuit, `${uid}n`) : ''), [nuit, uid]);
  const base = jour ?? nuit;
  return (
    <>
      {base && <div className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: jour ? svgJour : svgNuit }} />}
      {jour && nuit && opNuit > 0 && <div className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full transition-opacity duration-1000" style={{ opacity: opNuit }} dangerouslySetInnerHTML={{ __html: svgNuit }} />}
      {voile > 0 && <div className="absolute inset-0 transition-opacity duration-1000" style={{ background: aube ? VOILE_AUBE : VOILE_COUCHANT, opacity: voile, mixBlendMode: 'soft-light' }} />}
    </>
  );
}

/**
 * 🖼️ Le fond d'écran derrière toute l'appli (Nadia, 22/11) : tout-petits ou grands, jour → couchant → nuit → aube selon
 * les heures de prière de SA ville ; un fond différent chaque jour parmi ceux que l'enseignante garde actifs.
 * Chaque appareil peut choisir « animé / fixe / sans fond » (Paramètres). Mode sombre du téléphone : toujours la nuit.
 */
export function FondEcran() {
  const { user, isAdmin } = useAuth();
  const acces = useAccesPetits(user?.id, isAdmin);
  const { valeur: r } = useReglage<ReglageFonds>('fonds_ecran', REGLAGE_FONDS_DEFAUT);
  const [mode, setMode] = useState(lireModeFond());
  const { ville } = useVillePriere();
  const { prayerTimes } = usePrayerTimesCity(ville, getSavedMethod());
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [sombre, setSombre] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => { const t = setInterval(() => setMaintenant(Date.now()), 60_000); return () => clearInterval(t); }, []);
  useEffect(() => { const f = () => setMode(lireModeFond()); window.addEventListener(EVT_MODE_FOND, f); return () => window.removeEventListener(EVT_MODE_FOND, f); }, []);
  useEffect(() => {
    const o = new MutationObserver(() => setSombre(document.documentElement.classList.contains('dark')));
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => o.disconnect();
  }, []);

  const petits = acces.aAccueil;
  const jourDate = new Date(maintenant);
  const jour = fondDuJour(petits ? 'jp' : 'jg', r.actifs, jourDate);
  const nuit = fondDuJour(petits ? 'np' : 'ng', r.actifs, jourDate);
  const actif = !!user && r.actif && mode !== 'aucun' && !!(jour || nuit);

  const minuit = new Date(jourDate); minuit.setHours(0, 0, 0, 0);
  const fajr = prayerTimes?.fajrDate.getTime() ?? minuit.getTime() + 6 * 3600_000;
  const maghrib = prayerTimes?.maghribDate.getTime() ?? minuit.getTime() + 18 * 3600_000;
  const c = sombre ? { nuit: 1, voile: 0, moment: 'nuit' as const } : calques(maintenant, fajr, maghrib);
  const opNuit = jour ? c.nuit : 1;
  const voile = jour && nuit ? c.voile : 0;
  // 🌙 Fond de nuit avec l'appli en clair : les textes posés directement sur le fond passent en clair (sinon « Retour »,
  // titres et phrases grises deviennent invisibles, Nadia 24/11). Les cartes gardent leurs couleurs (index.css).
  const nuitVisible = actif && opNuit >= 0.5;

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('fond-actif', actif);
    html.classList.toggle('fond-anime', actif && mode === 'anime');
    html.classList.toggle('fond-nuit', nuitVisible);
    return () => { html.classList.remove('fond-actif', 'fond-anime', 'fond-nuit'); };
  }, [actif, mode, nuitVisible]);
  if (!actif) return null;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <CalquesFond jour={jour} nuit={nuit} opNuit={opNuit} voile={voile} aube={c.moment === 'aube'} uid="fe" vendredi={jourDate.getDay() === 5} />
    </div>
  );
}
