import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReglagesDevoirsGroupe } from '@/hooks/useReglagesDevoirsGroupe';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SortableCardList } from '@/components/shared/SortableCardList';
import type { LigneDevoir } from '@/lib/devoirFichiers';
import { moveToTrash } from '@/lib/trash';
import { cn, errorMessage } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';

const EMOJIS = ['🖍️', '✂️', '📄', '🧩', '🎨', '📝', '🗣️', '🎵', '📚', '⭐'];

/**
 * ⚙️ Lignes et maximum d'un groupe (2026-11-04, réglages validés par Nadia) : quelles lignes apparaissent dans « ✍️ Par matière »,
 * lignes ajoutées par le professeur (nom + emoji, pour les devoirs hors des cartes), ordre (appui long + glisser),
 * et le nombre maximum de devoirs par semaine (= diamants). Groupe 0 : Petits = 1 par défaut.
 */
export function ReglagesDevoirsGroupe({ groupId, groupName, open, onClose }: { groupId: string; groupName: string; open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  const { data } = useReglagesDevoirsGroupe(groupId);
  const [max, setMax] = useState<number | null>(null);
  const [lignes, setLignes] = useState<LigneDevoir[]>([]);
  const [nom, setNom] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [busy, setBusy] = useState(false);
  const [aRetirer, setARetirer] = useState<LigneDevoir | null>(null);
  useEffect(() => { if (data && open) { setMax(data.max_devoirs); setLignes(data.lignes); } }, [data, open]);

  const enregistrer = async (m: number | null, l: LigneDevoir[], message = '⚙️ Réglages du groupe enregistrés') => {
    setBusy(true);
    const { error } = await supabase.from('group_devoir_settings').upsert({
      group_id: groupId, max_devoirs: m, lignes: l.map(({ key, type, emoji: e, label, actif, perso }) => ({ key, type, emoji: e, label, actif, perso: !!perso })) as unknown as Json,
      updated_at: new Date().toISOString(), updated_by: user?.id ?? null,
    });
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return false; }
    queryClient.invalidateQueries({ queryKey: ['group-devoir-settings'] });
    toast.success(message);
    return true;
  };
  const ajouterLigne = () => {
    const label = nom.trim();
    if (!label) return;
    const l = [...lignes, { key: `perso_${Date.now().toString(36)}`, type: 'autre', emoji, label, actif: true, perso: true }];
    setLignes(l); setNom('');
    void enregistrer(max, l, `➕ Ligne « ${emoji} ${label} » ajoutée`);
  };
  const retirerLigne = async (x: LigneDevoir) => {
    if (!user) return;
    const ok = await moveToTrash(user.id, 'devoir_ligne', groupId, `${x.emoji} ${x.label} (ligne de devoir · ${groupName})`, { group_id: groupId, ligne: x } as unknown as Json);
    if (!ok) { toast.error('Mise en corbeille impossible : rien n\'a été retiré'); return; }
    const l = lignes.filter((y) => y.key !== x.key);
    setLignes(l);
    void enregistrer(max, l, `Ligne retirée (dans la corbeille de Paramètres)`);
  };
  const modifie = !!data && (max !== data.max_devoirs || JSON.stringify(lignes) !== JSON.stringify(data.lignes));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden" level="nested">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[88dvh] overflow-y-auto p-6 space-y-3">
        <DialogTitle className="pe-8 text-base [overflow-wrap:anywhere]">⚙️ Devoirs du groupe « {groupName} »</DialogTitle>
        {!data ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-sky-300 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-800 p-2.5">
              <span className="min-w-0"><b className="block text-sm">💎 Devoirs maximum par semaine</b><span className="block text-[11px] text-muted-foreground">Un devoir = un diamant. Au-delà, je te demande avant de donner.</span></span>
              <span className="flex items-center overflow-hidden rounded-xl border bg-card">
                <button type="button" aria-label="Un de moins" onClick={() => setMax((m) => (m === null ? null : m <= 1 ? null : m - 1))} className="px-3 py-1.5 text-lg font-extrabold text-muted-foreground">−</button>
                <b className="min-w-[6.5rem] text-center text-sm tabular-nums">{max === null ? 'Sans limite' : `${max} devoir${max > 1 ? 's' : ''}`}</b>
                <button type="button" aria-label="Un de plus" onClick={() => setMax((m) => (m === null ? 1 : Math.min(30, m + 1)))} className="px-3 py-1.5 text-lg font-extrabold text-muted-foreground">+</button>
              </span>
            </div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Lignes du formulaire « ✍️ Par matière »</p>
            <p className="text-[11px] text-muted-foreground">Appui long puis glisser pour changer l'ordre.</p>
            <div className="space-y-1.5">
              <SortableCardList items={lignes.map((l) => ({ ...l, id: l.key }))} onReorder={(n) => setLignes(n.map(({ id: _id, ...l }) => l))}
                renderItem={(l, drag) => {
                  const { ref, style, isDragging, ...rest } = drag;
                  return (
                    <div ref={ref} style={style} {...rest} className={cn('flex items-center gap-2 rounded-xl border bg-card px-2.5 py-1.5', !l.actif && 'opacity-55', isDragging && 'shadow-lg')}>
                      <span className="text-xl">{l.emoji}</span>
                      <span className="min-w-0 flex-1 text-sm font-semibold [overflow-wrap:anywhere]">{l.label}{l.perso && <span className="ms-1.5 rounded-full bg-amber-100 dark:bg-amber-950/50 px-1.5 text-[10px] font-bold">à toi</span>}</span>
                      {l.perso && (
                        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => setARetirer(l)} aria-label={`Retirer la ligne ${l.label}`}
                          className="h-7 w-7 rounded-full bg-[#EF4444] text-white text-xs font-extrabold grid place-items-center">✕</button>
                      )}
                      <span onPointerDown={(e) => e.stopPropagation()}>
                        <Switch checked={l.actif} onCheckedChange={(v) => setLignes((ls) => ls.map((y) => (y.key === l.key ? { ...y, actif: v } : y)))} aria-label={`Afficher la ligne ${l.label}`} />
                      </span>
                    </div>
                  );
                }} />
            </div>
            <div className="rounded-xl border-2 border-dashed p-2 space-y-2">
              <p className="text-xs font-bold">➕ Ajouter une ligne (devoir pas prévu dans les cartes)</p>
              <div className="flex flex-wrap gap-1">
                {EMOJIS.map((e) => <button key={e} type="button" aria-pressed={emoji === e} onClick={() => setEmoji(e)} className={cn('h-8 w-8 rounded-lg text-lg', emoji === e ? 'bg-amber-200 dark:bg-amber-900' : 'bg-muted')}>{e}</button>)}
              </div>
              <div className="flex gap-2">
                <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex. Coloriage" maxLength={30}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterLigne(); } }} />
                <Button type="button" onClick={ajouterLigne} disabled={!nom.trim() || busy}>Ajouter</Button>
              </div>
            </div>
            <div className="sticky bottom-0 grid grid-cols-2 gap-2 bg-background pt-1">
              <Button disabled={!modifie || busy} onClick={() => void enregistrer(max, lignes).then((ok) => { if (ok) onClose(); })}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}💾 Enregistrer</Button>
              <Button variant="outline" onClick={() => { if (data) { setMax(data.max_devoirs); setLignes(data.lignes); } onClose(); }}>{modifie ? '↩️ Annuler' : 'Fermer'}</Button>
            </div>
          </div>
        )}
        <AlertDialog open={!!aRetirer} onOpenChange={(o) => { if (!o) setARetirer(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retirer la ligne « {aRetirer?.emoji} {aRetirer?.label} » ?</AlertDialogTitle>
              <AlertDialogDescription>Elle ira dans la corbeille de Paramètres. Les devoirs déjà donnés ne changent pas.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (aRetirer) void retirerLigne(aRetirer); }}>Retirer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
        <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />
      </DialogContent>
    </Dialog>
  );
}
