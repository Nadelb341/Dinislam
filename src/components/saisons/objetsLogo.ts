/**
 * 🌼 Petits objets posés en haut à droite du logo (demande de Nadia du 2026-11-04).
 * Chaque saison a son catalogue ; Nadia coche un ou plusieurs objets (bouclier › Apparence appli › Décorations saisons),
 * ils alternent au rythme choisi. Dessins SVG (viewBox 0 0 24 24), sans image externe.
 * `t` = taille en px (le flocon est « à peine plus grand que la fleur »), `rot` = inclinaison.
 */
import type { Saison } from '@/lib/saisons';

export interface ObjetLogo { nom: string; svg: string; t: number; rot: number }

const marguerite = (petale: string, bord: string, coeur: string, bordCoeur: string) =>
  `<g fill="${petale}" stroke="${bord}" stroke-width=".6"><ellipse cx="12" cy="5" rx="2.6" ry="4.6"/><ellipse cx="12" cy="19" rx="2.6" ry="4.6"/><ellipse cx="5" cy="12" rx="4.6" ry="2.6"/><ellipse cx="19" cy="12" rx="4.6" ry="2.6"/><ellipse cx="7" cy="7" rx="2.4" ry="4.4" transform="rotate(-45 7 7)"/><ellipse cx="17" cy="17" rx="2.4" ry="4.4" transform="rotate(-45 17 17)"/><ellipse cx="17" cy="7" rx="2.4" ry="4.4" transform="rotate(45 17 7)"/><ellipse cx="7" cy="17" rx="2.4" ry="4.4" transform="rotate(45 7 17)"/></g><circle cx="12" cy="12" r="3.6" fill="${coeur}" stroke="${bordCoeur}" stroke-width=".6"/>`;

