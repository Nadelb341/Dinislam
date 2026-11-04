/**
 * 🌸☀️ Dessins du printemps et de l'été (demande de Nadia du 2026-11-04, d'après ses images :
 * prairie de marguerites et grand arbre courbé ; soleil à rayons pointus ; plage avec palmier et transat rayé).
 * Tous les dessins sont en SVG, sans image externe (l'appli reste légère et marche sans réseau).
 */
export type Clair = 'printemps' | 'ete';
const f1 = (n: number) => n.toFixed(1);

/* ---------- Soleils (viewBox 0 0 120 120) ---------- */
/** Printemps : soleil à rayons pointus, longs et courts en alternance (comme l'image de Nadia) */
export function soleilPrintemps(): string {
  let rayons = '', traits = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, long = i % 2 === 0, tip = long ? 57 : 47, base = 33, w = long ? 0.16 : 0.14;
    const p = (ang: number, r: number) => `${f1(60 + Math.cos(ang) * r)} ${f1(60 + Math.sin(ang) * r)}`;
    rayons += `<path d="M${p(a - w, base)}L${p(a, tip)}L${p(a + w, base)}z"/>`;
    traits += `<path d="M${p(a, base + 5)}L${p(a, base + (tip - base) * 0.55)}"/>`;
  }
  return `<defs><radialGradient id="peHaloP"><stop offset=".35" stop-color="#ffe680" stop-opacity=".7"/><stop offset="1" stop-color="#ffe680" stop-opacity="0"/></radialGradient></defs>
    <circle class="pe-halo" cx="60" cy="60" r="60" fill="url(#peHaloP)"/>
    <g class="pe-rayons"><g fill="#f7cf45" stroke="#f0b429" stroke-width="2.4" stroke-linejoin="round">${rayons}</g>
    <g stroke="#f0b429" stroke-width="1.3" stroke-linecap="round" opacity=".7">${traits}</g></g>
    <circle cx="60" cy="60" r="33" fill="#f9d548" stroke="#f0b429" stroke-width="3"/>
    <circle cx="60" cy="60" r="27" fill="#fbdb5b"/>
    <path d="M44 50a18 18 0 0 1 12-9" stroke="#fff3b0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
/** Été : soleil encore plus brillant (cœur en dégradé, rayons fins, grand halo qui pulse, petit éclat) */
export function soleilEte(): string {
  let rayons = '';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, r1 = 36, r2 = i % 2 ? 50 : 58;
    rayons += `<path d="M${f1(60 + Math.cos(a) * r1)} ${f1(60 + Math.sin(a) * r1)}L${f1(60 + Math.cos(a) * r2)} ${f1(60 + Math.sin(a) * r2)}"/>`;
  }
  return `<defs>
      <radialGradient id="peHaloE"><stop offset=".3" stop-color="#fff2a8" stop-opacity=".95"/><stop offset=".6" stop-color="#ffd84a" stop-opacity=".35"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient>
      <radialGradient id="peCoeurE" cx=".4" cy=".38"><stop offset="0" stop-color="#fffbe0"/><stop offset=".45" stop-color="#ffe14d"/><stop offset="1" stop-color="#ffb020"/></radialGradient>
    </defs>
    <circle class="pe-halo" cx="60" cy="60" r="60" fill="url(#peHaloE)"/>
    <g class="pe-rayons" stroke="#ffc21a" stroke-width="5" stroke-linecap="round">${rayons}</g>
    <circle cx="60" cy="60" r="31" fill="url(#peCoeurE)" stroke="#ffb020" stroke-width="2"/>
    <path class="pe-eclat" d="M84 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff"/>`;
}
/** Le soir, la lune remplace le soleil (croissant doux) */
export const LUNE_SVG = `<defs><radialGradient id="peLune"><stop offset=".4" stop-color="#fff6c8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>
  <circle cx="60" cy="60" r="56" fill="url(#peLune)"/><path d="M74 30a32 32 0 1 0 0 60a26 26 0 1 1 0-60z" fill="#fff3b8" stroke="#f2d77a" stroke-width="2"/>`;

/* ---------- Nuage (viewBox 0 0 80 40) ---------- */
export const NUAGE_SVG = `<path d="M14 36a12 12 0 0 1-1-24 15 15 0 0 1 28-7 12 12 0 0 1 21 6 10 10 0 0 1 4 25z" fill="#ffffff" stroke="#d8e8f5" stroke-width="1.5"/>
  <path d="M18 33h44" stroke="#e6f0fa" stroke-width="4" stroke-linecap="round"/>`;

/* ---------- Grand arbre du printemps (à la place de la cheminée, viewBox 0 0 200 240) ---------- */
export function arbrePrintemps(): string {
  const touffe = (x: number, y: number, r: number, c: string) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  const reflets = [[70, 60, 8], [120, 40, 7], [150, 80, 9], [95, 100, 6], [170, 50, 6]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="#d4ec8a" opacity=".85"/>`).join('');
  return `<g class="pe-arbre-bouge">
    <path d="M120 240c4-40 0-70-14-96-8-15-24-24-44-30 22 2 38 10 50 22-4-22-16-38-34-50 22 8 36 24 44 46 6-20 20-34 40-42-16 12-26 30-28 52 14 30 18 64 16 98z" fill="#8a4b3c" stroke="#5e2f24" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M118 236c2-34-2-60-12-82" stroke="#a65d4b" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>
    <g stroke="#5f8f2a" stroke-width="2.4">${touffe(60, 70, 40, '#8cc63f')}${touffe(110, 45, 46, '#9fd14a')}${touffe(160, 70, 40, '#8cc63f')}${touffe(95, 100, 34, '#7cb342')}${touffe(150, 108, 30, '#7cb342')}</g>
    ${touffe(60, 70, 38, '#8cc63f')}${touffe(110, 45, 44, '#9fd14a')}${touffe(160, 70, 38, '#8cc63f')}${touffe(95, 100, 32, '#7cb342')}${touffe(150, 108, 28, '#7cb342')}
    ${reflets}
  </g>`;
}

