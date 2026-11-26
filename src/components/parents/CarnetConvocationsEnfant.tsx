import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCarnet } from '@/components/carnet/useCarnet';
import { trierCarnet } from '@/lib/carnet';
import { depuisJour } from '@/lib/depuisJour';

/**
 * 🔗 2026-11-26 (Nadia : liens entre cartes, L12) — Espace parents : au même endroit,
 * - 📒 les messages du carnet de liaison qui attendent la signature d'un parent (on signe dans le carnet de l'accueil) ;
 * - 📨 les convocations de l'enfant pour un cours à venir, avec « ✅ Il vient » / « ❌ Absent » (même fonction que l'accueil).
 * Lecture hors ligne : dernières copies ; répondre à une convocation demande Internet (message clair).
 */
export function CarnetConvocationsEnfant({ childId, prenom, onFermer }: { childId: string; prenom: string; onFermer: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [envoi, setEnvoi] = useState<string | null>(null);
  const { data: carnet } = useCarnet(user?.id ?? null, false);

  const { data: convocations = [] } = useQuery({
    queryKey: ['convocations-enfant', childId],
    queryFn: async () => {
      const { data, error } = await supabase.from('convocations').select('id, texte, cours_le, reponse, canal')
        .eq('student_id', childId).in('canal', ['appli', 'rappel']).gte('cours_le', depuisJour(0)).order('envoye_le', { ascending: false }).limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  const aSigner = carnet && user ? trierCarnet(carnet.messages).filter((m) => {
    if (!m.signature) return false;
    const miennes = carnet.lectures.filter((l) => l.message_id === m.id && l.user_id === user.id);
    return !(miennes.some((l) => l.role === 'parent') || (carnet.estParent && miennes.length > 0));
  }) : [];

  const repondre = async (id: string, r: 'je_viens' | 'absent') => {
    setEnvoi(id);
    const { error } = await supabase.rpc('repondre_convocation', { p_id: id, p_reponse: r });
    setEnvoi(null);
    if (error) { toast.error(/fetch|network/i.test(error.message) ? '📡 Nécessite Internet : réessaie quand tu es connecté' : error.message); return; }
    void queryClient.invalidateQueries({ queryKey: ['convocations-enfant'] });
    void queryClient.invalidateQueries({ queryKey: ['convocations-eleve'] });
    toast.success(r === 'je_viens' ? `✅ Le professeur sait que ${prenom} vient.` : `❌ C'est noté : l'absence de ${prenom} est signalée au professeur.`);
  };

  return (
    <div className="space-y-2">
      <div className="rounded-xl border-2 border-sky-300 bg-sky-50 dark:bg-sky-950/30 p-3 space-y-1.5">
        <p className="text-sm font-extrabold text-sky-900 dark:text-sky-100">📒 Carnet de liaison à signer</p>
        {!aSigner.length ? <p className="text-xs text-muted-foreground">✅ Aucun message à signer.</p> : (
          <>
            {aSigner.slice(0, 5).map((m) => (
              <p key={m.id} className="text-sm [overflow-wrap:anywhere]">✍️ {m.emoji} {m.titre}</p>
            ))}
            <button type="button" onClick={() => { onFermer(); navigate('/?carnet=1'); }}
              className="w-full rounded-lg bg-sky-600 text-white px-3 py-2 text-sm font-extrabold">✍️ Signer dans le carnet</button>
          </>
        )}
      </div>
      <div className="rounded-xl border-2 border-red-200 bg-red-50 dark:bg-red-950/20 p-3 space-y-2">
        <p className="text-sm font-extrabold text-[#b42318] dark:text-red-200">📨 Convocations de {prenom}</p>
        {!convocations.length ? <p className="text-xs text-muted-foreground">Aucune convocation pour un cours à venir.</p>
          : convocations.map((c) => (
            <div key={c.id} className="space-y-1.5 rounded-lg bg-card p-2">
              <p className="text-sm whitespace-pre-line [overflow-wrap:anywhere]">{c.texte}</p>
              {c.reponse ? (
                <p className="text-sm font-bold">{c.reponse === 'je_viens' ? `✅ Réponse : ${prenom} vient` : `❌ Réponse : ${prenom} sera absent(e)`}
                  <button type="button" className="ms-2 text-xs underline text-muted-foreground" disabled={envoi === c.id}
                    onClick={() => void repondre(c.id, c.reponse === 'je_viens' ? 'absent' : 'je_viens')}>changer</button></p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" disabled={envoi === c.id} onClick={() => void repondre(c.id, 'je_viens')} className="rounded-lg py-2 text-sm font-extrabold bg-emerald-600 text-white disabled:opacity-60">✅ Il / elle vient</button>
                  <button type="button" disabled={envoi === c.id} onClick={() => void repondre(c.id, 'absent')} className="rounded-lg py-2 text-sm font-extrabold bg-white dark:bg-card border-2 border-[#d92d20] text-[#d92d20]">❌ Absent(e)</button>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
