import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { untypedDb } from '@/lib/untypedDb';
import { Button } from '@/components/ui/button';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { collectChildren, trashThenDelete } from '@/lib/trash';
import { errorMessage } from '@/lib/utils';

/**
 * 💬 Espace commentaires / questions d'une particularité (Nadia, 2026-11-21) : chaque élève pose une question ou commente,
 * l'enseignante (et les autres élèves) répondent dessous. Toute la classe lit. Chacun modifie ou retire SES messages
 * (l'enseignante : tous). Retirer → corbeille, avec les réponses. Hors ligne : gardé, envoyé au retour du réseau.
 * Table `alphabet_commentaires` (le prénom est rempli par la base).
 */
interface Commentaire { id: string; parent_id: string | null; user_id: string; auteur: string | null; est_admin: boolean; texte: string; created_at: string; updated_at: string }

const quand = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function CommentairesParticularite({ particuliereId, titre, isAdmin, userId }: { particuliereId: string; titre: string; isAdmin: boolean; userId: string | null }) {
  const queryClient = useQueryClient();
  const cle = ['alphabet-commentaires', particuliereId];
  const [texte, setTexte] = useState('');
  const [reponseA, setReponseA] = useState<Commentaire | null>(null);
  const [modif, setModif] = useState<Commentaire | null>(null);
  const [aRetirer, setARetirer] = useState<Commentaire | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const { data: tous = [] } = useQuery({
    queryKey: cle,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('alphabet_commentaires').select('id, parent_id, user_id, auteur, est_admin, texte, created_at, updated_at')
        .eq('particularite_id', particuliereId).order('created_at');
      if (error) throw error;
      return (data || []) as Commentaire[];
    },
  });
  const rafraichir = () => void queryClient.invalidateQueries({ queryKey: cle });
  const premiers = tous.filter((c) => !c.parent_id);
  const reponsesDe = (id: string) => tous.filter((c) => c.parent_id === id);
  const peutGerer = (c: Commentaire) => isAdmin || c.user_id === userId;

  const envoyer = async () => {
    const t = texte.trim();
    if (!t || envoi) return;
    setEnvoi(true);
    try {
      const r = modif
        ? await ecrireOuGarder({ table: 'alphabet_commentaires', op: 'update', id: modif.id, values: { texte: t } })
        : await ecrireOuGarder({ table: 'alphabet_commentaires', op: 'insert', rows: [{ particularite_id: particuliereId, parent_id: reponseA?.id ?? null, texte: t }] });
      toast.success(r === 'en_attente' ? '📡 Gardé sur cet appareil, envoyé au retour du réseau' : modif ? 'Modifié ✅' : 'Envoyé ✅');
      setTexte(''); setReponseA(null); setModif(null);
      rafraichir();
    } catch (e) { toast.error(errorMessage(e)); } finally { setEnvoi(false); }
  };

  const retirer = async (c: Commentaire) => {
    if (!userId) return;
    try {
      const reponses = c.parent_id ? null : await collectChildren('alphabet_commentaires', 'parent_id', [c.id]);
      await trashThenDelete({ userId, type: 'alphabet_commentaire', id: c.id, label: `Message « ${c.texte.slice(0, 40)} » (${titre})`,
        data: { ...c, particularite_id: particuliereId }, children: reponses ? [reponses] : undefined,
        remove: () => untypedDb.from('alphabet_commentaires').delete().eq('id', c.id) });
      toast.success('🗑️ Dans la corbeille (Paramètres)');
      rafraichir();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const Bulle = ({ c, reponse }: { c: Commentaire; reponse?: boolean }) => (
    <div className={`rounded-2xl p-3 space-y-1 ${c.est_admin ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800' : 'bg-card border border-border'} ${reponse ? 'ms-6' : ''}`}>
      <p className="text-xs font-bold">{c.est_admin ? '👩‍🏫' : '🙂'} {c.auteur || 'Élève'} <span className="font-normal text-muted-foreground">· {quand(c.created_at)}{c.updated_at !== c.created_at ? ' · modifié' : ''}</span></p>
      <p dir="auto" className="whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">{c.texte}</p>
      <div className="flex flex-wrap gap-1 justify-end">
        {!reponse && <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setReponseA(c); setModif(null); setTexte(''); }}>💬 Répondre</Button>}
        {peutGerer(c) && <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setModif(c); setReponseA(null); setTexte(c.texte); }}>✏️</Button>}
        {peutGerer(c) && <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" onClick={() => setARetirer(c)} aria-label="Retirer">🗑️</Button>}
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border-2 border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/20 p-3 space-y-2">
      <p className="font-extrabold">💬 Espace commentaires / questions <span className="text-xs font-semibold text-muted-foreground">({tous.length})</span></p>
      {!premiers.length && <p className="text-sm text-muted-foreground">Pas encore de message. Une question sur cette leçon ? Écris-la ici 👇</p>}
      {premiers.map((c) => (
        <div key={c.id} className="space-y-1.5">
          <Bulle c={c} />
          {reponsesDe(c.id).map((r) => <Bulle key={r.id} c={r} reponse />)}
        </div>
      ))}
      <div className="space-y-1.5 pt-1">
        {(reponseA || modif) && (
          <p className="text-xs font-semibold flex items-center gap-2">
            <span className="flex-1 [overflow-wrap:anywhere]">{modif ? '✏️ Modifier ton message' : `💬 Réponse à ${reponseA?.auteur || 'Élève'}`}</span>
            <button type="button" className="text-muted-foreground" onClick={() => { setReponseA(null); setModif(null); setTexte(''); }}>Annuler</button>
          </p>
        )}
        <TextareaDictee value={texte} onChange={(e) => setTexte(e.target.value)} rows={2} maxLength={2000} placeholder="Ta question ou ton commentaire…"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void envoyer(); } }} />
        <Button className="w-full" disabled={!texte.trim() || envoi} onClick={() => void envoyer()}>{envoi ? 'Envoi…' : modif ? '💾 Enregistrer' : '📨 Envoyer'}</Button>
      </div>
      <ConfirmDeleteDialog open={!!aRetirer} onOpenChange={(o) => !o && setARetirer(null)}
        onConfirm={() => { const c = aRetirer; setARetirer(null); if (c) void retirer(c); }}
        title="Retirer ce message ?" description={`Il ira dans la corbeille de Paramètres${aRetirer && !aRetirer.parent_id && reponsesDe(aRetirer.id).length ? ', avec ses réponses' : ''} ; tu pourras le restaurer.`} />
    </div>
  );
}