/* ---------- Palmiers + transat (à la place de la cheminée, viewBox 0 0 200 220) ---------- */
export function palmiersEte(): string {
  const palme = (x: number, y: number, ang: number, l: number, c: string) => {
    let d = `M${x} ${y}`;
    const ex = x + Math.cos(ang) * l, ey = y + Math.sin(ang) * l, mx = x + Math.cos(ang) * l * 0.5, my = y + Math.sin(ang) * l * 0.5 - l * 0.22;
    d += `Q${f1(mx)} ${f1(my)} ${f1(ex)} ${f1(ey)}`;
    let folioles = '';
    for (let k = 1; k <= 10; k++) {
      const t = k / 11, px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * mx + t * t * ex, py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * my + t * t * ey;
      const n = 14 * (1 - t * 0.6);
      folioles += `<path d="M${f1(px)} ${f1(py)}l${f1(Math.cos(ang + 1.9) * n)} ${f1(Math.sin(ang + 1.9) * n + 4)}M${f1(px)} ${f1(py)}l${f1(Math.cos(ang - 1.9) * n)} ${f1(Math.sin(ang - 1.9) * n + 4)}"/>`;
    }
    return `<g stroke="${c}" stroke-linecap="round" fill="none"><path d="${d}" stroke-width="3.6"/><g stroke-width="3.6">${folioles}</g></g>`;
  };
  const tronc = (x0: number, y0: number, x1: number, y1: number) => {
    let s = `<path d="M${x0} ${y0}Q${(x0 + x1) / 2 + 14} ${(y0 + y1) / 2} ${x1} ${y1}" stroke="#8a5a32" stroke-width="10" fill="none" stroke-linecap="round"/>`;
    for (let k = 1; k < 9; k++) {
      const t = k / 9, px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2 + 14) + t * t * x1, py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * ((y0 + y1) / 2) + t * t * y1;
      s += `<path d="M${f1(px - 5)} ${f1(py)}q5 3 10 0" stroke="#5e3a1e" stroke-width="1.4" fill="none"/>`;
    }
    return s;
  };
  const tete = (x: number, y: number, cls: string) => `<g class="${cls}" style="transform-origin:${x}px ${y}px">
    ${palme(x, y, -2.6, 58, '#3f8f3a')}${palme(x, y, -0.5, 58, '#3f8f3a')}${palme(x, y, -1.6, 46, '#4fa646')}${palme(x, y, 2.9, 50, '#4fa646')}${palme(x, y, 0.25, 52, '#4fa646')}${palme(x, y, -2.1, 40, '#5cb85c')}${palme(x, y, -1.0, 40, '#5cb85c')}
    <circle cx="${x - 4}" cy="${y + 4}" r="4" fill="#8a5a32"/><circle cx="${x + 3}" cy="${y + 5}" r="4" fill="#7a4a26"/></g>`;
  return `<defs><pattern id="peRayure" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-62)"><rect width="5" height="10" fill="#e0453c"/><rect x="5" width="5" height="10" fill="#ffffff"/></pattern></defs>
    ${tronc(146, 214, 120, 58)}${tronc(178, 216, 172, 104)}${tete(120, 58, 'pe-palme')}${tete(172, 104, 'pe-palme b')}
    <ellipse cx="70" cy="212" rx="58" ry="6" fill="#d9a85c" opacity=".35"/>
    <g stroke="#7a4a26" stroke-width="3" stroke-linecap="round"><path d="M34 150l16 60M60 192l-20 18M100 186l8 24M72 190l-6 20"/></g>
    <path d="M26 146l10-4 26 48 48-6 2 8-54 8z" fill="url(#peRayure)" stroke="#7a4a26" stroke-width="2" stroke-linejoin="round"/>
    <path d="M36 142l26 48 48-6" stroke="#8a5a32" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(118 194)"><path d="M0 0h16l-2 15H2z" fill="#4fb3e8" stroke="#2c6f9a" stroke-width="1.6"/><path d="M2 0q6-10 12 0" stroke="#2c6f9a" stroke-width="1.4" fill="none"/><path d="M14 2l10-12" stroke="#f2b23a" stroke-width="2.6" stroke-linecap="round"/><path d="M21 -14l6 2-3 5z" fill="#f2b23a"/></g>`;
}

