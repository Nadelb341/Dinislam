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

/**
 * 🔗 2026-11-26 (Nadia : liens entre cartes, L11/L20) : `eleveId` = la présence d'un AUTRE élève (son enfant dans
 * l'Espace parents, ou un élève dans sa fiche côté enseignante) ; `onOuvrir` remplace l'ouverture de la page Présence.
 */
export default function PresenceEnClasse({ eleveId, onOuvrir, vide }: { eleveId?: string; onOuvrir?: () => void; vide?: string } = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const boite = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(0);
  const qui = eleveId ?? user?.id;

  const { data: lignes = [], isFetched } = useQuery({
    queryKey: ['my-attendance', qui],
    enabled: !!qui,
    queryFn: async () => {
      const { data, error } = await supabase.from('attendance_records').select('*').eq('user_id', qui!).order('date', { ascending: false });
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

  if (!lignes.length) return vide && isFetched ? <p className="rounded-xl bg-muted p-3 text-sm">📋 {vide}</p> : null;
  // Une seule note par date (la plus récente si doublon), de la plus ancienne à la plus récente
  const parDate = new Map<string, string>();
  for (const r of lignes) if (!parDate.has(r.date)) parDate.set(r.date, r.status);
  const toutes = [...parDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  const place = largeur ? Math.max(1, Math.floor(largeur / COLONNE)) : toutes.length;
  const visibles = toutes.slice(-place);

  // Présence d'un autre élève sans action : simple affichage (la page Présence montre celle du compte connecté)
  const simple = !!eleveId && !onOuvrir;
  const Boite = simple ? 'div' : 'button';
  return (
    <Boite {...(simple ? {} : { type: 'button' as const, onClick: () => (onOuvrir ? onOuvrir() : navigate('/attendance')),
      'aria-label': onOuvrir ? 'Présence en classe : ouvrir' : 'Présence en classe : ouvrir la page Présence' })}
      className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-left shadow-sm transition active:scale-[0.99]">
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
    </Boite>
  );
}
