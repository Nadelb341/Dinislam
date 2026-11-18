/**
 * ⛄🍂☀️🐦 Les objets qui se promènent dans l'appli, un par saison (Nadia, 2026-11-18 : « comme le tapis volant de la
 * saison Ramadan » ; hiver = joli bonhomme de neige, automne = feuille géante dorée, été = joli soleil brillant avec de
 * jolis rayons, printemps = oiseau bleu et blanc). Dessins faits maison : arrondis, dégradés, petits reflets.
 * Chaque dessin reçoit un `uid` pour que ses dégradés ne se mélangent jamais avec ceux d'un autre dessin de la page.
 */
export type ObjetSaison = 'bonhomme' | 'feuille' | 'soleil' | 'oiseau';

export const OBJETS_SAISON: Record<ObjetSaison, { vb: [number, number]; larg: number; haut: number }> = {
  bonhomme: { vb: [80, 100], larg: 54, haut: 68 },
  feuille: { vb: [90, 90], larg: 64, haut: 64 },
  soleil: { vb: [100, 100], larg: 80, haut: 80 },
  oiseau: { vb: [90, 70], larg: 66, haut: 52 },
};

/* ---------- ⛄ Bonhomme de neige (bonnet tricoté, écharpe rayée, nez carotte, bras en bois) ---------- */
function bonhommeSvg(u: string): string {
  return `<defs>
    <radialGradient id="bn${u}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".62" stop-color="#f3f8fd"/><stop offset="1" stop-color="#c9dcef"/></radialGradient>
    <linearGradient id="be${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef6a5c"/><stop offset="1" stop-color="#c8392f"/></linearGradient>
    <linearGradient id="bb${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fa8ec"/><stop offset="1" stop-color="#2f62b8"/></linearGradient>
    <linearGradient id="bc${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb04a"/><stop offset="1" stop-color="#ee7a12"/></linearGradient>
  </defs>
  <ellipse cx="40" cy="96" rx="22" ry="3.2" fill="#8fb4da" opacity=".35"/>
  <path d="M21 62 Q12 56 6 49" stroke="#7a4b26" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M10 52 L5 54 M11 52 L9 46" stroke="#7a4b26" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M59 62 Q68 55 74 47" stroke="#7a4b26" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M70 50 L76 51 M70 50 L70 44" stroke="#7a4b26" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <circle cx="40" cy="74" r="22" fill="url(#bn${u})"/>
  <ellipse cx="32" cy="64" rx="6" ry="3.5" fill="#fff" opacity=".8"/>
  <circle cx="40" cy="41" r="15.5" fill="url(#bn${u})"/>
  <ellipse cx="34.5" cy="35" rx="4" ry="2.4" fill="#fff" opacity=".85"/>
  <circle cx="40" cy="65" r="1.9" fill="#3a3f55"/><circle cx="40" cy="73" r="1.9" fill="#3a3f55"/><circle cx="40" cy="81" r="1.9" fill="#3a3f55"/>
  <path d="M25.5 53 Q40 59 54.5 53 L55 57.5 Q40 63.5 25 57.5 Z" fill="url(#be${u})"/>
  <path d="M30 54.8 L31.5 59.5 M36 56 L36.8 61 M43 56 L42.6 61 M49 54.8 L48 59.5" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".85"/>
  <path d="M48 57 Q51 64 49 71 L54.5 70.5 Q55.5 63 53 56.5 Z" fill="url(#be${u})"/>
  <path d="M49.4 68.8 L54.8 68.3" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".85"/>
  <path d="M25.5 36 Q26 19 40 18 Q54 19 54.5 36 Z" fill="url(#bb${u})"/>
  <path d="M30 22 Q32 29 31 35 M36 19.5 Q37.5 27 37 35 M44 19.5 Q42.5 27 43 35 M50 22 Q48 29 49 35" stroke="#ffffff" stroke-width="1" fill="none" opacity=".35"/>
  <rect x="24" y="32.5" width="32" height="6.5" rx="3.2" fill="#f3f7fd"/>
  <path d="M27 35.7 H53" stroke="#cfdcef" stroke-width="1" stroke-dasharray="1.6 1.6"/>
  <circle cx="40" cy="16" r="5.2" fill="#ffffff"/><circle cx="38.4" cy="14.6" r="1.8" fill="#e8f1fb"/>
  <circle cx="34.6" cy="43" r="2" fill="#2b2f45"/><circle cx="45.4" cy="43" r="2" fill="#2b2f45"/>
  <circle cx="35.2" cy="42.3" r=".7" fill="#fff"/><circle cx="46" cy="42.3" r=".7" fill="#fff"/>
  <circle cx="30.8" cy="47.4" r="2.6" fill="#ff9fb0" opacity=".55"/><circle cx="49.2" cy="47.4" r="2.6" fill="#ff9fb0" opacity=".55"/>
  <path d="M40 45.5 L51.5 47.6 Q52 48.4 51.3 48.8 L40 48.6 Q38.6 47 40 45.5 Z" fill="url(#bc${u})"/>
  <path d="M35.6 50.5 Q40 53.4 44.4 50.5" stroke="#2b2f45" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  <path d="M66 22 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 z" fill="#cfe8ff" class="promeneur-scintille"/>`;
}

