/**
 * 🌙 Dessins de la 5ᵉ saison « Ramadan » — REFAITS le 2026-11-17 (Nadia : les premiers étaient « trop robot, trop carrés »,
 * le chameau avait 2 bosses). Choix de Nadia : finition C « or et nuit bleue » ÉCLAIRCIE (pas trop foncée dans l'appli),
 * page https://claude.ai/artifact/PUmpU6LpTW2nHb54ipDKRk. Formes arrondies, dégradés doux, lueur, petits détails,
 * inspirés de ses images d'exemple (sous licence → jamais copiées). Tout est dessiné ici (aucun fichier, marche hors ligne).
 *
 * ⚠️ Chaque dessin prend un `uid` : les dégradés SVG ont un identifiant, et deux dessins affichés sur la même page
 * ne doivent jamais partager le même (sinon un dessin caché peut « éteindre » les couleurs de l'autre).
 */
import { cheminPhase, fractionLune } from '@/lib/phaseLune';

const OR = ['#ffe9a8', '#e0b23a', '#b8891c'] as const; // clair, moyen, foncé
const BLEU = ['#7f95ec', '#4d64c4'] as const;           // bleu ÉCLAIRCI (au lieu du bleu nuit)
const TRAIT = '#8a6a2a';
const st = (w = 1.1, c = TRAIT) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const lin = (id: string, a: string, b: string, x2 = 0, y2 = 1, mid?: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/>${mid ? `<stop offset=".5" stop-color="${mid}"/>` : ''}<stop offset="1" stop-color="${b}"/></linearGradient>`;
const rad = (id: string, a: string, b: string, oa = 1, ob = 1) =>
  `<radialGradient id="${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${a}" stop-opacity="${oa}"/><stop offset="1" stop-color="${b}" stop-opacity="${ob}"/></radialGradient>`;
const etoile4 = (x: number, y: number, r: number, fill = '#fff6c9', cls = '') =>
  `<path${cls ? ` class="${cls}"` : ''} d="M${x} ${y - r}l${r * .28} ${r * .72} ${r * .72} ${r * .28}-${r * .72} ${r * .28}-${r * .28} ${r * .72}-${r * .28}-${r * .72}-${r * .72}-${r * .28} ${r * .72}-${r * .28}z" fill="${fill}"/>`;

/* ---------- 🌙 Lune à la bonne phase (partie éteinte à peine visible + partie éclairée dorée + lueur) ---------- */
export function lunePhase(uid: string, jourHijri: number, cx: number, cy: number, R: number, lueur = true, disqueEteint = true): string {
  const p = fractionLune(jourHijri);
  const g = `lp${uid}`, h = `lh${uid}`;
  return `<defs>${lin(g, '#fff4c4', '#e9b739', 1, 1)}${rad(h, '#fff2b8', '#ffd27a', .85, 0)}</defs>
    ${lueur ? `<circle class="ram-lueur-lune" cx="${cx}" cy="${cy}" r="${R * 1.9}" fill="url(#${h})"/>` : ''}
    ${disqueEteint ? `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#c9d2f0" opacity=".28"/>` : ''}
    <path d="${cheminPhase(p, cx, cy, R)}" fill="url(#${g})"/>
    <circle cx="${cx - R * .3}" cy="${cy + R * .25}" r="${R * .12}" fill="#d9a62a" opacity=".22"/><circle cx="${cx + R * .25}" cy="${cy - R * .3}" r="${R * .09}" fill="#d9a62a" opacity=".2"/>`;
}

/* ---------- 🏮 Lanternes : 4 modèles ciselés, cadre doré, verres pastel différents (viewBox 0 0 40 84, anneau en haut) ---------- */
export const LANTERNE_VB = { w: 40, h: 84 } as const;
export const NB_LANTERNES = 4;
const VERRES: [string, string][] = [['#fff6cf', '#ffcd5c'], ['#f0f4ff', '#a9bcff'], ['#fff1f4', '#ffb0c0'], ['#ecfbf6', '#86dccd']];
export function lanterneSvg(modele: number, uid: string): string {
  const n = ((modele % 4) + 4) % 4;
  const gv = `lv${uid}`, gm = `lm${uid}`, gl = `ll${uid}`;
  const [v0, v1] = VERRES[n];
  const s = st(.8, OR[2]);
  const defs = `<defs>${rad(gl, '#ffd98a', '#ffd98a', .8, 0)}
    <radialGradient id="${gv}" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fffdf2"/><stop offset=".45" stop-color="${v0}"/><stop offset="1" stop-color="${v1}"/></radialGradient>
    ${lin(gm, OR[2], OR[2], 1, 0, OR[0])}</defs>`;
  const debut = `${defs}<circle class="ram-lueur" cx="20" cy="44" r="22" fill="url(#${gl})"/><circle cx="20" cy="4" r="2.6" fill="none" stroke="url(#${gm})" stroke-width="1.6"/>`;
  const reflet = (d: string) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>`;
  if (n === 0) return `${debut}<path d="M20 7v5" stroke="${OR[2]}" stroke-width="1.2"/><path d="M20 10l1.5 4h-3z" fill="url(#${gm})"/>
    <path d="M11 24C11 16 15 13 20 13S29 16 29 24Z" fill="url(#${gm})" ${s}/>${reflet('M14 22c1-4 3-6 6-6')}
    <rect x="8" y="23.5" width="24" height="3.5" rx="1.5" fill="url(#${gm})" ${s}/>
    <path class="ram-verre" d="M10 27h20l3 15-4 16H11L7 42Z" fill="url(#${gv})" ${s}/>
    <path d="M15.5 27l-1 15 1.5 16M24.5 27l1 15-1.5 16M7 42h26" fill="none" stroke="url(#${gm})" stroke-width="1.6"/>
    <path d="M11.5 40c0-6 2-9 3-10M28.5 40c0-6-2-9-3-10M17 40c0-6 1.5-9 3-10 1.5 1 3 4 3 10" fill="none" stroke="${OR[2]}" stroke-width=".9" opacity=".75"/>
    <path class="ram-flamme" d="M17.5 50c0-3 1-5 2.5-5.5 1.5.5 2.5 2.5 2.5 5.5Z" fill="#fff"/>
    <path d="M10 58h20l-3 6H13Z" fill="url(#${gm})" ${s}/><path d="M15 64h10l-3 5h-4Z" fill="url(#${gm})" ${s}/>
    <path d="M20 69v6" stroke="${OR[2]}" stroke-width="1.2"/><circle cx="20" cy="77" r="2" fill="url(#${gm})"/><path d="M20 79l1.2 3h-2.4z" fill="${OR[2]}"/>`;
  if (n === 1) return `${debut}<path d="M20 7v6" stroke="${OR[2]}" stroke-width="1.2"/>
    <path d="M13 19c0-4 3-6 7-6s7 2 7 6Z" fill="url(#${gm})" ${s}/><rect x="11" y="18.5" width="18" height="3" rx="1.4" fill="url(#${gm})" ${s}/>
    <circle class="ram-verre" cx="20" cy="38" r="15" fill="url(#${gv})" ${s}/>
    <path d="M20 23c-6 5-6 25 0 30M20 23c6 5 6 25 0 30M5.5 36h29M7 44h26" fill="none" stroke="url(#${gm})" stroke-width="1.3"/>
    ${[[13, 30], [27, 30], [20, 38], [12, 41], [28, 41], [20, 48]].map(([x, y]) => etoile4(x, y, 2.4, '#fff', 'ram-flamme')).join('')}
    ${reflet('M11 30c2-4 5-6 8-6.5')}
    <path d="M13 52h14l-2 5H15Z" fill="url(#${gm})" ${s}/><path d="M20 57v8" stroke="${OR[2]}" stroke-width="1.2"/>
    <path d="M17 65h6l-1 5c-1 2-3 2-4 0Z" fill="url(#${gm})"/><path d="M20 71v6" stroke="${OR[2]}" stroke-width="1"/><circle cx="20" cy="78" r="1.8" fill="${OR[1]}"/>`;
  if (n === 2) return `${debut}<path d="M20 7v4" stroke="${OR[2]}" stroke-width="1.2"/>
    <path d="M20 9c1 3 3 4 3 6 0 2-1.5 3-3 3s-3-1-3-3c0-2 2-3 3-6z" fill="url(#${gm})" ${s}/>
    <path d="M10 27C10 21 15 18 20 18S30 21 30 27Z" fill="url(#${gm})" ${s}/><path d="M9 27h22v3H9Z" fill="url(#${gm})" ${s}/>
    <path class="ram-verre" d="M11 30h18v24c0 4-4 7-9 7s-9-3-9-7Z" fill="url(#${gv})" ${s}/>
    <path d="M17 30v30M23 30v30M11 42h18" fill="none" stroke="url(#${gm})" stroke-width="1.4"/>
    <path d="M13 40v-5a1.5 1.5 0 0 1 3 0v5M24 40v-5a1.5 1.5 0 0 1 3 0v5M18.5 40v-5a1.5 1.5 0 0 1 3 0v5M13 52c0-4 1-6 1.5-6s1.5 2 1.5 6M24 52c0-4 1-6 1.5-6s1.5 2 1.5 6" fill="none" stroke="${OR[2]}" stroke-width=".8"/>
    <ellipse class="ram-flamme" cx="20" cy="50" rx="1.6" ry="3" fill="#fff"/>
    <path d="M14 59h12l-2 4h-8Z" fill="url(#${gm})" ${s}/><path d="M20 63v5" stroke="${OR[2]}" stroke-width="1.2"/><path d="M18 68h4l-2 8z" fill="url(#${gm})"/>`;
  return `${debut}<path d="M20 7v4" stroke="${OR[2]}" stroke-width="1.2"/><circle cx="20" cy="12" r="1.8" fill="url(#${gm})"/>
    <path d="M20 13C17 18 11 20 7 22h26c-4-2-10-4-13-9Z" fill="url(#${gm})" ${s}/>
    <path d="M7 22c-1 1-2 1-3 0M33 22c1 1 2 1 3 0" fill="none" stroke="${OR[2]}" stroke-width="1.2" stroke-linecap="round"/>
    <rect x="10" y="22" width="20" height="3" rx="1" fill="url(#${gm})" ${s}/>
    <path class="ram-verre" d="M11 25h18l-1 26H12Z" fill="url(#${gv})" ${s}/>
    <path d="M11 25l9 13 9-13M12 51l8-13 8 13" fill="none" stroke="url(#${gm})" stroke-width="1.3"/>
    <path class="ram-flamme" d="M20 31.5l1.4 2.8 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3-2.2-2.1 3-.4z" fill="#fff"/>
    <path d="M8 51h24l-4 5H12Z" fill="url(#${gm})" ${s}/><path d="M14 56l6 14 6-14" fill="url(#${gm})" ${s}/><circle cx="20" cy="73" r="1.8" fill="${OR[1]}"/>`;
}

