import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Minimize2, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZOOM_RACINE_ID, ZOOM_URL, fermerErreur, quitterCours, reduireCours, useZoomCours } from '@/lib/zoomCours';

/**
 * 🎥 La fenêtre du cours Zoom (montée UNE fois, au-dessus des pages : le cours continue quand on change de page).
 * 27/11 (Nadia) : PLUS déplaçable. Fenêtre et pastille « Cours en direct » toujours au même endroit, en haut à gauche juste
 * sous l'en-tête (au-dessus de l'arbre de l'accueil), sur toutes les pages. Une place est réservée en haut de chaque page
 * (`AppLayout`) pour ne jamais cacher le bouton « Retour ».
 */
function useBasEntete() {
  const [bas, setBas] = useState(64);
  useEffect(() => {
    const maj = () => setBas(Math.round(document.querySelector('header')?.getBoundingClientRect().bottom ?? 64));
    maj();
    const t = window.setInterval(maj, 1000);
    window.addEventListener('resize', maj);
    return () => { window.clearInterval(t); window.removeEventListener('resize', maj); };
  }, []);
  return Math.max(0, bas);
}

export default function ZoomCours() {
  const s = useZoomCours();
  const ouvert = s.etat === 'connexion' || s.etat === 'en-cours';
  const haut = useBasEntete() + 6;
  const place = { top: haut, left: 'max(8px, env(safe-area-inset-left, 0px))' };

  return createPortal(
    <>
      {/* Toujours présente (le kit Zoom dessine dedans dès la connexion) ; cachée quand fermée, transparente quand réduite (le son continue) */}
      <section aria-label="Cours Zoom en direct"
        className={cn('fixed z-[70] w-[min(380px,calc(100vw-16px))] overflow-hidden rounded-2xl border-2 border-[#2D8CFF] bg-card shadow-2xl',
          !ouvert && 'hidden', s.reduit && 'pointer-events-none opacity-0')}
        style={place}>
        <header className="flex items-center gap-2 bg-[#2D8CFF] px-3 py-1.5 text-white">
          <span className="min-w-0 flex-1 text-sm font-extrabold [overflow-wrap:anywhere]">
            🎥 Cours en direct {s.etat === 'connexion' && '· connexion…'}
          </span>
          <button type="button" onClick={() => reduireCours(true)} aria-label="Réduire la fenêtre du cours (le son continue)"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/20 hover:bg-white/30"><Minimize2 className="h-4 w-4" /></button>
          <button type="button" onClick={() => void quitterCours()} aria-label="Quitter le cours"
            className="grid h-8 w-8 place-items-center rounded-full bg-white text-destructive"><X className="h-5 w-5" strokeWidth={2.75} /></button>
        </header>
        <div id={ZOOM_RACINE_ID} className="relative min-h-[220px] bg-[#1a1a1a]" />
        <p className="px-3 py-1.5 text-[11px] text-muted-foreground">
          📱↔️ Sur tablette, tu peux aussi mettre Zoom et Dinislam côte à côte :{' '}
          <a href={ZOOM_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2D8CFF] underline">ouvrir dans l'appli Zoom</a>.
        </p>
      </section>
      {/* Fenêtre réduite : la pastille, fixe, toujours au même endroit (bleu Zoom + liseré blanc : visible de jour comme de nuit) */}
      {ouvert && s.reduit && (
        <button type="button" onClick={() => reduireCours(false)}
          className="fixed z-[70] flex items-center gap-1.5 rounded-full border-2 border-white bg-[#2D8CFF] px-3 py-2 text-xs font-extrabold text-white shadow-lg"
          style={place}>
          <Maximize2 className="h-4 w-4" /> Cours en direct
        </button>
      )}
      {s.etat === 'erreur' && s.erreur && (
        <div role="alert" className="fixed z-[70] left-2 right-2 sm:left-auto sm:right-4 sm:w-[380px] rounded-2xl border-2 border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 shadow-xl dark:bg-rose-950/60 dark:text-rose-200"
          style={{ bottom: 'calc(var(--menu-bas, 0px) + 12px)' }}>
          <button type="button" onClick={fermerErreur} aria-label="Fermer" className="float-right ms-2 text-destructive"><X className="h-5 w-5" strokeWidth={2.75} /></button>
          {s.erreur}
        </div>
      )}
    </>,
    document.body,
  );
}
