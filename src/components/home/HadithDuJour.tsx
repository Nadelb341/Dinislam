import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { untypedDb } from '@/lib/untypedDb';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { trashThenDelete } from '@/lib/trash';
import { choisirHadithDuJour, type HadithDuJour } from '@/lib/hadithsDuJour';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { SortableCardList, type DragItemProps } from '@/components/shared/SortableCardList';
import { errorMessage } from '@/lib/utils';

/**
 * 🕊️ Carte « Hadith du jour » de l'accueil (2026-11-21) : les hadiths sont lus dans la table `hadiths_du_jour`.
 * Même règle de choix qu'avant (jour de l'année). Liste vide ou illisible → ancienne liste du code (jamais de carte vide).
 * Enseignante : ✏️ ouvre « Hadiths du jour » (ajouter, modifier, supprimer → corbeille, ranger par appui long + glisser).
 */
const CLE = ['hadiths-du-jour'];
const MSG_ATTENTE = '📡 Gardé sur cet appareil, envoyé au retour du réseau';

async function lireHadiths(): Promise<HadithDuJour[]> {
  const { data, error } = await untypedDb.from('hadiths_du_jour')
    .select('id, texte_arabe, texte, source, theme, position').order('position').order('created_at');
  if (error) throw error;
  return (data || []) as HadithDuJour[];
}

