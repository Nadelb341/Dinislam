import { useCallback, useEffect, useRef, useState, type PointerEvent as PE } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, Minimize2, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZOOM_RACINE_ID, ZOOM_URL, fermerErreur, quitterCours, reduireCours, useZoomCours } from '@/lib/zoomCours';

/**
 * 🎥 La fenêtre du cours Zoom (montée UNE fois, au-dessus des pages : le cours continue quand on change de page).
 * 27/11 (Nadia) : DÉPLAÇABLE par l'élève (on la tient par sa barre bleue, ou la pastille quand elle est réduite) ;
 * par défaut en haut à droite, juste sous les icônes de l'en-tête. La place choisie est gardée sur l'appareil.
 */
const CLE_PLACE = 'dinislam_zoom_place';
type Place = { x: number; y: number };
const lirePlace = (): Place | null => { try { const v = JSON.parse(localStorage.getItem(CLE_PLACE) || 'null'); return v && typeof v.x === 'number' ? v : null; } catch { return null; } };
const ecrirePlace = (p: Place) => { try { localStorage.setItem(CLE_PLACE, JSON.stringify(p)); } catch { /* stockage indisponible */ } };

/** Place par défaut : en haut à droite, sous l'en-tête */
function placeParDefaut(largeur: number): Place {
  const bas = document.querySelector('header')?.getBoundingClientRect().bottom ?? 64;
  return { x: Math.max(8, window.innerWidth - largeur - 12), y: Math.round(bas + 8) };
}
const borner = (p: Place, l: number, h: number): Place => ({
  x: Math.min(Math.max(4, p.x), Math.max(4, window.innerWidth - l - 4)),
  y: Math.min(Math.max(4, p.y), Math.max(4, window.innerHeight - Math.min(h, 120) - 4)),
});

export default function ZoomCours() {
  const s = useZoomCours();
  const ouvert = s.etat === 'connexion' || s.etat === 'en-cours';
  const fenetre = useRef<HTMLElement | null>(null);
  const pastille = useRef<HTMLButtonElement | null>(null);
  const reduitRef = useRef(s.reduit);
  reduitRef.current = s.reduit;
  const boite = useRef({ get current() { return reduitRef.current ? pastille.current : fenetre.current; } }).current;
  const [place, setPlace] = useState<Place | null>(lirePlace);
  const glisse = useRef<{ dx: number; dy: number; x0: number; y0: number; bouge: boolean } | null>(null);

  // Une place encore valable si l'écran a changé de taille (téléphone tourné…)
  const recaler = useCallback(() => {
    const el = boite.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setPlace((p) => borner(p ?? placeParDefaut(r.width), r.width, r.height));
  }, [boite]);
  useEffect(() => {
    if (!ouvert) return;
    recaler();
    window.addEventListener('resize', recaler);
    return () => window.removeEventListener('resize', recaler);
  }, [ouvert, s.reduit, recaler]);

  const debut = (e: PE<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('[data-pas-glisser]')) return;
    const r = boite.current?.getBoundingClientRect(); if (!r) return;
    glisse.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, x0: e.clientX, y0: e.clientY, bouge: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const bouger = (e: PE<HTMLElement>) => {
    const g = glisse.current; const r = boite.current?.getBoundingClientRect(); if (!g || !r) return;
    // un petit tremblement du doigt n'est pas un déplacement (sinon toucher la pastille ne la rouvrirait pas)
    if (!g.bouge && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 6) return;
    g.bouge = true;
    setPlace(borner({ x: e.clientX - g.dx, y: e.clientY - g.dy }, r.width, r.height));
  };
  const fin = () => {
    const g = glisse.current; glisse.current = null;
    if (g?.bouge && place) ecrirePlace(place);
    return !!g?.bouge;
  };
  const style = place ? { left: place.x, top: place.y } : { right: 12, top: 72 };

  return createPortal(
    <>
      {/* Toujours présente (le kit Zoom dessine dedans dès la connexion) ; cachée quand fermée, transparente quand réduite (le son continue) */}
      <section ref={fenetre} aria-label="Cours Zoom en direct"
        className={cn('fixed z-[70] w-[min(380px,calc(100vw-16px))] overflow-hidden rounded-2xl border-2 border-[#2D8CFF] bg-card shadow-2xl',
          !ouvert && 'hidden', s.reduit && 'pointer-events-none opacity-0')}
        style={style}>
        <header onPointerDown={debut} onPointerMove={bouger} onPointerUp={fin} onPointerCancel={fin}
          className="flex cursor-grab touch-none select-none items-center gap-2 bg-[#2D8CFF] px-3 py-1.5 text-white active:cursor-grabbing">
          <GripVertical className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          <span className="min-w-0 flex-1 text-sm font-extrabold [overflow-wrap:anywhere]">
            🎥 Cours en direct {s.etat === 'connexion' && '· connexion…'}
          </span>
          <button type="button" data-pas-glisser onClick={() => reduireCours(true)} aria-label="Réduire la fenêtre du cours (le son continue)"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/20 hover:bg-white/30"><Minimize2 className="h-4 w-4" /></button>
          <button type="button" data-pas-glisser onClick={() => void quitterCours()} aria-label="Quitter le cours"
            className="grid h-8 w-8 place-items-center rounded-full bg-white text-destructive"><X className="h-5 w-5" strokeWidth={2.75} /></button>
        </header>
        <div id={ZOOM_RACINE_ID} className="relative min-h-[220px] bg-[#1a1a1a]" />
        <p className="px-3 py-1.5 text-[11px] text-muted-foreground">
          📱↔️ Sur tablette, tu peux aussi mettre Zoom et Dinislam côte à côte :{' '}
          <a href={ZOOM_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2D8CFF] underline">ouvrir dans l'appli Zoom</a>.
        </p>
      </section>
      {/* Fenêtre réduite : une pastille déplaçable pour la rouvrir */}
      {ouvert && s.reduit && (
        <button type="button" ref={pastille}
          onPointerDown={debut} onPointerMove={bouger} onPointerUp={(e) => { if (!fin()) { e.preventDefault(); reduireCours(false); } }} onPointerCancel={fin}
          className="fixed z-[70] flex touch-none select-none items-center gap-1.5 rounded-full bg-[#2D8CFF] px-3 py-2 text-xs font-extrabold text-white shadow-lg"
          style={style}>
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
