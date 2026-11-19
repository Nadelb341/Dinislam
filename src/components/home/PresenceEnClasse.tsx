import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 📋 Présence en classe (Nadia, 2026-11-19) : copie compacte de la ligne de l'élève de « Vue de la classe » (page Présence),
 * toujours affichée sur l'accueil, juste au-dessus des cartes Prière / Hadith. Seulement les dates et les ronds :
 * pas de colonne « Élève » ni de prénom (c'est son propre compte). Jamais de défilement : on garde les séances les plus
 * récentes qui tiennent dans la largeur. Toucher la carte ouvre la page Présence.
 * Même cache que la page Présence (['my-attendance', id]) → déjà vu = lisible sans réseau, et mis à jour en direct.
 */
const COULEUR: Record<string, { c: string; l: string }> = {
  present: { c: 'bg-green-500', l: 'Présent' },
  absent: { c: 'bg-red-500', l: 'Absent' },
  late: { c: 'bg-yellow-400', l: 'En retard' },
  justified: { c: 'bg-blue-500', l: 'Absence justifiée' },
};
const COLONNE = 44; // largeur d'une date (px)

const jjmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

export default function PresenceEnClasse() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const boite = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(0);

  const { data: lignes = [] } = useQuery({
    queryKey: ['my-attendance', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('attendance_records').select('*').eq('user_id', user!.id).order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => setLargeur(Math.floor(e[0].contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!lignes.length) return null;
  // Une seule note par date (la plus récente si doublon), de la plus ancienne à la plus récente
  const parDate = new Map<string, string>();
  for (const r of lignes) if (!parDate.has(r.date)) parDate.set(r.date, r.status);
  const toutes = [...parDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  const place = largeur ? Math.max(1, Math.floor(largeur / COLONNE)) : toutes.length;
  const visibles = toutes.slice(-place);

  return (
    <button type="button" onClick={() => navigate('/attendance')}
      className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-left shadow-sm transition active:scale-[0.99]"
      aria-label="Présence en classe : ouvrir la page Présence">
      <p className="text-sm font-extrabold text-foreground">📋 Présence en classe</p>
      <div ref={boite} className="mt-1 overflow-hidden">
        <div className="flex">
          {visibles.map(([d, s]) => (
            <div key={d} className="flex shrink-0 flex-col items-center gap-1 border-l border-border first:border-l-0" style={{ width: COLONNE }}>
              <span className="text-[11px] tabular-nums text-muted-foreground">{jjmm(d)}</span>
              <span title={COULEUR[s]?.l ?? s} aria-label={`${jjmm(d)} : ${COULEUR[s]?.l ?? s}`}
                className={`h-6 w-6 rounded-full ${COULEUR[s]?.c ?? 'bg-muted'}`} />
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
