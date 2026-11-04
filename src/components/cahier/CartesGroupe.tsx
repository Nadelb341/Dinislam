import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { rectSortingStrategy } from '@dnd-kit/sortable';
import { MoreVertical, Pencil, Type, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SortableCardList } from '@/components/shared/SortableCardList';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { moveToTrash } from '@/lib/trash';
import { errorMessage } from '@/lib/utils';
import {
  CARTE_DEFAUT, emojiDe, enregistrerCartesCahier, numeroDe, titreDe, useReglagesCartesCahier,
  type CleCarte, type ReglagesCartesCahier,
} from '@/lib/cartesCahier';

/**
 * 🗂️ Les cartes d'un groupe du Cahier de texte (2026-11-05, demande de Nadia) : ⋮ Modifier / Renommer / Supprimer,
 * appui long + glisser pour les ranger, numéros ①②③ remis à jour selon l'ordre. Réglages communs à tous les groupes.
 */
export function CartesGroupe({ contenu }: { contenu: Record<CleCarte, { phrase: ReactNode; boutons: ReactNode }> }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: r } = useReglagesCartesCahier();
  const [renommer, setRenommer] = useState<CleCarte | null>(null);
  const [modifier, setModifier] = useState<CleCarte | null>(null);
  const [supprimer, setSupprimer] = useState<CleCarte | null>(null);
  const [titre, setTitre] = useState('');
  const [emoji, setEmoji] = useState('');
  const [phrase, setPhrase] = useState('');
  if (!r) return null;

  const sauver = async (n: ReglagesCartesCahier, message?: string) => {
    queryClient.setQueryData(['app-appearance', 'cartes_cahier'], n);
    const { error } = await enregistrerCartesCahier(n, user?.id ?? null);
    if (error) { toast.error(errorMessage(error)); void queryClient.invalidateQueries({ queryKey: ['app-appearance', 'cartes_cahier'] }); return false; }
    if (message) toast.success(message);
    return true;
  };
  const changerCarte = (k: CleCarte, v: Partial<NonNullable<ReglagesCartesCahier['cartes'][CleCarte]>>) =>
    ({ ...r, cartes: { ...r.cartes, [k]: { ...r.cartes[k], ...v } } });

  const visibles = r.ordre.filter((k) => !r.supprimees.includes(k));
  const nomComplet = (k: CleCarte) => [numeroDe(r, k), emojiDe(r, k), titreDe(r, k)].filter(Boolean).join(' ');

  const validerRenommer = async () => {
    if (!renommer) return;
    if (await sauver(changerCarte(renommer, { titre: titre.trim() || undefined }), '✏️ Carte renommée (dans tous les groupes)')) setRenommer(null);
  };
  const validerModifier = async () => {
    if (!modifier) return;
    const e = emoji.trim();
    const n = changerCarte(modifier, { emoji: e === CARTE_DEFAUT[modifier].emoji ? undefined : e, phrase: phrase.trim() || undefined });
    if (await sauver(n, '✏️ Carte modifiée (dans tous les groupes)')) setModifier(null);
  };
  const validerSupprimer = async () => {
    if (!supprimer || !user) return;
    const k = supprimer;
    const ok = await moveToTrash(user.id, 'cahier_carte', k, `${nomComplet(k)} (carte du Cahier de texte)`, { cle: k });
    if (!ok) { toast.error('La carte n\'a pas pu aller dans la corbeille : rien n\'est supprimé'); return; }
    if (await sauver({ ...r, supprimees: [...r.supprimees, k] }, '🗑️ Carte dans la corbeille (Paramètres › Corbeille pour la remettre)')) setSupprimer(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <SortableCardList
          items={visibles.map((k) => ({ id: k }))}
          strategy={rectSortingStrategy}
          onDragStart={() => { try { navigator.vibrate?.(15); } catch { /* rien */ } }}
          onReorder={(n) => {
            const nouvel = n.map((x) => x.id as CleCarte);
            // Les cartes supprimées gardent leur place relative à la fin
            void sauver({ ...r, ordre: [...nouvel, ...r.ordre.filter((k) => !nouvel.includes(k))] });
          }}
          renderItem={({ id }, dragProps) => {
            const k = id as CleCarte;
            const { ref, style, isDragging, ...attrs } = dragProps;
            const phraseCustom = r.cartes[k]?.phrase;
            return (
              <div ref={ref} style={style} {...attrs}
                className={`rounded-2xl border bg-card p-2.5 flex flex-col gap-1.5 touch-manipulation ${isDragging ? 'opacity-40 ring-2 ring-sky-400' : ''}`}>
                <div className="flex items-start gap-1">
                  <p className="flex-1 min-w-0 text-sm font-extrabold [overflow-wrap:anywhere]">{nomComplet(k)}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label={`Options de la carte ${titreDe(r, k)}`} onPointerDown={(e) => e.stopPropagation()}
                        className="-mt-1 -me-1 h-7 w-7 shrink-0 grid place-items-center rounded-lg text-muted-foreground hover:bg-muted">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[600]">
                      <DropdownMenuItem onClick={() => { setEmoji(emojiDe(r, k)); setPhrase(r.cartes[k]?.phrase ?? ''); setModifier(k); }}>
                        <Pencil className="h-4 w-4 mr-2" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setTitre(titreDe(r, k)); setRenommer(k); }}>
                        <Type className="h-4 w-4 mr-2" /> Renommer
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setSupprimer(k)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-[11px] text-muted-foreground [overflow-wrap:anywhere]">{phraseCustom || contenu[k].phrase}</p>
                {contenu[k].boutons}
              </div>
            );
          }}
        />
      </div>
      {visibles.length === 0 && <p className="text-xs text-muted-foreground text-center">Toutes les cartes sont dans la corbeille (Paramètres › Corbeille).</p>}
      <p className="text-[10px] text-muted-foreground text-center">✋ Appui long sur une carte pour la déplacer · ⋮ pour la modifier</p>

      {/* ✏️ Renommer */}
      <Dialog open={!!renommer} onOpenChange={(o) => !o && setRenommer(null)}>
        <DialogContent level="nested" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>✏️ Renommer la carte</DialogTitle>
            <DialogDescription>Le nouveau nom s'affiche dans tous les groupes.</DialogDescription>
          </DialogHeader>
          <Input autoFocus value={titre} maxLength={40} onChange={(e) => setTitre(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void validerRenommer(); }} />
          <div className="flex flex-wrap justify-between gap-2">
            {renommer && <button type="button" onClick={() => setTitre(CARTE_DEFAUT[renommer].titre)} className="text-xs font-semibold text-muted-foreground underline">↩️ Nom d'origine</button>}
            <button type="button" onClick={() => void validerRenommer()} className="ms-auto rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Enregistrer</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✏️ Modifier : emoji + petite phrase */}
      <Dialog open={!!modifier} onOpenChange={(o) => !o && setModifier(null)}>
        <DialogContent level="nested" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>✏️ Modifier la carte</DialogTitle>
            <DialogDescription>Emoji et petite phrase sous le titre, pour tous les groupes. Sans emoji, la carte garde son numéro (①, ②…).</DialogDescription>
          </DialogHeader>
          <label className="text-xs font-semibold">Emoji (laisser vide = numéro)</label>
          <Input value={emoji} maxLength={8} onChange={(e) => setEmoji(e.target.value)} placeholder="ex. 🎙️"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('phrase-carte')?.focus(); } }} />
          <label className="text-xs font-semibold">Petite phrase (laisser vide = phrase d'origine)</label>
          <Textarea id="phrase-carte" value={phrase} rows={2} maxLength={120} onChange={(e) => setPhrase(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void validerModifier(); } }} />
          <div className="flex flex-wrap justify-between gap-2">
            {modifier && <button type="button" onClick={() => { setEmoji(CARTE_DEFAUT[modifier].emoji); setPhrase(''); }} className="text-xs font-semibold text-muted-foreground underline">↩️ Comme à l'origine</button>}
            <button type="button" onClick={() => void validerModifier()} className="ms-auto rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Enregistrer</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🗑️ Supprimer : confirmation, puis corbeille */}
      <AlertDialog open={!!supprimer} onOpenChange={(o) => !o && setSupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🗑️ Supprimer la carte « {supprimer ? titreDe(r, supprimer) : ''} » ?</AlertDialogTitle>
            <AlertDialogDescription>Elle disparaît de tous les groupes et part dans la corbeille (Paramètres › Corbeille) : tu pourras la remettre à tout moment.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void validerSupprimer(); }} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
