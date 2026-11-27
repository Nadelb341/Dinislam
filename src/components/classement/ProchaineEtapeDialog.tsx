import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { lienEtape, NOM_CARTE_ETAPE, useProchainesEtapes } from '@/hooks/useProchainesEtapes';

/**
 * 🔗 2026-11-26 (Nadia : liens entre cartes, L18) — Classement, l'élève touche SA ligne :
 * « Pour gagner des points : ta prochaine étape », une ligne par carte (mêmes règles que le pré-remplissage des devoirs,
 * seulement les cartes qu'il voit) ; toucher une ligne ouvre la carte sur cet élément.
 * Hors ligne : dernière copie si déjà chargée.
 */
export function ProchaineEtapeDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const navigate = useNavigate();
  const etapes = useProchainesEtapes(userId);
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>⭐ Pour gagner des points : ta prochaine étape</DialogTitle>
          <DialogDescription>Touche une étape pour l'ouvrir. Chaque validation te donne des points !</DialogDescription>
        </DialogHeader>
        {!etapes.length ? (
          <p className="rounded-xl bg-muted p-3 text-sm">🎉 Rien à proposer pour l'instant : demande à ton professeur ce que tu peux faire.</p>
        ) : (
          <div className="space-y-2">
            {etapes.map((s, i) => {
              const lien = lienEtape(s);
              return (
                <button key={`${s.type}-${s.cible.v}`} type="button" disabled={!lien}
                  onClick={() => { if (!lien) return; onClose(); navigate(lien); }}
                  className={`w-full flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left active:scale-[0.99] transition-transform ${i === 0 ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30' : 'border-border bg-card'}`}>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] font-bold text-muted-foreground">{NOM_CARTE_ETAPE[s.type] ?? s.type}</span>
                    <span className="block text-sm font-semibold [overflow-wrap:anywhere]">{s.texte.charAt(0).toUpperCase() + s.texte.slice(1)}</span>
                  </span>
                  <span className="shrink-0 text-muted-foreground">›</span>
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
