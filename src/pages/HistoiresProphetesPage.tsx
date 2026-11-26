import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTitreCarte } from '@/hooks/useTitreCarte';
import { useEtoiles, useFichesPetits, useGagnerEtoile, type FichePetit } from '@/hooks/usePetits';
import { FicheEnGrand } from '@/components/petits/FicheEnGrand';
import { EditionFichePetit, GererFichesPetits } from '@/components/petits/FichesPetitsAdmin';
import { VideosHistoire } from '@/components/petits/VideosHistoire';
import { QuizHistoire } from '@/components/petits/QuizHistoire';
import { useSonErreurChoisi } from '@/hooks/useSonErreur';
import { refEtoileDuJour } from '@/lib/petits';
import { useNavigate } from 'react-router';
import { SURA_PAGE } from '@/data/coranMeta';
import { SOURATES_DATA } from '@/data/sourates';

/**
 * 📚 Carte « Histoires des Prophètes » (les grands, Nadia 22/11) : les mêmes outils que les histoires des tout-petits :
 * chaque histoire en grand (arabe, 🔊), 🎬 les VIDÉOS à la place du texte (22/11, texte retiré), choisies par l'enseignante (cachées au départ), 🎧 quiz.
 * Contenu à part (fiches `petits_fiches` rubrique « prophetes ») : modifier ici ne change pas les tout-petits.
 */
const COULEURS = ['from-violet-400 to-purple-600', 'from-sky-400 to-indigo-600', 'from-amber-400 to-orange-600', 'from-emerald-400 to-teal-600'];

export default function HistoiresProphetesPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const titre = useTitreCarte('/module/histoires-prophetes', 'Histoires des Prophètes');
  const { data: toutes = [], isLoading } = useFichesPetits();
  const fiches = useMemo(() => toutes.filter((f) => f.rubrique === 'prophetes'), [toutes]);
  const { data: etoiles = [] } = useEtoiles(user?.id);
  const gagnerEtoile = useGagnerEtoile(user?.id);
  useSonErreurChoisi();
  const [ouverte, setOuverte] = useState<number | null>(null);
  const [edition, setEdition] = useState<FichePetit | null>(null);
  const aEtoile = (source: string, ref: string) => etoiles.some((e) => e.source === source && e.ref === ref);

  return (
    <AppLayout title={titre}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-purple-800 p-5 text-white shadow-lg">
          <p className="font-arabic text-2xl" dir="rtl">قصص الأنبياء</p>
          <h1 className="text-2xl font-extrabold">{titre}</h1>
          <p className="text-sm opacity-90">Les récits du Coran en vidéos, avec un petit quiz à écouter.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fiches.map((f, i) => (
            <button key={f.id} type="button" onClick={() => setOuverte(i)} aria-label={f.titre}
              className={`aspect-square rounded-[28px] bg-gradient-to-br ${COULEURS[i % COULEURS.length]} shadow-lg p-2 flex flex-col items-center justify-center gap-1.5 text-white active:scale-95 transition-transform`}>
              {f.image_url ? <img src={f.image_url} alt="" className="h-3/5 w-full object-contain rounded-2xl" loading="lazy" /> : <span className="text-6xl leading-none drop-shadow">{f.emoji || '📚'}</span>}
              <span className="text-sm sm:text-base font-extrabold text-center leading-tight drop-shadow [overflow-wrap:anywhere]">{f.titre}</span>
            </button>
          ))}
        </div>
        {!fiches.length && !isLoading && <p className="text-center font-bold text-muted-foreground">🛠️ En cours de mise à jour</p>}
        {isAdmin && <GererFichesPetits rubrique="prophetes" fiches={fiches} userId={user?.id ?? null} />}
      </div>
      {ouverte !== null && (
        <FicheEnGrand fiches={fiches} index={ouverte} isAdmin={isAdmin} onIndex={setOuverte} onClose={() => setOuverte(null)}
          etoileDuJour={(f) => aEtoile('fiche', refEtoileDuJour(f))} onModifier={setEdition}
          auMilieu={(f) => (
            <>
              {/* 🔗 2026-11-26 (Nadia : liens entre cartes, L6) : la sourate liée à l'histoire, ouverte dans le Coran */}
              {typeof f.sourate_liee === 'number' && f.sourate_liee >= 1 && f.sourate_liee <= 114 && (
                <button type="button" onClick={() => navigate(`/coran?item=${SURA_PAGE[(f.sourate_liee as number) - 1]}`)}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#7a1d22] to-[#561216] text-white px-4 py-3 font-extrabold text-sm sm:text-base shadow active:scale-[0.98] transition-transform [overflow-wrap:anywhere]">
                  📖 La sourate : {SOURATES_DATA.find((s) => s.number === f.sourate_liee)?.name_french ?? `n° ${f.sourate_liee}`}
                </button>
              )}
              <VideosHistoire key={`v${f.id}`} ficheId={f.id} titreFiche={f.titre} isAdmin={isAdmin} />
            </>
          )}
          enBas={(f) => <QuizHistoire key={`q${f.id}`} ficheId={f.id} titre={f.titre} isAdmin={isAdmin} aEtoile={aEtoile} gagnerEtoile={gagnerEtoile} petits={false} />} />
      )}
      {edition && <EditionFichePetit rubrique="prophetes" fiche={edition} fiches={fiches} userId={user?.id ?? null} onClose={() => setEdition(null)}
        rafraichir={() => void queryClient.invalidateQueries({ queryKey: ['petits-fiches'] })} />}
    </AppLayout>
  );
}
