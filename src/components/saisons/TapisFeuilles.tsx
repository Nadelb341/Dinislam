import { useEffect, useMemo, useState } from 'react';
import type { ReglagesAutomne } from '@/lib/saisons';
import { ERABLE, IMAGES_AUTOMNE } from './dessinsAutomne';

/**
 * 🍂 Tapis de feuilles en bas de l'accueil, à gauche de la cheminée (demande de Nadia 2026-11-04).
 * - un tapis de feuilles posé au sol + un petit tas plus haut
 * - un écureuil OU un hérisson (ils alternent à chaque connexion) arrive, se promène,
 *   plonge dans le tas : les feuilles sautent tout autour ; puis il ressort et repart
 * Rien ne bloque un toucher (pointer-events: none). « Réduire les animations » = personnage assis, immobile.
 */

const COUL = ['#b5562b', '#c98a2b', '#7a4a2a', '#d9a441', '#a8432a', '#e07b2e', '#8c3a1c', '#e8b04a'];
const CYCLE = 26; // secondes pour un aller-retour complet

/** Hasard reproductible (le tapis ne « saute » pas à chaque affichage) */
function hasard(graine: number) {
  let s = graine;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/** Écureuil ou hérisson : on change à chaque nouvelle connexion (gardé le temps de la session) */
function choisirPersonnage(userId: string | null): 'ecureuil' | 'herisson' {
  const cle = `dinislam_tapis_perso_${userId ?? 'invite'}`;
  try {
    const session = sessionStorage.getItem(cle);
    if (session === 'ecureuil' || session === 'herisson') return session;
    const avant = localStorage.getItem(cle);
    const p = avant === 'ecureuil' ? 'herisson' : 'ecureuil';
    localStorage.setItem(cle, p); sessionStorage.setItem(cle, p);
    return p;
  } catch { return 'ecureuil'; }
}

const feuilleSvg = (x: number, y: number, rot: number, s: number, c: string, op = 1) =>
  `<path d="${ERABLE}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${s.toFixed(2)}) translate(-20 -20)" fill="${c}" opacity="${op}" stroke="#6b3a1c" stroke-opacity=".55" stroke-width="${(0.7 / s).toFixed(1)}" stroke-linejoin="round"/>`;

export function TapisFeuilles({ a, userId, calme, defile, largeurCheminee }: {
  a: ReglagesAutomne; userId: string | null; calme: boolean; defile: boolean; largeurCheminee: number;
}) {
  const [W, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 390));
  useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  const perso = useMemo(() => choisirPersonnage(userId), [userId]);

  // Largeur du tapis = écran moins la cheminée (on la chevauche un peu pour que ça se touche)
  const L = Math.max(160, W - largeurCheminee + 18);
  const H = 44;
  const tasX = Math.round(L * 0.58); // le tas : un peu à droite du milieu, avant la cheminée

  const tapis = useMemo(() => {
    const r = hasard(L * 7 + 13);
    let s = '';
    // fond du tapis : petit relief brun-orangé
    s += `<path d="M0 ${H}V${H - 12}C${L * 0.1} ${H - 17} ${L * 0.2} ${H - 11} ${L * 0.32} ${H - 15}S${L * 0.5} ${H - 12} ${tasX - 46} ${H - 16}C${tasX - 28} ${H - 34} ${tasX + 28} ${H - 34} ${tasX + 46} ${H - 16}S${L * 0.9} ${H - 12} ${L} ${H - 14}V${H}Z" fill="#c9773a" opacity=".9"/>`;
    // feuilles couchées sur tout le tapis
    const n = Math.round(L / 9);
    for (let i = 0; i < n; i++) {
      const x = r() * L, prox = Math.max(0, 1 - Math.abs(x - tasX) / 46);
      const y = H - 4 - r() * (9 + prox * 20);
      s += feuilleSvg(x, y, r() * 360, 0.26 + r() * 0.16, COUL[Math.floor(r() * COUL.length)]);
    }
    // le tas, bien bombé (devant le personnage quand il plonge)
    let tas = '';
    for (let i = 0; i < 26; i++) {
      const ang = Math.PI * r(), rr = 6 + r() * 34;
      tas += feuilleSvg(tasX + Math.cos(ang) * rr, H - 8 - Math.sin(ang) * rr * 0.55, r() * 360, 0.3 + r() * 0.16, COUL[Math.floor(r() * COUL.length)]);
    }
    return { fond: s, tas };
  }, [L, tasX]);

  // Feuilles qui sautent quand il plonge (et un petit peu quand il ressort)
  const eclats = useMemo(() => {
    const r = hasard(99);
    return Array.from({ length: 16 }, (_, i) => ({
      dx: (r() - 0.5) * 150, dy: -(34 + r() * 60), rot: (r() - 0.5) * 720, c: COUL[i % COUL.length], s: 11 + r() * 7, ressort: i >= 11,
    }));
  }, []);

  if (!a.tapis) return null;
  const montrerPerso = a.personnage;
  const anime = !calme;
  const img = IMAGES_AUTOMNE[perso].svg;

  return (
    <div className="fixed bottom-0 left-0 z-[28] transition-opacity duration-500"
      style={{ width: L, height: H + 30, marginBottom: 'env(safe-area-inset-bottom, 0px)', opacity: defile ? 0.3 : 1, ['--tas' as string]: `${tasX}px`, ['--cycle' as string]: `${CYCLE}s` }}>
      <svg className="absolute bottom-0 left-0" width={L} height={H} viewBox={`0 0 ${L} ${H}`} dangerouslySetInnerHTML={{ __html: tapis.fond }} />

      {montrerPerso && (
        <div className={`absolute bottom-[6px] left-0 ${anime ? `saison-perso-marche ${a.plongeon ? 'plonge' : ''}` : ''}`}
          style={anime ? undefined : { transform: `translateX(${tasX - 64}px)` }}>
          <div className={anime ? `saison-perso-pas ${perso === 'ecureuil' ? 'saute' : ''}` : ''}>
            <svg viewBox="0 0 48 48" width={36} height={36} style={{ filter: 'drop-shadow(0 1.5px 1px rgba(60,30,10,.25))' }} dangerouslySetInnerHTML={{ __html: img }} />
          </div>
        </div>
      )}

      {/* le tas passe DEVANT le personnage : on le voit vraiment entrer dedans */}
      <svg className={`absolute bottom-0 left-0 ${anime && montrerPerso && a.plongeon ? 'saison-tas-secoue' : ''}`} width={L} height={H} viewBox={`0 0 ${L} ${H}`}
        style={{ transformOrigin: `${tasX}px ${H}px` }} dangerouslySetInnerHTML={{ __html: tapis.tas }} />

      {anime && montrerPerso && a.plongeon && eclats.map((e, i) => (
        <svg key={i} viewBox="0 0 40 40" width={e.s} height={e.s} className={`saison-eclat-tas ${e.ressort ? 'ressort' : ''}`}
          style={{ left: tasX - e.s / 2, bottom: 16, ['--dx' as string]: `${e.dx.toFixed(0)}px`, ['--dy' as string]: `${e.dy.toFixed(0)}px`, ['--rot' as string]: `${e.rot.toFixed(0)}deg` }}>
          <path d={ERABLE} fill={e.c} stroke="#4a2c1a" strokeWidth="2.4" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}
