import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { errorMessage } from '@/lib/utils';
import { useComptesParGroupe } from '@/lib/comptesParGroupe';
import type { Tables } from '@/integrations/supabase/types';
import { CLE_OUVERTURES as CLE, useOuverturesPetits, type OuverturePetit } from '@/lib/ouverturesPetits';

/**
 * 🔓 Lettres des tout-petits ouvertes À LA MAIN (Nadia, 22/11) : au départ seulement ب (pour tous) ; ا revient plus tard dans l'année.
 * L'enseignante ouvre chaque lettre à tous les tout-petits, à un groupe, ou à certains enfants. Table `alphabet_petits_ouvertes`
 * (group_id et user_id vides = tous). Indépendant de l'onglet « Alphabet arabe » (qui garde son ordre et ses validations).
 */
export function OuvertureLettrePetits({ lettre, onClose }: { lettre: Tables<'alphabet_letters'>; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: ouv = [] } = useOuverturesPetits();
  const { data } = useComptesParGroupe(true);
  const [deplie, setDeplie] = useState<string | null>(null);
  const miennes = ouv.filter((o) => o.letter_id === lettre.id);
  const trouve = (g: string | null, u: string | null) => miennes.find((o) => o.group_id === g && o.user_id === u);

  const basculer = async (g: string | null, u: string | null) => {
    const deja = trouve(g, u);
    try {
      if (deja) {
        queryClient.setQueryData<OuverturePetit[]>(CLE, (old) => (old || []).filter((o) => o.id !== deja.id));
        const r = await ecrireOuGarder({ table: 'alphabet_petits_ouvertes', op: 'delete', id: deja.id });
        toast.success(r === 'en_attente' ? '📡 Gardé, envoyé au retour du réseau' : `🔒 ${lettre.letter_arabic} fermée`);
      } else {
        const row = { id: crypto.randomUUID(), letter_id: lettre.id, group_id: g, user_id: u };
        queryClient.setQueryData<OuverturePetit[]>(CLE, (old) => [...(old || []), row]);
        const r = await ecrireOuGarder({ table: 'alphabet_petits_ouvertes', op: 'insert', rows: [row] });
        toast.success(r === 'en_attente' ? '📡 Gardé, envoyé au retour du réseau' : `🔓 ${lettre.letter_arabic} ouverte`);
      }
    } catch (e) { toast.error(errorMessage(e)); void queryClient.invalidateQueries({ queryKey: CLE }); }
  };

  const Interrupteur = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
    <button type="button" onClick={onClick} aria-pressed={on} aria-label={label}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold ${on ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
      {on ? '🔓 Ouverte' : '🔒 Fermée'}
    </button>
  );

  const tous = !!trouve(null, null);
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><span className="font-arabic text-4xl">{lettre.letter_arabic}</span> Ouvrir aux tout-petits</DialogTitle>
          <DialogDescription>Un toucher ouvre ou ferme la lettre. Les enfants la voient tout de suite.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-3">
          <span className="flex-1 font-bold">🌍 Tous les tout-petits</span>
          <Interrupteur on={tous} onClick={() => void basculer(null, null)} label="Tous les tout-petits" />
        </div>
        {!tous && (data?.groupes ?? []).map((g) => {
          const membres = (data?.membres ?? []).filter((m) => m.group_id === g.id).map((m) => data?.comptes.find((c) => c.user_id === m.user_id)).filter(Boolean);
          const nbEleves = membres.filter((c) => trouve(null, c!.user_id)).length;
          return (
            <div key={g.id} className="rounded-xl border border-border p-2 space-y-1">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setDeplie(deplie === g.id ? null : g.id)} className="flex-1 min-w-0 text-start font-semibold [overflow-wrap:anywhere]">
                  {deplie === g.id ? '▾' : '▸'} {g.name}{nbEleves ? <span className="text-xs text-emerald-700"> · {nbEleves} enfant{nbEleves > 1 ? 's' : ''}</span> : null}
                </button>
                <Interrupteur on={!!trouve(g.id, null)} onClick={() => void basculer(g.id, null)} label={`Groupe ${g.name}`} />
              </div>
              {deplie === g.id && membres.map((c) => (
                <div key={c!.user_id} className="flex items-center gap-2 ps-5">
                  <span className="flex-1 min-w-0 text-sm [overflow-wrap:anywhere]">{c!.full_name || 'Élève'}</span>
                  <Interrupteur on={!!trouve(null, c!.user_id) || !!trouve(g.id, null)} onClick={() => { if (trouve(g.id, null)) { toast('Déjà ouverte à tout le groupe'); return; } void basculer(null, c!.user_id); }} label={c!.full_name || 'Élève'} />
                </div>
              ))}
            </div>
          );
        })}
      </DialogContent>
    </Dialog>
  );
}
