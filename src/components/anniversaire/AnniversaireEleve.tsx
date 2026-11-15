import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CLASSE_FETE, EVT_FETE, FETE_MS, commencerFete, debutFete, feteAffichee, feteEnCours, infoAnniversaire, phraseAnniversaire } from '@/lib/anniversaire';

/**
 * 🎉 Un an de plus (Nadia, 2026-11-15) — sur l'accueil de l'élève :
 * - message éphémère à la 1ʳᵉ connexion depuis la date (≤ 30 jours) : « Aujourd'hui, tu as un an de plus ! », +20 points,
 *   « بارك الله فيك » ; jamais « joyeux anniversaire », ni gâteau ni bougies ;
 * - 24 h de fête sur SON accueil : quelques ballons qui montent + confettis à côté de son prénom, chapeau du compagnon, titre en fête
 *   (classe `anniv-fete` sur la page) ;
 * - les +20 points : fonction `anniversaire_du_jour` (une fois par an) ; sans réseau, message et fête quand même, points au retour.
 */
export function AnniversaireEleve({ userId, naissance }: { userId: string; naissance: string | null }) {
  const info = infoAnniversaire(naissance);
  const [ouvert, setOuvert] = useState(false);
  const [debut, setDebut] = useState<number | null>(() => (info ? debutFete(userId, info.annee) : null));
  // Points : une fois par session suffit (la base refuse les doublons) ; réessaie à la prochaine ouverture si pas de réseau
  const { data: points } = useQuery({
    queryKey: ['anniversaire-du-jour', userId, info?.annee],
    enabled: !!info,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('anniversaire_du_jour' as never);
      if (error) throw error;
      return data as { nouveau: boolean } | null;
    },
  });
  // 1ʳᵉ fois sur cet appareil : le message s'ouvre et la fête de 24 h commence
  useEffect(() => {
    if (!info || debut) return;
    commencerFete(userId, info.annee);
    setDebut(debutFete(userId, info.annee) ?? Date.now());
    setOuvert(true);
  }, [info, debut, userId]);
  const fete = feteEnCours(debut);
  useEffect(() => {
    const el = document.documentElement;
    if (!fete || !debut) return;
    el.classList.add(CLASSE_FETE);
    window.dispatchEvent(new Event(EVT_FETE));
    const fin = setTimeout(() => { el.classList.remove(CLASSE_FETE); window.dispatchEvent(new Event(EVT_FETE)); }, Math.max(0, debut + FETE_MS - Date.now()));
    return () => { clearTimeout(fin); el.classList.remove(CLASSE_FETE); window.dispatchEvent(new Event(EVT_FETE)); };
  }, [fete, debut]);
  // Message éphémère : se ferme seul au bout de 12 s
  useEffect(() => { if (!ouvert) return; const t = setTimeout(() => setOuvert(false), 12000); return () => clearTimeout(t); }, [ouvert]);
  if (!info || (!fete && !ouvert)) return null;

  return createPortal(
    <>
      {fete && (
        <div aria-hidden className="anniv-ballons pointer-events-none fixed inset-0 z-[29] overflow-hidden">
          {BALLONS.map((b, i) => (
            <svg key={i} viewBox="0 0 20 34" className="anniv-ballon absolute" style={{ left: `${b.x}%`, width: b.t, animationDelay: `${b.d}s`, animationDuration: `${b.v}s` }}>
              <path d="M10 22v12" stroke="#94a3b8" strokeWidth=".6" fill="none" />
              <ellipse cx="10" cy="11" rx="8.5" ry="10.5" fill={b.c} />
              <path d="M8.6 21.5h2.8l-1.4 1.6z" fill={b.c} />
              <ellipse cx="7" cy="7" rx="2" ry="3" fill="#fff" opacity=".45" />
            </svg>
          ))}
        </div>
      )}
      {ouvert && (
        <div role="dialog" aria-label="Un an de plus" className="fixed inset-0 z-[90] grid place-items-center bg-black/30 px-4" onClick={() => setOuvert(false)}>
          <div className="anniv-message relative max-w-sm w-full rounded-3xl bg-card p-6 text-center shadow-2xl border-2 border-violet-300 space-y-2 overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {CONFETTIS.map((c, i) => <span key={i} className="anniv-confetti absolute block" style={{ left: `${c.x}%`, background: c.c, animationDelay: `${c.d}s`, width: c.l, height: c.l * 1.6 }} />)}
            </div>
            <p className="text-5xl" aria-hidden>🎊</p>
            <p className="text-xl font-extrabold text-violet-900 dark:text-violet-100 text-balance">{phraseAnniversaire(info)}</p>
            <p className="text-sm font-bold text-muted-foreground">{info.age} ans</p>
            <p className="inline-block rounded-full bg-amber-100 dark:bg-amber-950/40 px-3 py-1 text-sm font-extrabold text-amber-800 dark:text-amber-200">
              ⭐ +20 points{points === undefined && !navigator.onLine ? ' (ajoutés au retour d\'Internet)' : ''}
            </p>
            <p className="font-arabic text-3xl leading-snug text-emerald-700 dark:text-emerald-300" lang="ar" dir="rtl">بَارَكَ اللهُ فِيكَ</p>
            <p className="text-sm text-muted-foreground">Qu'Allah te bénisse et te garde sur le bon chemin.</p>
            <p className="text-[11px] text-muted-foreground pt-1">Touche pour fermer</p>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}

/** La fête de 24 h est-elle en cours (pour le titre, le prénom, le classement) ? Suit la classe posée par AnniversaireEleve */
export function useFeteAnniversaire(): boolean {
  const [f, setF] = useState(feteAffichee);
  useEffect(() => {
    const maj = () => setF(feteAffichee());
    maj();
    window.addEventListener(EVT_FETE, maj);
    return () => window.removeEventListener(EVT_FETE, maj);
  }, []);
  return f;
}

// Peu de ballons (Nadia : « pas surcharger »), lents, de couleurs douces
const BALLONS = [
  { x: 4, t: 26, d: 0, v: 22, c: '#f9a8d4' }, { x: 22, t: 20, d: 7, v: 26, c: '#fde68a' }, { x: 46, t: 24, d: 13, v: 24, c: '#a5b4fc' },
  { x: 68, t: 22, d: 4, v: 28, c: '#86efac' }, { x: 88, t: 26, d: 17, v: 23, c: '#fdba74' },
];
const CONFETTIS = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 37) % 100, d: (i % 9) * 0.18, l: 5 + (i % 3) * 2, c: ['#f472b6', '#facc15', '#60a5fa', '#34d399', '#a78bfa', '#fb923c'][i % 6],
}));