/* ---------- 🕋 Kaaba (viewBox 0 0 130 120), en haut à gauche, avec la lune du jour au-dessus ---------- */
export const KAABA_VB = { w: 130, h: 120 } as const;
export function kaabaSvg(uid: string, jourHijri: number): string {
  const f = `kf${uid}`, c = `kc${uid}`, o = `ko${uid}`, h = `kh${uid}`, sol = `ks${uid}`;
  return `<defs>${lin(f, '#3a3a46', '#17171d')}${lin(c, '#232330', '#0d0d12')}${lin(o, OR[2], OR[2], 1, 0, OR[0])}${rad(h, '#ffe2a0', '#ffe2a0', .9, 0)}${lin(sol, '#fbf6ec', '#e9dfcc')}</defs>
  <circle class="ram-halo" cx="62" cy="76" r="50" fill="url(#${h})"/>
  ${lunePhase(`k${uid}`, jourHijri, 98, 20, 10)}
  ${etoile4(40, 18, 3.2, '#fff3b0', 'ram-scintille')}${etoile4(120, 44, 2.4, '#fff3b0', 'ram-scintille')}
  <path d="M6 112Q65 100 124 112V120H6Z" fill="url(#${sol})"/>
  <path d="M26 52l14-10h62l-14 10z" fill="#4a4a58" ${st(1, '#2a2a33')}/>
  <path d="M88 52l14-10v58l-14 10z" fill="url(#${c})" ${st(1, '#2a2a33')}/>
  <rect x="26" y="52" width="62" height="58" rx="1.5" fill="url(#${f})" ${st(1, '#2a2a33')}/>
  <rect x="26" y="61" width="62" height="9" fill="url(#${o})"/>
  <path d="M88 61l14-10v9l-14 10z" fill="${OR[2]}"/>
  <path d="M29 66.5q2.5-3 5 0t5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0" fill="none" stroke="#7a560c" stroke-width=".9"/>
  <path d="M90.5 63q2-2 4-1.2t4-1.4 3-1" fill="none" stroke="#7a560c" stroke-width=".7"/>
  <path d="M60 110V88a7 7 0 0 1 14 0v22Z" fill="url(#${o})" ${st(.9, '#7a560c')}/>
  <path d="M63 92h8M63 98h8M63 104h8M67 84v26" stroke="#8a6410" stroke-width=".7"/>
  <path d="M29 56v50" stroke="#fff" stroke-opacity=".12" stroke-width="2" stroke-linecap="round"/>`;
}

