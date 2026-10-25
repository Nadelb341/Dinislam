import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from '@/components/ui/carousel';
import { uploadTodoFile, type TodoAttachment } from '@/lib/todoAttachments';
import { moveToTrash } from '@/lib/trash';
import { errorMessage, cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

/**
 * Carte « À FAIRE » : documents, photos, vidéos, audios… sur une ligne (2026-10-25, demande de Nadia).
 * Stockage privé `admin-todo` (carte réservée à l'enseignante), liens temporaires d'une heure.
 * Retirer ou remplacer un fichier : l'ancien part d'abord dans la corbeille de Paramètres (fichier gardé).
 */
type Kind = 'image' | 'video' | 'audio' | 'pdf' | 'office' | 'other';
const kindOf = (a: TodoAttachment): Kind => {
  const t = a.type || '';
  const n = a.name.toLowerCase();
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  if (t === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if (/\.(docx?|xlsx?|pptx?|odt|ods)$/.test(n)) return 'office';
  return 'other';
};
const ICONS: Record<Kind, { emoji: string; tone: string }> = {
  image: { emoji: '🖼️', tone: 'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200' },
  video: { emoji: '🎬', tone: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200' },
  audio: { emoji: '🎧', tone: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200' },
  pdf: { emoji: '📕', tone: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200' },
  office: { emoji: '📘', tone: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200' },
  other: { emoji: '📎', tone: 'bg-muted text-foreground' },
};

function useSignedUrls(paths: string[]) {
  return useQuery({
    queryKey: ['admin-todo-urls', paths.join('|')],
    enabled: paths.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('admin-todo').createSignedUrls(paths, 3600);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((d) => { if (d.path && d.signedUrl) map[d.path] = d.signedUrl; });
      return map;
    },
  });
}

function Preview({ a, url }: { a: TodoAttachment; url?: string }) {
  if (!url) return <div className="h-[55dvh] grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  const k = kindOf(a);
  if (k === 'image') return <img src={url} alt={a.name} className="max-h-[60dvh] w-full object-contain rounded-xl bg-black/5" />;
  if (k === 'video') return <video src={url} controls playsInline className="max-h-[60dvh] w-full rounded-xl bg-black" />;
  if (k === 'audio') return <div className="py-10 px-2"><audio src={url} controls className="w-full" /></div>;
  if (k === 'pdf') return <iframe src={url} title={a.name} className="h-[60dvh] w-full rounded-xl border" />;
  if (k === 'office') return <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`} title={a.name} className="h-[60dvh] w-full rounded-xl border" />;
  return (
    <div className="py-10 text-center space-y-3">
      <p className="text-5xl">📎</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold underline">Ouvrir « {a.name} »</a>
    </div>
  );
}

interface Props {
  taskId: string;
  taskTitle: string;
  attachments: TodoAttachment[];
  /** Enregistre la nouvelle liste de fichiers de la ligne */
  onChange: (next: TodoAttachment[]) => Promise<void>;
}

/** Vignettes cliquables d'une ligne + aperçu agrandi défilable (glisser, flèches, clavier) + remplacer / retirer */
export function TodoAttachments({ taskId, taskTitle, attachments, onChange }: Props) {
  const { user } = useAuth();
  const { data: urls = {} } = useSignedUrls(attachments.map((a) => a.path));
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [toRemove, setToRemove] = useState<TodoAttachment | null>(null);
  const [busy, setBusy] = useState(false);
  const replaceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!api) return;
    const up = () => setCurrent(api.selectedScrollSnap());
    up();
    api.on('select', up);
    return () => { api.off('select', up); };
  }, [api]);
  useEffect(() => {
    if (openAt === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') api?.scrollPrev(); if (e.key === 'ArrowRight') api?.scrollNext(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openAt, api]);

  if (!attachments.length) return null;
  const shown = attachments[current] ?? attachments[0];

  const remove = async (a: TodoAttachment) => {
    if (!user) return;
    setBusy(true);
    try {
      const ok = await moveToTrash(user.id, 'admin_task_attachment', taskId, `${a.name} (À FAIRE · ${taskTitle})`, { task_id: taskId, attachment: a } as unknown as Json);
      if (!ok) throw new Error("Mise en corbeille impossible : rien n'a été retiré");
      await onChange(attachments.filter((x) => x.path !== a.path));
      toast.success('Fichier retiré (il est dans la corbeille de Paramètres)');
      if (attachments.length <= 1) setOpenAt(null);
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  const replace = async (file: File) => {
    if (!user || !shown) return;
    setBusy(true);
    try {
      const fresh = await uploadTodoFile(taskId, file);
      const ok = await moveToTrash(user.id, 'admin_task_attachment', taskId, `${shown.name} (remplacé · ${taskTitle})`, { task_id: taskId, attachment: shown } as unknown as Json);
      if (!ok) throw new Error("Mise en corbeille de l'ancien fichier impossible : rien n'a été changé");
      await onChange(attachments.map((x) => (x.path === shown.path ? fresh : x)));
      toast.success('Fichier remplacé ✅ (l\'ancien est dans la corbeille)');
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="mt-1.5 flex flex-wrap gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
        {attachments.map((a, i) => {
          const k = kindOf(a);
          return (
            <button key={a.path} type="button" onClick={() => setOpenAt(i)} aria-label={`Ouvrir ${a.name}`}
              className={cn('h-12 w-12 rounded-lg overflow-hidden grid place-items-center text-xl border border-border', k !== 'image' && ICONS[k].tone)}>
              {k === 'image' && urls[a.path] ? <img src={urls[a.path]} alt="" className="h-full w-full object-cover" /> : ICONS[k].emoji}
            </button>
          );
        })}
      </div>

      <Dialog open={openAt !== null} onOpenChange={(o) => { if (!o) setOpenAt(null); }}>
        <DialogContent className="max-w-2xl" level="nested">
          <DialogTitle className="pe-8 text-base [overflow-wrap:anywhere]">{ICONS[kindOf(shown)].emoji} {shown?.name}</DialogTitle>
          {openAt !== null && (
            attachments.length > 1 ? (
              <Carousel setApi={setApi} opts={{ startIndex: openAt, loop: true }}>
                <CarouselContent>
                  {attachments.map((a) => <CarouselItem key={a.path}><Preview a={a} url={urls[a.path]} /></CarouselItem>)}
                </CarouselContent>
                <CarouselPrevious className="left-1" />
                <CarouselNext className="right-1" />
              </Carousel>
            ) : <Preview a={attachments[0]} url={urls[attachments[0].path]} />
          )}
          {attachments.length > 1 && <p className="text-center text-xs font-bold text-muted-foreground tabular-nums">{current + 1} / {attachments.length}</p>}
          <div className="flex flex-wrap justify-center gap-2">
            {urls[shown?.path] && <a href={urls[shown.path]} target="_blank" rel="noopener noreferrer" className="rounded-full bg-muted px-4 py-2 text-xs font-bold">⬇️ Ouvrir / télécharger</a>}
            <button type="button" disabled={busy} onClick={() => replaceRef.current?.click()} className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold disabled:opacity-50">🔁 Remplacer</button>
            <button type="button" disabled={busy} onClick={() => setToRemove(shown)} className="rounded-full bg-destructive text-destructive-foreground px-4 py-2 text-xs font-bold disabled:opacity-50">🗑️ Retirer</button>
            <input ref={replaceRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void replace(f); e.target.value = ''; }} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toRemove} onOpenChange={(o) => { if (!o) setToRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce fichier ?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">« {toRemove?.name} » ira dans la corbeille de Paramètres, d'où tu pourras le remettre.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (toRemove) void remove(toRemove); setToRemove(null); }}>Retirer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
