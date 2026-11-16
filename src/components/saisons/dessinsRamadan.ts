/**
 * 🌙 Dessins de la 5ᵉ saison « Ramadan » (choix de Nadia du 2026-11-15 : ambiance B « sable doré et lanternes »,
 * avec quelques touches des autres, SANS surcharger). Tous FAITS MAISON (ses images d'exemple sont sous licence).
 * Kaaba en haut à gauche (à la place de l'arbre), mosquée en bas à droite (à la place de la cheminée), dunes,
 * lanternes de la guirlande, compagnons (dromadaire, tapis volant, lune, colombe), mouton de l'Aïd el-Adha, images des cartes.
 */
const T = 'stroke="#3a2a20" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"';

/* ---------- 🕋 Kaaba (viewBox 0 0 130 120), en haut à gauche ---------- */
export const KAABA_VB = { w: 130, h: 120 };
export const KAABA = `
  <circle class="ram-halo" cx="66" cy="70" r="46" fill="#ffd27a"/>
  <path d="M74 10a14 14 0 1 0 12 22 11 11 0 1 1-12-22z" fill="#f5c542" stroke="#c99a1a" stroke-width="1"/>
  <path class="ram-scintille" d="M100 14l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#fff3b0"/>
  <path class="ram-scintille" style="animation-delay:.8s" d="M44 20l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="#fff3b0"/>
  <path d="M10 112c30-6 80-6 110 0v8H10z" fill="#e9d2a8"/>
  <path d="M28 54l14-10h66l-14 10z" fill="#3b3631" ${T}/>
  <path d="M94 54l14-10v58l-14 10z" fill="#151311" ${T}/>
  <rect x="28" y="54" width="66" height="58" fill="#1f1c19" ${T}/>
  <rect x="28" y="64" width="66" height="9" fill="#d4a017" stroke="#8a6410" stroke-width="1"/>
  <path d="M94 64l14-10v9l-14 10z" fill="#b8860b" stroke="#8a6410" stroke-width="1"/>
  <g stroke="#7a560c" stroke-width=".9" fill="none"><path d="M33 68.5h8M45 68.5h8M57 68.5h8M69 68.5h8M81 68.5h8"/></g>
  <rect x="66" y="80" width="14" height="24" rx="2" fill="#c89b2a" stroke="#7a560c" stroke-width="1"/>
  <path d="M68 84h10M68 90h10M68 96h10" stroke="#7a560c" stroke-width=".8"/>`;

/* ---------- 🕌 Mosquée (viewBox 0 0 200 172), en bas à droite ---------- */
export const MOSQUEE_VB = { w: 200, h: 172 };
export const MOSQUEE = `
  <ellipse class="ram-halo" cx="100" cy="120" rx="92" ry="54" fill="#ffd27a"/>
  <rect x="150" y="34" width="20" height="128" fill="#f1e2c6" ${T}/>
  <path d="M146 34h28l-4-8h-20z" fill="#e7d3ad" ${T}/>
  <path d="M152 26q8-22 16 0z" fill="#2aa198" ${T}/>
  <path d="M160 6v-2M160 12a3.5 3.5 0 1 1 0-7 2.6 2.6 0 1 0 0 7z" stroke="#c99a1a" stroke-width="1.2" fill="#f5c542"/>
  <rect class="ram-fenetre" x="156" y="50" width="8" height="14" rx="4" fill="#ffcf6b" ${T}/>
  <rect class="ram-fenetre" x="156" y="80" width="8" height="14" rx="4" fill="#ffcf6b" ${T}/>
  <rect x="22" y="92" width="130" height="70" fill="#f6e7cf" ${T}/>
  <path d="M22 92h130" stroke="#3a2a20" stroke-width="1.3"/>
  <path d="M46 92a41 41 0 0 1 82 0z" fill="#2aa198" ${T}/>
  <path d="M60 80q27-20 54 0" fill="none" stroke="#1d7f78" stroke-width="1.2"/>
  <path d="M87 51v-6" stroke="#c99a1a" stroke-width="1.4"/>
  <path d="M87 44a4 4 0 1 1 0-8 3 3 0 1 0 0 8z" fill="#f5c542" stroke="#c99a1a" stroke-width="1"/>
  <path d="M22 92a12 12 0 0 1 24 0z M128 92a12 12 0 0 1 24 0z" fill="#2aa198" ${T}/>
  <g class="ram-fenetre" fill="#ffcf6b" ${T}><path d="M34 122v-10a6 6 0 0 1 12 0v10z"/><path d="M128 122v-10a6 6 0 0 1 12 0v10z"/><path d="M58 122v-10a6 6 0 0 1 12 0v10z"/><path d="M104 122v-10a6 6 0 0 1 12 0v10z"/></g>
  <path d="M76 162v-26a11 11 0 0 1 22 0v26z" fill="#7a4e2a" ${T}/>
  <path d="M87 125v37" stroke="#5a381c" stroke-width="1"/>
  <g class="ram-lanterne"><path d="M110 132v6" stroke="#8a5a2a"/><path d="M106 138h8l-1 10h-6z" fill="#ffd27a" stroke="#8a5a2a" stroke-width="1"/><path d="M106 138l4-3 4 3z" fill="#c8792b"/></g>`;

