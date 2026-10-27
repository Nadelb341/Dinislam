import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { matiereOf } from '@/lib/devoirMatieres';
import { jourCourt, type Decision } from '@/lib/rotationDevoirs';
import { cn } from '@/lib/utils';
import type { LigneProf } from './RotationProf';

const cle = (l: LigneProf) => `${l.devoirId}|${l.eleveId}`;

/**
 * 📋 En distribuant les devoirs (2026-10-27, demande de Nadia) : liste des devoirs précédents PAS FAITS, élève par élève.
 * Case cochée = « 🔁 À rattraper » (reste en haut du cahier de l'élève jusqu'à ce qu'il soit fait) ;
 * décochée = « 📚 Historique » (rangé avec la mention « pas fait »). Chaque devoir n'est demandé qu'une fois.
 */
export function DecisionsDialog({ open, items, nom, onClose, onSave }: {
  open: boolean;
  items: LigneProf[];
  nom: (id: string) => string;
  onClose: () => void;
  onSave: (choix: { devoirId: string; studentId: string; decision: Decision }[]) => void;
}) {
  const [coches, setCoches] = useState<Record<string, boolean>>({});
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  useEffect(() => { if (open) { setCoches(Object.fromEntries(items.map((l) => [cle(l), true]))); setTimeout(handleScroll, 50); } }, [open, items, handleScroll]);

  const eleves = [...new Set(items.map((l) => l.eleveId))].sort((a, b) => nom(a).localeCompare(nom(b)));
  const nbRattraper = items.filter((l) => coches[cle(l)] !== false).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent level="nested" className="p-0 overflow-hidden max-w-lg">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[85vh] overflow-y-auto p-5 space-y-3">
          <DialogHeader>
            <DialogTitle>📋 Devoirs précédents pas faits</DialogTitle>
            <DialogDescription>
              Avant de donner les nouveaux devoirs : coche ceux à <b>rattraper</b> (ils restent en haut du cahier de l'élève jusqu'à ce qu'ils soient faits). Décoche ceux à ranger dans l'<b>historique</b>.
            </DialogDescription>
          </DialogHeader>
          {eleves.map((id) => {
            const siens = items.filter((l) => l.eleveId === id);
            return (
              <div key={id} className="rounded-xl border-2 border-border bg-muted/30 p-2.5 space-y-1.5">
                <p className="text-sm font-extrabold [overflow-wrap:anywhere]">👤 {nom(id)} · {siens.length} pas fait{siens.length > 1 ? 's' : ''}</p>
                {siens.sort((a, b) => a.heureRendu.getTime() - b.heureRendu.getTime()).map((l, i) => {
                  const coche = coches[cle(l)] !== false;
                  return (
                    <label key={cle(l)} className={cn('flex items-center gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer', coche ? 'bg-red-50 dark:bg-red-950/30' : 'bg-card')}>
                      <input type="checkbox" checked={coche} onChange={(e) => setCoches((c) => ({ ...c, [cle(l)]: e.target.checked }))} className="h-5 w-5 shrink-0 accent-red-600" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm [overflow-wrap:anywhere]">{i + 1}. {matiereOf(l.type).emoji} <span className="cahier-main text-base">{l.titre}</span></span>
                        <span className="block text-[11px] text-muted-foreground">Cours du {jourCourt(l.heureRendu)}{l.statut === 'a_refaire' ? ' · 🔄 à refaire' : ''}</span>
                      </span>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold', coche ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200' : 'bg-muted text-muted-foreground')}>
                        {coche ? '🔁 À rattraper' : '📚 Historique'}
                      </span>
                    </label>
                  );
                })}
              </div>
            );
          })}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border px-3 py-2.5 text-sm font-bold">Plus tard</button>
            <button type="button" onClick={() => onSave(items.map((l) => ({ devoirId: l.devoirId, studentId: l.eleveId, decision: coches[cle(l)] !== false ? 'rattraper' : 'historique' })))}
              className="rounded-xl bg-[#2457a5] text-white px-3 py-2.5 text-sm font-extrabold">
              ✅ Enregistrer ({nbRattraper} à rattraper)
            </button>
          </div>
        </div>
        <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />
      </DialogContent>
    </Dialog>
  );
}
