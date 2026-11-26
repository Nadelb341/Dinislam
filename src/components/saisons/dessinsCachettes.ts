/**
 * 🎨 Dessins faits maison (2026-11-26) : l'écureuil qui se cache partout, sa maisonnette, et les nouvelles cachettes
 * du cache-cache (grand bonhomme de neige d'hiver, grand papillon de printemps). Mêmes traits que les animaux
 * d'automne (contour brun arrondi, joues roses, reflets dans les yeux). Aucun fichier : tout marche sans réseau.
 */
const T = 'stroke="#4a2c1a" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';

/** 🐿️ L'écureuil (viewBox 0 0 48 48) : grosse queue touffue, oreilles à pinceaux, il tient un gland doré */
export const ECUREUIL_VB = '0 0 48 48';
export const ECUREUIL_SVG = `
<g ${T}>
  <path d="M28.5 43.5c10.5 1 17.5-6.5 16.5-16.5-.8-8.4-7.4-13.6-14.4-12.2-5 1-6.8 5-4.6 8 2.8-2.2 7.2-1.4 8.2 2.8 1.2 5.2-2.6 8.4-5.6 10.4-3.2 2.2-3.6 5.4-.1 7.5z" fill="#d9772f"/>
</g>
<path d="M33 18.5c5.2.4 8.4 4.6 8.2 9.6M38 33c-1.6 3.2-4.4 5.4-7.6 6.4" stroke="#f6c088" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<g ${T}>
  <ellipse cx="20" cy="34.5" rx="10" ry="10.2" fill="#d9772f"/>
  <ellipse cx="20" cy="36" rx="6.2" ry="7" fill="#fbe3bf"/>
  <path d="M11.4 12.4 12 3.6l6.8 6.2z" fill="#d9772f"/>
  <path d="M27.6 10.4 27 1.6l-6.2 7.4z" fill="#d9772f"/>
  <circle cx="19.5" cy="18.6" r="10" fill="#d9772f"/>
  <ellipse cx="19.5" cy="22.6" rx="5.6" ry="4.2" fill="#fbe3bf"/>
  <ellipse cx="13" cy="44.6" rx="4.2" ry="2.1" fill="#b85a22"/>
  <ellipse cx="27" cy="44.6" rx="4.2" ry="2.1" fill="#b85a22"/>
  <path d="M16.2 31.6h7.6c0 4.4-1.7 6.9-3.8 6.9s-3.8-2.5-3.8-6.9z" fill="#e8b04a"/>
  <path d="M15.4 31.8c0-2.6 2.1-4.2 4.6-4.2s4.6 1.6 4.6 4.2z" fill="#8a5a32"/>
  <ellipse cx="15.2" cy="32.4" rx="2.3" ry="1.9" fill="#d9772f"/>
  <ellipse cx="24.8" cy="32.4" rx="2.3" ry="1.9" fill="#d9772f"/>
</g>
<path d="M20 27.6v-1.8" stroke="#4a2c1a" stroke-width="1.4" stroke-linecap="round"/>
<path d="M17 30.2l1.4 1.2M20 29.8v1.4M23 30.2l-1.4 1.2" stroke="#5e3b20" stroke-width=".8" stroke-linecap="round"/>
<path d="M18 33.6q1 .6 1.6 2.4" stroke="#fff3c4" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/>
<path d="M13.2 8l1.4 2.6M26.2 6.4l-1.2 2.6" stroke="#f7a8a0" stroke-width="1.9" stroke-linecap="round"/>
<path d="M12 3.6l-1.4-2.4M12.2 3.4l.4-2.8M27 1.6l1.4-2.2M26.8 1.4l-.6-2.6" stroke="#4a2c1a" stroke-width="1.1" stroke-linecap="round"/>
<ellipse cx="15.6" cy="17.4" rx="2.2" ry="2.5" fill="#2a1a10"/>
<ellipse cx="23.4" cy="17.4" rx="2.2" ry="2.5" fill="#2a1a10"/>
<circle cx="16.4" cy="16.5" r=".85" fill="#fff"/><circle cx="24.2" cy="16.5" r=".85" fill="#fff"/>
<circle cx="15" cy="18.4" r=".4" fill="#fff" opacity=".8"/><circle cx="22.8" cy="18.4" r=".4" fill="#fff" opacity=".8"/>
<path d="M18 20.6q1.5-1 3 0l-1.5 1.5z" fill="#4a2c1a"/>
<path d="M17.4 23.1q2.1 1.7 4.2 0" stroke="#4a2c1a" stroke-width="1" fill="none" stroke-linecap="round"/>
<circle cx="11.9" cy="21.4" r="1.9" fill="#f28b82" opacity=".55"/><circle cx="27.1" cy="21.4" r="1.9" fill="#f28b82" opacity=".55"/>`;

