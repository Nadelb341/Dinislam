import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { supabase } from '@/integrations/supabase/client';
import { untypedDb } from '@/lib/untypedDb';
import { alphabetDeLecon, normaliserTitre } from '@/lib/alphabetNourania';

/**
 * 🔗 2026-11-26 (Nadia : liens entre cartes, L15) : boutons « Continue dans Nourania » (fiche d'une lettre,
 * leçon des Lettres particulières) et « Continue dans l'Alphabet » (leçon Nourania). Table de correspondance :
 * `src/lib/alphabetNourania.ts`. Hors ligne : dernières copies des listes (le lien marche si la liste a déjà été vue).
 */
function useLecons() {
  return useQuery({
    queryKey: ['nourania-lecons-numeros'],
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('nourania_lessons').select('id, lesson_number, title_french');
      if (error) throw error;
      return data ?? [];
    },
  });
}

const classeBouton = 'w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-3 text-sm sm:text-base font-extrabold shadow active:scale-[0.98] transition-transform [overflow-wrap:anywhere]';

export function BoutonVersNourania({ numero, onAvant }: { numero: number | null; onAvant?: () => void }) {
  const navigate = useNavigate();
  const { data: lecons = [] } = useLecons();
  const lecon = numero ? lecons.find((l) => l.lesson_number === numero) : null;
  if (!lecon) return null;
  return (
    <button type="button" className={classeBouton} onClick={() => { onAvant?.(); navigate(`/nourania?item=${lecon.id}`); }}>
      📗 Continue dans Nourania : {lecon.title_french}
    </button>
  );
}

export function BoutonVersAlphabet({ numero }: { numero: number }) {
  const navigate = useNavigate();
  const cible = alphabetDeLecon(numero);
  const titre = cible && 'particularite' in cible ? cible.particularite : null;
  const { data: particularites = [] } = useQuery({
    queryKey: ['alphabet-particularites-titres'],
    enabled: !!titre,
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('alphabet_particularites').select('id, titre');
      if (error) throw error;
      return (data ?? []) as { id: string; titre: string }[];
    },
  });
  if (!cible) return null;
  if ('lettres' in cible) {
    return <button type="button" className={classeBouton} onClick={() => navigate('/alphabet')}>🔤 Continue dans l'Alphabet : les lettres</button>;
  }
  const p = particularites.find((x) => normaliserTitre(x.titre) === titre);
  if (!p) return null;
  return (
    <button type="button" className={classeBouton} onClick={() => navigate(`/alphabet?item=p:${p.id}`)}>
      🔤 Continue dans l'Alphabet : {p.titre}
    </button>
  );
}
