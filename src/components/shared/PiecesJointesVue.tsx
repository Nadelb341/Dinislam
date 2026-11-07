import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from '@/components/ui/carousel';
import { urlPJ, type PieceJointe } from '@/lib/devoirFichiers';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useUrlLisible } from '@/lib/fichiersPrives';
import { ImgPrive } from '@/components/shared/FichiersPrives';

/**
 * 📎 Idée 8 (2026-11-04) : documents et photos d'un devoir, ouverts DANS l'appli (photo en grand, PDF, Word, vidéo, audio),
 * avec défilement d'un fichier à l'autre (glisser, flèches, clavier, compteur). `onOpen` : le professeur voit qui a ouvert (idée 3).
 * `onRemove` (facultatif) : petite croix rouge sur chaque vignette (formulaire du professeur).
 */
type Kind = 'image' | 'video' | 'audio' | 'pdf' | 'office' | 'other';
const kindPJ = (a: PieceJointe): Kind => {
  const t = a.type || '', n = a.name.toLowerCase();
  if (t.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic)$/.test(n)) return 'image';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  if (t === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if (/\.(docx?|xlsx?|pptx?|odt|ods)$/.test(n)) return 'office';
  return 'other';
};
const ICONES: Record<Kind, { e: string; c: string }> = {
  image: { e: '🖼️', c: 'bg-pink-100 dark:bg-pink-950/40' }, video: { e: '🎬', c: 'bg-violet-100 dark:bg-violet-950/40' },
  audio: { e: '🎧', c: 'bg-sky-100 dark:bg-sky-950/40' }, pdf: { e: '📕', c: 'bg-red-100 dark:bg-red-950/40' },
  office: { e: '📘', c: 'bg-blue-100 dark:bg-blue-950/40' }, other: { e: '📎', c: 'bg-muted' },
};

function Apercu({ a }: { a: PieceJointe }) {
  // 🔒 Lien signé (espace `devoirs-fichiers` bientôt privé, 2026-11-07) ; rien d'affiché tant qu'il n'est pas prêt
  const url = useUrlLisible(urlPJ(a.path)), k = kindPJ(a);
  if (!url) return <div className="grid h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (k === 'image') return <img src={url} alt={a.name} className="max-h-[62dvh] w-full object-contain rounded-xl bg-black/5" />;
  if (k === 'video') return <video key={url} src={url} controls playsInline className="max-h-[62dvh] w-full rounded-xl bg-black" />;
  if (k === 'audio') return <div className="py-10 px-2"><audio key={url} src={url} controls className="w-full" /></div>;
  if (k === 'pdf') return <iframe src={url} title={a.name} className="h-[62dvh] w-full rounded-xl border" />;
  if (k === 'office') return <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`} title={a.name} className="h-[62dvh] w-full rounded-xl border" />;
  return <div className="py-10 text-center text-5xl">📎<p className="mt-2 text-sm font-bold [overflow-wrap:anywhere]">{a.name}</p></div>;
}

export function PiecesJointesVue({ items, onOpen, onRemove, grand = false, className }: {
  items: PieceJointe[]; onOpen?: () => void; onRemove?: (a: PieceJointe) => void; grand?: boolean; className?: string;
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [cur, setCur] = useState(0);
  useEffect(() => {
    if (!api) return;
    const up = () => setCur(api.selectedScrollSnap());
    up(); api.on('select', up);
    return () => { api.off('select', up); };
  }, [api]);
  useEffect(() => {
    if (openAt === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') api?.scrollPrev(); if (e.key === 'ArrowRight') api?.scrollNext(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [openAt, api]);
  if (!items.length) return null;
  const shown = items[openAt === null ? 0 : (items.length > 1 ? cur : 0)] ?? items[0];
  const taille = grand ? 'h-20 w-20 text-3xl' : 'h-12 w-12 text-xl';

  return (
    <>
      <div className={cn('flex flex-wrap gap-1.5', className)} onPointerDown={(e) => e.stopPropagation()}>
        {items.map((a, i) => {
          const k = kindPJ(a);
          return (
            <span key={a.path} className="relative">
              <button type="button" onClick={() => { setCur(i); setOpenAt(i); onOpen?.(); }} aria-label={`Ouvrir ${a.name}`} title={a.name}
                className={cn('rounded-xl overflow-hidden grid place-items-center border border-border', taille, k !== 'image' && ICONES[k].c)}>
                {k === 'image' ? <ImgPrive src={urlPJ(a.path)} alt="" loading="lazy" className="h-full w-full object-cover" /> : ICONES[k].e}
              </button>
              {onRemove && (
                <button type="button" onClick={() => onRemove(a)} aria-label={`Retirer ${a.name}`}
                  className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-[#EF4444] text-white text-[11px] font-extrabold grid place-items-center shadow">✕</button>
              )}
            </span>
          );
        })}
      </div>
      <Dialog open={openAt !== null} onOpenChange={(o) => { if (!o) setOpenAt(null); }}>
        <DialogContent className="max-w-2xl" level="nested">
          <DialogTitle className="pe-8 text-base [overflow-wrap:anywhere]">{ICONES[kindPJ(shown)].e} {shown.name}</DialogTitle>
          {openAt !== null && (items.length > 1 ? (
            <Carousel setApi={setApi} opts={{ startIndex: openAt, loop: true }}>
              <CarouselContent>{items.map((a) => <CarouselItem key={a.path}><Apercu a={a} /></CarouselItem>)}</CarouselContent>
              <CarouselPrevious className="left-1" /><CarouselNext className="right-1" />
            </Carousel>
          ) : <Apercu a={items[0]} />)}
          {items.length > 1 && <p className="text-center text-xs font-bold text-muted-foreground tabular-nums">{cur + 1} / {items.length}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
