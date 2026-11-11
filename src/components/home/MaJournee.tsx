import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CLE_BILAN_ENVOYE, bilanAProposer, cleSemaine } from '@/lib/bilanSemaine';
import { BilanSemaineDialog } from './BilanSemaineDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAdminPendingCounts } from '@/hooks/useAdminPendingCounts';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { lundiCourant } from '@/lib/devoirFichiers';

/**
 * 📋 « Ma journée » (Nadia, 2026-11-11, idée 4 « gagner du temps ») : un seul résumé en haut de l'accueil de l'enseignante.
 * Une ligne par chose à faire (seulement s'il y en a) ; un appui y emmène. Mêmes chiffres que le bouclier (useAdminPendingCounts).
 */
export function MaJournee() {
  const navigate = useNavigate();
  const c = useAdminPendingCounts();
  const { unreadCount } = useUnreadMessages();
  const [bilanOuvert, setBilanOuvert] = useState(false);
  const [dejaFait, setDejaFait] = useState<string | null>(() => { try { return localStorage.getItem(CLE_BILAN_ENVOYE); } catch { return null; } });
  const [params, setParams] = useSearchParams();
  // Notification du mardi 16 h (/?bilanSemaine=1) : le bilan s'ouvre
  useEffect(() => {
    if (params.get('bilanSemaine') !== '1') return;
    setBilanOuvert(true);
    const p = new URLSearchParams(params); p.delete('bilanSemaine'); setParams(p, { replace: true });
  }, [params, setParams]);
  const fermerBilan = (v: boolean) => {
    setBilanOuvert(v);
    // « Pas cette semaine » ou envoyé : on ne le repropose plus avant mardi prochain
    if (!v && bilanAProposer(new Date(), dejaFait)) { try { localStorage.setItem(CLE_BILAN_ENVOYE, cleSemaine()); } catch { /* stockage indisponible */ } setDejaFait(cleSemaine()); }
  };
  const { data: extra } = useQuery({
    queryKey: ['ma-journee'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const jour = new Date().toLocaleDateString('en-CA');
      const [roles, profils, devoirs, absences] = await Promise.all([
        supabase.from('user_roles').select('user_id').eq('role', 'student'),
        supabase.from('profiles').select('user_id').eq('is_approved', true),
        supabase.from('devoirs').select('student_id').gte('created_at', lundiCourant(new Date()).toISOString()).not('student_id', 'is', null),
        supabase.from('absence_justifications').select('student_id', { count: 'exact', head: true }).eq('course_date', jour),
      ]);
      const approuves = new Set((profils.data || []).map((p) => p.user_id));
      const eleves = (roles.data || []).map((r) => r.user_id).filter((id) => approuves.has(id));
      const avec = new Set((devoirs.data || []).map((d) => d.student_id));
      return { sansDevoirs: eleves.filter((id) => !avec.has(id)).length, absences: absences.count || 0 };
    },
  });

  const audios = c.recitations + c.allahNames;
  const lignes: { n: number; texte: string; aller: () => void }[] = [
    { n: audios, texte: `🎙️ ${audios} audio${audios > 1 ? 's' : ''} à écouter et valider`, aller: () => navigate('/admin?section=recitations') },
    { n: c.sourates, texte: `📖 ${c.sourates} sourate${c.sourates > 1 ? 's' : ''} à valider`, aller: () => navigate('/admin?section=sourates-validations') },
    { n: c.nourania, texte: `✨ ${c.nourania} leçon${c.nourania > 1 ? 's' : ''} Nourania à valider`, aller: () => navigate('/admin?section=nourania-validations') },
    { n: c.alphabet, texte: `🔤 ${c.alphabet} lettre${c.alphabet > 1 ? 's' : ''} de l'Alphabet à valider`, aller: () => navigate('/alphabet') },
    { n: c.homework, texte: `📚 ${c.homework} devoir${c.homework > 1 ? 's' : ''} rendu${c.homework > 1 ? 's' : ''} à corriger`, aller: () => navigate('/?open=todo&cahier=1') },
    { n: extra?.sansDevoirs ?? 0, texte: `📭 ${extra?.sansDevoirs ?? 0} élève${(extra?.sansDevoirs ?? 0) > 1 ? 's' : ''} sans devoirs cette semaine`, aller: () => navigate('/?open=todo&cahier=1') },
    { n: unreadCount, texte: `✉️ ${unreadCount} message${unreadCount > 1 ? 's' : ''} pas encore lu${unreadCount > 1 ? 's' : ''}`, aller: () => navigate('/?open=messages') },
    { n: extra?.absences ?? 0, texte: `🙋 ${extra?.absences ?? 0} absence${(extra?.absences ?? 0) > 1 ? 's' : ''} signalée${(extra?.absences ?? 0) > 1 ? 's' : ''} aujourd'hui`, aller: () => document.getElementById('absences-signalees')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) },
    { n: bilanAProposer(new Date(), dejaFait) ? 1 : 0, texte: '📊 Le bilan de la semaine est prêt : le relire et décider de l\'envoyer', aller: () => setBilanOuvert(true) },
    { n: c.registrations, texte: `👤 ${c.registrations} inscription${c.registrations > 1 ? 's' : ''} à valider`, aller: () => navigate('/admin?section=registration-validations') },
  ].filter((l) => l.n > 0);

  return (
    <section aria-label="Ma journée" className="rounded-2xl border-2 border-teal-300 dark:border-teal-800 bg-teal-50/80 dark:bg-teal-950/20 p-3 shadow-sm">
      <p className="font-extrabold text-teal-900 dark:text-teal-100">📋 Ma journée</p>
      {lignes.length ? (
        <ul className="mt-1.5 space-y-1">
          {lignes.map((l) => (
            <li key={l.texte}>
              <button type="button" onClick={l.aller} className="w-full flex items-center gap-2 rounded-lg bg-card/80 hover:bg-card px-2.5 py-1.5 text-start text-sm font-semibold">
                <span className="flex-1 min-w-0 [overflow-wrap:anywhere]">{l.texte}</span><span aria-hidden className="text-teal-700 dark:text-teal-300">›</span>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="mt-1 text-sm text-teal-900 dark:text-teal-100">✨ Rien qui t'attend : tout est à jour, bravo !</p>}
      <button type="button" onClick={() => setBilanOuvert(true)} className="mt-2 text-xs font-bold text-teal-800 dark:text-teal-200 underline underline-offset-2">📊 Bilan de la semaine</button>
      {bilanOuvert && <BilanSemaineDialog open onOpenChange={fermerBilan} />}
    </section>
  );
}
