import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sendPushNotification } from '@/lib/pushHelper';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { matiereOf } from '@/lib/devoirMatieres';
import { errorMessage } from '@/lib/utils';
import { dateCourte, prenomOf, type CahierDevoir, type CahierEleve, type CahierRendu } from './useCahierClasse';

/**
 * Petite fenêtre partagée du Tableau de la classe et du Récapitulatif (2026-10-26) :
 * le devoir d'un élève, son audio, et « ✅ Valider le devoir » / « 🔄 À refaire » ;
 * s'il n'a rien envoyé (ou doit refaire) : « 💌 Encourager ».
 */
export default function ValiderRenduDialog({ open, onClose, eleve, devoir, rendu, onEncourage }: {
  open: boolean;
  onClose: () => void;
  eleve: CahierEleve | null;
  devoir: CahierDevoir | null;
  rendu: CahierRendu | null;
  onEncourage?: () => void;
}) {
  const queryClient = useQueryClient();
  const { askValidation, validationDialog } = useConfirmValidation();
  const [refaire, setRefaire] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [busy, setBusy] = useState(false);

  const prenom = prenomOf(eleve?.full_name);
  const titre = devoir?.titre || 'Devoir';
  const matiere = devoir ? matiereOf(devoir.type) : null;

  const fermer = () => { setRefaire(false); setCommentaire(''); onClose(); };
  const rafraichir = () => {
    void queryClient.invalidateQueries({ queryKey: ['cahier-classe'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-devoirs-rendus'] });
  };

  const valider = async () => {
    if (!rendu || !eleve) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('devoirs_rendus').update({ statut: 'corrige' }).eq('id', rendu.id);
      if (error) throw error;
      sendPushNotification({
        title: '✅ {prenom}, ton devoir est validé !', category: 'hw_res', userId: eleve.user_id,
        body: `« ${titre} » : ton diamant brille ✨`, data: { url: '/?open=devoirs' },
      });
      toast.success(`✅ Devoir de ${prenom} validé, ${prenom} est prévenu${eleve.gender === 'fille' ? 'e' : ''} !`);
      rafraichir();
      fermer();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  const envoyerARefaire = async () => {
    if (!rendu || !eleve) return;
    setBusy(true);
    try {
      const texte = commentaire.trim();
      const { error } = await supabase.from('devoirs_rendus')
        .update({ statut: 'a_refaire', commentaire_admin: texte || null }).eq('id', rendu.id);
      if (error) throw error;
      sendPushNotification({
        title: '🔄 {prenom}, devoir à refaire', category: 'hw_res', userId: eleve.user_id,
        body: `« ${titre} » est à refaire${texte ? ` : ${texte}` : ''}`, data: { url: '/?open=devoirs' },
      });
      toast.success(`🔄 ${prenom} est prévenu${eleve.gender === 'fille' ? 'e' : ''} : devoir à refaire`);
      rafraichir();
      fermer();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  const statut = rendu?.statut ?? null;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) fermer(); }}>
        <DialogContent level="nested" className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogTitle className="pe-8 [overflow-wrap:anywhere]">👤 {eleve?.full_name || 'Élève'}</DialogTitle>
          <DialogDescription asChild>
            <div className="rounded-xl border-2 border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40 p-3 text-sky-950 dark:text-sky-100">
              <p className="font-bold [overflow-wrap:anywhere]">{matiere?.emoji} {titre}</p>
              {devoir?.date_limite && <p className="text-xs mt-0.5">📅 À rendre {dateCourte(devoir.date_limite)}</p>}
            </div>
          </DialogDescription>

          {statut === 'corrige' && (
            <p className="rounded-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 p-3 text-sm font-semibold">✅ Devoir déjà validé, bravo {prenom} !</p>
          )}
          {statut === 'rendu' && (
            <p className="rounded-xl bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200 p-3 text-sm font-semibold">
              🟠 Envoyé{rendu?.rendu_at ? ` le ${dateCourte(rendu.rendu_at)}` : ''} : à valider
              {!rendu?.audio_url && <span className="block text-xs font-normal mt-0.5">(sans audio : aucun audio n'était demandé)</span>}
            </p>
          )}
          {statut === 'a_refaire' && (
            <div className="rounded-xl bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200 p-3 text-sm">
              <p className="font-semibold">🔄 Devoir à refaire, en attente du nouvel envoi</p>
              {rendu?.commentaire_admin && <p className="mt-1 text-xs [overflow-wrap:anywhere]">💬 {rendu.commentaire_admin}</p>}
            </div>
          )}
          {!rendu && (
            <p className="rounded-xl bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200 p-3 text-sm font-semibold">⏳ {prenom} n'a encore rien envoyé pour ce devoir.</p>
          )}

          {rendu?.audio_url && (
            <audio src={rendu.audio_url} controls preload="metadata" className="w-full h-10 rounded-xl" />
          )}

          {statut === 'rendu' && !refaire && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                disabled={busy}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => askValidation('Valider ce devoir ?', `« ${titre} » de ${prenom} : son diamant va briller ✨`, () => void valider())}
              >✅ Valider le devoir</Button>
              <Button disabled={busy} variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40" onClick={() => setRefaire(true)}>
                🔄 À refaire
              </Button>
            </div>
          )}

          {statut === 'rendu' && refaire && (
            <div className="space-y-2">
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={3}
                placeholder={`Un petit mot pour ${prenom} (facultatif)`}
                aria-label="Commentaire pour l'élève"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" disabled={busy} onClick={() => { setRefaire(false); setCommentaire(''); }}>Annuler</Button>
                <Button disabled={busy} className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => void envoyerARefaire()}>🔄 Envoyer</Button>
              </div>
            </div>
          )}

          {(!rendu || statut === 'a_refaire') && onEncourage && (
            <Button className="bg-pink-600 hover:bg-pink-700 text-white" onClick={() => { const go = onEncourage; fermer(); go(); }}>
              💌 Encourager {prenom}
            </Button>
          )}
        </DialogContent>
      </Dialog>
      {validationDialog}
    </>
  );
}
