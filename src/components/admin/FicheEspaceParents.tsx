import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { trashThenDelete } from '@/lib/trash';
import { childAge } from '@/hooks/useParentLock';
import { espaceParentsActif, type ModeEspace } from '@/lib/espaceParents';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { errorMessage } from '@/lib/utils';

/**
 * 👨‍👩‍👧 Fiche élève › Espace parents (2026-10-28) : Espace parents (selon l'âge / toujours / jamais),
 * message « date de naissance » (Nadia peut le couper), codes parents (remise à zéro → corbeille),
 * parents et enfants reliés (retrait → corbeille).
 */
export function FicheEspaceParents({ userId }: { userId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [aRetirer, setARetirer] = useState<{ type: 'code' | 'lien'; id: string; label: string; data: Record<string, unknown> } | null>(null);
  const cle = ['admin-parents', userId];

  const { data } = useQuery({
    queryKey: cle,
    queryFn: async () => {
      const [{ data: profil }, { data: codes }, { data: parents }, { data: enfants }] = await Promise.all([
        supabase.from('profiles').select('date_of_birth, age, espace_parents, ask_birth_date, children_question').eq('user_id', userId).maybeSingle(),
        supabase.from('parent_codes').select('*').eq('child_id', userId).order('created_at'),
        supabase.from('parent_links').select('*').eq('child_id', userId),
        supabase.from('parent_links').select('*').eq('parent_id', userId),
      ]);
      const ids = [...(parents || []).map((l) => l.parent_id), ...(enfants || []).map((l) => l.child_id)];
      const { data: noms } = ids.length ? await supabase.from('profiles').select('user_id, full_name').in('user_id', ids) : { data: [] };
      const nom = (id: string) => noms?.find((n) => n.user_id === id)?.full_name || 'Élève';
      return { profil, codes: codes || [], parents: (parents || []).map((l) => ({ ...l, nom: nom(l.parent_id) })), enfants: (enfants || []).map((l) => ({ ...l, nom: nom(l.child_id) })) };
    },
  });
  const rafraichir = () => queryClient.invalidateQueries({ queryKey: cle });

  const majProfil = async (champs: { espace_parents?: ModeEspace; ask_birth_date?: boolean }) => {
    const { error } = await supabase.from('profiles').update(champs).eq('user_id', userId);
    if (error) toast.error('Réglage non enregistré'); else { toast.success('Réglage enregistré'); void rafraichir(); }
  };

  const retirer = async () => {
    if (!aRetirer || !user) return;
    try {
      if (aRetirer.type === 'code') {
        await trashThenDelete({ userId: user.id, type: 'parent_code', id: aRetirer.id, label: aRetirer.label, data: aRetirer.data,
          remove: () => supabase.from('parent_codes').delete().eq('id', aRetirer.id) });
      } else {
        const d = aRetirer.data as { parent_id: string; child_id: string };
        await trashThenDelete({ userId: user.id, type: 'parent_link', id: `${d.parent_id}|${d.child_id}`, label: aRetirer.label, data: d,
          remove: () => supabase.from('parent_links').delete().eq('parent_id', d.parent_id).eq('child_id', d.child_id) });
      }
      toast.success('Mis dans la corbeille (Paramètres)');
      void rafraichir();
    } catch (e) { toast.error(errorMessage(e)); }
    setARetirer(null);
  };

  if (!data) return null;
  const p = data.profil;
  const age = childAge(p);
  const mode = (p?.espace_parents ?? 'auto') as ModeEspace;
  const actif = espaceParentsActif(p);

  return (
    <div className="border-t pt-4 space-y-3">
      <h4 className="font-semibold">👨‍👩‍👧 Espace parents</h4>

      <div className="space-y-1.5">
        <p className="text-sm font-medium">Espace parents dans ses Paramètres (bilans, absences) : <b>{actif ? 'oui' : 'non'}</b></p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Espace parents">
          {([['auto', `Selon l'âge${age !== null ? ` (${age} ans)` : ' (âge inconnu)'}`], ['on', 'Toujours'], ['off', 'Jamais']] as [ModeEspace, string][]).map(([m, label]) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => void majProfil({ espace_parents: m })}
              className={`min-h-11 rounded-xl border-2 px-2 py-2 text-xs font-medium [overflow-wrap:anywhere] ${mode === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>{label}</button>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-2 rounded-xl border-2 border-border p-2.5 text-sm cursor-pointer">
        <input type="checkbox" className="mt-0.5 h-4 w-4" checked={!!p?.ask_birth_date} onChange={(e) => void majProfil({ ask_birth_date: e.target.checked })} />
        <span>🎂 Lui demander sa date de naissance à chaque connexion
          <span className="block text-xs text-muted-foreground">{p?.date_of_birth ? `Déjà enregistrée : ${new Date(`${p.date_of_birth}T12:00:00`).toLocaleDateString('fr-FR')}` : 'Pas encore enregistrée'}</span></span>
      </label>

      <div className="space-y-1.5 text-sm">
        <p className="font-medium">🔐 Codes parents</p>
        {data.codes.length ? data.codes.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
            <span className="flex-1">{c.label} · créé le {new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
            <button type="button" onClick={() => setARetirer({ type: 'code', id: c.id, label: `Code parents « ${c.label} »`, data: c })} className="text-xs font-bold text-destructive">Remettre à zéro</button>
          </div>
        )) : <p className="text-muted-foreground">Aucun code créé pour l'instant.</p>}
      </div>

      {(data.parents.length > 0 || data.enfants.length > 0 || p?.children_question) && (
        <div className="space-y-1.5 text-sm">
          {data.parents.map((l) => (
            <div key={l.parent_id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
              <span className="flex-1 [overflow-wrap:anywhere]">👤 Parent relié : <b>{l.nom}</b></span>
              <button type="button" onClick={() => setARetirer({ type: 'lien', id: l.parent_id, label: `Lien ${l.nom} → enfant`, data: { parent_id: l.parent_id, child_id: l.child_id } })} className="text-xs font-bold text-destructive">Retirer</button>
            </div>
          ))}
          {data.enfants.map((l) => (
            <div key={l.child_id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
              <span className="flex-1 [overflow-wrap:anywhere]">🧒 Enfant relié : <b>{l.nom}</b></span>
              <button type="button" onClick={() => setARetirer({ type: 'lien', id: l.child_id, label: `Lien parent → ${l.nom}`, data: { parent_id: l.parent_id, child_id: l.child_id } })} className="text-xs font-bold text-destructive">Retirer</button>
            </div>
          ))}
          {p?.children_question === 'non' && <p className="text-muted-foreground">A répondu « Non » à « Vos enfants suivent-ils aussi les cours ? »</p>}
        </div>
      )}

      <ConfirmDeleteDialog open={!!aRetirer} onOpenChange={(o) => { if (!o) setARetirer(null); }} onConfirm={() => void retirer()}
        description={aRetirer?.type === 'code' ? "Les parents devront créer un nouveau code. L'ancien va dans la corbeille (Paramètres)." : 'Le lien va dans la corbeille (Paramètres), d\'où tu pourras le restaurer.'} />
    </div>
  );
}
