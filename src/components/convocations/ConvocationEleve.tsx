import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * 📨 Convocation sur l'accueil de l'élève (Nadia, 2026-11-11, idée 6) : la dernière convocation pour un cours à venir,
 * avec « ✅ Je viens » / « ❌ Absent ». « Absent » arrive tout seul dans « Absences signalées par les parents » (fonction repondre_convocation).
 * Rien du tout s'il n'y a pas de convocation (ne gêne jamais l'accueil).
 */
export function ConvocationEleve() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);
  const [envoi, setEnvoi] = useState(false);
  const { data: c } = useQuery({
    queryKey: ['convocations-eleve', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const depuis = new Date(Date.now() - 3 * 3600000).toISOString();
      const { data } = await supabase.from('convocations').select('id, texte, cours_le, reponse, canal')
        .eq('student_id', user!.id).in('canal', ['appli', 'rappel']).gte('cours_le', depuis).order('envoye_le', { ascending: false }).limit(1);
      return data?.[0] ?? null;
    },
  });
  // Ouvert depuis la notification (/?convocation=1) : on descend jusqu'à la carte
  useEffect(() => {
    if (params.get('convocation') !== '1' || !c) return;
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    const p = new URLSearchParams(params); p.delete('convocation'); setParams(p, { replace: true });
  }, [params, c, setParams]);
  if (!c) return null;

  const repondre = async (r: 'je_viens' | 'absent') => {
    setEnvoi(true);
    const { error } = await supabase.rpc('repondre_convocation', { p_id: c.id, p_reponse: r });
    setEnvoi(false);
    if (error) { toast.error(/fetch|network/i.test(error.message) ? '📡 Nécessite Internet : réessaie quand tu es connecté' : error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['convocations-eleve'] });
    toast.success(r === 'je_viens' ? '✅ Merci ! Ton professeur sait que tu viens.' : '❌ C\'est noté : ton absence est signalée à ton professeur.');
  };

  return (
    <div ref={ref} className="rounded-2xl border-2 border-[#d92d20]/40 bg-red-50 dark:bg-red-950/20 p-3 space-y-2">
      <p className="text-sm font-extrabold text-[#b42318] dark:text-red-200">📨 Convocation</p>
      <p className="text-sm whitespace-pre-line [overflow-wrap:anywhere]">{c.texte}</p>
      {c.reponse ? (
        <p className="text-sm font-bold">{c.reponse === 'je_viens' ? '✅ Tu as répondu : je viens' : '❌ Tu as répondu : absent'}
          <button type="button" className="ms-2 text-xs underline text-muted-foreground" onClick={() => void repondre(c.reponse === 'je_viens' ? 'absent' : 'je_viens')}>changer</button></p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={envoi} onClick={() => void repondre('je_viens')} className={cn('rounded-xl py-2 text-sm font-extrabold bg-emerald-600 text-white disabled:opacity-60')}>✅ Je viens</button>
          <button type="button" disabled={envoi} onClick={() => void repondre('absent')} className="rounded-xl py-2 text-sm font-extrabold bg-white dark:bg-card border-2 border-[#d92d20] text-[#d92d20]">❌ Absent</button>
        </div>
      )}
    </div>
  );
}
