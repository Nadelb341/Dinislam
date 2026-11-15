import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SortableCardList, rectSortingStrategy } from '@/components/shared/SortableCardList';
import { MODULE_EMOJI_FALLBACK } from '@/lib/emojiCartes';

/**
 * ✅ Bouclier › Corrections (Nadia, 2026-11-15) : UNE tuile par carte de l'accueil (+ Devoirs), en grille de 3 comme
 * « Élèves / Registre / Inscriptions ». Rouge + pastille = des choses attendent ; vert = rien. Appui long puis glisser
 * pour ranger (ordre gardé sur l'appareil). Une nouvelle carte de l'accueil a sa tuile toute seule.
 * Cartes où les élèves n'envoient encore rien à valider (Ramadan, Prière…) : tuile présente, l'écran le dit.
 */
export type CompteursCorrections = {
  homework: number; alphabet: number; nourania: number; nouraniaLignes: number; recitations: number;
  sourates: number; invocations: number; allahNames: number;
};
export type TuileCorrection = { id: string; label: string; emoji: string; section: string; compte: number; chemin?: string };

/** Écran de correction de chaque carte (par chemin de la carte) ; absente = rien à corriger pour l'instant */
const ECRANS: Record<string, { section: string; compte: (c: CompteursCorrections) => number }> = {
  '/alphabet': { section: 'alphabet-validations', compte: (c) => c.alphabet },
  '/nourania': { section: 'nourania-validations', compte: (c) => c.nourania + c.nouraniaLignes },
  '/sourates': { section: 'recitations-audio', compte: (c) => c.recitations + c.sourates },
  '/invocations': { section: 'invocations-validations', compte: (c) => c.invocations },
  '/allah-names': { section: 'allah-names-audio', compte: (c) => c.allahNames },
};
/** Si la liste des cartes n'a jamais été chargée (1re ouverture sans réseau) */
const CARTES_SECOURS = [
  { title: 'Alphabet', builtin_path: '/alphabet' }, { title: 'Nourania', builtin_path: '/nourania' },
  { title: 'Sourates', builtin_path: '/sourates' }, { title: 'Invocations', builtin_path: '/invocations' },
  { title: "99 Noms d'Allah", builtin_path: '/allah-names' },
];
const CLE_ORDRE = 'dinislam_corrections_ordre';

export const totalCorrections = (c: CompteursCorrections) =>
  c.homework + c.alphabet + c.nourania + c.nouraniaLignes + c.recitations + c.sourates + c.invocations + c.allahNames;

export function useTuilesCorrections(c: CompteursCorrections): TuileCorrection[] {
  const { data: cartes } = useQuery({
    queryKey: ['corrections-cartes'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => (await supabase.from('learning_modules').select('id, title, builtin_path, display_order').order('display_order')).data || [],
  });
  const liste = (cartes?.length ? cartes : CARTES_SECOURS) as { id?: string; title: string; builtin_path: string | null }[];
  return [
    { id: 'devoirs', label: 'Devoirs', emoji: '📚', section: 'cahier-texte', compte: c.homework },
    ...liste.map((m) => {
      const slug = (m.builtin_path || '').replace(/^\//, '') || m.id || m.title;
      const ecran = m.builtin_path ? ECRANS[m.builtin_path] : undefined;
      return {
        id: `carte:${slug}`, label: m.title, emoji: MODULE_EMOJI_FALLBACK[slug]?.emoji ?? '📚',
        section: ecran?.section ?? `rien:${slug}`, compte: ecran ? ecran.compte(c) : 0, chemin: m.builtin_path ?? undefined,
      };
    }),
  ];
}

export function CorrectionsGrille({ tuiles, onOuvrir }: { tuiles: TuileCorrection[]; onOuvrir: (t: TuileCorrection) => void }) {
  const [ordre, setOrdre] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(CLE_ORDRE) || '[]'); } catch { return []; } });
  // Ordre choisi ; une tuile nouvelle (nouvelle carte) se range juste après sa voisine d'origine
  const rangees = tuiles.reduce<TuileCorrection[]>((acc, t, i) => {
    if (acc.some((x) => x.id === t.id)) return acc;
    const prev = tuiles[i - 1];
    const at = prev ? acc.findIndex((x) => x.id === prev.id) + 1 : 0;
    acc.splice(at, 0, t);
    return acc;
  }, ordre.map((id) => tuiles.find((t) => t.id === id)).filter((t): t is TuileCorrection => !!t));
  const ranger = (n: TuileCorrection[]) => {
    const ids = n.map((t) => t.id);
    setOrdre(ids);
    try { localStorage.setItem(CLE_ORDRE, JSON.stringify(ids)); } catch { /* stockage bloqué : ordre gardé pour cette visite */ }
  };
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Touche une carte pour corriger. Maintiens puis glisse pour la déplacer.</p>
      <div className="grid grid-cols-3 gap-2">
        <SortableCardList items={rangees} onReorder={ranger} strategy={rectSortingStrategy}
          onDragStart={() => { try { navigator.vibrate?.(15); } catch { /* */ } }}
          renderItem={(t, { ref, style, isDragging, ...drag }) => {
            const attend = t.compte > 0;
            return (
              <button key={t.id} ref={ref as React.Ref<HTMLButtonElement>} style={style} {...drag} type="button" onClick={() => onOuvrir(t)}
                aria-label={`${t.label}${attend ? ` : ${t.compte} à corriger` : ''}`}
                className={`relative flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-3 text-center font-semibold text-white transition-all active:scale-95 touch-manipulation ${attend ? 'bg-destructive' : 'bg-emerald-500'} ${isDragging ? 'opacity-60 ring-4 ring-sky-300' : ''}`}>
                {attend && (
                  <span className="absolute top-1.5 right-1.5 bg-white text-destructive text-xs font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">{t.compte}</span>
                )}
                <span className={`text-2xl leading-none ${t.emoji === 'أ' ? 'font-arabic' : ''}`}>{t.emoji}</span>
                <span className="text-xs leading-tight [overflow-wrap:anywhere] hyphens-none">{t.label}</span>
              </button>
            );
          }} />
      </div>
    </div>
  );
}

/** Carte sans rien à corriger pour l'instant */
export function RienACorriger({ tuile, onOuvrirCarte }: { tuile?: TuileCorrection; onOuvrirCarte?: () => void }) {
  return (
    <div className="text-center py-10 space-y-3">
      <p className="text-4xl">{tuile?.emoji ?? '✅'}</p>
      <p className="font-bold">Rien à corriger dans « {tuile?.label ?? 'cette carte'} »</p>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">Pour l'instant, les élèves n'envoient rien à valider dans cette carte. Dès qu'ils le pourront, leurs envois arriveront ici.</p>
      {onOuvrirCarte && <button type="button" onClick={onOuvrirCarte} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">Ouvrir la carte →</button>}
    </div>
  );
}
