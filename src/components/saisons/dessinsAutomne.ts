/**
 * 🍂 Dessins de l'automne (maquette validée par Nadia le 2026-11-03) : tout est dessiné en SVG par l'appli, aucune photo.
 * Les chaînes sont fixes (aucune donnée d'utilisateur dedans) et injectées telles quelles.
 * - arbre : tronc + vraies branches (style de l'image de Nadia), feuilles au bout des branches, oiseaux qui s'envolent
 * - cheminée en pierres, version « plus petite et moins haute » demandée le 2026-11-03
 * - images « autocollants » des cartes (contour brun, style de la planche de Nadia), en haut à droite de chaque carte
 */
import type { ReglagesAutomne } from '@/lib/saisons';

export const ERABLE = 'M20 2l3 8 6-4-1 8 8-1-5 6 6 3-8 3 2 7-7-4-2 10h-2l-2-10-7 4 2-7-8-3 6-3-5-6 8 1-1-8 6 4z';
const OVALE = 'M20 2C31 10 33 26 20 38 7 26 9 10 20 2z';

/** Petit hasard fixe : le même dessin à chaque ouverture */
function graine(n: number) { let g = n; return () => { g = (g * 16807) % 2147483647; return (g - 1) / 2147483646; }; }

/* ---------- Arbre ---------- */
export const ARBRE_VB = { w: 130, h: 205 };
export interface Arbre { svg: string; bouts: [number, number][] }
export function dessinerArbre(oiseaux: boolean): Arbre {
  const h = graine(23);
  const branches: { d: string; w: number }[] = [];
  const bouts: [number, number, number][] = [];
  const pousse = (x: number, y: number, ang: number, len: number, w: number, prof: number) => {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    const k = (h() - 0.5) * 2 * len * 0.14;
    const cx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * k, cy = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * k;
    branches.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, w });
    if (prof === 0) { bouts.push([x2, y2, 0]); return; }
    if (prof <= 2) bouts.push([x2, y2, prof]);
    const n = prof > 3 ? 2 : (h() < 0.5 ? 2 : 3);
    for (let i = 0; i < n; i++) {
      const ecart = (n === 2 ? (i ? 0.44 : -0.48) : (i - 1) * 0.55) + (h() - 0.5) * 0.22;
      pousse(x2, y2, ang + ecart + 0.06, len * (0.72 + h() * 0.1), w * 0.62, prof - 1);
    }
  };
  pousse(58, 200, -Math.PI / 2 + 0.05, 50, 9, 5);
  let s = `<ellipse cx="60" cy="201" rx="40" ry="3.5" fill="#d9a441" opacity=".35"/><g class="saison-arbre-bouge">`;
  s += `<path d="M52 201c3-10 4-22 3-36h7c0 14 1 26 4 36z" fill="#3d2416"/>`;
  s += branches.map((b) => `<path d="${b.d}" stroke="#3d2416" stroke-width="${b.w.toFixed(2)}" stroke-linecap="round" fill="none"/>`).join('');
  const C = ['#f08a2c', '#e8572a', '#f6b73c', '#c8381f', '#9bb24a', '#f4cf5a', '#e86f2c'];
  const h2 = graine(41);
  bouts.forEach(([x, y, p]) => {
    const n = p === 0 ? 7 : 3;
    s += `<g class="saison-frisson" style="animation-delay:${(-h2() * 2.4).toFixed(2)}s">`;
    for (let i = 0; i < n; i++) {
      const a = h2() * Math.PI * 2, r = h2() * (p === 0 ? 10 : 7), t = 7 + h2() * 5;
      const lx = x + Math.cos(a) * r, ly = y + Math.sin(a) * r * 0.85;
      const forme = h2() < 0.7 ? ERABLE : OVALE;
      s += `<path d="${forme}" fill="${C[Math.floor(h2() * C.length)]}" transform="translate(${(lx - t / 2).toFixed(1)} ${(ly - t / 2).toFixed(1)}) rotate(${Math.round(h2() * 360)} ${(t / 2).toFixed(1)} ${(t / 2).toFixed(1)}) scale(${(t / 40).toFixed(3)})"/>`;
    }
    s += `</g>`;
  });
  s += `</g>`;
  [[22, 196], [36, 199], [80, 197], [96, 199]].forEach(([x, y], i) => { s += `<path d="${ERABLE}" fill="${C[i]}" transform="translate(${x} ${y}) rotate(${i * 60}) scale(.15)"/>`; });
  if (oiseaux) for (let i = 0; i < 3; i++) {
    s += `<g class="saison-oiseau" style="animation-delay:${-i * 3}s"><g transform="translate(${100 + i * 8} ${40 + i * 10})"><path class="saison-aile" d="M0 0q3-4 6 0" stroke="#5a4a3e" stroke-width="1.4" fill="none" stroke-linecap="round"/><path class="saison-aile" d="M6 0q3-4 6 0" stroke="#5a4a3e" stroke-width="1.4" fill="none" stroke-linecap="round"/></g></g>`;
  }
  return { svg: s, bouts: bouts.map(([x, y]) => [x, y]) };
}

