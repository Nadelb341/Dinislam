import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushHelper';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { BoutonDictee } from '@/components/shared/BoutonDictee';
import type { AnnivJour } from './AnniversairesDuJour';

/** ✉️ Idée 5 (2026-11-15) : un mot de l'enseignante à l'élève qui a un an de plus (message déjà écrit, modifiable ; jamais « joyeux anniversaire ») */
export function MotAnniversaire({ eleve, onClose }: { eleve: AnnivJour; onClose: () => void }) {
  const [texte, setTexte] = useState(`🎊 ${eleve.prenom}, aujourd'hui tu as un an de plus ! بَارَكَ اللهُ فِيكَ : qu'Allah te bénisse, te garde sur le bon chemin et t'aide à apprendre toujours plus. Ton professeur`);
  const [envoi, setEnvoi] = useState(false);
  const envoyer = async () => {
    if (!texte.trim()) return;
    setEnvoi(true);
    try {
      const { error } = await supabase.from('user_messages').insert({ user_id: eleve.user_id, message: texte.trim(), sender_type: 'admin', message_type: 'text' });
      if (error) throw error;
      sendPushNotification({ userId: eleve.user_id, type: 'user', category: 'msg', title: '✉️ {prenom}, un mot de ton professeur', body: 'Ouvre tes messages ✉️', data: { url: '/?open=messages' } });
      toast.success(`✉️ Mot envoyé à ${eleve.prenom}`);
      onClose();
    } catch (e) {
      toast.error(/fetch|network/i.test((e as Error).message) ? '📡 Nécessite Internet' : (e as Error).message);
    } finally { setEnvoi(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogTitle>✉️ Un mot pour {eleve.prenom}</DialogTitle>
        <DialogDescription>Il arrive dans sa messagerie. Tu peux le modifier.</DialogDescription>
        <div className="relative">
          <Textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={5} aria-label="Ton mot" className="pe-10" />
          <div className="absolute end-1 bottom-1"><BoutonDictee onTexte={(t) => setTexte((x) => `${x} ${t}`.trim())} /></div>
        </div>
        <button type="button" disabled={envoi || !texte.trim()} onClick={() => void envoyer()} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-extrabold disabled:opacity-60">
          {envoi ? '⏳ …' : '✉️ Envoyer'}
        </button>
      </DialogContent>
    </Dialog>
  );
}