/* ---------- 🕌 Mosquée claire aux coupoles bleu doux (viewBox 0 0 200 172), en bas à droite ---------- */
export const MOSQUEE_VB = { w: 200, h: 172 } as const;
export function mosqueeSvg(uid: string): string {
  const m = `mm${uid}`, d = `md${uid}`, o = `mo${uid}`, h = `mh${uid}`, fe = `mf${uid}`;
  const coupole = (x1: number, x2: number, base: number, haut: number) => {
    const cx = (x1 + x2) / 2;
    return `<path d="M${x1} ${base}C${x1} ${base - (base - haut) * .6} ${cx - (x2 - x1) * .25} ${haut + 6} ${cx} ${haut}C${cx + (x2 - x1) * .25} ${haut + 6} ${x2} ${base - (base - haut) * .6} ${x2} ${base}Z" fill="url(#${d})" ${st(1, '#3b4f9e')}/>
      <path d="M${x1 + (x2 - x1) * .22} ${base - 4}C${x1 + (x2 - x1) * .22} ${base - (base - haut) * .55} ${cx - (x2 - x1) * .12} ${haut + 10} ${cx} ${haut + 6}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>
      <path d="M${cx} ${haut}v-7" stroke="${OR[2]}" stroke-width="1.4"/><circle cx="${cx}" cy="${haut - 2}" r="1.6" fill="url(#${o})"/>
      <path d="M${cx + 1.5} ${haut - 13}a3.6 3.6 0 1 0 0 6 2.8 2.8 0 1 1 0-6z" fill="url(#${o})"/>`;
  };
  const fenetre = (x: number, y: number, w: number, hh: number) =>
    `<path class="ram-fenetre" d="M${x} ${y + hh}V${y + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y + hh}Z" fill="url(#${fe})" ${st(.9, OR[2])}/>`;
  return `<defs>${lin(m, '#fffaf0', '#efdcbc')}${lin(d, BLEU[0], BLEU[1], 1, 1)}${lin(o, OR[2], OR[2], 1, 0, OR[0])}${rad(h, '#ffe2a0', '#ffe2a0', .9, 0)}${lin(fe, '#fff3c4', '#ffc24d')}</defs>
  <ellipse class="ram-halo" cx="100" cy="122" rx="96" ry="56" fill="url(#${h})"/>
  <rect x="152" y="40" width="18" height="122" rx="2" fill="url(#${m})" ${st()}/>
  <rect x="148" y="70" width="26" height="5" rx="2" fill="url(#${o})" ${st(.8, OR[2])}/>
  <rect x="149" y="38" width="24" height="5" rx="2" fill="url(#${o})" ${st(.8, OR[2])}/>
  ${coupole(152, 170, 38, 18)}
  ${fenetre(157, 50, 8, 14)}${fenetre(157, 84, 8, 14)}${fenetre(157, 110, 8, 14)}
  <rect x="28" y="96" width="124" height="66" rx="2" fill="url(#${m})" ${st()}/>
  <rect x="26" y="93" width="128" height="5" rx="2" fill="url(#${o})" ${st(.8, OR[2])}/>
  <rect x="58" y="80" width="64" height="14" rx="2" fill="url(#${m})" ${st()}/>
  ${coupole(54, 126, 82, 30)}
  ${coupole(30, 58, 95, 74)}${coupole(122, 150, 95, 74)}
  <path d="M62 86h56" stroke="${OR[1]}" stroke-width="1.2" stroke-dasharray="3 2.4"/>
  ${fenetre(38, 108, 10, 20)}${fenetre(56, 108, 10, 20)}${fenetre(114, 108, 10, 20)}${fenetre(132, 108, 10, 20)}
  <path d="M76 162v-30a14 14 0 0 1 28 0v30Z" fill="#a9733f" ${st()}/>
  <path d="M80 162v-29a10 10 0 0 1 20 0v29" fill="none" stroke="${OR[1]}" stroke-width="1.6"/>
  <path d="M90 124v38" stroke="#7d5126" stroke-width="1"/>
  <g class="ram-lanterne">${'' /* petite lanterne qui pend à l'entrée */}<path d="M90 112v6" stroke="${OR[2]}" stroke-width="1"/><path d="M86.5 118h7l-1 9h-5z" fill="#ffd98a" ${st(.8, OR[2])}/><path d="M86.5 118l3.5-3 3.5 3z" fill="${OR[1]}"/></g>`;
}

/* ---------- 🐪 Dromadaire (UNE bosse) : couverture brodée à pompons, il cligne des yeux et remue la queue ---------- */
const patte = (x: number, fill: string, cls: string) =>
  `<path class="${cls}" d="M${x - 5} 52C${x - 5.5} 62 ${x - 3.6} 72 ${x - 3.8} 77C${x - 4.3} 79.5 ${x - 2.7} 82 ${x - 2.5} 86L${x - 2.7} 91.5Q${x - 3.4} 95 ${x} 95Q${x + 3.4} 95 ${x + 2.7} 91.5L${x + 2.5} 86C${x + 2.7} 82 ${x + 4.3} 79.5 ${x + 3.8} 77C${x + 3.6} 72 ${x + 5.5} 62 ${x + 5} 52Z" fill="${fill}" ${st(1.2, '#7a5530')}/>`;