/* ---------- Bande du bas (largeur W, viewBox 0 0 W 70 ou 84) ---------- */
function hasard(graine: number) { let s = graine; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const marguerite = (x: number, y: number, r: number, centre = '#f7c22e', petale = '#ffffff') => {
  let p = ''; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; p += `<ellipse cx="${f1(x + Math.cos(a) * r * 0.75)}" cy="${f1(y + Math.sin(a) * r * 0.75)}" rx="${f1(r * 0.5)}" ry="${f1(r * 0.22)}" transform="rotate(${f1(a * 180 / Math.PI)} ${f1(x + Math.cos(a) * r * 0.75)} ${f1(y + Math.sin(a) * r * 0.75)})" fill="${petale}" stroke="#d9d2c0" stroke-width=".5"/>`; }
  return `${p}<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 0.38)}" fill="${centre}" stroke="#e0a21a" stroke-width=".6"/>`;
};
const fleurTige = (x: number, sol: number, h: number, r: number, couleur: string, centre: string, d: number) =>
  `<g class="pe-fleur" style="animation-delay:${f1(-d)}s"><path d="M${f1(x)} ${sol}q${f1(r * 0.4)} ${f1(-h / 2)} 0 ${f1(-h)}" stroke="#4f9a2f" stroke-width="1.6" fill="none"/><path d="M${f1(x)} ${f1(sol - h * 0.4)}q-6 -2 -8 -7q6 0 8 7z" fill="#5cae38"/>${marguerite(x, sol - h, r, centre, couleur)}</g>`;

/** Prairie fleurie (printemps) : collines vertes + marguerites et fleurs rouges/jaunes qui se balancent ; touffe plus dense au tas */
export function bandePrintemps(W: number, tasX: number): { fond: string; tas: string } {
  const r = hasard(Math.round(W) * 11 + 3), H = 70;
  let s = `<path d="M0 ${H}V26C${W * 0.2} 12 ${W * 0.4} 30 ${W * 0.6} 20S${W * 0.9} 14 ${W} 24V${H}z" fill="#c6e27e"/>
    <path d="M0 ${H}V40C${W * 0.25} 28 ${W * 0.5} 46 ${W * 0.75} 34S${W} 32 ${W} 38V${H}z" fill="#8cc63f"/>
    <path d="M0 ${H}V54C${W * 0.3} 46 ${W * 0.6} 60 ${W} 50V${H}z" fill="#76b03a"/>`;
  for (let i = 0; i < W / 7; i++) { const x = r() * W, y = 42 + r() * 26; s += `<path d="M${f1(x)} ${f1(y)}l-2 -6M${f1(x)} ${f1(y)}l1 -7M${f1(x)} ${f1(y)}l3 -5" stroke="#5f9a2c" stroke-width="1.1" stroke-linecap="round"/>`; }
  const COUL: [string, string][] = [['#ffffff', '#f7c22e'], ['#ffffff', '#f7c22e'], ['#ffffff', '#f7c22e'], ['#f05a3a', '#8a3a12'], ['#f7b733', '#c96b12'], ['#ffd1dc', '#f7c22e']];
  const n = Math.round(W / 22);
  for (let i = 0; i < n; i++) {
    const x = r() * W; if (Math.abs(x - tasX) < 34) continue;
    const [c, ce] = COUL[Math.floor(r() * COUL.length)];
    s += fleurTige(x, 62 + r() * 6, 12 + r() * 14, 4 + r() * 3, c, ce, r() * 3);
  }
  let tas = `<path d="M${tasX - 36} 70C${tasX - 30} 46 ${tasX + 30} 46 ${tasX + 36} 70z" fill="#6aa832"/>`;
  for (let i = 0; i < 11; i++) {
    const [c, ce] = COUL[i % COUL.length], x = tasX - 30 + (i / 10) * 60 + (r() - 0.5) * 6;
    tas += fleurTige(x, 68, 16 + r() * 14, 5 + r() * 2.5, c, ce, r() * 3);
  }
  return { fond: s, tas };
}