/* ---------- 🏮 Lanternes de la guirlande (viewBox 0 0 20 34), 4 modèles différents ---------- */
const lanterne = (verre: string, metal: string, forme: 'ronde' | 'haute' | 'etoile' | 'bulbe') => {
  const corps = forme === 'ronde' ? `<ellipse cx="10" cy="20" rx="7" ry="8" fill="${verre}"/><path d="M3 20h14M10 12v16" stroke="${metal}" stroke-width=".8"/>`
    : forme === 'haute' ? `<path d="M5 11h10l2 7-2 10H5L3 18z" fill="${verre}"/><path d="M5 11l-2 7 2 10M15 11l2 7-2 10M10 11v17" stroke="${metal}" stroke-width=".8" fill="none"/>`
    : forme === 'etoile' ? `<path d="M10 10l2.6 5.2 5.6.8-4 4 1 5.6-5.2-2.8-5.2 2.8 1-5.6-4-4 5.6-.8z" fill="${verre}" stroke="${metal}" stroke-width=".8"/>`
    : `<path d="M10 10c6 3 8 9 5 15H5c-3-6-1-12 5-15z" fill="${verre}"/><path d="M10 10v15M6 18h8" stroke="${metal}" stroke-width=".8"/>`;
  return `<path d="M10 0v4" stroke="${metal}" stroke-width="1"/><circle cx="10" cy="5" r="1.6" fill="none" stroke="${metal}" stroke-width=".9"/>
    <path d="M6 9h8l-1.5-2.6h-5z" fill="${metal}"/>
    <ellipse class="ram-lueur" cx="10" cy="20" rx="12" ry="12" fill="#ffd27a"/>
    <g stroke="${metal}" stroke-width="1">${corps}</g>
    <path d="M7 28h6l-1 3H8z" fill="${metal}"/><path d="M10 31v3" stroke="${metal}" stroke-width="1"/>`;
};
export const LANTERNES = [
  lanterne('#ffcf6b', '#b06a1f', 'ronde'), lanterne('#7fd8cf', '#1d7f78', 'haute'),
  lanterne('#ffb3c1', '#b8475c', 'etoile'), lanterne('#ffe08a', '#8a6410', 'bulbe'),
];

