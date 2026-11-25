import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ZonesContenu } from '@/components/shared/ZonesContenu';

/**
 * 🎥 « Ton enregistrement pendant le cours » (Nadia, 2026-11-25) — dans CHAQUE sourate, juste au-dessus de
 * « Envoyer ma récitation », surligné en violet. ÉLÈVE PAR ÉLÈVE (choix de Nadia) :
 *  - élève : voit seulement SES vidéos / documents pour cette sourate ;
 *  - enseignante : choisit l'élève, puis ajoute une vidéo et/ou un document (PDF, image, Word, Excel…).
 * Fichiers dans l'espace privé `devoirs-fichiers/<élève>/…` ; zones_contenu (cible 'cours-sourate:<n>', eleve_id).
 */
export function EnregistrementCours({ sourateNumber, sourateName }: { sourateNumber: number; sourateName: string }) {
  const { user, isAdmin } = useAuth();
  const [eleve, setEleve] = useState('');
  const cible = `cours-sourate:${sourateNumber}`;

  const { data: eleves = [] } = useQuery({
    queryKey: ['eleves-enregistrement-cours'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, full_name').order('full_name', { ascending: true });
      if (error) throw error;
      return (data || []).filter((p) => p.user_id !== user?.id);
    },
  });

  if (!user) return null;
  const nomEleve = eleves.find((e) => e.user_id === eleve)?.full_name;

  return (
    <section className="rounded-2xl border-2 border-violet-400 bg-violet-50 p-4 space-y-3 shadow-sm dark:border-violet-500 dark:bg-violet-950/40"
      aria-label="Ton enregistrement pendant le cours">
      <p className="text-sm font-extrabold text-violet-800 dark:text-violet-200 flex items-center gap-2">
        <span aria-hidden>🎥</span> Ton enregistrement pendant le cours
      </p>
      {isAdmin ? (
        <>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-violet-900 dark:text-violet-200">Pour quel élève ?</span>
            <select value={eleve} onChange={(e) => setEleve(e.target.value)}
              className="block w-full rounded-xl border border-violet-300 bg-white px-3 py-2 text-sm text-foreground dark:bg-background">
              <option value="">— Choisis un élève —</option>
              {eleves.map((e) => <option key={e.user_id} value={e.user_id}>{e.full_name || 'Sans nom'}</option>)}
            </select>
          </label>
          {eleve ? (
            <ZonesContenu key={eleve} cible={cible} eleveId={eleve} isAdmin libelle={`Enregistrement du cours, ${sourateName}${nomEleve ? `, ${nomEleve}` : ''}`} />
          ) : (
            <p className="text-xs text-violet-900/80 dark:text-violet-200/80">Choisis un élève pour ajouter sa vidéo ou un document. Lui seul le verra (et toi).</p>
          )}
        </>
      ) : (
        <ZonesContenu cible={cible} eleveId={user.id} isAdmin={false} libelle={`Enregistrement du cours, ${sourateName}`}
          vide="Ton professeur mettra ici ton enregistrement du cours." />
      )}
    </section>
  );
}
