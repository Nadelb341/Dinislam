import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { READER_COUNT, pageOfIndex } from '@/data/coranMeta';
import { pageUrl, describeIndex } from '@/lib/coranPages';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

/**
 * Lecteur du Coran Al-Tajwid (2026-10-25) : on tourne les pages de droite à gauche, comme un vrai Coran.
 * - glisser le doigt vers la droite (ou flèche de gauche) = page suivante ;
 * - zoom à deux doigts ou double-tap (on se déplace dans la page zoomée avec un doigt) ;
 * - tablette ou ordinateur à l'horizontale : double page, comme un Coran ouvert ;
 * - seule la page affichée se charge (+ les voisines en avance) ; les pages vues restent sur l'appareil (lecture sans connexion).
 */
const CACHE = 'dinislam-coran-pages-v1';

/** Garde la page sur l'appareil ; si la connexion manque, la reprend depuis l'appareil */
function useOfflinePage(url: string) {
  const [src, setSrc] = useState(url);
  useEffect(() => { setSrc(url); }, [url]);
  const onError = useCallback(async () => {
    try {
      if (!('caches' in window)) return;
      const hit = await (await caches.open(CACHE)).match(url);
      if (hit) setSrc(URL.createObjectURL(await hit.blob()));
    } catch { /* rien sur l'appareil */ }
  }, [url]);
  const onLoad = useCallback(() => {
    try { if ('caches' in window) void caches.open(CACHE).then(async (c) => { if (!(await c.match(url))) await c.add(url); }).catch(() => {}); } catch { /* stockage indisponible */ }
  }, [url]);
  return { src, onError, onLoad };
}

function PageImage({ index, alt }: { index: number; alt: string }) {
  const { src, onError, onLoad } = useOfflinePage(pageUrl(index));
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(false); }, [src]);
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {!loaded && <Loader2 className="absolute h-8 w-8 animate-spin text-[#c39a3e]" aria-hidden />}
      <img src={src} alt={alt} draggable={false} onError={onError}
        onLoad={() => { setLoaded(true); onLoad(); }}
        className={cn('max-h-full max-w-full object-contain select-none transition-opacity duration-200', loaded ? 'opacity-100' : 'opacity-0')} />
    </div>
  );
}


export type ReaderMode = { kind: 'free' | 'juz' | 'prog'; label: string; sub?: string };

const MODE_STYLE: Record<ReaderMode['kind'], string> = {
  free: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  juz: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  prog: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
};

interface Props {
  index: number;
  onIndexChange: (index: number) => void;
  mode: ReaderMode;
  /** Bouton d'action du mode (ex. « ✅ Sourate terminée ») */
  action?: ReactNode;
  /** Boutons du bas (marque-page, sommaire, écouter…) */
  tools?: ReactNode;
  /** Limites de lecture (programme du jour) : rien n'empêche d'aller plus loin, on les affiche juste */
  range?: { from: number; to: number };
  /** Marque-page posé sur une page : ruban de couleur dans le coin de la page */
  bookmarkOf?: (index: number) => { dot: string; label: string } | null;
}

