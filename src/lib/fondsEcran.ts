/**
 * 🖼️ Fonds d'écran (Nadia, 22/11 : choix sur https://claude.ai/artifact/GWFHW8uENRG4XAE54QYP73) :
 * jour clair et doux, nuit à partir du Maghrib (heure de la ville), bascule douce (30 min de couchant + 20 min vers la nuit,
 * aube au Fajr). 4 familles : jour/nuit × tout-petits/grands. Tous dessinés ici (aucun fichier : marche sans Internet).
 * Réglage `fonds_ecran` (reglages_appli) : lesquels sont actifs, choisis par l'enseignante ; un fond différent chaque jour.
 */
export type FamilleFond = 'jp' | 'jg' | 'np' | 'ng';
export interface Fond { cle: string; famille: FamilleFond; nom: string; dessin: (u: string) => string }
export interface ReglageFonds { actif: boolean; actifs: string[] }

const W = 180, H = 320;
const ciel = (id: string, haut: string, bas: string, milieu?: string) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${haut}"/>${milieu ? `<stop offset=".55" stop-color="${milieu}"/>` : ''}<stop offset="1" stop-color="${bas}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
const nuage = (x: number, y: number, s = 1, c = '#fff', o = .9) => `<g class="fond-nuage" opacity="${o}" fill="${c}" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="8" rx="22" ry="9"/><circle cx="-8" cy="2" r="9"/><circle cx="6" cy="-1" r="12"/></g>`;
const colline = (y: number, c: string, a = 26) => `<path d="M0 ${y} Q ${W * .3} ${y - a} ${W * .55} ${y - 4} T ${W} ${y - 10} V ${H} H 0 Z" fill="${c}"/>`;
const soleil = (x: number, y: number, r: number, c = '#ffd75e') => `<circle cx="${x}" cy="${y}" r="${r * 1.7}" fill="${c}" opacity=".18"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const croissant = (x: number, y: number, r: number, c: string, fond: string) => `<circle cx="${x}" cy="${y}" r="${r * 1.9}" fill="${c}" opacity=".12"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x + r * .45}" cy="${y - r * .25}" r="${r * .9}" fill="${fond}"/>`;
function etoiles(n: number, graine: number, c = '#fff', hmax = 200, taille = 1.3) {
  let s = graine, out = '';
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) out += `<circle class="${i % 4 === 0 ? 'fond-scintille' : ''}" cx="${(r() * W).toFixed(1)}" cy="${(r() * hmax).toFixed(1)}" r="${(r() * taille + .4).toFixed(2)}" fill="${c}" opacity="${(.5 + r() * .5).toFixed(2)}"/>`;
  return out;
}
const fleurs = (y: number, couleurs: string[]) => couleurs.map((c, i) => `<circle cx="${14 + i * 26}" cy="${y + (i % 2) * 8}" r="3.2" fill="${c}"/><circle cx="${14 + i * 26}" cy="${y + (i % 2) * 8}" r="1.2" fill="#fff6b0"/>`).join('');
const arbre = (x: number, y: number, s: number, c: string, t = '#9a6b4a') => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-3" y="0" width="6" height="22" rx="2" fill="${t}"/><circle cx="0" cy="-6" r="16" fill="${c}"/><circle cx="-10" cy="2" r="10" fill="${c}"/><circle cx="10" cy="2" r="10" fill="${c}"/></g>`;
const palmier = (x: number, y: number, s: number, c = '#5aa877', t = '#b98a5a') => `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke-linecap="round"><path d="M0 0 Q 3 -20 0 -40" stroke="${t}" stroke-width="5"/><g stroke="${c}" stroke-width="5"><path d="M0 -40 Q -16 -46 -26 -36"/><path d="M0 -40 Q 16 -48 26 -38"/><path d="M0 -40 Q -6 -54 -18 -56"/><path d="M0 -40 Q 8 -56 20 -56"/></g></g>`;
export const mosquee = (y: number, c: string, o = 1) => `<g fill="${c}" opacity="${o}"><rect x="40" y="${y - 30}" width="100" height="40"/><path d="M60 ${y - 30} Q 90 ${y - 78} 120 ${y - 30} Z"/><circle cx="90" cy="${y - 66}" r="3"/><rect x="28" y="${y - 70}" width="9" height="80"/><path d="M26 ${y - 70} L 32.5 ${y - 86} L 39 ${y - 70} Z"/><rect x="143" y="${y - 70}" width="9" height="80"/><path d="M141 ${y - 70} L 147.5 ${y - 86} L 154 ${y - 70} Z"/><path d="M45 ${y - 30} Q 52 ${y - 46} 59 ${y - 30} Z"/><path d="M121 ${y - 30} Q 128 ${y - 46} 135 ${y - 30} Z"/><rect y="${y + 8}" width="${W}" height="${H - y}"/></g>`;
const dunes = (y: number, c1: string, c2: string) => `<path d="M0 ${y} Q 50 ${y - 26} 100 ${y - 6} T ${W} ${y - 14} V ${H} H 0 Z" fill="${c1}"/><path d="M0 ${y + 30} Q 70 ${y + 4} 120 ${y + 26} T ${W} ${y + 20} V ${H} H 0 Z" fill="${c2}"/>`;
function motif(c: string, o: number) {
  let out = `<g fill="none" stroke="${c}" stroke-width="1" opacity="${o}">`;
  for (let y = 20; y < H; y += 44) for (let x = (y / 44) % 2 ? 22 : 0; x < W + 20; x += 44)
    out += `<rect x="${x - 9}" y="${y - 9}" width="18" height="18"/><rect x="${x - 9}" y="${y - 9}" width="18" height="18" transform="rotate(45 ${x} ${y})"/>`;
  return out + '</g>';
}
const lanterne = (x: number, y: number, c: string) => `<line x1="${x}" y1="0" x2="${x}" y2="${y - 12}" stroke="#d9b45a" stroke-width="1"/><circle class="fond-scintille" cx="${x}" cy="${y}" r="16" fill="${c}" opacity=".18"/><path d="M${x - 7} ${y - 9} h14 l3 6 v8 l-3 6 h-14 l-3 -6 v-8 z" fill="${c}" stroke="#d9b45a" stroke-width="1.2"/><path d="M${x - 4} ${y - 12} h8 l-1 3 h-6 z" fill="#d9b45a"/>`;
const chameau = (x: number, y: number, c: string) => `<g fill="${c}" transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="16" ry="8"/><ellipse cx="-2" cy="-8" rx="8" ry="7"/><path d="M14 -2 Q 22 -6 22 -18 Q 26 -20 28 -16 Q 26 -6 18 4 Z"/><rect x="-12" y="4" width="3" height="14"/><rect x="-5" y="4" width="3" height="14"/><rect x="4" y="4" width="3" height="14"/><rect x="10" y="4" width="3" height="14"/></g>`;