export function HadithDuJourCarte({ isAdmin, userId }: { isAdmin: boolean; userId: string | null }) {
  const [gestion, setGestion] = useState(false);
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: CLE, queryFn: lireHadiths, retry: 1 });
  // data absent (chargement, erreur, hors ligne sans copie) → la liste de secours prend le relais
  const todayHadith = choisirHadithDuJour(data);

  return (
    <div className="carte-givre relative rounded-2xl overflow-hidden shadow-md animate-fade-in border-2 border-emerald-300 dark:border-emerald-700 flex flex-col">
      <div className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 dark:from-emerald-900/40 dark:via-teal-900/40 dark:to-cyan-900/40 px-3 py-2 relative">
        <div className="absolute inset-0 opacity-40 pointer-events-none select-none overflow-hidden">
          <span className="absolute top-0 right-2 text-2xl">🌿</span>
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">🕊️ Hadith du jour</h3>
            {todayHadith.theme && (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-200 dark:bg-emerald-800/50 px-2 py-0.5 rounded-full shrink-0">
                {todayHadith.theme}
              </span>
            )}
            {isAdmin && (
              <button type="button" onClick={() => setGestion(true)} aria-label="Modifier les hadiths du jour"
                className="h-7 w-7 shrink-0 grid place-items-center rounded-full bg-white/80 dark:bg-slate-800/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-white">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {todayHadith.arabic && (
            <p dir="rtl" className="font-arabic text-base text-emerald-800 dark:text-emerald-200 leading-snug pr-7 ml-auto">
              {todayHadith.arabic}
            </p>
          )}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 px-3 py-2 flex-1 flex items-center">
        <p className="text-sm font-medium text-foreground leading-snug [overflow-wrap:anywhere]">
          <span className="text-emerald-400 font-serif font-bold">« </span>
          {todayHadith.text}
          <span className="text-emerald-400 font-serif font-bold">{' »'}</span>
          {todayHadith.source && <span className="text-xs text-muted-foreground whitespace-nowrap"> — {todayHadith.source}</span>}
        </p>
      </div>
      {/* 🔗 2026-11-26 (Nadia : liens entre cartes, L14) : vers la carte Hadiths */}
      <div className="bg-white dark:bg-slate-800 px-3 pb-2 flex justify-end">
        <button type="button" onClick={() => navigate('/module/hadiths')}
          className="text-xs font-bold text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-700 px-3 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
          📚 Voir tous les hadiths ›
        </button>
      </div>
      {isAdmin && gestion && <GestionHadiths items={data ?? []} userId={userId} onClose={() => setGestion(false)} />}
    </div>
  );
}

/** ✏️ Fenêtre « Hadiths du jour » (enseignante) : liste, ajouter, modifier, supprimer (corbeille), ranger */
function GestionHadiths({ items, userId, onClose }: { items: HadithDuJour[]; userId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  const [edition, setEdition] = useState<HadithDuJour | 'nouveau' | null>(null);
  const [aSupprimer, setASupprimer] = useState<HadithDuJour | null>(null);
  const rafraichir = () => { void queryClient.invalidateQueries({ queryKey: CLE }); };

  const ranger = async (n: HadithDuJour[]) => {
    const avecPositions = n.map((h, i) => ({ ...h, position: (i + 1) * 10 }));
    queryClient.setQueryData(CLE, avecPositions);
    try {
      let attente = false;
      for (const h of avecPositions) {
        const avant = items.find((x) => x.id === h.id);
        if (avant && avant.position === h.position) continue; // seulement les lignes qui changent de place
        const r = await ecrireOuGarder({ table: 'hadiths_du_jour', op: 'update', id: h.id, values: { position: h.position } });
        if (r === 'en_attente') attente = true;
      }
      toast.success(attente ? '📡 Ordre gardé sur cet appareil, envoyé au retour du réseau' : '✋ Ordre enregistré');
    } catch (e) { toast.error(errorMessage(e)); rafraichir(); }
  };

  const mettreCorbeille = async (h: HadithDuJour) => {
    if (!userId) return;
    try {
      await trashThenDelete({ userId, type: 'hadith_du_jour', id: h.id,
        label: `${h.texte.slice(0, 60)}${h.texte.length > 60 ? '…' : ''} (Hadith du jour)`, data: h,
        remove: () => untypedDb.from('hadiths_du_jour').delete().eq('id', h.id) });
      toast.success('🗑️ Dans la corbeille (Paramètres › Corbeille pour le remettre)');
      rafraichir();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const ligne = (h: HadithDuJour, drag?: DragItemProps) => {
    const { ref, style, isDragging, ...attrs } = drag ?? ({} as Partial<DragItemProps>);
    return (
      <div key={h.id} ref={ref} style={style} {...attrs}
        className={`flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 touch-manipulation overflow-hidden ${isDragging ? 'opacity-40' : ''}`}>
        <div className="flex-1 min-w-0 space-y-0.5">
          {h.texte_arabe && <p dir="rtl" className="font-arabic text-base text-emerald-800 dark:text-emerald-200 [overflow-wrap:anywhere]">{h.texte_arabe}</p>}
          <p className="text-sm [overflow-wrap:anywhere]">{h.texte}</p>
          <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {h.source || 'Sans source'}{h.theme ? ` · ${h.theme}` : ''}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setEdition(h)} onPointerDown={(e) => e.stopPropagation()}
          aria-label="Modifier ce hadith"><Pencil className="h-3.5 w-3.5" /></Button>
        <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={() => setASupprimer(h)}
          onPointerDown={(e) => e.stopPropagation()} aria-label="Supprimer ce hadith">🗑️</Button>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[85vh] overflow-y-auto p-5 space-y-3">
          <DialogHeader>
            <DialogTitle>🕊️ Hadiths du jour</DialogTitle>
            <DialogDescription>
              Un hadith différent chaque jour, dans cet ordre. ✏️ pour modifier · 🗑️ pour supprimer (corbeille) · ✋ appui long puis glisser pour ranger.
            </DialogDescription>
          </DialogHeader>
          <Button type="button" className="w-full" onClick={() => setEdition('nouveau')}>➕ Ajouter un hadith</Button>
          {items.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">
              Aucun hadith en base pour l'instant : l'accueil affiche la liste d'origine. Ajoute le premier avec ➕.
            </p>
          )}
          <div className="space-y-2">
            <SortableCardList items={items} onReorder={(n) => void ranger(n)}
              onDragStart={() => { try { navigator.vibrate?.(15); } catch { /* rien */ } }}
              renderItem={(h, drag) => ligne(h, drag)} />
          </div>
        </div>
        <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />
        {edition && (
          <EditionHadith h={edition === 'nouveau' ? null : edition} items={items} onClose={() => setEdition(null)} rafraichir={rafraichir} />
        )}
        <ConfirmDeleteDialog open={!!aSupprimer} onOpenChange={(o) => { if (!o) setASupprimer(null); }}
          onConfirm={() => { const h = aSupprimer; setASupprimer(null); if (h) void mettreCorbeille(h); }}
          title="Supprimer ce hadith ?"
          description={`« ${aSupprimer?.texte ?? ''} » ira dans la corbeille de Paramètres, tu pourras le restaurer.`} />
      </DialogContent>
    </Dialog>
  );
}

/** ➕ / ✏️ Un hadith : arabe, texte, source, thème. Entrée = champ suivant, puis enregistrer. */
function EditionHadith({ h, items, onClose, rafraichir }: {
  h: HadithDuJour | null; items: HadithDuJour[]; onClose: () => void; rafraichir: () => void;
}) {
  const [arabe, setArabe] = useState(h?.texte_arabe ?? '');
  const [texte, setTexte] = useState(h?.texte ?? '');
  const [source, setSource] = useState(h?.source ?? '');
  const [theme, setTheme] = useState(h?.theme ?? '');
  const [saving, setSaving] = useState(false);
  const suivant = (id: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById(id)?.focus(); }
  };

  const enregistrer = async () => {
    if (saving) return;
    if (!texte.trim()) { toast.error('Écris le texte du hadith'); return; }
    setSaving(true);
    try {
      const valeurs = { texte_arabe: arabe.trim() || null, texte: texte.trim(), source: source.trim() || null, theme: theme.trim() || null };
      const r = h
        ? await ecrireOuGarder({ table: 'hadiths_du_jour', op: 'update', id: h.id, values: valeurs })
        : await ecrireOuGarder({ table: 'hadiths_du_jour', op: 'insert',
            rows: [{ id: crypto.randomUUID(), ...valeurs, position: Math.max(0, ...items.map((x) => x.position)) + 10 }] });
      toast.success(r === 'en_attente' ? MSG_ATTENTE : h ? 'Hadith modifié ✅' : 'Hadith ajouté ✅');
      rafraichir(); onClose();
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm" level="nested">
        <DialogHeader>
          <DialogTitle>{h ? '✏️ Modifier le hadith' : '➕ Nouveau hadith'}</DialogTitle>
          <DialogDescription>Seul le texte en français est obligatoire.</DialogDescription>
        </DialogHeader>
        <label className="text-xs font-semibold" htmlFor="hadith-arabe">Texte en arabe (facultatif)</label>
        <Input id="hadith-arabe" dir="rtl" className="font-arabic text-lg" value={arabe} onChange={(e) => setArabe(e.target.value)}
          onKeyDown={suivant('hadith-texte')} />
        <label className="text-xs font-semibold" htmlFor="hadith-texte">Texte du hadith</label>
        <TextareaDictee id="hadith-texte" rows={4} value={texte} onChange={(e) => setTexte(e.target.value)}
          placeholder="Ex. : Les actions ne valent que par leurs intentions."
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('hadith-source')?.focus(); } }} />
        <label className="text-xs font-semibold" htmlFor="hadith-source">Source (facultatif)</label>
        <Input id="hadith-source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ex. : Sahih Boukhari"
          onKeyDown={suivant('hadith-theme')} />
        <label className="text-xs font-semibold" htmlFor="hadith-theme">Thème (facultatif, petite étiquette sur la carte)</label>
        <Input id="hadith-theme" value={theme} maxLength={40} onChange={(e) => setTheme(e.target.value)} placeholder="Ex. : Intention"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void enregistrer(); } }} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="button" disabled={saving} onClick={() => void enregistrer()}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