/* ---------- 🍂 Feuille géante dorée (érable, nervures, petit reflet) ---------- */
function feuilleSvg(u: string): string {
  return `<defs>
    <linearGradient id="fd${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b8"/><stop offset=".45" stop-color="#f6c443"/><stop offset="1" stop-color="#d4851a"/></linearGradient>
    <radialGradient id="fh${u}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe8a0" stop-opacity=".7"/><stop offset="1" stop-color="#ffd060" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="45" cy="42" r="42" fill="url(#fh${u})"/>
  <path d="M45 62 Q46 74 41 86" stroke="#b06a14" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M45 4 L51 20 L61 13 L59 31 L73 24 L69 38 L85 41 L72 50 L78 59 L61 58 L63 69 L49 61 L45 63 L41 61 L27 69 L29 58 L12 59 L18 50 L5 41 L21 38 L17 24 L31 31 L29 13 L39 20 Z"
    fill="url(#fd${u})" stroke="#c27a15" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M45 61 V9 M45 50 L70 31 M45 50 L20 31 M45 55 L76 48 M45 55 L14 48 M45 57 L60 64 M45 57 L30 64"
    stroke="#b0661a" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".55"/>
  <path d="M30 26 Q36 20 41 22" stroke="#fffbe6" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".75"/>
  <path d="M20 16 l1 2.5 2.5 1 -2.5 1 -1 2.5 -1 -2.5 -2.5 -1 2.5 -1 z" fill="#fff6c9" class="promeneur-scintille"/>
  <path d="M74 66 l.8 2 2 .8 -2 .8 -.8 2 -.8 -2 -2 -.8 2 -.8 z" fill="#fff6c9" class="promeneur-scintille"/>`;
}