function dromadaireSvg(uid: string): string {
  const p = `dp${uid}`, c = `dc${uid}`, o = `ds${uid}`;
  const fonce = '#c08a4c';
  return `<defs>${lin(p, '#f6d7a2', '#cf9a5a')}${lin(c, BLEU[0], BLEU[1], 1, 1)}${rad(o, '#000', '#000', .16, 0)}</defs>
  <ellipse cx="58" cy="95" rx="40" ry="4" fill="url(#${o})"/>
  ${patte(41, fonce, 'ram-patte-b')}${patte(81, fonce, 'ram-patte-a')}
  <g class="ram-queue"><path d="M25 50c-6 3-8 9-6 16" fill="none" stroke="${fonce}" stroke-width="2.4" stroke-linecap="round"/><path d="M19 64c-2 2-2 5 0 7 2-1 3-4 0-7z" fill="${fonce}"/></g>
  ${patte(32, `url(#${p})`, 'ram-patte-a')}${patte(72, `url(#${p})`, 'ram-patte-b')}
  <path d="M24 56C18 46 24 36 34 32C40 17 59 13 67 30C71 38 77 40 81 35C85 29 86 21 90 17C94 12 102 12 106 16C110 18 115 21 115 26C115 30 111 31 106 30C102 30 100 31 98 34C95 41 92 50 86 58C80 66 70 66 60 64C48 66 36 66 30 62C27 60 25 58 24 56Z" fill="url(#${p})" ${st(1.2, '#7a5530')}/>
  <path d="M40 30c5-9 15-11 20-4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
  <path d="M37 33C43 21 58 19 64 31L67 47C57 52 44 52 34 47Z" fill="url(#${c})" ${st(1, '#3b4f9e')}/>
  <path d="M39 37C45 27 57 25 62 34L64 44C56 48 45 48 37 44Z" fill="none" stroke="${OR[1]}" stroke-width="1.4"/>
  <path d="M50 31l3 4-3 4-3-4z" fill="${OR[0]}"/><path d="M44 41l2 2.5-2 2.5-2-2.5zM56 41l2 2.5-2 2.5-2-2.5z" fill="${OR[1]}"/>
  ${[36, 42, 48, 54, 60, 65].map((x, i) => { const y = 48 + (i === 0 || i === 5 ? -1 : 1); return `<path d="M${x} ${y}v4" stroke="${OR[1]}" stroke-width="1.2"/><circle cx="${x}" cy="${y + 5}" r="1.8" fill="${OR[1]}"/>`; }).join('')}
  <path d="M99 22c3 4 9 5 14 2" fill="none" stroke="${BLEU[1]}" stroke-width="2"/><circle cx="99.5" cy="23" r="1.6" fill="${OR[1]}"/>
  <path d="M98 15c-1-4 1-6 3-5 1 2 0 4-3 5z" fill="${fonce}" ${st(1, '#7a5530')}/>
  <g class="ram-oeil"><ellipse cx="104" cy="19.5" rx="2" ry="2.4" fill="#2a1a10"/><circle cx="104.7" cy="18.6" r=".7" fill="#fff"/></g>
  <path d="M102 17.2l-1.2-1.4M103.6 16.6l-.4-1.7M105.4 16.8l.5-1.6" stroke="#2a1a10" stroke-width=".8" stroke-linecap="round"/>
  <path d="M112.5 24.5q.8-.6 1.4.2M108 28.5q3 1.2 5.5-.6" fill="none" stroke="#2a1a10" stroke-width=".9" stroke-linecap="round"/>
  <ellipse cx="107" cy="24" rx="2.2" ry="1.4" fill="#ff8a8a" opacity=".45"/>`;
}

/* ---------- 🧞 Tapis volant : bordure, médaillon, franges, pompons ; il ondule (classe ram-ondule) ---------- */
function tapisSvg(uid: string): string {
  const f = `tf${uid}`, s = `ts${uid}`;
  const rouge = '#d0485c';
  const franges = (x0: number, y0: number, x1: number, y1: number, dx: number, dy0: number, dy1: number) => Array.from({ length: 7 }, (_, i) => {
    const t = i / 6; return `<path d="M${(x0 + (x1 - x0) * t).toFixed(1)} ${(y0 + (y1 - y0) * t).toFixed(1)}l${dx} ${(dy0 + (dy1 - dy0) * t).toFixed(1)}" stroke="${OR[1]}" stroke-width="1.4" stroke-linecap="round"/>`;
  }).join('');
  return `<defs>${lin(f, BLEU[0], BLEU[1], 1, 1)}<linearGradient id="${s}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>
  <g class="ram-ondule">
  <path d="M8 44C30 37 46 50 64 42C78 35 92 40 104 34L104 38C92 44 78 39 64 46C46 54 30 41 8 48Z" fill="#3b4f9e" ${st(1, '#3b4f9e')}/>
  <path d="M14 30C30 20 46 34 64 26C80 19 96 22 110 16L104 34C92 40 78 35 64 42C46 50 30 37 8 44Z" fill="url(#${f})" ${st(1, '#3b4f9e')}/>
  <path d="M14 30C30 20 46 34 64 26C80 19 96 22 110 16L104 34C92 40 78 35 64 42C46 50 30 37 8 44Z" fill="url(#${s})"/>
  <path d="M17 31.5C32 23 47 36 64 29C80 22 95 25 106 19.5L101.5 32.5C90 37.5 77 33 64 39.5C47 47 31 35 12.5 41.5Z" fill="none" stroke="${rouge}" stroke-width="3"/>
  <path d="M21 33C34 26 48 38 64 31.5C79 25 93 28 102 23L98.5 31C88 35 76 31 64 37C48 44 33 34 17.5 39Z" fill="none" stroke="${OR[0]}" stroke-width="1.2" stroke-dasharray="2 1.6"/>
  <path d="M60 28.5l6 5.5-6 5.5-6-5.5z" fill="${OR[1]}" ${st(.8, OR[2])}/><path d="M60 31l3.2 3-3.2 3-3.2-3z" fill="${rouge}"/>
  <path d="M38 33.5l3 3-3 3-3-3zM84 28.5l3 3-3 3-3-3z" fill="${OR[0]}"/>
  ${franges(14, 30, 8, 44, -5, 1, 2)}${franges(110, 16, 104, 34, 5, -1, 0)}
  <circle cx="9" cy="31" r="2.4" fill="${OR[1]}"/><circle cx="3.5" cy="46" r="2.4" fill="${OR[1]}"/><circle cx="115.5" cy="15" r="2.4" fill="${OR[1]}"/><circle cx="109" cy="34" r="2.4" fill="${OR[1]}"/>
  </g>
  ${etoile4(30, 58, 3, '#ffe08a', 'ram-scintille')}${etoile4(86, 54, 2.4, '#ffe08a', 'ram-scintille')}${etoile4(56, 60, 1.8, '#ffe08a', 'ram-scintille')}`;
}

/* ---------- 🕊️ Colombe ---------- */
function colombeSvg(uid: string): string {
  const c = `cc${uid}`, a = `ca${uid}`;
  return `<defs>${lin(c, '#ffffff', '#dfe6f6')}${lin(a, '#ffffff', '#cfd9f2', 1, 1)}</defs>
  <path d="M8 30c-4 1-7 4-7 7 4-1 7-1 9-3z" fill="url(#${a})" ${st(1, '#9aa7c7')}/>
  <path d="M10 30C14 22 24 18 34 20c4-5 10-6 13-3 2 2 1 5-1 7-1 9-8 15-18 16-9 1-15-3-18-10z" fill="url(#${c})" ${st(1, '#9aa7c7')}/>
  <path class="ram-aile" d="M22 24C20 12 26 4 36 2c-1 9-4 16-10 22z" fill="url(#${a})" ${st(1, '#9aa7c7')}/>
  <path d="M27 9c2-2 4-3 6-4M26 14c2-2 4-3 6-4" fill="none" stroke="#b9c4e0" stroke-width=".9" stroke-linecap="round"/>
  <path d="M46.5 19.5l6 1.5-6 2z" fill="#f5a623" ${st(.6, '#c97d10')}/>
  <circle cx="43" cy="19" r="1.3" fill="#2a1d14"/><circle cx="43.4" cy="18.6" r=".4" fill="#fff"/>
  <path d="M52 21c3 1 5 0 7-2" fill="none" stroke="#5a8a3a" stroke-width="1" stroke-linecap="round"/>
  <ellipse cx="56" cy="18" rx="2.2" ry="1.1" fill="#7dbb55" transform="rotate(-30 56 18)"/><ellipse cx="58.5" cy="21.5" rx="2.2" ry="1.1" fill="#7dbb55" transform="rotate(20 58.5 21.5)"/>`;
}

/* ---------- 🐑 Mouton de l'Aïd el-Adha (viewBox 0 0 60 44), laine en petits nuages ---------- */
export const MOUTON_VB = { w: 60, h: 44 } as const;
export function moutonSvg(uid: string): string {
  const l = `ml${uid}`, t = `mt${uid}`;
  const boucles = [[14, 18], [22, 13], [31, 12], [40, 15], [46, 22], [42, 29], [33, 31], [23, 31], [14, 27], [27, 21], [36, 22]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="url(#${l})"/>`).join('');
  return `<defs>${rad(l, '#ffffff', '#ebe3d4')}${lin(t, '#8a6d58', '#5e4636')}</defs>
  <ellipse cx="30" cy="42" rx="20" ry="2" fill="#000" opacity=".12"/>
  <path d="M19 32v9M25 33v8M36 33v8M42 32v9" stroke="#5e4636" stroke-width="3" stroke-linecap="round"/>
  <g ${st(.8, '#d6cbb7')}>${boucles}</g>
  <path d="M46 14c3-4 10-3 12 2 2 5-1 11-6 11-4 0-7-5-6-13z" fill="url(#${t})"/>
  <ellipse cx="46" cy="15" rx="4" ry="2" fill="#5e4636" transform="rotate(-25 46 15)"/>
  <circle cx="51" cy="12" r="4" fill="url(#${l})"/>
  <circle cx="54.5" cy="18" r="1.2" fill="#1d130c"/><circle cx="54.9" cy="17.6" r=".4" fill="#fff"/>
  <ellipse cx="53" cy="22" rx="1.8" ry="1" fill="#f4a3a3" opacity=".6"/>`;
}