/* ---------- Cheminée (plus petite et moins haute que la maquette) ---------- */
export const CHEMINEE_VB = { w: 200, h: 172 };
export function dessinerCheminee(a: ReglagesAutomne): string {
  const O = 'stroke="#4a3426" stroke-width="1.3" stroke-linejoin="round"';
  const GRIS = ['#a09a92', '#8f8981', '#b2aca3', '#9a948b'];
  const pierres = (x0: number, y0: number, w: number, hh: number, rangs: number, cols: number) => {
    let s = ''; const pw = w / cols, ph = hh / rangs;
    for (let r = 0; r < rangs; r++) for (let c = 0; c < cols + 1; c++) {
      const x = x0 + c * pw + (r % 2 ? -pw / 2 : 0), xx = Math.max(x0, x), xw = Math.min(x0 + w, x + pw) - xx;
      if (xw < 4) continue;
      s += `<rect x="${(xx + 1).toFixed(1)}" y="${(y0 + r * ph + 1).toFixed(1)}" width="${(xw - 2).toFixed(1)}" height="${(ph - 2).toFixed(1)}" rx="3.5" fill="${GRIS[(r * 3 + c) % 4]}" ${O}/>`;
    }
    return s;
  };
  const feuille = (x: number, y: number, rot: number, c: string, sc = 0.32) => `<path d="${ERABLE}" fill="${c}" stroke="#4a2c1a" stroke-width="2.4" transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})"/>`;
  // Arche en pierres (dans les coordonnées d'origine, le bas est remonté de 20 avec le groupe « bas »)
  let voute = '';
  for (let i = 0; i < 9; i++) {
    const a1 = Math.PI * (1 - i / 9), a2 = Math.PI * (1 - (i + 1) / 9), cx = 100, cy = 118, r1 = 31, r2 = 41;
    const p = (ang: number, r: number) => `${(cx + Math.cos(ang) * r).toFixed(1)} ${(cy - Math.sin(ang) * r).toFixed(1)}`;
    voute += `<path d="M${p(a1 - 0.01, r1)}L${p(a1 - 0.01, r2)}A${r2} ${r2} 0 0 1 ${p(a2 + 0.01, r2)}L${p(a2 + 0.01, r1)}A${r1} ${r1} 0 0 0 ${p(a1 - 0.01, r1)}z" fill="${['#c9b49a', '#b8a389', '#d4c0a6'][i % 3]}" ${O}/>`;
  }
  for (let r = 0; r < 4; r++) voute += `<rect x="59" y="${119 + r * 12.5}" width="10" height="11.5" rx="3" fill="${GRIS[r % 4]}" ${O}/><rect x="131" y="${119 + r * 12.5}" width="10" height="11.5" rx="3" fill="${GRIS[(r + 2) % 4]}" ${O}/>`;

  const bas = `<g transform="translate(0 -20)">
    <ellipse class="saison-lueur" cx="100" cy="168" rx="98" ry="22" fill="#f59e0b" opacity=".45"/>
    ${[[30, 178, 26, 7], [66, 183, 24, 6], [100, 179, 22, 7], [136, 183, 26, 6], [172, 178, 22, 6], [50, 172, 18, 5], [150, 172, 18, 5]].map(([x, y, rx, ry], i) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${['#c4ad90', '#b39c80', '#cdb89c'][i % 3]}" ${O}/>`).join('')}
  </g>`;
  const corps = `${pierres(66, 20, 68, 22, 2, 4)}${pierres(46, 57, 108, 93, 7, 5)}`;
  const foyer = `<g transform="translate(0 -20)">
    <path d="M69 170V118a31 31 0 0 1 62 0v52z" fill="url(#saisonFeu)" ${O}/>
    ${voute}
    <g class="saison-feu">
      <ellipse cx="100" cy="160" rx="26" ry="8" fill="#ffd27a" opacity=".55"/>
      <path class="saison-fl" d="M82 160c-6-14 4-22 8-32 2 10 8 12 8 4 9 10 10 20 4 28z" fill="#ea580c" stroke="#b4400c" stroke-width="1"/>
      <path class="saison-fl b" d="M92 160c-4-16 6-26 10-40 3 13 12 18 9 40z" fill="#f59e0b" stroke="#c2620a" stroke-width="1"/>
      <path class="saison-fl c" d="M104 160c0-12 6-18 9-26 5 11 6 18 1 26z" fill="#fbbf24"/>
      <path class="saison-fl b" d="M96 160c-1-8 3-12 4-19 3 8 4 13 2 19z" fill="#fff3c4"/>
      ${a.braises ? '<g fill="#ffcf6b" class="saison-braise"><circle cx="90" cy="120" r="1.4"/><circle cx="108" cy="115" r="1.2"/><circle cx="100" cy="108" r="1"/></g>' : ''}
    </g>
    <g ${O}><rect x="77" y="156" width="46" height="9" rx="4.5" fill="#8a5a36"/><ellipse cx="121" cy="160.5" rx="4" ry="4.5" fill="#e3c49a"/></g>
    <path d="M75 167h50M79 167v4M121 167v4" stroke="#2a1d16" stroke-width="2.4" stroke-linecap="round"/>
    <g fill="#e8572a"><circle cx="87" cy="166" r="1.6"/><circle cx="99" cy="167" r="1.4"/><circle cx="112" cy="166" r="1.6"/></g>
    ${a.buches ? `<g transform="translate(14 112)" ${O}><path d="M10 54V6" stroke="#3a2a20" stroke-width="2.4" fill="none"/><circle cx="10" cy="5" r="3" fill="#a8652e"/><path d="M4 56h12" stroke="#3a2a20" stroke-width="3" stroke-linecap="round"/><path d="M5 14v30M15 14v28" stroke="#3a2a20" stroke-width="1.6"/><circle cx="5" cy="13" r="2.4" fill="#a8652e"/><circle cx="15" cy="13" r="2.4" fill="#a8652e"/><path d="M12 44l5 8-6 0z" fill="#3a2a20"/></g>
    <g ${O}><rect x="10" y="164" width="34" height="10" rx="5" fill="#9a6332" transform="rotate(-6 27 169)"/><ellipse cx="11" cy="170" rx="4" ry="5" fill="#e3c49a"/><rect x="18" y="156" width="30" height="9" rx="4.5" fill="#8a5a36" transform="rotate(4 33 160)"/><ellipse cx="47" cy="161" rx="3.6" ry="4.5" fill="#e3c49a"/></g>` : ''}
    ${a.courge ? `<g transform="translate(152 134)" ${O}>
      <path d="M14 20c-4-10-2-18 2-22M20 20c0-10 4-16 10-20M24 22c4-8 10-12 18-12" stroke="#c99a52" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M2 22h40l-4 18H6z" fill="#a8743f"/><path d="M4 28h36M5 34h34" stroke="#7a5230" stroke-width="1.1"/>
      <ellipse cx="22" cy="20" rx="14" ry="9" fill="#e07b2e"/><path d="M15 13c-1 4-1 10 0 14M22 11v18M29 13c1 4 1 10 0 14" stroke="#b5562b" stroke-width="1.1" fill="none"/>
      <path d="M22 11c0-3 2-5 4-5" stroke="#5a3520" stroke-width="2" stroke-linecap="round" fill="none"/></g>` : ''}
    ${feuille(36, 178, 40, '#f2a33a', 0.3)}${feuille(130, 182, -30, '#e8572a', 0.26)}${feuille(176, 174, 10, '#d9772b', 0.28)}
  </g>`;
  const poutre = `<rect x="34" y="42" width="132" height="15" rx="3" fill="url(#saisonPoutre)" ${O}/>
    <path d="M42 48h40M96 52h50M60 45h24" stroke="#6a3f20" stroke-width="1" opacity=".6"/>`;
  const dessus = `
    <g transform="translate(46 18)"><path d="M3 24V10c0-3 1-5 2-7h2c1 2 2 4 2 7v14z" fill="#8a5a36" ${O}/><circle cx="6" cy="2" r="2.4" fill="#6a3f20" ${O}/></g>
    ${a.bougies ? `<g transform="translate(60 26)"><rect x="0" y="4" width="9" height="12" rx="1.5" fill="#f3e6d0" ${O}/><path class="saison-fl" d="M4.5 -4c2.6 3.4 2.6 6 0 7.4-2.6-1.4-2.6-4 0-7.4z" fill="#fbbf24"/><circle class="saison-lueur" cx="4.5" cy="0" r="7" fill="#fde68a" opacity=".3"/></g>
    <g transform="translate(142 22)"><rect x="0" y="6" width="10" height="14" rx="1.5" fill="#f3e6d0" ${O}/><path class="saison-fl b" d="M5 -2c2.6 3.4 2.6 6 0 7.4-2.6-1.4-2.6-4 0-7.4z" fill="#fbbf24"/><circle class="saison-lueur" cx="5" cy="2" r="7" fill="#fde68a" opacity=".3"/></g>` : ''}
    ${a.feuillesPoutre ? `${feuille(78, 32, -20, '#f2a33a')}${feuille(96, 34, 25, '#e8572a', 0.28)}${feuille(118, 31, -40, '#d9772b')}${feuille(154, 40, 30, '#e8572a', 0.36)}${feuille(150, 78, 15, '#f2a33a', 0.3)}` : ''}`;
  return `<defs>
    <radialGradient id="saisonFeu" cx=".5" cy=".75" r=".75"><stop offset="0" stop-color="#ffd27a"/><stop offset=".45" stop-color="#f08a2c"/><stop offset="1" stop-color="#5a2410"/></radialGradient>
    <linearGradient id="saisonPoutre" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a86d3c"/><stop offset="1" stop-color="#7a4a26"/></linearGradient>
  </defs>${bas}${corps}${foyer}${poutre}${dessus}`;
}

/* ---------- Images des cartes (« autocollants ») ---------- */
const T = 'stroke="#4a2c1a" stroke-width="1.6" stroke-linejoin="round"';
const erableCerne = (tr: string, fill: string) => `<path d="${ERABLE}" transform="${tr}" fill="${fill}" stroke="#4a2c1a" stroke-width="3.6" stroke-linejoin="round"/>`;
const dosHerisson = (() => {
  let d = 'M8 31';
  for (let i = 0; i <= 14; i++) { const a = Math.PI * (1 - i / 14), r = i % 2 ? 21 : 16; d += ` L${(26 + Math.cos(a) * r).toFixed(1)} ${(38 - Math.sin(a) * r * 0.95).toFixed(1)}`; }
  return d + ' L44 40 L20 40 Z';
})();
const traitsHerisson = Array.from({ length: 6 }, (_, i) => { const a = Math.PI * (0.85 - i * 0.13); return `<path d="M${(26 + Math.cos(a) * 7).toFixed(1)} ${(38 - Math.sin(a) * 7).toFixed(1)}L${(26 + Math.cos(a) * 13).toFixed(1)} ${(38 - Math.sin(a) * 13).toFixed(1)}"/>`; }).join('');
const ecailles = [[24, 14], [18, 20], [30, 20], [24, 25], [15, 29], [33, 29], [21, 32], [28, 33], [18, 38], [30, 38], [24, 41]].map(([x, y]) => `<path d="M${x - 5} ${y}q5 6 10 0q-5 -3 -10 0z"/>`).join('');

export const IMAGES_AUTOMNE: Record<string, { nom: string; svg: string }> = {
  gland: { nom: 'Gland', svg: `<g ${T} stroke-linecap="round"><path d="M33 8c5-4 11-3 13 1-4 4-10 4-13-1z" fill="#9bb24a"/><path d="M11 22h26c0 12-6 21-13 22-7-1-13-10-13-22z" fill="#d6893a"/><path d="M8 21c0-8 7-13 16-13s16 5 16 13c0 2-2 3-4 3H12c-2 0-4-1-4-3z" fill="#8a5a32"/><path d="M24 8c0-3 2-5 5-6" fill="none" stroke-width="2.4"/></g><path d="M13 16q3-3 6 0M20 13q3-3 6 0M27 16q3-3 6 0M16 20q3-3 6 0M24 20q3-3 6 0" stroke="#a8743f" stroke-width="1.3" fill="none"/><path d="M16 27c0 6 2 10 5 13" stroke="#f3bd79" stroke-width="3" stroke-linecap="round" fill="none"/>` },
  ecureuil: { nom: 'Écureuil', svg: `<g ${T}><path d="M30 44c11 0 17-9 15-20-1-9-9-14-16-11 6 2 7 9 3 13-4 5-7 8-2 18z" fill="#dc7a2e"/><path d="M34 15c5 1 8 6 7 11" stroke="#f4b067" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="34" rx="10" ry="11" fill="#dc7a2e"/><ellipse cx="20" cy="36" rx="6" ry="7" fill="#f8dfb6"/><path d="M11 11l1-8 6 6zM28 9l-1-8-5 7z" fill="#dc7a2e"/><circle cx="19.5" cy="18" r="10" fill="#dc7a2e"/><ellipse cx="19.5" cy="22" rx="5.5" ry="4" fill="#f8dfb6"/><ellipse cx="13" cy="45" rx="4" ry="2" fill="#c0652a"/><ellipse cx="27" cy="45" rx="4" ry="2" fill="#c0652a"/><path d="M15 30h10c0 5-2 8-5 8s-5-3-5-8z" fill="#d6893a"/><path d="M14 30c0-3 3-5 6-5s6 2 6 5z" fill="#8a5a32"/></g><path d="M12.5 6.5l1.5 2.5M26.5 5l-1.5 3" stroke="#f4b067" stroke-width="1.6" stroke-linecap="round"/><circle cx="15.5" cy="17" r="2" fill="#2a1a10"/><circle cx="23.5" cy="17" r="2" fill="#2a1a10"/><circle cx="16.1" cy="16.3" r=".7" fill="#fff"/><circle cx="24.1" cy="16.3" r=".7" fill="#fff"/><ellipse cx="19.5" cy="20.6" rx="1.6" ry="1.1" fill="#4a2c1a"/><path d="M18 22.6q1.5 1.4 3 0" stroke="#4a2c1a" stroke-width="1" fill="none" stroke-linecap="round"/><circle cx="12" cy="21" r="1.8" fill="#f28b82" opacity=".55"/><circle cx="27" cy="21" r="1.8" fill="#f28b82" opacity=".55"/>` },
  champignons: { nom: 'Champignons', svg: `<g ${T}><path d="M30 32c1 5 1 9-1 11-2 1-6 1-8 0-1-3-1-7 0-11z" fill="#f4ead6"/><path d="M26 33c0-6 5-10 10-10s10 4 10 10c0 1-1 2-2 2H28c-1 0-2-1-2-2z" fill="#a8652e"/><path d="M14 26h13c1 6 1 12-1 16-3 2-8 2-11 0-2-4-2-10-1-16z" fill="#f7efe0"/><path d="M3 24C3 13 11 6 21 6s18 7 18 18c0 2-2 3-4 3H7c-2 0-4-1-4-3z" fill="#d9432f"/></g><g fill="#fff"><ellipse cx="13" cy="16" rx="3" ry="2.4"/><ellipse cx="23" cy="11" rx="2.6" ry="2"/><ellipse cx="30" cy="18" rx="3.2" ry="2.6"/><ellipse cx="19" cy="21" rx="2" ry="1.6"/></g><path d="M17 30v9" stroke="#e6d6bb" stroke-width="2.4" stroke-linecap="round"/><path d="M2 46c4-4 6-4 9-1M37 46c3-3 6-4 9-1" stroke="#6f9a3c" stroke-width="2" fill="none" stroke-linecap="round"/>` },
  herisson: { nom: 'Hérisson', svg: `<g ${T}><path fill="#8a5a32" d="${dosHerisson}"/><path d="M3 34c0-7 5-12 11-12 4 0 7 2 8 6v12H8c-3 0-5-3-5-6z" fill="#f2d3a6"/><ellipse cx="13" cy="41" rx="3.4" ry="2" fill="#c99a68"/><ellipse cx="32" cy="41" rx="3.4" ry="2" fill="#c99a68"/></g><g stroke="#b07a46" stroke-width="1.2" stroke-linecap="round" fill="none">${traitsHerisson}</g><circle cx="10" cy="29" r="1.8" fill="#2a1a10"/><circle cx="10.6" cy="28.4" r=".6" fill="#fff"/><circle cx="3.6" cy="33" r="1.8" fill="#4a2c1a"/><circle cx="13" cy="33" r="1.7" fill="#f28b82" opacity=".55"/><path d="${ERABLE}" transform="translate(26 8) rotate(25) scale(.36)" fill="#e8572a" stroke="#4a2c1a" stroke-width="3.5"/>` },
  feuilles: { nom: 'Feuilles', svg: `${erableCerne('translate(22 4) rotate(25 12 12) scale(.62)', '#9bb24a')}${erableCerne('translate(2 14) rotate(-20 12 12) scale(.66)', '#e8572a')}${erableCerne('translate(16 20) scale(.66)', '#f2a33a')}<path d="M29 46l-2-12M14 40l2-8M36 22l3-6" stroke="#4a2c1a" stroke-width="1.4" stroke-linecap="round"/>` },
  hibou: { nom: 'Hibou', svg: `<path d="M1 41c12-2 30-3 46-1" stroke="#4a2c1a" stroke-width="4.4" stroke-linecap="round" fill="none"/><path d="M1 41c12-2 30-3 46-1" stroke="#8a5a32" stroke-width="2.4" stroke-linecap="round" fill="none"/><g ${T}><path d="M38 38c4-3 8-3 9 0-3 3-7 3-9 0z" fill="#e8572a"/><path d="M12 12l-1-8 6 5M36 12l1-8-6 5" fill="#9a6a3c"/><path d="M24 6c9 0 14 7 14 17s-5 16-14 16S10 33 10 23 15 6 24 6z" fill="#9a6a3c"/><ellipse cx="24" cy="28" rx="8" ry="9" fill="#f0d4a8"/><circle cx="18.5" cy="17" r="5.5" fill="#fff"/><circle cx="29.5" cy="17" r="5.5" fill="#fff"/><path d="M22 21l2 4 2-4z" fill="#f2a33a"/><path d="M10 22c-3 4-2 10 2 13M38 22c3 4 2 10-2 13" fill="#7a4f2a"/><path d="M19 38l-1 3M29 38l1 3" fill="none"/></g><circle cx="19" cy="17" r="2.6" fill="#2a1a10"/><circle cx="29" cy="17" r="2.6" fill="#2a1a10"/><circle cx="19.8" cy="16.2" r=".9" fill="#fff"/><circle cx="29.8" cy="16.2" r=".9" fill="#fff"/><path d="M20 29l2 2 2-2 2 2 2-2M21 33l1.5 1.5 1.5-1.5 1.5 1.5 1.5-1.5" stroke="#c99a68" stroke-width="1.2" fill="none" stroke-linecap="round"/>` },
  pommePin: { nom: 'Pomme de pin', svg: `<g stroke="#3f6b2a" stroke-width="1.6" stroke-linecap="round"><path d="M26 10l20-6M30 9l2-6M34 8l1-6M38 7l2-5M42 6l3-4M30 9l3 4M34 8l3 4M38 7l3 4M42 6l3 3"/></g><path d="M24 6c9 3 14 12 13 22-1 9-6 16-13 17-7-1-12-8-13-17-1-10 4-19 13-22z" fill="#9a6332" stroke="#4a2c1a" stroke-width="1.6" stroke-linejoin="round"/><g stroke="#4a2c1a" stroke-width="1.2" fill="#c58a4e" stroke-linejoin="round">${ecailles}</g>` },
  renard: { nom: 'Renard', svg: `<g ${T}><path d="M30 44c10 1 16-5 15-14-1-5-5-8-9-7 3 3 3 8-1 11-3 3-6 4-5 10z" fill="#e8772b"/><path d="M40 30c4 2 5 6 5 10-3 3-7 4-10 3 3-3 6-7 5-13z" fill="#fff6ea"/><path d="M12 44c-2-9 2-17 10-18 8 1 12 9 10 18z" fill="#e8772b"/><path d="M17 44c0-6 2-10 5-11 3 1 5 5 5 11z" fill="#fff6ea"/><path d="M22 30c-9 0-14-6-14-12 0-5 2-9 4-12l6 6h8l6-6c2 3 4 7 4 12 0 6-5 12-14 12z" fill="#e8772b"/><path d="M22 30c-5 0-9-3-11-7 4 1 8 0 11-3 3 3 7 4 11 3-2 4-6 7-11 7z" fill="#fff6ea"/></g><circle cx="16.5" cy="18" r="1.8" fill="#2a1a10"/><circle cx="27.5" cy="18" r="1.8" fill="#2a1a10"/><ellipse cx="22" cy="24.5" rx="1.8" ry="1.2" fill="#2a1a10"/>` },
  tasse: { nom: 'Chocolat chaud', svg: `<path d="M16 12c-3-3 3-5 0-9M24 12c-3-3 3-5 0-9" stroke="#c9b49a" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M36 22c7 0 7 11 0 11" fill="none" stroke="#4a2c1a" stroke-width="4"/><path d="M36 22c7 0 7 11 0 11" fill="none" stroke="#b5562b" stroke-width="2"/><g ${T}><path d="M6 16h32v16c0 7-5 12-12 12h-8C11 44 6 39 6 32z" fill="#b5562b"/><ellipse cx="22" cy="16" rx="16" ry="3.5" fill="#6b3a1e"/></g><path d="M12 24v8c0 4 2 6 4 7" stroke="#e08a5a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M20 26c2-4 7-4 8 0-2 4-6 4-8 0z" fill="#f2c27a" stroke="#4a2c1a" stroke-width="1"/>` },
  echarpe: { nom: 'Écharpe', svg: `<g ${T}><path d="M8 10c10 6 22 6 32 0l2 7c-11 7-25 7-36 0z" fill="#d9772b"/><path d="M26 17l6 22-8 2-5-21z" fill="#d9772b"/></g><path d="M10 13c9 5 20 5 29 0M28 24l-7 2M30 31l-7 2" stroke="#f6c453" stroke-width="2.2" fill="none"/><path d="M24 41v5M27 40v5M30 39.5v5" stroke="#4a2c1a" stroke-width="1.4" stroke-linecap="round"/>` },
};

/** Image de chaque carte (comme dans la maquette) ; une autre carte prend une image à tour de rôle */
const PAR_CARTE: Record<string, keyof typeof IMAGES_AUTOMNE> = {
  nourania: 'gland', sourates: 'ecureuil', ramadan: 'champignons', coran: 'herisson', alphabet: 'feuilles', grammaire: 'hibou', 'allah-names': 'pommePin',
};
const ROTATION: (keyof typeof IMAGES_AUTOMNE)[] = ['renard', 'tasse', 'echarpe', 'gland', 'feuilles', 'champignons', 'ecureuil', 'hibou', 'herisson', 'pommePin'];
export function imageDeCarte(slug: string, index: number): string {
  return IMAGES_AUTOMNE[PAR_CARTE[slug] ?? ROTATION[index % ROTATION.length]].svg;
}
