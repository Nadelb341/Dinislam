// Nouveaux dessins Ramadan — 3 finitions (A pastel dégradé, B dessiné main, C doré nuit)
// Chaque fonction rend un <svg> complet. id unique par appel pour les dégradés.
let N = 0;
const uid = (p) => `${p}${++N}`;

const STYLES = {
  A: { trait: 'none', tw: 0, clair: 1 },          // pastel dégradé sans contour (réf. 1)
  B: { trait: '#5a3a22', tw: 1.6, clair: 0 },      // contour fin brun, dessiné main (réf. 2 et 4)
  C: { trait: '#8a6410', tw: 1.1, clair: 2 },      // or + bleu nuit, lumineux (réf. 3 et 5)
};

const patte = (x, fill, s) => `<path d="M${x-5} 52C${x-5.5} 62 ${x-3.6} 72 ${x-3.8} 77C${x-4.3} 79.5 ${x-2.7} 82 ${x-2.5} 86L${x-2.7} 91.5Q${x-3.4} 95 ${x} 95Q${x+3.4} 95 ${x+2.7} 91.5L${x+2.5} 86C${x+2.7} 82 ${x+4.3} 79.5 ${x+3.8} 77C${x+3.6} 72 ${x+5.5} 62 ${x+5} 52Z" fill="${fill}" stroke="${s.trait}" stroke-width="${s.tw}" stroke-linejoin="round"/><path d="M${x-3} 92.5h6" stroke="#5a3a22" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/>`;
/* ============ 🐪 Dromadaire (une seule bosse) ============ */
export function dromadaire(style = 'B') {
  const s = STYLES[style];
  const g1 = uid('d'), g2 = uid('d'), g3 = uid('d');
  const peau = style === 'C' ? ['#f3d39a', '#c8914f'] : style === 'A' ? ['#ffd9a8', '#f0a868'] : ['#f0c98e', '#c98f52'];
  const peauFonce = style === 'A' ? '#e39255' : '#b07a3e';
  const tapis = style === 'A' ? ['#ff8fb1', '#b980f0'] : style === 'C' ? ['#2c3e8f', '#16205a'] : ['#c8364a', '#8f1f33'];
  const or = '#f5c542';
  const st = `stroke="${s.trait}" stroke-width="${s.tw}" stroke-linejoin="round" stroke-linecap="round"`;
  return `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${g1}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${peau[0]}"/><stop offset="1" stop-color="${peau[1]}"/></linearGradient>
    <linearGradient id="${g2}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tapis[0]}"/><stop offset="1" stop-color="${tapis[1]}"/></linearGradient>
    <radialGradient id="${g3}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="58" cy="95" rx="40" ry="4" fill="url(#${g3})"/>
  <!-- pattes (cuisse, genou, sabot), dessinées AVANT le corps pour s'y fondre -->
  ${patte(41, peauFonce, s)}${patte(81, peauFonce, s)}${patte(32, `url(#${g1})`, s)}${patte(72, `url(#${g1})`, s)}
  <!-- queue -->
  <path d="M25 50c-6 3-8 9-6 16" fill="none" stroke="${peauFonce}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M19 64c-2 2-2 5 0 7 2-1 3-4 0-7z" fill="${peauFonce}"/>
  <!-- corps : une seule bosse, cou en S, tête -->
  <path d="M24 56C18 46 24 36 34 32C40 17 59 13 67 30C71 38 77 40 81 35C85 29 86 21 90 17C94 12 102 12 106 16C110 18 115 21 115 26C115 30 111 31 106 30C102 30 100 31 98 34C95 41 92 50 86 58C80 66 70 66 60 64C48 66 36 66 30 62C27 60 25 58 24 56Z" fill="url(#${g1})" ${st}/>
  <!-- reflet doux sur la bosse -->
  <path d="M40 30c5-9 15-11 20-4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>
  <!-- couverture de selle avec franges et pompons -->
  <path d="M37 33C43 21 58 19 64 31L67 47C57 52 44 52 34 47Z" fill="url(#${g2})" ${st}/>
  <path d="M39 37C45 27 57 25 62 34L64 44C56 48 45 48 37 44Z" fill="none" stroke="${or}" stroke-width="1.4"/>
  <path d="M50 31l3 4-3 4-3-4z" fill="${or}"/>
  <path d="M44 41l2 2.5-2 2.5-2-2.5zM56 41l2 2.5-2 2.5-2-2.5z" fill="${or}" opacity=".9"/>
  ${[36, 42, 48, 54, 60, 65].map((x, i) => `<path d="M${x} ${48 + (i === 0 || i === 5 ? -1 : 1)}v4" stroke="${or}" stroke-width="1.2"/><circle cx="${x}" cy="${53 + (i === 0 || i === 5 ? -1 : 1)}" r="1.8" fill="${style === 'C' ? or : '#ff9f43'}"/>`).join('')}
  <!-- licol coloré -->
  <path d="M99 22c3 4 9 5 14 2" fill="none" stroke="${tapis[0]}" stroke-width="2"/>
  <circle cx="99.5" cy="23" r="1.6" fill="${or}"/>
  <!-- oreille, œil avec cils, narine, sourire, joue -->
  <path d="M98 15c-1-4 1-6 3-5 1 2 0 4-3 5z" fill="${peauFonce}" ${st}/>
  <ellipse cx="104" cy="19.5" rx="2" ry="2.4" fill="#2a1a10"/><circle cx="104.7" cy="18.6" r=".7" fill="#fff"/>
  <path d="M102 17.2l-1.2-1.4M103.6 16.6l-.4-1.7M105.4 16.8l.5-1.6" stroke="#2a1a10" stroke-width=".8" stroke-linecap="round"/>
  <path d="M112.5 24.5q.8-.6 1.4.2" fill="none" stroke="#2a1a10" stroke-width=".9" stroke-linecap="round"/>
  <path d="M108 28.5q3 1.2 5.5-.6" fill="none" stroke="#2a1a10" stroke-width=".9" stroke-linecap="round"/>
  <ellipse cx="107" cy="24" rx="2.2" ry="1.4" fill="#ff8a8a" opacity=".45"/>
</svg>`;
}

/* ============ 🧞 Tapis volant ============ */
export function tapis(style = 'B') {
  const s = STYLES[style];
  const g1 = uid('t'), g2 = uid('t');
  const fond = style === 'A' ? ['#b980f0', '#7d5bd6'] : style === 'C' ? ['#2c3e8f', '#16205a'] : ['#8e2a8f', '#5b1a6b'];
  const bord = style === 'A' ? '#ff8fb1' : '#c8364a';
  const or = '#f5c542';
  const st = `stroke="${s.trait}" stroke-width="${s.tw}" stroke-linejoin="round"`;
  const haut = 'M14 30C30 20 46 34 64 26C80 19 96 22 110 16L104 34C92 40 78 35 64 42C46 50 30 37 8 44Z';
  return `<svg viewBox="0 0 120 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${g1}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${fond[0]}"/><stop offset="1" stop-color="${fond[1]}"/></linearGradient>
    <linearGradient id="${g2}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".5" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
  </defs>
  <!-- épaisseur du tapis (bord qui ondule) -->
  <path d="M8 44C30 37 46 50 64 42C78 35 92 40 104 34L104 38C92 44 78 39 64 46C46 54 30 41 8 48Z" fill="${fond[1]}" ${st}/>
  <!-- dessus -->
  <path d="${haut}" fill="url(#${g1})" ${st}/>
  <path d="${haut}" fill="url(#${g2})"/>
  <!-- bordure rouge/rose puis dorée -->
  <path d="M17 31.5C32 23 47 36 64 29C80 22 95 25 106 19.5L101.5 32.5C90 37.5 77 33 64 39.5C47 47 31 35 12.5 41.5Z" fill="none" stroke="${bord}" stroke-width="3"/>
  <path d="M21 33C34 26 48 38 64 31.5C79 25 93 28 102 23L98.5 31C88 35 76 31 64 37C48 44 33 34 17.5 39Z" fill="none" stroke="${or}" stroke-width="1.2" stroke-dasharray="2 1.6"/>
  <!-- médaillon central + petits losanges -->
  <path d="M60 28.5l6 5.5-6 5.5-6-5.5z" fill="${or}" ${st}/>
  <path d="M60 31l3.2 3-3.2 3-3.2-3z" fill="${bord}"/>
  <path d="M38 33.5l3 3-3 3-3-3zM84 28.5l3 3-3 3-3-3z" fill="${or}" opacity=".9"/>
  <!-- franges aux deux bouts -->
  ${[0, 1, 2, 3, 4, 5, 6].map((i) => { const t = i / 6; const x = 14 + (8 - 14) * t, y = 30 + (44 - 30) * t; return `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l-5 ${(1 + t).toFixed(1)}" stroke="${or}" stroke-width="1.4" stroke-linecap="round"/>`; }).join('')}
  ${[0, 1, 2, 3, 4, 5, 6].map((i) => { const t = i / 6; const x = 110 + (104 - 110) * t, y = 16 + (34 - 16) * t; return `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l5 ${(-1 + t).toFixed(1)}" stroke="${or}" stroke-width="1.4" stroke-linecap="round"/>`; }).join('')}
  <!-- pompons aux 4 coins -->
  <circle cx="9" cy="31" r="2.4" fill="${or}"/><circle cx="3.5" cy="46" r="2.4" fill="${or}"/>
  <circle cx="115.5" cy="15" r="2.4" fill="${or}"/><circle cx="109" cy="34" r="2.4" fill="${or}"/>
  <!-- petites étoiles de vol -->
  <path d="M30 56l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#ffe08a"/>
  <path d="M86 52l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" fill="#ffe08a"/>
</svg>`;
}

/* ============ 🏮 Lanternes (4 modèles) ============ */
// viewBox 0 0 40 84 — anneau en haut à (20,2)
export function lanterne(modele = 0, style = 'B', allumee = 1) {
  const s = STYLES[style];
  const gv = uid('l'), gm = uid('l'), gl = uid('l');
  const metaux = style === 'C' ? [['#ffe08a', '#c99a1a']] : null;
  const pal = [
    { m: ['#f2b25c', '#b0681f'], v: ['#fff4c2', '#ffbf47'] },  // dorée
    { m: ['#5cc3b6', '#1d7f78'], v: ['#fff6d6', '#ffd27a'] },  // turquoise
    { m: ['#f28fa6', '#b8475c'], v: ['#fff1e0', '#ffc46b'] },  // rose
    { m: ['#7f8ff0', '#3e4bb0'], v: ['#fff6d6', '#ffcf6b'] },  // bleue
  ][modele % 4];
  const m = metaux ? metaux[0] : pal.m;
  const st = `stroke="${s.trait === 'none' ? m[1] : s.trait}" stroke-width="${s.tw || .8}" stroke-linejoin="round"`;
  const defs = `<defs>
    <radialGradient id="${gl}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity="${.75 * allumee}"/><stop offset=".55" stop-color="#ffd27a" stop-opacity="${.25 * allumee}"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <radialGradient id="${gv}" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="${pal.v[0]}"/><stop offset="1" stop-color="${pal.v[1]}"/></radialGradient>
    <linearGradient id="${gm}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${m[1]}"/><stop offset=".45" stop-color="${m[0]}"/><stop offset="1" stop-color="${m[1]}"/></linearGradient>
  </defs>`;
  const lueur = `<circle cx="20" cy="44" r="22" fill="url(#${gl})"/>`;
  const anneau = `<circle cx="20" cy="4" r="2.6" fill="none" stroke="url(#${gm})" stroke-width="1.6"/>`;
  let corps = '';
  if (modele % 4 === 0) { // haute hexagonale, dôme à pointe, fenêtres en arc
    corps = `<path d="M20 7v5" stroke="${m[1]}" stroke-width="1.2"/>
      <path d="M20 10l1.5 4h-3z" fill="url(#${gm})"/>
      <path d="M11 24C11 16 15 13 20 13S29 16 29 24Z" fill="url(#${gm})" ${st}/>
      <path d="M14 22c1-4 3-6 6-6" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/>
      <rect x="8" y="23.5" width="24" height="3.5" rx="1.5" fill="url(#${gm})" ${st}/>
      <path d="M10 27h20l3 15-4 16H11L7 42Z" fill="url(#${gv})" ${st}/>
      <path d="M15.5 27l-1 15 1.5 16M24.5 27l1 15-1.5 16M7 42h26" fill="none" stroke="url(#${gm})" stroke-width="1.6"/>
      <path d="M11.5 40c0-6 2-9 3-10M28.5 40c0-6-2-9-3-10M17 40c0-6 1.5-9 3-10 1.5 1 3 4 3 10" fill="none" stroke="${m[1]}" stroke-width=".9" opacity=".8"/>
      <path d="M17.5 50c0-3 1-5 2.5-5.5 1.5.5 2.5 2.5 2.5 5.5Z" fill="#fff" opacity="${.35 + .5 * allumee}"/>
      <path d="M10 58h20l-3 6H13Z" fill="url(#${gm})" ${st}/>
      <path d="M15 64h10l-3 5h-4Z" fill="url(#${gm})" ${st}/>
      <path d="M20 69v6" stroke="${m[1]}" stroke-width="1.2"/><circle cx="20" cy="77" r="2" fill="url(#${gm})"/><path d="M20 79l1.2 3h-2.4z" fill="${m[1]}"/>`;
  } else if (modele % 4 === 1) { // globe rond ajouré d'étoiles
    corps = `<path d="M20 7v6" stroke="${m[1]}" stroke-width="1.2"/>
      <path d="M13 19c0-4 3-6 7-6s7 2 7 6Z" fill="url(#${gm})" ${st}/>
      <rect x="11" y="18.5" width="18" height="3" rx="1.4" fill="url(#${gm})" ${st}/>
      <circle cx="20" cy="38" r="15" fill="url(#${gv})" ${st}/>
      <path d="M20 23c-6 5-6 25 0 30M20 23c6 5 6 25 0 30M5.5 36h29M7 44h26" fill="none" stroke="url(#${gm})" stroke-width="1.3"/>
      ${[[13, 30], [27, 30], [20, 38], [12, 41], [28, 41], [20, 48]].map(([x, y]) => `<path d="M${x} ${y - 2.4}l.8 1.6 1.6.8-1.6.8-.8 1.6-.8-1.6-1.6-.8 1.6-.8z" fill="#fff" opacity="${.4 + .5 * allumee}"/>`).join('')}
      <path d="M11 30c2-4 5-6 8-6.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M13 52h14l-2 5H15Z" fill="url(#${gm})" ${st}/>
      <path d="M20 57v8" stroke="${m[1]}" stroke-width="1.2"/><path d="M17 65h6l-1 5c-1 2-3 2-4 0Z" fill="url(#${gm})"/>
      <path d="M20 71v6" stroke="${m[1]}" stroke-width="1"/><circle cx="20" cy="78" r="1.8" fill="${m[0]}"/>`;
  } else if (modele % 4 === 2) { // bulbe en oignon, corps long à vitraux
    corps = `<path d="M20 7v4" stroke="${m[1]}" stroke-width="1.2"/>
      <path d="M20 9c1 3 3 4 3 6 0 2-1.5 3-3 3s-3-1-3-3c0-2 2-3 3-6z" fill="url(#${gm})" ${st}/>
      <path d="M10 27C10 21 15 18 20 18S30 21 30 27Z" fill="url(#${gm})" ${st}/>
      <path d="M9 27h22v3H9Z" fill="url(#${gm})" ${st}/>
      <path d="M11 30h18v24c0 4-4 7-9 7s-9-3-9-7Z" fill="url(#${gv})" ${st}/>
      <path d="M17 30v30M23 30v30M11 42h18" fill="none" stroke="url(#${gm})" stroke-width="1.4"/>
      <path d="M13 40v-5a1.5 1.5 0 0 1 3 0v5M24 40v-5a1.5 1.5 0 0 1 3 0v5M18.5 40v-5a1.5 1.5 0 0 1 3 0v5" fill="none" stroke="${m[1]}" stroke-width=".8"/>
      <path d="M13 52c0-4 1-6 1.5-6 .5 0 1.5 2 1.5 6M24 52c0-4 1-6 1.5-6 .5 0 1.5 2 1.5 6" fill="none" stroke="${m[1]}" stroke-width=".8"/>
      <ellipse cx="20" cy="50" rx="1.6" ry="3" fill="#fff" opacity="${.35 + .5 * allumee}"/>
      <path d="M14 59h12l-2 4h-8Z" fill="url(#${gm})" ${st}/>
      <path d="M20 63v5" stroke="${m[1]}" stroke-width="1.2"/><path d="M18 68h4l-2 8z" fill="url(#${gm})"/>`;
  } else { // petite carrée à toit en pagode et pointes
    corps = `<path d="M20 7v4" stroke="${m[1]}" stroke-width="1.2"/>
      <circle cx="20" cy="12" r="1.8" fill="url(#${gm})"/>
      <path d="M20 13C17 18 11 20 7 22h26c-4-2-10-4-13-9Z" fill="url(#${gm})" ${st}/>
      <path d="M7 22c-1 1-2 1-3 0M33 22c1 1 2 1 3 0" fill="none" stroke="${m[1]}" stroke-width="1.2" stroke-linecap="round"/>
      <rect x="10" y="22" width="20" height="3" rx="1" fill="url(#${gm})" ${st}/>
      <path d="M11 25h18l-1 26H12Z" fill="url(#${gv})" ${st}/>
      <path d="M11 25l9 13 9-13M12 51l8-13 8 13" fill="none" stroke="url(#${gm})" stroke-width="1.3"/>
      <path d="M20 31.5l1.4 2.8 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3-2.2-2.1 3-.4z" fill="#fff" opacity="${.35 + .5 * allumee}"/>
      <path d="M8 51h24l-4 5H12Z" fill="url(#${gm})" ${st}/>
      <path d="M14 56l6 14 6-14" fill="url(#${gm})" ${st}/>
      <circle cx="20" cy="73" r="1.8" fill="${m[0]}"/>`;
  }
  return `<svg viewBox="0 0 40 84" xmlns="http://www.w3.org/2000/svg">${defs}${lueur}${anneau}${corps}</svg>`;
}

/* ============ 🌙 Lune lumineuse ============ */
export function lune(style = 'B') {
  const g1 = uid('n'), g2 = uid('n');
  const c = style === 'A' ? ['#fff3c4', '#ffb86b'] : style === 'C' ? ['#fff0b3', '#e0a91f'] : ['#ffe58f', '#e8b130'];
  const s = STYLES[style];
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="${g1}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2b8" stop-opacity=".9"/><stop offset=".5" stop-color="#ffd27a" stop-opacity=".3"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <linearGradient id="${g2}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient>
  </defs>
  <circle cx="38" cy="40" r="38" fill="url(#${g1})"/>
  <path d="M46 10C30 10 17 23 17 40s13 30 29 30c6 0 11-2 15-5-3 1-6 1-9 1-15 0-26-12-26-26S37 14 52 14c3 0 6 0 9 1-4-3-9-5-15-5z" fill="url(#${g2})" ${s.tw ? `stroke="${s.trait}" stroke-width="${s.tw * .8}"` : ''}/>
  <path d="M24 32c2-8 8-14 16-17" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>
  <circle cx="30" cy="48" r="2.2" fill="${c[1]}" opacity=".35"/><circle cx="26" cy="38" r="1.4" fill="${c[1]}" opacity=".3"/><circle cx="36" cy="58" r="1.6" fill="${c[1]}" opacity=".3"/>
  <path d="M58 30l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#fff6c9"/>
  <path d="M66 50l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#fff6c9" opacity=".85"/>
</svg>`;
}

/* ============ Planche d'essai ============ */
export function planche() {
  const fonds = { A: 'linear-gradient(160deg,#3b2a7a,#6a4bb5)', B: '#fbf3e4', C: 'linear-gradient(160deg,#0e1640,#1e2d72)' };
  return ['A', 'B', 'C'].map((st) => `<div style="background:${fonds[st]};padding:16px;margin:8px;border-radius:16px;display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap">
    <b style="color:${st === 'B' ? '#333' : '#fff'};font:700 20px sans-serif;width:30px">${st}</b>
    <div style="width:200px">${dromadaire(st)}</div>
    <div style="width:200px">${tapis(st)}</div>
    ${[0, 1, 2, 3].map((i) => `<div style="width:60px">${lanterne(i, st)}</div>`).join('')}
    <div style="width:110px">${lune(st)}</div></div>`).join('');
}