/** 🏡 La maisonnette de l'écureuil (viewBox 0 0 100 96) ; `dedans` = on le voit à la porte et la fenêtre est allumée */
export const MAISON_VB = '0 0 100 96';
export function maisonnetteSvg(uid: string, dedans: boolean): string {
  const ec = `<g clip-path="url(#porte-${uid})"><g transform="translate(51.5 66) scale(.42)"><g class="maison-ecureuil-coucou">${ECUREUIL_SVG}</g></g></g>`;
  return `
<defs>
  <linearGradient id="bois-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2c98a"/><stop offset="1" stop-color="#d9a35e"/></linearGradient>
  <linearGradient id="toit-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4643a"/><stop offset="1" stop-color="#a9461f"/></linearGradient>
  <radialGradient id="lum-${uid}" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#f5c542"/></radialGradient>
  <clipPath id="porte-${uid}"><path d="M52 89.5V75a9 9 0 0 1 18 0v14.5z"/></clipPath>
</defs>
<ellipse cx="50" cy="91.5" rx="42" ry="4.5" fill="#4a2c1a" opacity=".16"/>
<path d="M8 91c5-6 12-7.5 18-3.5 5-5.5 13-5.5 17.5-.5 6-5.5 15-5.5 21 0 6-4.5 14-3.5 20 3.5 4 .5 6 1 8 .5z" fill="#86b553" stroke="#4a6b2a" stroke-width="1.2" stroke-linejoin="round"/>
<g stroke="#4a2c1a" stroke-width="1.6" stroke-linejoin="round">
  <rect x="64" y="17" width="9" height="16" rx="1.8" fill="#9b6a43"/>
  <path d="M21 45h58v41.5c0 1.9-1.6 3.5-3.5 3.5h-51c-1.9 0-3.5-1.6-3.5-3.5z" fill="url(#bois-${uid})"/>
</g>
<path d="M21.8 57h56.4M21.8 69h56.4M21.8 81h56.4" stroke="#c48a45" stroke-width="1" opacity=".7"/>
<path d="M36 57v12M60 69v12M44 81v8.5M30 45v12" stroke="#c48a45" stroke-width=".8" opacity=".55"/>
<path d="M11.5 48.5 50 14.5l38.5 34c1.5 1.3.6 3.7-1.4 3.7H12.9c-2 0-2.9-2.4-1.4-3.7z" fill="url(#toit-${uid})" stroke="#4a2c1a" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M22 44q4 3.2 8 0 4 3.2 8 0 4 3.2 8 0 4 3.2 8 0 4 3.2 8 0 4 3.2 8 0 4 3.2 8 0M31 36q4 3 8 0 4 3 8 0 4 3 8 0 4 3 8 0M40 28q4 2.8 8 0 4 2.8 8 0 4 2.8 8 0" stroke="#8f3a1a" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".75"/>
<path d="M14 49.5 50 17.5l36 32" stroke="#f4a582" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".55"/>
<path d="M70 15c0-3 3-4 4-2 1-3 5-2 4 1" stroke="#cbd5e1" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
<g stroke="#4a2c1a" stroke-width="1.2" stroke-linejoin="round">
  <path d="M27 40.5c3-4 7-5 10-3-1 4-5 6-10 3z" fill="#e8572a"/>
  <path d="M69 43c2-3.5 6-4.5 8.5-2.5-1 3.5-4.5 5-8.5 2.5z" fill="#f2a33a"/>
  <path d="M47 23c1.5-3 5-3.5 7-1.5-1 3-4 4-7 1.5z" fill="#c98a2b"/>
</g>
<circle cx="35" cy="62" r="7.5" fill="${dedans ? `url(#lum-${uid})` : '#5b4636'}" stroke="#4a2c1a" stroke-width="1.6"/>
<path d="M35 54.5v15M27.5 62h15" stroke="#7a4a2a" stroke-width="1.4"/>
${dedans ? '<circle cx="35" cy="62" r="11" fill="#fde68a" opacity=".22"/>' : ''}
<path d="M52 89.5V75a9 9 0 0 1 18 0v14.5z" fill="#3a2416" stroke="#4a2c1a" stroke-width="1.6" stroke-linejoin="round"/>
${dedans ? ec : '<path d="M56 88V76.5a5 5 0 0 1 4-4.8" stroke="#5e3b20" stroke-width="1" fill="none" opacity=".7"/>'}
<path d="M49.5 89.5V75a11.5 11.5 0 0 1 23 0v14.5" stroke="#8a5a32" stroke-width="2.4" fill="none" stroke-linejoin="round"/>
<g stroke="#4a2c1a" stroke-width="1.2" stroke-linejoin="round">
  <rect x="53" y="55" width="16" height="8.5" rx="2" fill="#f6e3c2"/>
  <path d="M58.4 58.4h5.2c0 2.6-1.1 4-2.6 4s-2.6-1.4-2.6-4z" fill="#e8b04a"/>
  <path d="M57.8 58.6c0-1.6 1.4-2.6 3.2-2.6s3.2 1 3.2 2.6z" fill="#8a5a32"/>
</g>
<g stroke="#4a2c1a" stroke-width="1.1" stroke-linejoin="round">
  <ellipse cx="80" cy="88.5" rx="3.4" ry="2.4" fill="#a86b3c"/>
  <path d="M77.6 87.8c0-1.8 1.2-2.6 2.4-2.6s2.4.8 2.4 2.6z" fill="#6b4226"/>
  <ellipse cx="85.5" cy="89.5" rx="2.8" ry="2" fill="#a86b3c"/>
  <path d="M83.6 88.9c0-1.5 1-2.2 1.9-2.2s1.9.7 1.9 2.2z" fill="#6b4226"/>
</g>`;
}

/** ⛄ Grand bonhomme de neige d'hiver (viewBox 0 0 50 64) : chapeau, écharpe rouge, nez carotte, bras en bois */
export const BONHOMME_VB = '0 0 50 64';
export const GRAND_BONHOMME_SVG = `
<ellipse cx="25" cy="61.5" rx="19" ry="2.6" fill="#7f9ec4" opacity=".3"/>
<path d="M11 40 2 33M5 35.5l-3.5 1M39 40l9-7M45 35.5l3.5 1" stroke="#7a4a2a" stroke-width="1.6" stroke-linecap="round" fill="none"/>
<g stroke="#8a9bb5" stroke-width="1.3">
  <circle cx="25" cy="47" r="14" fill="#fff"/>
  <circle cx="25" cy="25" r="10.5" fill="#fff"/>
</g>
<path d="M14 50a12 12 0 0 0 20 6M18 29a9 9 0 0 0 14 3" stroke="#dbe8f8" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<g stroke="#1e293b" stroke-width="1.2" stroke-linejoin="round">
  <path d="M17 16.5h16" stroke-width="3" stroke-linecap="round"/>
  <path d="M19 16V5.5c0-1.2.9-2 2-2h8c1.1 0 2 .8 2 2V16z" fill="#334155"/>
</g>
<path d="M19.6 12.6h10.8" stroke="#d9443b" stroke-width="2.4"/>
<circle cx="21" cy="5.6" r=".8" fill="#fff" opacity=".5"/>
<ellipse cx="21.2" cy="23.6" rx="1.3" ry="1.5" fill="#1d2533"/><ellipse cx="28.8" cy="23.6" rx="1.3" ry="1.5" fill="#1d2533"/>
<circle cx="21.6" cy="23" r=".45" fill="#fff"/><circle cx="29.2" cy="23" r=".45" fill="#fff"/>
<path d="M25 26.2l7 1.6-7 1.4z" fill="#f29a2e" stroke="#c2620a" stroke-width=".7" stroke-linejoin="round"/>
<path d="M21 30.6q4 2.6 8 0" stroke="#1d2533" stroke-width="1" fill="none" stroke-linecap="round" stroke-dasharray=".1 1.8"/>
<circle cx="18.6" cy="27.4" r="1.6" fill="#f6a5b4" opacity=".7"/><circle cx="31.4" cy="27.4" r="1.6" fill="#f6a5b4" opacity=".7"/>
<g stroke="#9b2c2c" stroke-width="1" stroke-linejoin="round">
  <path d="M15.5 33c6 3 13 3 19 0l.8 3.6c-6.4 3-14.2 3-20.6 0z" fill="#d9443b"/>
  <path d="M29.5 35.5l2.5 9.5-3.4 1-1.8-9.6z" fill="#d9443b"/>
</g>
<path d="M19 34.6l1 2.4M23 35.4l.6 2.4M27 35.4l-.4 2.4M28.6 41.6h3.2" stroke="#fca5a5" stroke-width=".9" stroke-linecap="round"/>
<circle cx="25" cy="43" r="1.3" fill="#1d2533"/><circle cx="25" cy="48.5" r="1.3" fill="#1d2533"/><circle cx="25" cy="54" r="1.3" fill="#1d2533"/>`;

/** 🦋 Grand papillon de printemps (viewBox 0 0 60 46) : 4 ailes en dégradé avec des points, antennes enroulées */
export const PAPILLON_VB = '0 0 60 46';
export function grandPapillonSvg(uid: string): string {
  return `
<defs>
  <linearGradient id="ph-${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9a8d4"/><stop offset="1" stop-color="#f472b6"/></linearGradient>
  <linearGradient id="pb-${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#fb923c"/></linearGradient>
</defs>
<g class="papillon-aile g" stroke="#7c2d5b" stroke-width="1.3" stroke-linejoin="round">
  <path d="M29 21C22 6 8 2 4 8c-3 5 2 14 11 15 6 .6 11-.4 14-2z" fill="url(#ph-${uid})"/>
  <path d="M29 23c-7 2-15 5-16 12-.6 5 5 8 10 5 5-3 6-10 6-17z" fill="url(#pb-${uid})"/>
</g>
<g class="papillon-aile d" stroke="#7c2d5b" stroke-width="1.3" stroke-linejoin="round">
  <path d="M31 21C38 6 52 2 56 8c3 5-2 14-11 15-6 .6-11-.4-14-2z" fill="url(#ph-${uid})"/>
  <path d="M31 23c7 2 15 5 16 12 .6 5-5 8-10 5-5-3-6-10-6-17z" fill="url(#pb-${uid})"/>
</g>
<g fill="#fff" opacity=".85"><circle cx="11" cy="11" r="2.4"/><circle cx="18" cy="15" r="1.5"/><circle cx="49" cy="11" r="2.4"/><circle cx="42" cy="15" r="1.5"/><circle cx="19" cy="33" r="1.6"/><circle cx="41" cy="33" r="1.6"/></g>
<g fill="#7c2d5b" opacity=".55"><circle cx="8" cy="15" r="1.1"/><circle cx="52" cy="15" r="1.1"/><circle cx="21" cy="38" r=".9"/><circle cx="39" cy="38" r=".9"/></g>
<ellipse cx="30" cy="24" rx="2.6" ry="11" fill="#4a2c1a"/>
<circle cx="30" cy="12.5" r="3.2" fill="#4a2c1a"/>
<path d="M29 10c-2-4-4-6-7-6M31 10c2-4 4-6 7-6" stroke="#4a2c1a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
<circle cx="21.6" cy="4" r="1.4" fill="#4a2c1a"/><circle cx="38.4" cy="4" r="1.4" fill="#4a2c1a"/>
<circle cx="28.9" cy="12" r=".6" fill="#fff"/><circle cx="31.1" cy="12" r=".6" fill="#fff"/>`;
}