/* ---------- Compagnons : le dromadaire (désert de l'accueil), le tapis (se promène partout), la colombe (cache-cache), la lune ---------- */
export type CompagnonRamadan = 'dromadaire' | 'tapis' | 'lune' | 'colombe';
export const COMPAGNONS: Record<CompagnonRamadan, { nom: string; vb: [number, number]; vole: boolean }> = {
  dromadaire: { nom: 'Le dromadaire', vb: [120, 100], vole: false },
  tapis: { nom: 'Le tapis volant', vb: [120, 64], vole: true },
  lune: { nom: 'La lune', vb: [80, 80], vole: true },
  colombe: { nom: 'La colombe', vb: [60, 46], vole: true },
};
/** Le dessin d'un compagnon ; la lune prend la phase du jour du mois hégirien */
export function compagnonSvg(k: CompagnonRamadan, uid: string, jourHijri = 10): string {
  if (k === 'dromadaire') return dromadaireSvg(uid);
  if (k === 'tapis') return tapisSvg(uid);
  if (k === 'colombe') return colombeSvg(uid);
  return `${lunePhase(`c${uid}`, jourHijri, 40, 40, 22)}
    ${etoile4(68, 22, 4, '#fff6c9', 'ram-scintille')}${etoile4(12, 62, 3, '#fff6c9', 'ram-scintille')}`;
}