/* ---------- Compagnons des dunes (un différent à chaque connexion) ---------- */
export type CompagnonRamadan = 'dromadaire' | 'tapis' | 'lune' | 'colombe';
export const COMPAGNONS: Record<CompagnonRamadan, { nom: string; vb: [number, number]; svg: string; vole: boolean }> = {
  dromadaire: { nom: 'Le dromadaire', vb: [48, 40], vole: false, svg: `<g ${T}>
    <path d="M6 22c0-6 4-10 9-10 3 0 5 2 7 4 2-5 5-8 9-8s6 4 7 8l2-6c1-3 4-4 6-2l1 3-3 1-3 9c-1 3-3 4-5 4H12c-3 0-6 0-6-3z" fill="#d8a35e"/>
    <path d="M10 25l-1 13M16 26l1 12M30 26l-1 12M35 25l2 13" stroke-width="2.4" stroke="#b07a3a" fill="none"/>
    <path d="M14 15c2 4 10 4 13 1" fill="#b23a48" stroke="#7a1f2c"/><path d="M15 17l2 3M19 18l1 3M23 18v3" stroke="#f5c542" stroke-width="1"/>
    <path d="M6 22c-3 1-4 4-3 7" fill="none" stroke-width="1.4"/></g><circle cx="44" cy="11" r="1" fill="#2a1d14"/>` },
  tapis: { nom: 'Le tapis volant', vb: [48, 24], vole: true, svg: `<g ${T}>
    <path d="M3 10c8-4 14 2 21-1s13-5 21 0l-1 8c-8-4-13 1-20 2S10 15 4 18z" fill="#b23a48"/>
    <path d="M6 12c7-3 12 2 18-1s11-4 18 0" fill="none" stroke="#f5c542" stroke-width="1.4"/>
    <path d="M7 15c6-2 11 2 17 0s10-3 17 0" fill="none" stroke="#2aa198" stroke-width="1"/></g>
    <g stroke="#f5c542" stroke-width="1"><path d="M3 10l-2 1M4 18l-2 1M45 9l2-1M44 17l2 1"/></g>` },
  lune: { nom: 'La lune', vb: [40, 40], vole: true, svg: `<circle class="ram-lueur" cx="20" cy="20" r="19" fill="#ffe7a0"/>
    <path d="M23 4a16 16 0 1 0 13 24A13 13 0 1 1 23 4z" fill="#f5c542" stroke="#c99a1a" stroke-width="1.2"/>
    <circle cx="15" cy="17" r="1.2" fill="#3a2a20"/><path d="M14 23q3 2 6 0" stroke="#3a2a20" stroke-width="1" fill="none"/>
    <circle cx="12" cy="21" r="1.6" fill="#f4a3a3" opacity=".7"/>` },
  colombe: { nom: 'La colombe', vb: [40, 32], vole: true, svg: `<g ${T}>
    <path d="M6 18c4-6 12-8 18-6l6-6c3-2 6 0 5 3l-4 6c2 4 0 9-6 11-8 3-15 0-19-8z" fill="#fff"/>
    <path d="M14 14c2-6 7-9 12-8-1 5-5 9-12 8z" fill="#e8eef7"/><path d="M33 9l5 1-4 2" fill="#f5a623"/></g>
    <circle cx="31" cy="10" r="1" fill="#2a1d14"/>` },
};
export const ORDRE_COMPAGNONS: CompagnonRamadan[] = ['dromadaire', 'tapis', 'lune', 'colombe'];

/* ---------- 🐑 Mouton de l'Aïd el-Adha (viewBox 0 0 48 36) ---------- */
export const MOUTON = `<g ${T}>
  <path d="M10 18c-3-5 1-10 6-9 2-4 8-5 11-2 4-2 9 0 10 4 4 1 6 6 3 9 2 4-1 8-5 8-2 3-7 4-10 1-4 2-9 1-10-2-4 0-7-4-5-9z" fill="#fbf7ef"/>
  <path d="M15 28v7M21 29v6M30 29v6M35 28v7" stroke-width="2.2"/>
  <path d="M38 12c4-2 9 1 9 6s-4 7-8 6c-3-1-4-8-1-12z" fill="#3a2a20"/>
  <path d="M39 12c-2-3-5-3-6 0" fill="none" stroke-width="1.6"/></g>
  <circle cx="43" cy="16" r="1" fill="#fff"/><path d="M38 21q-2 2 0 4" stroke="#fbf7ef" stroke-width="1" fill="none"/>`;