/** Plage (été) : mer qui ondule en haut, sable en bas avec coquillages et étoiles de mer ; petit tas de sable */
export function bandeEte(W: number, tasX: number): { fond: string; tas: string } {
  const r = hasard(Math.round(W) * 7 + 5), H = 84;
  let vagues = '';
  for (let x = -40; x < W + 80; x += 40) vagues += `<path d="M${x} 12q10-5 20 0t20 0" stroke="#ffffff" stroke-width="2" fill="none" opacity=".75" stroke-linecap="round"/>`;
  let s = `<defs><linearGradient id="peMer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fdcf7"/><stop offset="1" stop-color="#38a9df"/></linearGradient>
      <linearGradient id="peSable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8dc9a"/><stop offset="1" stop-color="#eec27a"/></linearGradient></defs>
    <path d="M0 ${H}V6C${W * 0.3} 2 ${W * 0.6} 10 ${W} 4V${H}z" fill="url(#peMer)"/>
    <g class="pe-vagues">${vagues}</g>
    <path d="M0 ${H}V40C${W * 0.2} 30 ${W * 0.45} 44 ${W * 0.7} 34S${W * 0.95} 30 ${W} 36V${H}z" fill="#ffffff" opacity=".7" class="pe-ecume"/>
    <path d="M0 ${H}V42C${W * 0.2} 33 ${W * 0.45} 46 ${W * 0.7} 37S${W * 0.95} 33 ${W} 39V${H}z" fill="url(#peSable)"/>`;
  for (let i = 0; i < W / 9; i++) s += `<circle cx="${f1(r() * W)}" cy="${f1(50 + r() * 32)}" r=".9" fill="#d6a85c" opacity=".7"/>`;
  for (let i = 0; i < W / 70; i++) {
    const x = r() * W, y = 60 + r() * 18; if (Math.abs(x - tasX) < 30) continue;
    s += r() < 0.5
      ? `<path d="M${f1(x)} ${f1(y)}l2.4 -5 2.4 5 5 .6-3.8 3.4 1.2 5-4.8-2.6-4.8 2.6 1.2-5-3.8-3.4z" fill="#f2864a" stroke="#c75a26" stroke-width=".8"/>`
      : `<path d="M${f1(x)} ${f1(y)}q6-9 12 0z" fill="#fde7d8" stroke="#d9a58c" stroke-width=".8"/><path d="M${f1(x + 6)} ${f1(y)}v-6M${f1(x + 3)} ${f1(y)}l1.6-5M${f1(x + 9)} ${f1(y)}l-1.6-5" stroke="#d9a58c" stroke-width=".6"/>`;
  }
  const tas = `<path d="M${tasX - 32} ${H}C${tasX - 26} 56 ${tasX + 26} 56 ${tasX + 32} ${H}z" fill="#f2cf86" stroke="#d9a85c" stroke-width="1.2"/>
    <path d="M${tasX - 14} 66q6-5 12-4" stroke="#fbe6b4" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M${tasX + 6} 60v-16" stroke="#7a4a26" stroke-width="1.6"/><path d="M${tasX + 6} 44l12 4-12 4z" fill="#e0453c"/>`;
  return { fond: s, tas };
}