/* ---------- ✨ Guirlande : petite étoile qui pend entre deux lanternes (viewBox 0 0 14 30) ---------- */
export function etoilePendue(uid: string): string {
  const g = `ep${uid}`;
  return `<defs>${lin(g, OR[0], OR[1], 1, 1)}</defs><path d="M7 0v13" stroke="${OR[2]}" stroke-width=".8" stroke-dasharray="1.4 1.4"/>
    <circle cx="7" cy="5" r="1.3" fill="${OR[1]}"/><circle cx="7" cy="10" r="1.3" fill="${OR[1]}"/>
    <path d="M7 14l1.9 4 4.3.6-3.1 3 .7 4.3L7 23.9l-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="url(#${g})" ${st(.6, OR[2])}/>`;
}

/* ---------- 🖼️ Images sur les cartes de l'accueil (viewBox 0 0 48 48) ---------- */
function imageSvg(k: string, uid: string): string {
  const a = `ia${uid}`, b = `ib${uid}`, o = `io${uid}`;
  const dOr = lin(o, OR[2], OR[2], 1, 0, OR[0]);
  switch (k) {
    case 'lanterne': return `<g transform="translate(13 1) scale(.55)">${lanterneSvg(Number(uid.replace(/\D/g, '')) || 0, `i${uid}`)}</g>`;
    case 'croissant': return `${lunePhase(`i${uid}`, 3, 24, 24, 17, false, false)}${etoile4(38, 12, 4, OR[0])}${etoile4(9, 38, 2.6, OR[0])}`;
    case 'dattes': return `<defs>${lin(a, '#f3e3c6', '#cfae7c')}${lin(b, '#9a4a22', '#5a2410', 1, 1)}</defs>
      <path d="M5 30h38c0 8-8 13-19 13S5 38 5 30z" fill="url(#${a})" ${st()}/><ellipse cx="24" cy="30" rx="19" ry="4" fill="#f8eedb" ${st()}/>
      ${[[15, 26, -25], [24, 24, 0], [33, 26, 25], [19, 21, -10], [29, 21, 12]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="4" ry="7" fill="url(#${b})" ${st(.6, '#3a1a08')}/><ellipse cx="${x - 1.4}" cy="${y - 2.5}" rx="1" ry="2.4" fill="#d48a5c" opacity=".7"/></g>`).join('')}`;
    case 'theiere': return `<defs>${dOr}${lin(a, '#fff3c4', OR[1], 1, 1)}</defs>
      <path d="M13 23c0-6 5-9 11-9s11 3 11 9v8c0 5-5 9-11 9s-11-4-11-9z" fill="url(#${a})" ${st(1, OR[2])}/>
      <path d="M35 22c6-1 8 5 4 9l-4 2" fill="none" stroke="${OR[2]}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M13 26C9 23 7 18 4 16" fill="none" stroke="${OR[2]}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M17 14c1-3 4-5 7-5s6 2 7 5z" fill="url(#${o})" ${st(.8, OR[2])}/><circle cx="24" cy="7.4" r="2" fill="${OR[1]}"/>
      <path d="M15 27h18M16 32h16" stroke="${BLEU[0]}" stroke-width="1.4"/><path d="M18 20c1-2 3-3 5-3" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M38 36h7l-1 8h-5z" fill="#d6ecff" opacity=".85" ${st(.7, OR[2])}/><path d="M39 39h5" stroke="#c0782a" stroke-width="2.6"/>`;
    case 'chapelet': return `<defs><radialGradient id="${a}" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#e9a86a"/><stop offset="1" stop-color="#8a4a1a"/></radialGradient>${dOr}</defs>
      ${Array.from({ length: 16 }, (_, i) => { const t = (i / 16) * Math.PI * 2; return `<circle cx="${(24 + Math.cos(t) * 14).toFixed(1)}" cy="${(19 + Math.sin(t) * 12).toFixed(1)}" r="2.4" fill="url(#${a})"/>`; }).join('')}
      <path d="M24 31v5" stroke="${OR[2]}" stroke-width="1.2"/><circle cx="24" cy="37.5" r="2.4" fill="url(#${o})"/>
      <path d="M21 40h6l1.5 6h-9z" fill="${BLEU[0]}" ${st(.6, BLEU[1])}/><path d="M22 42v4M24 42v4M26 42v4" stroke="${BLEU[1]}" stroke-width=".6"/>`;
    case 'coran': return `<defs>${lin(a, '#3fa66b', '#1f6b43', 1, 1)}${dOr}</defs>
      <path d="M8 44l16-10 16 10M14 39l10 6 10-6" fill="none" stroke="#a9733f" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M6 13c6-3 12-3 18 2v21c-6-5-12-5-18-2z" fill="url(#${a})" ${st(1, '#174f32')}/><path d="M42 13c-6-3-12-3-18 2v21c6-5 12-5 18-2z" fill="url(#${a})" ${st(1, '#174f32')}/>
      <path d="M9 17c4-1 8-1 12 2v13c-4-2-8-2-12-1zM39 17c-4-1-8-1-12 2v13c4-2 8-2 12-1z" fill="none" stroke="url(#${o})" stroke-width="1.1"/>
      <path d="M15 23l1.4 2.8-1.4 2.8-1.4-2.8zM33 23l1.4 2.8-1.4 2.8-1.4-2.8z" fill="${OR[0]}"/>`;
    case 'tapis': return `<defs>${lin(a, '#e0566a', '#a9304a', 1, 1)}${dOr}</defs>
      <rect x="9" y="6" width="30" height="36" rx="2" fill="url(#${a})" ${st(1, '#7a2034')}/>
      <rect x="12" y="9" width="24" height="30" rx="1" fill="none" stroke="url(#${o})" stroke-width="1.4"/>
      <path d="M16 36V20a8 8 0 0 1 16 0v16" fill="${BLEU[0]}" stroke="${OR[1]}" stroke-width="1.2"/>
      <path d="M24 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="${OR[0]}"/><path d="M18 31h12" stroke="${OR[0]}" stroke-width="1" stroke-dasharray="1.6 1.2"/>
      <path d="M11 6V3M15 6V3M19 6V3M23 6V3M27 6V3M31 6V3M35 6V3M11 42v3M15 42v3M19 42v3M23 42v3M27 42v3M31 42v3M35 42v3" stroke="${OR[1]}" stroke-width="1.1" stroke-linecap="round"/>`;
    case 'tambour': return `<defs>${lin(a, '#e9a35a', '#a85e22', 1, 0)}${dOr}</defs>
      <path d="M10 10h28c0 9-6 13-9 16 1 6 4 10 6 16H13c2-6 5-10 6-16-3-3-9-7-9-16z" fill="url(#${a})" ${st(1, '#7a4012')}/>
      <ellipse cx="24" cy="10" rx="14" ry="4" fill="#f8eedb" ${st(1, '#7a4012')}/>
      <path d="M14 15l4 5 6-5 6 5 4-5" fill="none" stroke="${OR[0]}" stroke-width="1.4"/><path d="M15 38h18" stroke="url(#${o})" stroke-width="2.4"/>
      <path d="M18 31c1-2 2-3 3-4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/>`;
    case 'palmier': return `<defs>${lin(a, '#7cc46a', '#2f7d3a', 1, 1)}${lin(b, '#c08a4c', '#8a5a2a', 1, 0)}</defs>
      <path d="M22 46c2-10 2-20 0-29h4c2 9 2 19 0 29z" fill="url(#${b})" ${st(.8, '#6b4220')}/>
      <path d="M22 22h4M22 28h4M22 34h4M22 40h4" stroke="#6b4220" stroke-width=".8"/>
      <g fill="url(#${a})" ${st(.8, '#245e2c')}><path d="M24 17C18 8 9 9 4 15c7-2 13 0 20 2z"/><path d="M24 17c6-9 16-9 20-3-7-2-14 0-20 3z"/><path d="M24 17c-4-8-2-13 3-15 1 5 0 10-3 15z"/><path d="M24 17C15 17 9 23 9 30c4-7 9-10 15-13z"/><path d="M24 17c9 0 15 6 15 13-4-7-9-10-15-13z"/></g>
      <g fill="#8a3f1a"><circle cx="22" cy="20" r="2"/><circle cx="25.5" cy="20.6" r="2"/><circle cx="23.5" cy="23" r="2"/></g>`;
    case 'mosquee': return `<g transform="translate(1 4) scale(.23)">${mosqueeSvg(`i${uid}`).replace('class="ram-halo"', 'opacity="0"')}</g>`;
    default: return '';
  }
}
const PAR_CARTE: Record<string, string> = {
  nourania: 'lanterne', sourates: 'chapelet', coran: 'coran', invocations: 'croissant', ramadan: 'dattes', priere: 'tapis',
  alphabet: 'theiere', 'allah-names': 'croissant', grammaire: 'palmier', vocabulaire: 'tambour', hadiths: 'mosquee',
};
const ROTATION = ['lanterne', 'croissant', 'dattes', 'theiere', 'chapelet', 'coran', 'tapis', 'tambour', 'palmier', 'mosquee'];
export function imageDeCarteRamadan(slug: string, index: number): string {
  return imageSvg(PAR_CARTE[slug] ?? ROTATION[index % ROTATION.length], `c${index}`);
}
/** Aperçu de toutes les images (réglages de l'enseignante) */
export const IMAGE_RAMADAN: Record<string, string> = Object.fromEntries(ROTATION.map((k, i) => [k, imageSvg(k, `a${i}`)]));

