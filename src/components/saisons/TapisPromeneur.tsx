import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSaisonActive } from '@/lib/saisons';
import { COMPAGNONS, compagnonSvg } from './dessinsRamadan';

/**
 * 🧞 Le tapis volant se promène dans TOUTE l'appli pendant la saison Ramadan (Nadia, 2026-11-17 : « qu'il vole lentement
 * dans toute l'application, comme s'il se promenait, et qu'il puisse apparaître quelques secondes dans les autres pages »).
 * De temps en temps (toutes les 35 à 75 s), il traverse l'écran lentement, à une hauteur et dans un sens au hasard,
 * en ondulant. Il ne se touche pas et ne cache rien (aucun clic bloqué). Pas sur l'accueil si le compagnon du jour est
 * déjà le tapis. Réglage : Décorations des saisons › Ramadan › « 🧞 Tapis volant qui se promène dans l'appli ».
 */
type Passage = { id: number; haut: number; versGauche: boolean; duree: number };

export function TapisPromeneur() {
  const { pathname } = useLocation();
  const { saison, r } = useSaisonActive();
  const accueil = pathname === '/';
  const reduit = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const compagnonTapis = useMemo(() => { try { return sessionStorage.getItem('dinislam_ramadan_compagnon') === 'tapis'; } catch { return false; } }, []);
  const actif = saison === 'ramadan' && r.ramadan.tapisPromeneur !== false && (!reduit || r.animerToujours) && !(accueil && compagnonTapis);
  const svg = useMemo(() => compagnonSvg('tapis', 'promeneur'), []);
  const [passage, setPassage] = useState<Passage | null>(null);

  useEffect(() => {
    if (!actif) { setPassage(null); return; }
    let t = 0;
    let n = 0;
    const prevoir = (attente: number) => {
      t = window.setTimeout(() => {
        if (document.hidden) { prevoir(10000); return; }
        // Plus lent sur l'accueil (il s'y promène), plus court ailleurs (« quelques secondes »)
        const duree = accueil ? 24 : 14;
        setPassage({ id: ++n, haut: 18 + Math.random() * 44, versGauche: Math.random() < 0.5, duree });
        t = window.setTimeout(() => { setPassage(null); prevoir(35000 + Math.random() * 40000); }, duree * 1000 + 300);
      }, attente);
    };
    prevoir(6000 + Math.random() * 10000);
    return () => clearTimeout(t);
  }, [actif, accueil]);

  if (!actif || !passage) return null;
  const [w, h] = COMPAGNONS.tapis.vb;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[35] overflow-hidden">
      <div key={passage.id} className={`tapis-promeneur absolute ${passage.versGauche ? 'vers-gauche' : ''}`}
        style={{ top: `${passage.haut}%`, animationDuration: `${passage.duree}s` }}>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-[40px] w-[75px] overflow-visible" style={passage.versGauche ? { transform: 'scaleX(-1)' } : undefined}
          dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  );
}
