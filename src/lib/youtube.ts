/** Identifiant d'une vidéo YouTube à partir d'un lien (watch?v=, youtu.be/, shorts/, embed/) ou de l'identifiant seul */
export function idYoutube(lien: string): string | null {
  const t = lien.trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  try {
    const u = new URL(t);
    const h = u.hostname.replace(/^www\.|^m\./, '');
    if (h === 'youtu.be') return /^[\w-]{11}$/.test(u.pathname.slice(1, 12)) ? u.pathname.slice(1, 12) : null;
    if (h.endsWith('youtube.com') || h.endsWith('youtube-nocookie.com')) {
      const v = u.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]{11})/);
      return m ? m[1] : null;
    }
  } catch { /* pas un lien */ }
  return null;
}