export const FONDS: Fond[] = [
  { cle: 'jp1', famille: 'jp', nom: 'Prairie aux fleurs', dessin: (u) => ciel(`${u}a`, '#bfe6ff', '#e9f8ff') + soleil(140, 52, 16) + nuage(50, 70, 1) + nuage(120, 110, .7) + colline(250, '#a8dc8f') + colline(280, '#86c977', 18) + fleurs(292, ['#ff9fb3', '#ffd36b', '#b9a2ff', '#ff9fb3', '#8fd4ff', '#ffd36b', '#ff9fb3']) },
  { cle: 'jp2', famille: 'jp', nom: 'Le chemin dans la forêt', dessin: (u) => ciel(`${u}a`, '#c9ecff', '#f2fbff') + nuage(90, 60, 1.1) + arbre(22, 170, 1.4, '#86c977') + arbre(160, 160, 1.6, '#76bb6c') + colline(250, '#9fd68a', 14) + `<path d="M70 ${H} Q 90 250 92 232 Q 96 250 120 ${H} Z" fill="#f1dcae"/>` + fleurs(300, ['#ff9fb3', '#ffd36b', '#fff', '#ffd36b', '#ff9fb3', '#b9a2ff', '#fff']) },
  { cle: 'jp3', famille: 'jp', nom: 'Le bord de mer', dessin: (u) => ciel(`${u}a`, '#c4ecff', '#ecfaff') + soleil(40, 60, 13) + nuage(130, 70, .8) + `<rect y="210" width="${W}" height="40" fill="#8fe0dc"/><path d="M0 214 q 15 -5 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/><path d="M0 248 Q 90 236 ${W} 250 V ${H} H 0 Z" fill="#f6e3b8"/><circle cx="40" cy="290" r="5" fill="#ffb8a6"/><circle cx="130" cy="300" r="4" fill="#ffd9a0"/>` },
  { cle: 'jp4', famille: 'jp', nom: 'L\'oasis', dessin: (u) => ciel(`${u}a`, '#ffe4c8', '#fff6ea') + soleil(130, 70, 18, '#ffc46b') + dunes(250, '#f4d39b', '#ecc283') + palmier(40, 240, 1.2) + palmier(150, 252, .9) + `<ellipse cx="100" cy="262" rx="30" ry="6" fill="#8fd4e6"/>` },
  { cle: 'jp5', famille: 'jp', nom: 'L\'arc-en-ciel', dessin: (u) => ciel(`${u}a`, '#d7f0ff', '#f7fcff') + ([['#ffb3b3', 80], ['#ffd59e', 72], ['#fff1a0', 64], ['#bfeab0', 56], ['#b3dcff', 48], ['#d3c4ff', 40]] as const).map(([c, r]) => `<path d="M${90 - r * 1.3} 200 A ${r * 1.3} ${r * 1.3} 0 0 1 ${90 + r * 1.3} 200" stroke="${c}" stroke-width="8" fill="none" opacity=".7"/>`).join('') + nuage(30, 196, 1) + nuage(150, 196, 1) + colline(285, '#bfe6a8', 10) },
  { cle: 'jg1', famille: 'jg', nom: 'Aube dorée', dessin: (u) => ciel(`${u}a`, '#fffaf0', '#f7e7c2') + motif('#c9a24b', .16) },
  { cle: 'jg2', famille: 'jg', nom: 'Le ciel de Médine', dessin: (u) => ciel(`${u}a`, '#cfe8fb', '#f4f9fd') + nuage(130, 70, .9, '#fff', .8) + mosquee(270, '#ead9b5', .9) },
  { cle: 'jg4', famille: 'jg', nom: 'Le papier du calligraphe', dessin: (u) => ciel(`${u}a`, '#fbf4e6', '#f5ead4') + `<g fill="none" stroke="#b9925a" opacity=".35">${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 22 - 2} 18 q 11 -12 22 0 q -11 12 -22 0"/><path d="M${i * 22 - 2} ${H - 18} q 11 -12 22 0 q -11 12 -22 0"/>`).join('')}</g>` },
  { cle: 'jg5', famille: 'jg', nom: 'La brume bleue', dessin: (u) => ciel(`${u}a`, '#eaf3fb', '#f8fbfe') + colline(220, '#d6e5f2', 20) + colline(255, '#c3d7ea', 24) + colline(290, '#aec8e0', 16) },
  { cle: 'np1', famille: 'np', nom: 'Le tapis volant', dessin: (u) => ciel(`${u}a`, '#25205c', '#5b3f9a', '#3a2f7d') + etoiles(40, 3, '#fff', 260) + croissant(48, 64, 16, '#ffe9a8', '#2a2361') + nuage(120, 230, 1.3, '#7d6bc4', .7) + nuage(40, 270, 1.1, '#8a77cf', .6) + `<g transform="translate(118 108) rotate(-6)"><rect x="-28" y="-5" width="56" height="10" rx="3" fill="#d24e5a"/><rect x="-28" y="-5" width="56" height="3" fill="#f0c35a"/></g>` },
  { cle: 'np2', famille: 'np', nom: 'Les lanternes', dessin: (u) => ciel(`${u}a`, '#151a3d', '#2c2f6b') + etoiles(22, 7, '#fff', 300, 1) + lanterne(30, 70, '#ffcf6b') + lanterne(75, 100, '#ffb48a') + lanterne(115, 64, '#a8e0ff') + lanterne(155, 96, '#ffcf6b') },
  { cle: 'np3', famille: 'np', nom: 'Les lucioles', dessin: (u) => ciel(`${u}a`, '#0f2d3a', '#1d4a52') + etoiles(18, 11, '#fff', 120, 1) + etoiles(16, 21, '#e9ff9a', 280, 1.8) + colline(260, '#143a40', 22) + colline(290, '#0f3036', 14) },
  { cle: 'np4', famille: 'np', nom: 'Les nuages qui dorment', dessin: (u) => ciel(`${u}a`, '#3b2f6e', '#7d68b8') + etoiles(26, 5, '#fff', 200) + croissant(130, 70, 18, '#fff1c2', '#3f3274') + nuage(50, 200, 1.6, '#a796da', .8) + nuage(140, 250, 1.4, '#b6a6e4', .7) + nuage(60, 290, 1.5, '#c4b6ea', .7) },
  { cle: 'np5', famille: 'np', nom: 'Le désert étoilé', dessin: (u) => ciel(`${u}a`, '#141838', '#36407a') + etoiles(45, 13, '#fff', 220) + croissant(40, 60, 12, '#ffe9a8', '#161a3c') + dunes(250, '#3a3f78', '#2c305f') + chameau(118, 236, '#232750') },
  { cle: 'ng1', famille: 'ng', nom: 'La nuit de Médine', dessin: (u) => ciel(`${u}a`, '#0f1533', '#28306a') + etoiles(36, 17, '#fff', 200) + croissant(136, 60, 14, '#ffe9a8', '#121838') + mosquee(272, '#0a0f27', 1) },
  { cle: 'ng2', famille: 'ng', nom: 'La voûte étoilée', dessin: (u) => ciel(`${u}a`, '#070b24', '#1d2a5c') + etoiles(110, 29, '#fff', 320, .9) },
  { cle: 'ng3', famille: 'ng', nom: 'Géométrie dorée', dessin: (u) => ciel(`${u}a`, '#10122b', '#1f2350') + motif('#d9b45a', .14) },
  { cle: 'ng4', famille: 'ng', nom: 'Crépuscule violet', dessin: (u) => ciel(`${u}a`, '#1b1740', '#7a4b7f', '#34295e') + etoiles(24, 37, '#fff', 160) + `<ellipse cx="90" cy="${H}" rx="140" ry="60" fill="#f2a27a" opacity=".25"/>` },
  { cle: 'ng5', famille: 'ng', nom: 'La nuit du désert', dessin: (u) => ciel(`${u}a`, '#0c1030', '#2a2f5f') + `<path d="M-20 150 Q 90 70 200 20" stroke="#cbd6ff" stroke-width="30" opacity=".08" fill="none"/>` + etoiles(60, 41, '#fff', 210) + dunes(255, '#232853', '#1a1f44') },
];

export const REGLAGE_FONDS_DEFAUT: ReglageFonds = { actif: true, actifs: FONDS.map((f) => f.cle) };
export const NOMS_FAMILLES: Record<FamilleFond, string> = { jp: '☀️ Jour', jg: '☀️ Jour', np: '🌙 Nuit', ng: '🌙 Nuit' };

export function svgFond(f: Fond, uid: string, vendredi = false) {
  const jumua = vendredi && (f.famille === 'jp' || f.famille === 'jg') && f.cle !== 'jg2' ? `<g transform="translate(118 252) scale(.34)">${mosquee(270, '#ffffff', .55)}</g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${f.dessin(uid)}${jumua}</svg>`;
}

/** Le fond du jour dans une famille : change chaque jour, le même pour tout le monde (parmi ceux qui sont actifs) */
export function fondDuJour(famille: FamilleFond, actifs: string[], d = new Date()): Fond | null {
  const liste = FONDS.filter((f) => f.famille === famille && actifs.includes(f.cle));
  if (!liste.length) return null;
  const jour = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  return liste[jour % liste.length];
}

export type Moment = 'jour' | 'couchant' | 'nuit' | 'aube';
/**
 * Opacités des calques à l'instant t : nuit (0 → 1), voile du couchant / de l'aube (0 → 0,6).
 * 30 min avant le Maghrib le ciel se réchauffe ; Maghrib → +20 min : on passe à la nuit ; Fajr → +30 min : retour au jour.
 */
export function calques(t: number, fajr: number, maghrib: number) {
  const M = 60000;
  const lisse = (x: number) => Math.max(0, Math.min(1, x));
  if (t >= maghrib - 30 * M && t < maghrib) return { nuit: 0, voile: .6 * lisse((t - (maghrib - 30 * M)) / (30 * M)), moment: 'couchant' as Moment };
  if (t >= maghrib && t < maghrib + 20 * M) { const k = lisse((t - maghrib) / (20 * M)); return { nuit: k, voile: .6 * (1 - k), moment: 'couchant' as Moment }; }
  if (t >= fajr && t < fajr + 30 * M) { const k = lisse((t - fajr) / (30 * M)); return { nuit: 1 - k, voile: .5 * Math.sin(Math.PI * k), moment: 'aube' as Moment }; }
  if (t >= fajr + 30 * M && t < maghrib - 30 * M) return { nuit: 0, voile: 0, moment: 'jour' as Moment };
  return { nuit: 1, voile: 0, moment: 'nuit' as Moment };
}

/** Choix de chaque appareil (Paramètres) */
export type ModeFond = 'anime' | 'fixe' | 'aucun';
const CLE_MODE = 'dinislam_fond_ecran';
export const EVT_MODE_FOND = 'dinislam:fond-ecran';
export function lireModeFond(): ModeFond {
  try { const v = localStorage.getItem(CLE_MODE); return v === 'fixe' || v === 'aucun' ? v : 'anime'; } catch { return 'anime'; }
}
export function choisirModeFond(m: ModeFond) {
  try { localStorage.setItem(CLE_MODE, m); } catch { /* stockage indisponible */ }
  try { window.dispatchEvent(new Event(EVT_MODE_FOND)); } catch { /* rien */ }
}