export const OBJETS_LOGO: Record<Saison, Record<string, ObjetLogo>> = {
  printemps: {
    marguerite: { nom: '🌼 Marguerite', t: 24, rot: 12, svg: marguerite('#fff', '#d9d2c0', '#f7c22e', '#e0a21a') },
    fleurVerte: { nom: '💚 Fleur verte', t: 24, rot: 12, svg: marguerite('#bfe58f', '#6aa83a', '#f7e27a', '#c9a926') },
    tulipe: { nom: '🌷 Tulipe', t: 24, rot: 10, svg: '<path d="M12 23V12" stroke="#4f9a2f" stroke-width="1.6"/><path d="M12 19c-3-1-5-3-5-6 3 0 5 2 5 6z" fill="#6cbf3f"/><path d="M6 4l3 3 3-5 3 5 3-3v5c0 3-3 5-6 5s-6-2-6-5z" fill="#f2668b" stroke="#c9406a" stroke-width=".7" stroke-linejoin="round"/><path d="M9 8c0 2 1 3 2 4" stroke="#ffb3c6" stroke-width="1" fill="none" stroke-linecap="round"/>' },
    coccinelle: { nom: '🐞 Coccinelle', t: 22, rot: 18, svg: '<circle cx="12" cy="6" r="3.2" fill="#222"/><ellipse cx="12" cy="14" rx="8" ry="8" fill="#e53935" stroke="#9c1c1c" stroke-width=".8"/><path d="M12 6v16" stroke="#222" stroke-width="1"/><g fill="#222"><circle cx="8" cy="11" r="1.6"/><circle cx="16" cy="11" r="1.6"/><circle cx="7.5" cy="17" r="1.4"/><circle cx="16.5" cy="17" r="1.4"/><circle cx="12" cy="20" r="1"/></g><circle cx="10.6" cy="5" r=".7" fill="#fff"/><circle cx="13.4" cy="5" r=".7" fill="#fff"/>' },
    papillon: { nom: '🦋 Papillon', t: 24, rot: -8, svg: '<path d="M12 12C8 3 2 4 3 9s5 4 9 3zM12 12c4-9 10-8 9-3s-5 4-9 3z" fill="#8ec5ff" stroke="#3f7fc4" stroke-width=".7"/><path d="M12 12c-4 2-8 5-6 8s5-2 6-8zM12 12c4 2 8 5 6 8s-5-2-6-8z" fill="#ffd36e" stroke="#c99a1e" stroke-width=".7"/><path d="M12 7v12" stroke="#3a2a20" stroke-width="1.4" stroke-linecap="round"/><path d="M12 7l-2-3M12 7l2-3" stroke="#3a2a20" stroke-width=".7"/>' },
  },
  ete: {
    lunettes: { nom: '🕶️ Lunettes de soleil', t: 30, rot: 14, svg: '<g transform="translate(-3 4) scale(1)"><path d="M1 4h28" stroke="#3a2a20" stroke-width="1.6"/><path d="M2 4h11c0 6-2 9-6 9S2 10 2 4zM17 4h11c0 6-2 9-6 9s-5-3-5-9z" fill="#2c3a55" stroke="#3a2a20" stroke-width="1"/><path d="M4 6l3 3M19 6l3 3" stroke="#fff" stroke-width="1.2" opacity=".7"/></g>' },
    ballon: { nom: '🏐 Ballon de plage', t: 24, rot: 0, svg: '<circle cx="12" cy="12" r="10.5" fill="#fff" stroke="#c9b48a" stroke-width=".7"/><path d="M12 1.5C7 5 7 19 12 22.5 6 21 2 17 1.5 12 2 7 6 3 12 1.5z" fill="#f05a3a"/><path d="M12 1.5c5 3.5 5 17.5 0 21 6-1.5 10-5.5 10.5-10.5C22 7 18 3 12 1.5z" fill="#2e8fd0"/><path d="M12 1.5c-2 4-2 17 0 21" fill="#f7c22e" opacity=".9"/><circle cx="12" cy="12" r="10.5" fill="none" stroke="#b39765" stroke-width=".7"/><ellipse cx="8" cy="6" rx="2.2" ry="1.3" fill="#fff" opacity=".55" transform="rotate(-35 8 6)"/>' },
    etoileMer: { nom: '⭐ Étoile de mer', t: 24, rot: 16, svg: '<path d="M12 1.5l2.6 7 7.4.4-5.8 4.6 2 7.2L12 16.6l-6.2 4.1 2-7.2L2 8.9l7.4-.4z" fill="#ff9a62" stroke="#d9663a" stroke-width=".9" stroke-linejoin="round"/><g fill="#fff3e0"><circle cx="12" cy="7" r=".8"/><circle cx="16" cy="11" r=".8"/><circle cx="8" cy="11" r=".8"/><circle cx="10" cy="15" r=".8"/><circle cx="14" cy="15" r=".8"/></g>' },
    chapeau: { nom: '👒 Chapeau de paille', t: 28, rot: 12, svg: '<ellipse cx="12" cy="15" rx="11" ry="4" fill="#f3d27a" stroke="#c99a3a" stroke-width=".8"/><path d="M6 15c0-6 2.5-9 6-9s6 3 6 9" fill="#f7dc8e" stroke="#c99a3a" stroke-width=".8"/><path d="M6.3 12.5c3.8 1.4 7.6 1.4 11.4 0V14c-3.8 1.4-7.6 1.4-11.4 0z" fill="#e8555a"/>' },
    glace: { nom: '🍦 Glace', t: 22, rot: 10, svg: '<path d="M7 11l5 12 5-12z" fill="#e3b26a" stroke="#b8833a" stroke-width=".8" stroke-linejoin="round"/><path d="M8.5 13l6 5M15.5 13l-6 5" stroke="#b8833a" stroke-width=".6"/><circle cx="9.5" cy="9" r="3.6" fill="#ffb3c6"/><circle cx="14.5" cy="9" r="3.6" fill="#bfe58f"/><circle cx="12" cy="5.5" r="3.6" fill="#fff3d6"/><circle cx="12" cy="1.8" r="1.4" fill="#e53935"/>' },
  },
  automne: {
    erable: { nom: '🍁 Feuille d\'érable', t: 26, rot: 18, svg: '<path d="M12 1l1.8 4.2 2.6-1.4-.6 4.6 4.2-1.6-1.4 3.4 3.4 1.2-4.6 3.4.8 2.2-4.8-.8.4 4.6h-3.6l.4-4.6-4.8.8.8-2.2L1.6 11.4 5 10.2 3.6 6.8l4.2 1.6-.6-4.6 2.6 1.4z" fill="#e0622b" stroke="#a83d14" stroke-width=".7" stroke-linejoin="round"/><path d="M12 6v17M12 13l-5-3M12 13l5-3" stroke="#a83d14" stroke-width=".7"/>' },
    champignon: { nom: '🍄 Champignon', t: 24, rot: 8, svg: '<path d="M9 13h6l1 9H8z" fill="#fff3e0" stroke="#c9a77a" stroke-width=".8"/><path d="M1.5 13C2 6 6.5 2 12 2s10 4 10.5 11z" fill="#d6452f" stroke="#9c2a1a" stroke-width=".8"/><g fill="#fff"><circle cx="7" cy="8.5" r="1.6"/><circle cx="13" cy="5.5" r="1.4"/><circle cx="17.5" cy="9.5" r="1.7"/><circle cx="11" cy="10.5" r="1"/></g>' },
    gland: { nom: '🌰 Gland', t: 22, rot: 14, svg: '<path d="M6 10c0 7 3 11 6 12 3-1 6-5 6-12z" fill="#c98b48" stroke="#8a5a26" stroke-width=".8"/><path d="M4 10c0-4 4-6 8-6s8 2 8 6z" fill="#8a5a26"/><path d="M5 9h14M6 7h12" stroke="#6b4419" stroke-width=".6"/><path d="M12 4V1.5" stroke="#6b4419" stroke-width="1.4" stroke-linecap="round"/><path d="M9 13c0 3 1 5 2 6" stroke="#e6b47a" stroke-width="1" fill="none" stroke-linecap="round"/>' },
    citrouille: { nom: '🎃 Petite courge', t: 24, rot: 6, svg: '<ellipse cx="12" cy="14" rx="10" ry="8" fill="#f28c28" stroke="#b85c12" stroke-width=".8"/><path d="M12 6c-3 0-4 4-4 8s1 8 4 8M12 6c3 0 4 4 4 8s-1 8-4 8" fill="none" stroke="#b85c12" stroke-width=".8"/><path d="M12 6c0-2 1-4 3-4" stroke="#4f7a2a" stroke-width="1.8" stroke-linecap="round" fill="none"/>' },
    feuilleJaune: { nom: '💛 Feuille dorée', t: 24, rot: -14, svg: '<path d="M12 2C5 6 3 13 6 20c7 0 13-5 14-14-3-2-5-3-8-4z" fill="#f2b632" stroke="#b9801a" stroke-width=".8"/><path d="M6 20C9 14 13 9 18 5" stroke="#b9801a" stroke-width=".8" fill="none"/>' },
  },
  hiver: {
    flocon: { nom: '❄️ Gros flocon', t: 28, rot: 0, svg: '<g stroke="#7fb4ea" stroke-width="2" stroke-linecap="round"><path d="M12 1v22M2.5 6.5l19 11M2.5 17.5l19-11"/></g><g stroke="#b8dcff" stroke-width="1.3" stroke-linecap="round" fill="none"><path d="M9.5 3l2.5 2.5L14.5 3M9.5 21l2.5-2.5 2.5 2.5M3 9.6l3.4.9-.9 3.4M21 14.4l-3.4-.9.9-3.4M3 14.4l3.4-.9-.9-3.4M21 9.6l-3.4.9.9 3.4"/></g><circle cx="12" cy="12" r="2" fill="#fff" stroke="#7fb4ea"/>' },
    moufles: { nom: '🧤 Moufles', t: 26, rot: 8, svg: '<path d="M3 20V10c0-4 2-6 4.5-6S11 6 11 9v11z" fill="#e53935" stroke="#9c1c1c" stroke-width=".8"/><path d="M3 12c-2-1-2.5-4-.5-4.5" stroke="#9c1c1c" stroke-width=".8" fill="#e53935"/><path d="M13 20V10c0-4 2-6 4.5-6S21 6 21 9v11z" fill="#e53935" stroke="#9c1c1c" stroke-width=".8"/><path d="M21 12c2-1 2.5-4 .5-4.5" stroke="#9c1c1c" stroke-width=".8" fill="#e53935"/><rect x="2.6" y="18" width="8.8" height="4" rx="1.2" fill="#fff"/><rect x="12.6" y="18" width="8.8" height="4" rx="1.2" fill="#fff"/><path d="M5 11l1.5 1.5L8 11M15 11l1.5 1.5L18 11" stroke="#fff" stroke-width=".8" fill="none"/>' },
    bonnet: { nom: '🧶 Petit bonnet rouge', t: 26, rot: 14, svg: '<path d="M3 18C3 9 7 5 12 5s9 4 9 13z" fill="#e53935" stroke="#9c1c1c" stroke-width=".8"/><path d="M7 8l2 10M12 5v13M17 8l-2 10" stroke="#c62828" stroke-width=".8"/><rect x="2" y="16.5" width="20" height="5" rx="2.2" fill="#fff" stroke="#d8dee8" stroke-width=".6"/><circle cx="12" cy="3.6" r="3" fill="#fff" stroke="#d8dee8" stroke-width=".6"/>' },
    echarpe: { nom: '🧣 Écharpe', t: 26, rot: -6, svg: '<path d="M2 7c6 3 14 3 20 0v5c-6 3-14 3-20 0z" fill="#2e7d5b" stroke="#1d5a40" stroke-width=".8"/><path d="M15 10l2 12h-5l-1-11z" fill="#2e7d5b" stroke="#1d5a40" stroke-width=".8"/><path d="M5 8.5v5M9 9.4v5M13 9.6v5M17 9.2v5M12 20h5" stroke="#f7c22e" stroke-width="1.2"/>' },
    chocolat: { nom: '☕ Chocolat chaud', t: 24, rot: 0, svg: '<path d="M4 9h13l-1.5 12h-10z" fill="#fff" stroke="#c7a27a" stroke-width=".8"/><path d="M17 11c3 0 3 5 0 5" stroke="#c7a27a" stroke-width="1.4" fill="none"/><ellipse cx="10.5" cy="9.5" rx="6.5" ry="1.6" fill="#7a4a24"/><path d="M8 6c-1-1.5 1-2.5 0-4M12 6c-1-1.5 1-2.5 0-4" stroke="#c7d0dc" stroke-width="1" fill="none" stroke-linecap="round"/>' },
  },
};

/** L'objet du moment : un seul coché = toujours lui ; plusieurs = ils alternent au rythme choisi */
export function objetDuMoment(saison: Saison, objets: string[], rythme: 'connexion' | 'jour' | 'semaine' | 'mois', d = new Date()): ObjetLogo | null {
  const cat = OBJETS_LOGO[saison];
  const liste = objets.filter((k) => cat[k]);
  if (!liste.length) return null;
  let n = 0;
  if (rythme === 'jour') n = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86_400_000);
  else if (rythme === 'semaine') n = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000 + 3 * 86_400_000) / (7 * 86_400_000));
  else if (rythme === 'mois') n = d.getFullYear() * 12 + d.getMonth();
  else {
    // À chaque connexion : un compteur par onglet ouvert (le même tant que l'appli reste ouverte)
    try {
      let v = sessionStorage.getItem('dinislam_logo_tour');
      if (v === null) { const k = Number(localStorage.getItem('dinislam_logo_compteur') || '0') + 1; localStorage.setItem('dinislam_logo_compteur', String(k)); v = String(k); sessionStorage.setItem('dinislam_logo_tour', v); }
      n = Number(v);
    } catch { n = 0; }
  }
  return cat[liste[((n % liste.length) + liste.length) % liste.length]];
}