/* ---------- Animaux qui se promènent (viewBox 0 0 40 34, tournés vers la droite) ---------- */
const O = 'stroke="#3a2a20" stroke-width="1.2" stroke-linejoin="round"';
export type AnimalClair = 'lapin' | 'escargot' | 'biche' | 'crabe' | 'dauphin';
export const ANIMAUX: Record<AnimalClair, { nom: string; svg: string }> = {
  lapin: { nom: 'le lapin', svg: `<g class="pe-corps"><ellipse cx="17" cy="24" rx="11" ry="8" fill="#ece3d8" ${O}/><circle cx="6" cy="23" r="3.6" fill="#fff" ${O}/>
    <path d="M27 14c-1-8 0-13 2-13 2 1 2 7 0 13z" fill="#ece3d8" ${O}/><path d="M28 12c0-5 .4-8 1-8" stroke="#f6b6c2" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M31 15c1-8 3-12 5-12 1 2 0 8-3 13z" fill="#ece3d8" ${O}/>
    <circle cx="30" cy="19" r="6.5" fill="#ece3d8" ${O}/><circle cx="32" cy="18" r="1.3" fill="#2a1a10"/><circle cx="32.4" cy="17.6" r=".45" fill="#fff"/>
    <circle cx="36.2" cy="20.4" r="1.1" fill="#f28ba0"/><circle cx="31" cy="22" r="1.5" fill="#f6a5b4" opacity=".6"/>
    <ellipse cx="12" cy="31" rx="4" ry="1.8" fill="#ece3d8" ${O}/><ellipse cx="24" cy="31" rx="3" ry="1.6" fill="#ece3d8" ${O}/></g>` },
  escargot: { nom: "l'escargot", svg: `<g class="pe-corps"><path d="M4 31c4-2 22-2 30-1 3 0 5-3 4-6-1-2-3-2-4 0" fill="#d8e59a" ${O}/>
    <path d="M34 24c1-5 0-9-1-12M36 25c2-5 3-9 3-12" stroke="#3a2a20" stroke-width="1.1" fill="none"/><circle cx="33" cy="11.5" r="1.4" fill="#3a2a20"/><circle cx="39" cy="12.5" r="1.4" fill="#3a2a20"/>
    <circle cx="18" cy="20" r="10" fill="#e08a3c" ${O}/><path d="M18 20m-6 0a6 6 0 1 1 6 6a3.5 3.5 0 1 1 -3.5-3.5" stroke="#9a4f1c" stroke-width="1.6" fill="none"/>
    <circle cx="36" cy="26" r="1" fill="#2a1a10"/></g>` },
  biche: { nom: 'la biche', svg: `<g class="pe-corps"><path d="M9 25c0-6 6-9 15-9 4 0 7 2 7 6 0 4-4 6-11 6H12z" fill="#c98a52" ${O}/>
    <g stroke="#3a2a20" stroke-width="1.2" stroke-linecap="round"><path d="M12 27v6M17 27v6M24 27v6M28 26v7"/></g>
    <path d="M27 18c1-5 3-8 6-9 3 0 4 2 3 5-1 2-3 3-5 3l-2 4z" fill="#c98a52" ${O}/><path d="M32 10c-1-4 0-6 2-7 1 2 1 5-1 7" fill="#c98a52" ${O}/>
    <circle cx="34" cy="12" r="1.2" fill="#2a1a10"/><circle cx="37.2" cy="13.6" r=".9" fill="#2a1a10"/>
    <g fill="#fff4e6"><circle cx="15" cy="20" r="1.1"/><circle cx="19" cy="18.6" r="1"/><circle cx="22" cy="21" r="1.1"/><circle cx="18" cy="23" r=".9"/></g>
    <path d="M9 21c-2-1-3-3-2-4 2 0 3 2 3 3z" fill="#fff4e6" ${O}/></g>` },
  crabe: { nom: 'le crabe', svg: `<g class="pe-corps"><g stroke="#b6371f" stroke-width="1.6" stroke-linecap="round"><path d="M8 26l-5 4M9 29l-4 4M32 26l5 4M31 29l4 4"/></g>
    <ellipse cx="20" cy="24" rx="13" ry="8" fill="#ef5a3a" stroke="#b6371f" stroke-width="1.2"/>
    <path d="M9 18l-4-7M31 18l4-7" stroke="#b6371f" stroke-width="2" stroke-linecap="round"/>
    <path d="M1 9c0-4 4-6 7-4l-3 3 4 1c-2 4-7 4-8 0z" fill="#ef5a3a" stroke="#b6371f" stroke-width="1"/><path d="M39 9c0-4-4-6-7-4l3 3-4 1c2 4 7 4 8 0z" fill="#ef5a3a" stroke="#b6371f" stroke-width="1"/>
    <path d="M16 17v-5M24 17v-5" stroke="#b6371f" stroke-width="1.4"/><circle cx="16" cy="11" r="2.2" fill="#fff" stroke="#3a2a20" stroke-width=".8"/><circle cx="24" cy="11" r="2.2" fill="#fff" stroke="#3a2a20" stroke-width=".8"/>
    <circle cx="16.4" cy="11.2" r="1" fill="#2a1a10"/><circle cx="24.4" cy="11.2" r="1" fill="#2a1a10"/><path d="M17 26q3 2 6 0" stroke="#7a2412" stroke-width="1" fill="none"/></g>` },
  dauphin: { nom: 'le dauphin', svg: `<g class="pe-corps"><path d="M2 22c6-10 18-14 28-10 4 1 7 4 8 7l-6 1c-2 0-3 1-4 2-8 3-18 4-26 0z" fill="#6aa9d8" stroke="#2e6a99" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M6 24c8 3 16 2 22-1" fill="#e6f3fb" stroke="none"/><path d="M18 12l4-8 3 9z" fill="#5a98c8" stroke="#2e6a99" stroke-width="1.1"/>
    <path d="M3 21l-3-6 6 3zM3 22l-3 5 6-2z" fill="#5a98c8" stroke="#2e6a99" stroke-width="1"/><circle cx="31" cy="16" r="1.2" fill="#1d2533"/><path d="M33 20q2 1 4-1" stroke="#2e6a99" stroke-width=".9" fill="none"/></g>` },
};