/* ---------- 🖼️ Images sur les cartes de l'accueil (viewBox 0 0 48 48) ---------- */
const IMAGES: Record<string, string> = {
  lanterne: `<g transform="translate(14 6) scale(1.2)">${LANTERNES[0]}</g>`,
  croissant: `<path d="M27 6a19 19 0 1 0 15 28A15 15 0 1 1 27 6z" fill="#f5c542" stroke="#c99a1a" stroke-width="1.4"/><path d="M38 10l1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4z" fill="#ffe08a"/>`,
  dattes: `<ellipse cx="24" cy="36" rx="18" ry="6" fill="#e7d3ad" ${T}/><g fill="#7a3b1c" ${T}><ellipse cx="17" cy="30" rx="4" ry="7" transform="rotate(-25 17 30)"/><ellipse cx="25" cy="28" rx="4" ry="7"/><ellipse cx="33" cy="30" rx="4" ry="7" transform="rotate(25 33 30)"/></g><path d="M16 26l2-2M24 23v-3M32 26l-1-2" stroke="#d99a6a" stroke-width="1.2"/>`,
  theiere: `<g ${T}><path d="M12 22c0-6 5-9 12-9s12 3 12 9v8c0 5-5 8-12 8s-12-3-12-8z" fill="#2aa198"/><path d="M36 22c5 0 7 4 5 8l-5 3" fill="none" stroke="#1d7f78" stroke-width="2.4"/><path d="M12 24L5 18" stroke="#1d7f78" stroke-width="2.4"/><ellipse cx="24" cy="13" rx="7" ry="2.4" fill="#1d7f78"/><circle cx="24" cy="9.6" r="2" fill="#f5c542"/></g><path d="M16 27h16" stroke="#f5c542" stroke-width="1.6"/>`,
  chapelet: `<g fill="#b06a1f" stroke="#6e3f12" stroke-width=".8">${Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return `<circle cx="${(24 + Math.cos(a) * 13).toFixed(1)}" cy="${(20 + Math.sin(a) * 11).toFixed(1)}" r="2.3"/>`; }).join('')}</g><path d="M24 31v7" stroke="#6e3f12" stroke-width="1.2"/><path d="M21 38h6l-1 7h-4z" fill="#2aa198" stroke="#1d7f78" stroke-width=".8"/>`,
  coran: `<g ${T}><path d="M8 40l16-8 16 8M14 36l10 6 10-6" fill="none" stroke="#8a5a2a" stroke-width="2"/><path d="M6 14c6-3 12-3 18 2v20c-6-5-12-5-18-2z" fill="#2e7d4f"/><path d="M42 14c-6-3-12-3-18 2v20c6-5 12-5 18-2z" fill="#2e7d4f"/></g><path d="M10 17c4-1 8-1 11 2M27 19c3-3 7-3 11-2" stroke="#f5c542" stroke-width="1.2" fill="none"/>`,
  tapis: `<g ${T}><rect x="8" y="6" width="32" height="36" rx="2" fill="#b23a48"/><path d="M24 10l8 8-8 8-8-8z" fill="#f5c542"/><path d="M14 30h20M14 34h20" stroke="#2aa198" stroke-width="2"/></g><path d="M8 6v-3M14 6v-3M20 6v-3M28 6v-3M34 6v-3M40 6v-3M8 42v3M14 42v3M20 42v3M28 42v3M34 42v3M40 42v3" stroke="#f5c542" stroke-width="1.2"/>`,
  tambour: `<g ${T}><path d="M8 16h32v18c0 4-7 7-16 7S8 38 8 34z" fill="#c8792b"/><ellipse cx="24" cy="16" rx="16" ry="6" fill="#f6e7cf"/><path d="M8 22l8 12 8-12 8 12 8-12" fill="none" stroke="#f6e7cf" stroke-width="1.4"/></g><path d="M32 4l-8 10" stroke="#7a4e2a" stroke-width="2.4" stroke-linecap="round"/><circle cx="33" cy="3.6" r="2.4" fill="#f6e7cf" stroke="#3a2a20"/>`,
  palmier: `<path d="M24 44c1-10 0-20-2-28" stroke="#8a5a2a" stroke-width="3.2" fill="none" stroke-linecap="round"/><g fill="#3f8f3a" ${T}><path d="M22 16C16 8 8 9 4 14c7-2 12 0 18 2z"/><path d="M22 16c6-8 15-8 19-3-7-2-13 0-19 3z"/><path d="M22 16c-3-7-1-12 4-14 0 5-1 9-4 14z"/><path d="M22 16C14 16 9 22 9 28c4-6 8-9 13-12z"/></g><g fill="#7a3b1c"><circle cx="21" cy="19" r="1.8"/><circle cx="24" cy="19.6" r="1.8"/></g>`,
  mosquee: `<g transform="scale(.24) translate(2 30)">${MOSQUEE.replace('class="ram-halo"', 'opacity="0"')}</g>`,
};
const PAR_CARTE: Record<string, string> = {
  nourania: 'lanterne', sourates: 'chapelet', coran: 'coran', invocations: 'croissant', ramadan: 'dattes', priere: 'tapis',
  alphabet: 'theiere', 'allah-names': 'croissant', grammaire: 'palmier', vocabulaire: 'tambour', hadiths: 'mosquee',
};
const ROTATION = ['lanterne', 'croissant', 'dattes', 'theiere', 'chapelet', 'coran', 'tapis', 'tambour', 'palmier', 'mosquee'];
export function imageDeCarteRamadan(slug: string, index: number): string {
  return IMAGES[PAR_CARTE[slug] ?? ROTATION[index % ROTATION.length]];
}
export const IMAGE_RAMADAN = IMAGES;