export function CoranReader({ index, onIndexChange, mode, action, tools, range, bookmarkOf }: Props) {
  const [double, setDouble] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape) and (min-width: 900px)');
    const up = () => setDouble(mq.matches);
    up();
    mq.addEventListener('change', up);
    return () => mq.removeEventListener('change', up);
  }, []);

  // Double page : page impaire du Coran à droite, la suivante à gauche (comme un Coran ouvert)
  const rightIndex = double && index > 3 ? index - ((index - 4) % 2) : index;
  const step = double && index > 3 ? 2 : 1;
  const go = useCallback((delta: number) => {
    const target = delta > 0 ? Math.min(READER_COUNT, rightIndex + (delta > 0 ? step : 0)) : Math.max(1, (double && rightIndex > 5 ? rightIndex - 2 : rightIndex - 1));
    if (target !== index) onIndexChange(target);
  }, [rightIndex, step, double, index, onIndexChange]);

  // Pages voisines chargées en avance
  useEffect(() => {
    [index + 1, index + 2, index - 1].filter((i) => i >= 1 && i <= READER_COUNT).forEach((i) => { const im = new Image(); im.src = pageUrl(i); });
  }, [index]);

  // Clavier (ordinateur) : ← page suivante, → page précédente
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, [contenteditable="true"]')) return;
      if (e.key === 'ArrowLeft') go(1);
      if (e.key === 'ArrowRight') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  // Zoom à deux doigts + glisser pour tourner les pages
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, [index]);
  const touch = useRef<{ x: number; y: number; dist: number; zoom: number; pan: { x: number; y: number }; t: number } | null>(null);
  const lastTap = useRef(0);
  const dist = (t: React.TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches;
    touch.current = { x: t[0].clientX, y: t[0].clientY, dist: t.length > 1 ? dist(t) : 0, zoom, pan, t: Date.now() };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = touch.current;
    if (!s) return;
    const t = e.touches;
    if (t.length > 1 && s.dist) {
      setZoom(Math.min(3, Math.max(1, s.zoom * (dist(t) / s.dist))));
    } else if (zoom > 1) {
      setPan({ x: s.pan.x + (t[0].clientX - s.x), y: s.pan.y + (t[0].clientY - s.y) });
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s || e.touches.length) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const dy = e.changedTouches[0].clientY - s.y;
    if (zoom <= 1.02 && !s.dist && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      go(dx > 0 ? 1 : -1); // sens arabe : glisser vers la droite = page suivante
      return;
    }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && Date.now() - s.t < 250) {
      const now = Date.now();
      if (now - lastTap.current < 300) { setZoom((z) => (z > 1 ? 1 : 2)); setPan({ x: 0, y: 0 }); }
      lastTap.current = now;
    }
  };

  const info = describeIndex(rightIndex);
  const leftInfo = double && rightIndex > 3 && rightIndex < READER_COUNT ? describeIndex(rightIndex + 1) : null;
  const page = pageOfIndex(rightIndex);
  const inRange = range && page ? page >= range.from && page <= range.to : true;

  const pages = useMemo(() => (leftInfo ? [rightIndex + 1, rightIndex] : [rightIndex]), [leftInfo, rightIndex]);

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-[#e6d9cc] dark:border-[#3a2523] bg-white dark:bg-[#1b1110] shadow-sm">
      {/* En haut : le mode de lecture à gauche, les outils (marque-page, sommaire, écouter) à droite (2026-10-25) */}
      <div className={cn('flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs font-bold', MODE_STYLE[mode.kind])}>
        <div className="min-w-0">
          <p className="[overflow-wrap:anywhere]">{mode.label}</p>
          {mode.sub && <p className="text-[11px] font-semibold opacity-80 [overflow-wrap:anywhere]">{mode.sub}</p>}
        </div>
        {tools && <div className="flex flex-wrap items-center justify-end gap-1.5">{tools}</div>}
      </div>

      <div className="relative bg-white flex items-center justify-center overflow-hidden touch-none select-none"
        style={{ height: 'min(74dvh, 1100px)' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div className="h-full w-full flex items-center justify-center gap-1 transition-transform duration-150"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          {pages.map((i) => {
            const bm = bookmarkOf?.(i);
            return (
              <div key={i} className={cn('relative h-full', pages.length > 1 ? 'w-1/2' : 'w-full')}>
                <PageImage index={i} alt={`${describeIndex(i).title} · ${describeIndex(i).sub}`} />
                {bm && (
                  <span className="absolute top-0 right-3 flex flex-col items-center pointer-events-none" aria-label={`Marque-page : ${bm.label}`}>
                    <span className={cn('block w-7 h-12 shadow-md [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]', bm.dot)} />
                    <span className="mt-1 rounded-full bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 whitespace-nowrap">🔖 {bm.label}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => go(1)} disabled={rightIndex >= READER_COUNT} aria-label="Page suivante"
          className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-[#7a1d22]/85 text-white grid place-items-center shadow disabled:opacity-30">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button type="button" onClick={() => go(-1)} disabled={rightIndex <= 1} aria-label="Page précédente"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-[#7a1d22]/85 text-white grid place-items-center shadow disabled:opacity-30">
          <ChevronRight className="h-6 w-6" />
        </button>
        {zoom > 1 && (
          <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 text-white text-xs font-bold px-3 py-1">
            🔍 Revenir à la page entière
          </button>
        )}
        {!inRange && range && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 text-white text-[11px] font-bold px-3 py-1 whitespace-nowrap">
            Lecture du jour : pages {range.from} à {range.to}
          </span>
        )}
      </div>

      {/* En bas : le numéro de la page, centré (2026-10-25) */}
      <div className="flex flex-col items-center gap-1.5 px-3 py-2 text-center border-t border-[#e6d9cc] dark:border-[#3a2523] bg-[#fbf7ef] dark:bg-[#221413]">
        <div className="min-w-0">
          <p className="text-sm font-extrabold tabular-nums text-[#2a1414] dark:text-[#f3e9e4]">
            {leftInfo ? `${info.title} – ${leftInfo.title.replace('Page ', '')}` : info.title}
          </p>
          <p className="text-[11px] text-[#75605a] dark:text-[#bfa79f] [overflow-wrap:anywhere]">{info.sub}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