/** Oiseau dans l'arbre (printemps) et tortue sur le sable (été) : ils montrent le mot du jour (viewBox 0 0 40 34) */
export const OISEAU_SVG = `<g class="pe-respire"><ellipse cx="18" cy="20" rx="11" ry="9" fill="#4aa3df" ${O}/><path d="M8 20c-5-1-7-4-6-6 3 0 6 2 7 4z" fill="#3a86c0" ${O}/>
  <circle cx="27" cy="13" r="7" fill="#4aa3df" ${O}/><ellipse cx="22" cy="22" rx="6" ry="5" fill="#ffe08a"/><path d="M33 13l5 1.6-5 1.6z" fill="#f7a823" ${O}/>
  <circle cx="29" cy="12" r="1.3" fill="#1d2533"/><circle cx="29.4" cy="11.6" r=".4" fill="#fff"/><path d="M12 18q6 4 12 0" stroke="#2f6e9e" stroke-width="1.1" fill="none"/>
  <path d="M16 29v3M20 29v3" stroke="#f7a823" stroke-width="1.4"/></g>`;
export const TORTUE_SVG = `<g class="pe-respire"><path d="M6 26c0-9 6-14 14-14s14 5 14 14z" fill="#5fa84a" ${O}/>
  <path d="M12 26c1-6 4-9 8-9s7 3 8 9M20 17v9M14 20l12 0" stroke="#3e7a30" stroke-width="1.1" fill="none"/>
  <ellipse cx="36" cy="23" rx="5" ry="4" fill="#9fd07a" ${O}/><circle cx="37.5" cy="22" r="1" fill="#1d2533"/>
  <ellipse cx="9" cy="28" rx="3.4" ry="2" fill="#9fd07a" ${O}/><ellipse cx="29" cy="28" rx="3.4" ry="2" fill="#9fd07a" ${O}/></g>`;

/* ---------- Mots du jour (prononciation · traduction) ---------- */
export const MOTS: Record<Clair, [string, string][]> = {
  printemps: [['رَبِيع', 'rabîʿ · le printemps'], ['زَهْرَة', 'zahra · une fleur'], ['فَرَاشَة', 'farâcha · un papillon'], ['نَحْلَة', 'naḥla · une abeille'], ['شَجَرَة', 'chajara · un arbre'], ['عُشْب', 'ʿouchb · l’herbe'], ['شَمْس', 'chams · le soleil'], ['مَطَر', 'maṭar · la pluie'], ['أَرْنَب', 'arnab · le lapin'], ['حَلَزُون', 'ḥalazoûn · l’escargot']],
  ete: [['صَيْف', 'ṣayf · l’été'], ['بَحْر', 'baḥr · la mer'], ['رَمْل', 'raml · le sable'], ['شَاطِئ', 'châṭiʾ · la plage'], ['سَمَكَة', 'samaka · un poisson'], ['نَخْلَة', 'nakhla · un palmier'], ['دُلْفِين', 'doulfîn · le dauphin'], ['سَرَطَان', 'saraṭân · le crabe'], ['مَوْجَة', 'mawja · une vague'], ['حَرّ', 'ḥarr · la chaleur']],
};

/* ---------- Images des cartes (« autocollants », viewBox 0 0 48 48) ---------- */
const T = 'stroke="#3a2a20" stroke-width="1.6" stroke-linejoin="round"';
const papillonImg = (c1: string, c2: string) => `<g ${T}><path d="M24 22C16 6 4 8 6 18c1 6 10 8 18 6z" fill="${c1}"/><path d="M24 22C32 6 44 8 42 18c-1 6-10 8-18 6z" fill="${c1}"/>
  <path d="M24 25c-7 0-14 4-12 11 3 5 9 0 12-8z" fill="${c2}"/><path d="M24 25c7 0 14 4 12 11-3 5-9 0-12-8z" fill="${c2}"/><ellipse cx="24" cy="25" rx="2.4" ry="10" fill="#3a2a20"/></g>
  <path d="M23 15q-3-6-6-8M25 15q3-6 6-8" stroke="#3a2a20" stroke-width="1.3" fill="none" stroke-linecap="round"/><g fill="#fff" opacity=".85"><circle cx="13" cy="15" r="2"/><circle cx="35" cy="15" r="2"/></g>`;