/* ---------- 🏜️ Le désert en bas de l'accueil (Nadia, 2026-11-17 : « le dromadaire qui marche sur le désert, avec des palmiers,
   des cactus… », d'après son image d'exemple — sable clair, rochers orangés au loin, cactus ronds, petites touffes). ---------- */
const VERT = ['#9fd67a', '#5ea24c', '#3f7a3a'] as const;
/** 🌴 Palmier (viewBox 0 0 60 90) : tronc courbe à anneaux, palmes découpées, régime de dattes */
export const PALMIER_VB = { w: 60, h: 90 } as const;
export function palmierSvg(uid: string): string {
  const t = `pt${uid}`, f = `pf${uid}`, g = `pg${uid}`;
  const palme = (ang: number, sx: number, l: number, fill: string) =>
    `<g transform="translate(31 22) scale(${sx} 1) rotate(${ang}) scale(${l})"><path d="M0 0C9-8 22-8 31 4C24-1 12-1 0 3Z" fill="${fill}" ${st(.7, VERT[2])}/>
    <path d="M1 1.5C11-3.5 22-3 31 4" fill="none" stroke="${VERT[2]}" stroke-width=".7"/>
    <path d="M7-2.4l1.6 3.4M12.5-3.6l1.6 3.9M18-3.6l1.5 4.2M23.5-2l1.4 4" stroke="${VERT[2]}" stroke-width=".55" stroke-linecap="round"/></g>`;
  const anneaux = Array.from({ length: 10 }, (_, i) => { const y = 30 + i * 5.8, x = 29.3 - i * .25; return `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q2.8 1.8 5.6 0" fill="none" stroke="#8a5a2a" stroke-width=".8" stroke-linecap="round"/>`; }).join('');
  return `<defs>${lin(t, '#d9a467', '#9c6a35', 1, 0)}${lin(f, VERT[0], VERT[1], 1, 1)}${lin(g, '#b6e294', VERT[1], 1, 1)}</defs>
  <ellipse cx="30" cy="88" rx="12" ry="2" fill="#000" opacity=".1"/>
  <path d="M26 88C29 70 31 48 29 24h5c3 24 1 46-2 64z" fill="url(#${t})" ${st(.9, '#7a5530')}/>${anneaux}
  ${palme(22, 1, 1, `url(#${f})`)}${palme(22, -1, 1, `url(#${f})`)}${palme(-12, 1, .95, `url(#${g})`)}${palme(-12, -1, .95, `url(#${g})`)}
  ${palme(-48, 1, .85, `url(#${f})`)}${palme(-48, -1, .85, `url(#${f})`)}${palme(-84, 1, .7, `url(#${g})`)}
  <g fill="#a0522d" ${st(.5, '#5a2410')}><circle cx="28.5" cy="26" r="2.1"/><circle cx="32" cy="26.6" r="2.1"/><circle cx="30.2" cy="29" r="2.1"/><circle cx="34" cy="29.4" r="1.8"/></g>`;
}
/** 🌵 Cactus (viewBox 0 0 40 60) : modèle 0 = grand cactus à bras, 1 = raquettes avec une fleur */
export const CACTUS_VB = { w: 40, h: 60 } as const;
export function cactusSvg(modele: number, uid: string): string {
  const c = `cg${uid}`;
  const epines = (pts: number[][]) => pts.map(([x, y]) => `<path d="M${x} ${y}l-1.6-.8M${x} ${y}l1.6-.8" stroke="#fff8d8" stroke-width=".6" stroke-linecap="round"/>`).join('');
  if (modele % 2 === 0) {
    return `<defs>${lin(c, VERT[0], VERT[1], 1, 0)}</defs><ellipse cx="20" cy="58.5" rx="13" ry="1.6" fill="#000" opacity=".1"/>
    <g fill="url(#${c})" ${st(1, VERT[2])}>
      <path d="M16 46H10.5Q6 46 6 41.5V29Q6 25 9.5 25T13 29V39H16Z"/><path d="M24 38H29.5Q34 38 34 33.5V21Q34 17 30.5 17T27 21V31H24Z"/>
      <path d="M15 58.5V15Q15 8.5 20 8.5T25 15V58.5Z"/></g>
    <path d="M18 13v44M22 13v44M8.5 29v12M31.5 21v12" stroke="${VERT[2]}" stroke-width=".7" opacity=".55"/>
    <path d="M17 14c0-2 1-3 2.4-3.6" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" stroke-linecap="round"/>
    ${epines([[16.5, 20], [23.5, 26], [16.5, 34], [23.5, 44], [7, 33], [33, 25], [16.5, 50]])}
    <path d="M20 8.6c-1.6-2.8 0-4.6 0-4.6s1.6 1.8 0 4.6z" fill="#f59ab5"/><circle cx="20" cy="6.6" r="1.2" fill="#fde047"/>`;
  }
  const raquette = (cx: number, cy: number, rx: number, ry: number, rot: number) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="url(#${c})" ${st(1, VERT[2])}/>`;
  return `<defs>${lin(c, VERT[0], VERT[1], 1, 1)}</defs><ellipse cx="20" cy="58.5" rx="14" ry="1.6" fill="#000" opacity=".1"/>
  ${raquette(20, 47, 8, 11, 0)}${raquette(11, 34, 6, 8.5, -25)}${raquette(29, 33, 6, 8.5, 22)}${raquette(21, 26, 5, 7, 4)}
  ${[[18, 44], [22, 51], [10, 32], [30, 31], [21, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="#fff8d8"/>`).join('')}
  <path d="M21 19.6c-2.2-1.2-3.4-3-2.4-4.4 1 .4 1.8 1.2 2.4 2.4.6-1.2 1.4-2 2.4-2.4 1 1.4-.2 3.2-2.4 4.4z" fill="#f59ab5" ${st(.5, '#c2557a')}/>
  <circle cx="21" cy="18.4" r=".9" fill="#fde047"/><circle cx="7" cy="26.6" r="1.6" fill="#f472b6"/><circle cx="33.6" cy="25.6" r="1.6" fill="#f472b6"/>`;
}
/** 🪨 Rocher (viewBox 0 0 40 22) */
export function rocherSvg(uid: string): string {
  const r = `ro${uid}`;
  return `<defs>${lin(r, '#efe0c6', '#c4a983', 1, 1)}</defs><path d="M2 20Q3 11 11 8Q17 3 25 6Q34 6 38 20Z" fill="url(#${r})" ${st(1, '#9c8463')}/>
  <path d="M10 11q5-4 10-3" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/><path d="M24 12q3 3 3 7" fill="none" stroke="#a88e6a" stroke-width=".8"/>`;
}
/** 🌱 Touffe d'herbe sèche (viewBox 0 0 20 10) */
export const TOUFFE = `<path d="M10 10C9 6 6 3 2 2c3 3 5 5 6 8M10 10c0-4 1-7 3-9-1 4-1 6-1 9M10 10c1-3 4-5 8-5-3 2-5 3-6 5" fill="${VERT[0]}" stroke="${VERT[1]}" stroke-width=".7" stroke-linejoin="round"/>`;
/** ⛰️ Rochers orangés au loin (viewBox 0 0 120 60), couleurs claires (« pas trop foncé ») */
export const MESA_VB = { w: 120, h: 60 } as const;
export function mesaSvg(uid: string): string {
  const a = `ma${uid}`, b = `mb${uid}`;
  return `<defs>${lin(a, '#f6d2a8', '#e6aa78', 1, 0)}${lin(b, '#f3c79a', '#dc9e6c', 1, 0)}</defs>
  <path d="M2 60L8 34Q9 27 15 25L20 9Q22 4 28 4H40Q46 4 48 10L52 24Q57 27 58 34L64 60Z" fill="url(#${a})" ${st(1, '#c98a5a')}/>
  <path d="M28 4h12M20 12q7 2 14 0M15 27q8 2 14 0" fill="none" stroke="#fde4c4" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M34 8v50M44 12l4 46M24 14l-3 44" stroke="#d99a68" stroke-width=".9" opacity=".7"/>
  <path d="M60 60L66 40Q68 34 73 33L78 20Q80 16 85 16H95Q100 16 102 21L106 34Q111 36 112 42L118 60Z" fill="url(#${b})" ${st(1, '#c98a5a')}/>
  <path d="M85 16h10M78 23q8 2 15 0" fill="none" stroke="#fde4c4" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M90 20v38M100 24l4 34M80 26l-4 32" stroke="#d99a68" stroke-width=".9" opacity=".7"/>
  <path d="M30 0q2-2 4 0q2-2 4 0M50 6q1.5-1.5 3 0q1.5-1.5 3 0" fill="none" stroke="#a37a55" stroke-width=".8" stroke-linecap="round"/>`;
}