/* ---------- ☀️ Soleil brillant (rayons qui tournent doucement, joues roses, sourire) ---------- */
function soleilSvg(u: string): string {
  const rayons = Array.from({ length: 12 }, (_, i) => {
    const long = i % 2 === 0;
    const p = long ? 5 : 12; // bout du rayon : long (r ≈ 45) ou court (r ≈ 38), en alternance
    return `<path d="M45 25 Q48.6 ${p + 7} 50 ${p} Q51.4 ${p + 7} 55 25 Z" transform="rotate(${i * 30 + 15} 50 50)" fill="url(#sr${u})" stroke="#ffc23a" stroke-width=".6" stroke-linejoin="round"/>`;
  }).join('');
  return `<defs>
    <radialGradient id="sh${u}" cx=".5" cy=".5" r=".5"><stop offset=".45" stop-color="#ffe680" stop-opacity=".75"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>
    <radialGradient id="sc${u}" cx=".42" cy=".38" r=".65"><stop offset="0" stop-color="#fffbe0"/><stop offset=".5" stop-color="#ffd84a"/><stop offset="1" stop-color="#ffa21a"/></radialGradient>
    <linearGradient id="sr${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset="1" stop-color="#ffb21f"/></linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#sh${u})"/>
  <g class="promeneur-rayons">${rayons}</g>
  <circle cx="50" cy="50" r="24" fill="url(#sc${u})" stroke="#ffb72e" stroke-width="1.5"/>
  <ellipse cx="42" cy="40" rx="7" ry="4.2" fill="#fff" opacity=".55" transform="rotate(-25 42 40)"/>
  <path d="M40.5 49 Q43 46.2 45.5 49" stroke="#9a5a0a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M54.5 49 Q57 46.2 59.5 49" stroke="#9a5a0a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <circle cx="39" cy="55" r="3.3" fill="#ff8a7a" opacity=".5"/><circle cx="61" cy="55" r="3.3" fill="#ff8a7a" opacity=".5"/>
  <path d="M44.5 56.5 Q50 61.5 55.5 56.5" stroke="#9a5a0a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
}

/* ---------- 🐦 Oiseau bleu et blanc (ventre et joue blancs, aile qui bat) ---------- */
function oiseauSvg(u: string): string {
  return `<defs>
    <linearGradient id="ob${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc0ff"/><stop offset="1" stop-color="#2e6fd6"/></linearGradient>
    <linearGradient id="oa${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5aa6f5"/><stop offset="1" stop-color="#1f56b3"/></linearGradient>
    <radialGradient id="ov${u}" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3eefb"/></radialGradient>
    <linearGradient id="obe${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffc35a"/><stop offset="1" stop-color="#f08c1e"/></linearGradient>
  </defs>
  <path d="M22 38 Q8 30 3 34 Q10 38 9 42 Q4 46 8 48 Q16 46 24 44 Z" fill="url(#oa${u})"/>
  <path d="M8 36 Q14 38 20 40 M8 45 Q14 44 21 43" stroke="#cfe5ff" stroke-width="1" fill="none" opacity=".6" stroke-linecap="round"/>
  <ellipse cx="42" cy="41" rx="23" ry="16" fill="url(#ob${u})"/>
  <ellipse cx="47" cy="47" rx="16" ry="10" fill="url(#ov${u})"/>
  <circle cx="62" cy="29" r="12.5" fill="url(#ob${u})"/>
  <path d="M58 18.5 Q60 13 64 14 Q61.5 16.5 62.5 18" fill="#2e6fd6"/>
  <ellipse cx="65.5" cy="33" rx="6.4" ry="5" fill="url(#ov${u})"/>
  <path d="M73 27.5 L83 30.5 Q83.6 31.3 83 32 L73 34 Q71.2 30.8 73 27.5 Z" fill="url(#obe${u})"/>
  <circle cx="66.5" cy="27.5" r="2.5" fill="#1d2340"/><circle cx="67.3" cy="26.7" r=".9" fill="#fff"/>
  <circle cx="68.5" cy="34.5" r="2" fill="#ff9fb0" opacity=".6"/>
  <g class="promeneur-aile">
    <path d="M36 34 Q30 14 50 8 Q56 18 52 32 Q45 37 36 34 Z" fill="url(#oa${u})" stroke="#1f56b3" stroke-width=".8"/>
    <path d="M41 30 Q40 20 48 13 M46 31 Q46 22 51 16" stroke="#ffffff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>
  </g>`;
}

export function objetSvg(k: ObjetSaison, uid: string): string {
  if (k === 'bonhomme') return bonhommeSvg(uid);
  if (k === 'feuille') return feuilleSvg(uid);
  if (k === 'soleil') return soleilSvg(uid);
  return oiseauSvg(uid);
}