export const IMAGES_CLAIR: Record<Clair, Record<string, [string, string]>> = {
  printemps: {
    marguerite: ['Marguerite', marguerite(24, 24, 18, '#f7c22e', '#ffffff')],
    papillon: ['Papillon', papillonImg('#f26b38', '#f7b733')],
    abeille: ['Abeille', `<g ${T}><ellipse cx="17" cy="14" rx="8" ry="10" fill="#e8f4ff" opacity=".9" transform="rotate(-25 17 14)"/><ellipse cx="31" cy="14" rx="8" ry="10" fill="#e8f4ff" opacity=".9" transform="rotate(25 31 14)"/><ellipse cx="24" cy="29" rx="14" ry="11" fill="#f9c80e"/></g><path d="M18 19v20M25 18v22M32 20v18" stroke="#3a2a20" stroke-width="3.4"/><circle cx="35" cy="26" r="1.6" fill="#2a1a10"/><path d="M33 31q2 1.4 4 0" stroke="#2a1a10" stroke-width="1" fill="none"/><circle cx="36" cy="29" r="1.6" fill="#f6a5b4" opacity=".7"/>`],
    coccinelle: ['Coccinelle', `<g ${T}><circle cx="24" cy="12" r="7" fill="#2a1a10"/><circle cx="24" cy="28" r="16" fill="#e0302a"/></g><path d="M24 12v32" stroke="#2a1a10" stroke-width="2"/><g fill="#2a1a10"><circle cx="16" cy="24" r="3"/><circle cx="32" cy="24" r="3"/><circle cx="17" cy="34" r="2.6"/><circle cx="31" cy="34" r="2.6"/></g><circle cx="21" cy="11" r="1.4" fill="#fff"/><circle cx="27" cy="11" r="1.4" fill="#fff"/><path d="M15 21a10 10 0 0 1 5-5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`],
    tulipe: ['Tulipe', `<path d="M24 46V22" stroke="#4f9a2f" stroke-width="3"/><path d="M24 38c-8-2-12-8-12-14 6 2 10 6 12 14zM24 34c8-2 12-8 12-14-6 2-10 6-12 14z" fill="#6cbf3c" ${T}/><path d="M14 8c4 2 6 6 10 6s6-4 10-6c2 10-2 18-10 18S12 18 14 8z" fill="#f15a8b" ${T}/><path d="M24 14v10" stroke="#c23a68" stroke-width="1.4"/>`],
    lapin: ['Lapin', `<g ${T}><path d="M16 22c-3-10-2-18 2-19 4 1 4 10 2 19z" fill="#ece3d8"/><path d="M32 22c3-10 2-18-2-19-4 1-4 10-2 19z" fill="#ece3d8"/><ellipse cx="24" cy="38" rx="14" ry="9" fill="#ece3d8"/><circle cx="24" cy="26" r="11" fill="#ece3d8"/></g><path d="M18 8v10M30 8v10" stroke="#f6b6c2" stroke-width="2.2" stroke-linecap="round"/><circle cx="20" cy="25" r="1.7" fill="#2a1a10"/><circle cx="28" cy="25" r="1.7" fill="#2a1a10"/><ellipse cx="24" cy="29" rx="1.8" ry="1.2" fill="#f28ba0"/><circle cx="17" cy="29" r="2" fill="#f6a5b4" opacity=".6"/><circle cx="31" cy="29" r="2" fill="#f6a5b4" opacity=".6"/>`],
    arrosoir: ['Arrosoir', `<g ${T}><path d="M10 20h22v18c0 3-2 5-5 5H15c-3 0-5-2-5-5z" fill="#5fb6e8"/><path d="M32 26l10-8 2 3-10 9z" fill="#5fb6e8"/><path d="M14 20c0-8 14-8 14 0" fill="none" stroke="#3a2a20" stroke-width="3"/></g><g fill="#7cc6f2"><circle cx="44" cy="26" r="1.4"/><circle cx="46" cy="31" r="1.2"/><circle cx="42" cy="33" r="1.2"/></g><path d="M14 30h14" stroke="#ffffff" stroke-width="2" opacity=".7"/>`],
    escargot: ['Escargot', ANIMAUX.escargot.svg.replace('<g class="pe-corps">', '<g transform="translate(4 8)">')],
  },
  ete: {
    soleil: ['Soleil', `<g stroke="#ffb020" stroke-width="3" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${f1(24 + Math.cos(a) * 15)} ${f1(24 + Math.sin(a) * 15)}L${f1(24 + Math.cos(a) * 22)} ${f1(24 + Math.sin(a) * 22)}"/>`; }).join('')}</g><circle cx="24" cy="24" r="12" fill="#ffd84a" stroke="#ffb020" stroke-width="1.6"/><circle cx="20" cy="22" r="1.5" fill="#3a2a20"/><circle cx="28" cy="22" r="1.5" fill="#3a2a20"/><path d="M19 27q5 4 10 0" stroke="#3a2a20" stroke-width="1.4" fill="none" stroke-linecap="round"/>`],
    glace: ['Glace', `<path d="M14 22l10 24 10-24z" fill="#e8b46a" ${T}/><path d="M17 26l13 0M19 32h10M16 22l10 12M32 22l-10 12" stroke="#c48a42" stroke-width="1"/><g ${T}><circle cx="18" cy="18" r="7" fill="#ffb3c7"/><circle cx="30" cy="18" r="7" fill="#c9f2d2"/><circle cx="24" cy="10" r="7" fill="#fff1c1"/></g><circle cx="24" cy="4" r="2.4" fill="#e0302a"/>`],
    pasteque: ['Pastèque', `<path d="M4 18a20 20 0 0 0 40 0z" fill="#4caf50" ${T}/><path d="M8 18a16 16 0 0 0 32 0z" fill="#f04f5a"/><path d="M8 18h32" stroke="#3a2a20" stroke-width="1.6"/><g fill="#2a1a10"><ellipse cx="17" cy="24" rx="1" ry="1.6"/><ellipse cx="24" cy="29" rx="1" ry="1.6"/><ellipse cx="31" cy="24" rx="1" ry="1.6"/><ellipse cx="22" cy="22" rx="1" ry="1.6"/><ellipse cx="27" cy="23" rx="1" ry="1.6"/></g>`],
    coquillage: ['Coquillage', `<path d="M24 42L8 20c2-10 10-14 16-14s14 4 16 14z" fill="#fde2d4" ${T}/><path d="M24 42L14 12M24 42L24 7M24 42l10-30M24 42L9 21M24 42l15-21" stroke="#d99a80" stroke-width="1.2"/><path d="M18 42h12l-6 4z" fill="#f4c2ad" ${T}/>`],
    crabe: ['Crabe', ANIMAUX.crabe.svg.replace('<g class="pe-corps">', '<g transform="translate(4 6)">')],
    etoile: ['Étoile de mer', `<path d="M24 4l5 12 13 1-10 8 4 13-12-7-12 7 4-13-10-8 13-1z" fill="#f2864a" ${T}/><g fill="#ffd2b0"><circle cx="24" cy="14" r="1.3"/><circle cx="34" cy="20" r="1.3"/><circle cx="14" cy="20" r="1.3"/><circle cx="30" cy="31" r="1.3"/><circle cx="18" cy="31" r="1.3"/><circle cx="24" cy="23" r="1.6"/></g>`],
    parasol: ['Parasol', `<path d="M24 14v32" stroke="#7a4a26" stroke-width="2.4"/><path d="M4 22C6 10 14 4 24 4s18 6 20 18c-3-3-7-3-10 0-3-3-7-3-10 0-3-3-7-3-10 0-3-3-7-3-10 0z" fill="#f04f5a" ${T}/><path d="M14 20c0-8 4-14 10-16 6 2 10 8 10 16" fill="#fff" stroke="none"/><path d="M24 4c-6 2-10 8-10 16M24 4c6 2 10 8 10 16" stroke="#3a2a20" stroke-width="1.2" fill="none"/><path d="M4 46h40" stroke="#eec27a" stroke-width="4" stroke-linecap="round"/>`],
    dauphin: ['Dauphin', `<g transform="translate(4 10)">${ANIMAUX.dauphin.svg.replace('class="pe-corps"', '')}</g><path d="M4 42q5-4 10 0t10 0 10 0 10 0" stroke="#38a9df" stroke-width="2.4" fill="none" stroke-linecap="round"/>`],
  },
};
const PAR_CARTE: Record<Clair, Record<string, string>> = {
  printemps: { nourania: 'abeille', sourates: 'papillon', ramadan: 'tulipe', coran: 'marguerite', alphabet: 'coccinelle', grammaire: 'arrosoir', 'allah-names': 'lapin' },
  ete: { nourania: 'soleil', sourates: 'dauphin', ramadan: 'pasteque', coran: 'coquillage', alphabet: 'etoile', grammaire: 'glace', 'allah-names': 'parasol' },
};
export function imageDeCarteClair(saison: Clair, slug: string, index: number): string {
  const imgs = IMAGES_CLAIR[saison], cles = Object.keys(imgs);
  return imgs[PAR_CARTE[saison][slug] ?? cles[index % cles.length]][1];
}
