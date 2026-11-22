import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Lock, Pencil } from 'lucide-react';
import { untypedDb } from '@/lib/untypedDb';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import ContentUploadTabs from '@/components/admin/ContentUploadTabs';
import ValiderPourEleve from '@/components/admin/ValiderPourEleve';
import { LecteurVideo } from '@/components/video/LecteurVideo';
import { SafeYoutubeEmbed } from '@/components/SafeYoutubeEmbed';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { trashThenDelete } from '@/lib/trash';
import { enregistrerOrdre, envoyerFichierAlphabet, horsLigne } from '@/lib/alphabetMedias';
import { SortableCardList } from '@/components/shared/SortableCardList';
import { confettiLettres } from '@/lib/confettiLettres';
import { sonHarpeEtoiles } from '@/lib/sonSaison';
import { errorMessage } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
import { JeuxDeLaLettre } from './JeuxDeLaLettre';
import { ChoixSonErreur } from '@/components/petits/ChoixSonErreur';
import { useSonErreurChoisi } from '@/hooks/useSonErreur';
import { sonErreur } from '@/lib/sonsErreur';
import { OuvertureLettrePetits } from './OuvertureLettrePetits';
import { lettresOuvertesPour, resumeOuverture, useOuverturesPetits } from '@/lib/ouverturesPetits';
import { useMesGroupes } from '@/hooks/usePetits';

/**
 * 🧸 Onglet « Pour les tout-petits » (1 à 5 ans) de l'Alphabet (Nadia, 2026-11-21, disposition « E · La télé des houroufs ») :
 * de grosses vignettes, une par lettre ; un toucher = la vidéo (« le monde des houroufs ») en plein écran, grosse croix pour revenir.
 * Idées gardées : aucun mot à lire, boutons géants, jamais « raté », minuteur des parents, vidéos gardées sur l'appareil,
 * sa voix (audio de la lettre), petites animations, confettis en LETTRES ARABES quand l'enfant réussit.
 * Les lettres restent fermées 🔒 : l'enseignante les ouvre À LA MAIN (tous, un groupe, certains enfants), ب d'abord, ا à la fin (22/11).
 * Le petit jeu n'utilise que les lettres DÉJÀ VALIDÉES.
 */
type Lettre = Tables<'alphabet_letters'>;
interface VideoPetit { id: string; letter_id: number; url: string; type: 'video' | 'youtube'; nom: string | null; position: number }

const TEINTES = ['#f97316', '#10b981', '#ec4899', '#8b5cf6', '#0ea5e9', '#eab308', '#ef4444', '#14b8a6'];
const CLE_MINUTEUR = 'dinislam_petits_minuteur_fin';

function jouerUrl(url: string | null | undefined) {
  if (!url) return;
  try { void new Audio(url).play().catch(() => {}); } catch { /* son indisponible */ }
}

export function AlphabetToutPetits({ letters: toutes, learned, isAdmin }: {
  letters: Lettre[]; learned: Set<number>; isAdmin: boolean;
}) {
  const { user } = useAuth();
  // ب en premier, ا à la fin (Nadia commence toujours par ب et revient à ا plus tard dans l'année)
  const letters = useMemo(() => [...toutes.filter((l) => l.id !== 1), ...toutes.filter((l) => l.id === 1)], [toutes]);
  const { data: ouvertures = [] } = useOuverturesPetits();
  const { data: mesGroupes = [] } = useMesGroupes(isAdmin ? null : user?.id);
  const unlocked = useMemo(() => lettresOuvertesPour(ouvertures, user?.id, mesGroupes), [ouvertures, user?.id, mesGroupes]);
  const [aOuvrir, setAOuvrir] = useState<Lettre | null>(null);
  useSonErreurChoisi(); // le son doux choisi par l'enseignante, retenu sur l'appareil
  const queryClient = useQueryClient();
  const [lecture, setLecture] = useState<{ lettre: Lettre; i: number; onglet?: 'video' | 'jeux' } | null>(null);
  const [edition, setEdition] = useState<Lettre | null>(null);
  const [jeu, setJeu] = useState(false);
  const [minuteurOuvert, setMinuteurOuvert] = useState(false);
  const [fin, setFin] = useState<number | null>(() => { try { const v = Number(localStorage.getItem(CLE_MINUTEUR)); return v > Date.now() ? v : null; } catch { return null; } });
  const [termine, setTermine] = useState(false);
  const [validerOuvert, setValiderOuvert] = useState(false);

  const { data: videos = [] } = useQuery({
    queryKey: ['alphabet-petits-videos'],
    queryFn: async () => {
      const { data, error } = await untypedDb.from('alphabet_petits_videos').select('id, letter_id, url, type, nom, position').order('position').order('created_at');
      if (error) throw error;
      return (data || []) as VideoPetit[];
    },
  });
  const videosDe = (id: number) => videos.filter((v) => v.letter_id === id);
  const [sonsOuverts, setSonsOuverts] = useState(false);

  // ⏱️ Minuteur des parents : à la fin, écran doux « on range ! »
  useEffect(() => {
    if (!fin) return;
    const reste = fin - Date.now();
    if (reste <= 0) { setTermine(true); return; }
    const t = setTimeout(() => setTermine(true), reste);
    return () => clearTimeout(t);
  }, [fin]);
  const lancerMinuteur = (min: number | null) => {
    const v = min ? Date.now() + min * 60000 : null;
    setFin(v); setTermine(false); setMinuteurOuvert(false);
    try { if (v) localStorage.setItem(CLE_MINUTEUR, String(v)); else localStorage.removeItem(CLE_MINUTEUR); } catch { /* stockage indisponible */ }
    if (min) toast.success(`⏱️ ${min} minutes, puis on range`);
  };

  const ouvrir = (l: Lettre) => {
    const ouverte = isAdmin || unlocked.has(l.id);
    if (!ouverte) return;
    // La carte s'ouvre toujours en grand (2026-11-21) : vidéos s'il y en a, sinon la lettre + « en cours de mise à jour »
    if (!videosDe(l.id).length) jouerUrl(l.audio_url);
    setLecture({ lettre: l, i: 0 });
  };
  const validees = useMemo(() => letters.filter((l) => learned.has(l.id) && l.audio_url), [letters, learned]);
  // 🎮 Jeux de la carte : la lettre ouverte, mélangée avec TOUTES les autres lettres de l'alphabet (Nadia, 2026-11-21)
  const connues = letters;

  return (
    <div className="space-y-3">
      {/* Barre des grands : jeu (gros bouton) + minuteur des parents */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => (validees.length >= 2 ? setJeu(true) : toast('🔒 Le jeu s\'ouvre dès que 2 lettres sont validées'))}
          aria-label="Jouer"
          className={`flex-1 h-20 rounded-3xl text-4xl shadow-md transition-transform active:scale-95 ${validees.length >= 2 ? 'bg-gradient-to-br from-yellow-300 to-orange-400' : 'bg-muted opacity-60'}`}>
          {validees.length >= 2 ? '🎈' : '🔒'}
        </button>
        <button type="button" onClick={() => setMinuteurOuvert(true)} aria-label="Minuteur des parents"
          className="h-20 w-20 rounded-3xl bg-card border-2 border-border text-3xl shadow-sm">⏱️</button>
      </div>
      {fin && !termine && <p className="text-center text-xs text-muted-foreground">⏱️ Fin à {new Date(fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>}

      {isAdmin && (
        <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/30 p-3 space-y-2 text-sm">
          <p>👆 ✏️ sur une lettre = ses vidéos ; 🔓 = l'ouvrir à tous les tout-petits, à un groupe ou à certains enfants (🌍 tous · 🎯 certains · 🔒 fermée). Les enfants ne voient que les lettres ouvertes.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setValiderOuvert((v) => !v)}>{validerOuvert ? 'Fermer' : '✅ Valider une lettre pour un enfant'}</Button>
            <Button size="sm" variant="outline" onClick={() => setSonsOuverts((v) => !v)}>🔈 Son quand l'enfant se trompe</Button>
          </div>
          {sonsOuverts && <ChoixSonErreur />}
          {validerOuvert && (
            <ValiderPourEleve genre="alphabet" profiles={[]}
              elements={letters.map((l) => ({ id: String(l.id), libelle: `${l.letter_arabic}  ${l.name_french}` }))} />
          )}
        </div>
      )}

      {/* 📺 La télé des houroufs */}
      <div dir="rtl" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {letters.map((l, i) => {
          const ouverte = isAdmin || unlocked.has(l.id);
          const nb = videosDe(l.id).length;
          return (
            <div key={l.id} className="relative">
              <button type="button" onClick={() => ouvrir(l)} aria-label={l.name_french}
                className={`w-full aspect-square rounded-[28px] grid place-items-center relative shadow-md transition-transform active:scale-95 ${ouverte ? 'animate-fade-in' : 'opacity-45 grayscale'}`}
                style={{ background: TEINTES[i % TEINTES.length] }}>
                <span className="absolute top-2 start-3 font-arabic text-5xl text-white drop-shadow-md leading-none">{l.letter_arabic}</span>
                {ouverte ? (
                  nb > 0
                    ? <span className="h-16 w-16 rounded-full bg-white/90 grid place-items-center text-3xl text-slate-800 shadow-lg ps-1" dir="ltr">▶</span>
                    : <span className="font-arabic text-6xl text-white/90">{l.letter_arabic}</span>
                ) : <Lock className="h-12 w-12 text-white" />}
                {learned.has(l.id) && <span className="absolute bottom-2 end-3 text-2xl">⭐</span>}
              </button>
              {isAdmin && (
                <button type="button" onClick={() => setAOuvrir(l)} aria-label={`Ouvrir ${l.name_french} aux tout-petits`}
                  className="absolute bottom-1.5 start-1.5 h-9 min-w-9 px-1.5 grid place-items-center rounded-full bg-card shadow border border-border text-sm font-bold" dir="ltr">
                  {resumeOuverture(ouvertures, l.id)}
                </button>
              )}
              {isAdmin && (
                <button type="button" onClick={() => setEdition(l)} aria-label={`Vidéos de ${l.name_french}`}
                  className="absolute top-1.5 end-1.5 h-9 w-9 grid place-items-center rounded-full bg-card shadow border border-border">
                  <Pencil className="h-4 w-4" />
                  {nb > 0 && <span className="absolute -bottom-1 -start-1 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">{nb}</span>}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 🎬 La carte de la lettre en plein écran : vidéo(s), ou la lettre et « en cours de mise à jour » */}
      {lecture && (() => {
        const liste = videosDe(lecture.lettre.id);
        const v = liste[lecture.i] ?? null;
        const i = letters.findIndex((x) => x.id === lecture.lettre.id);
        return (
          <div className="fixed inset-0 z-[900] flex flex-col" style={{ background: v && lecture.onglet !== 'jeux' ? '#000' : TEINTES[i % TEINTES.length], paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {/* 📺 Vidéo / 🎮 Jeux de la lettre */}
            <div className="flex justify-center gap-3 pt-3 relative z-10">
              {/* ‹ Retour à la liste des lettres (Nadia, 2026-11-21) */}
              <button type="button" onClick={() => setLecture(null)} aria-label="Retour aux lettres"
                className="absolute start-4 top-3 h-16 px-4 rounded-full bg-white/90 shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform">
                <span className="text-4xl font-black text-slate-700 leading-none" dir="ltr">‹</span>
                <span className="hidden sm:inline font-arabic text-2xl text-slate-800 leading-none" dir="rtl">أ ب ت</span>
              </button>
              {(['video', 'jeux'] as const).map((o) => (
                <button key={o} type="button" aria-label={o === 'video' ? 'Vidéo' : 'Jeux'} onClick={() => setLecture({ ...lecture, onglet: o })}
                  aria-pressed={(lecture.onglet ?? 'video') === o}
                  className={`h-20 w-24 sm:h-24 sm:w-28 rounded-[28px] text-5xl sm:text-6xl shadow-lg grid place-items-center transition-transform active:scale-95 ${(lecture.onglet ?? 'video') === o ? 'bg-red-500 ring-4 ring-yellow-300 scale-105' : 'bg-white/60'}`}>
                  {o === 'video' ? '📺' : '🎮'}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0 grid place-items-center p-4 relative">
              {lecture.onglet === 'jeux' ? <JeuxDeLaLettre key={lecture.lettre.id} lettre={lecture.lettre} connues={connues} /> : v ? (v.type === 'youtube'
                ? <div className="w-full max-w-3xl"><SafeYoutubeEmbed embedUrl={v.url} title={v.nom || lecture.lettre.name_french} /></div>
                : <LecteurVideo key={v.id} src={v.url} autoPlay playsInline controlsList="nodownload" className="max-h-full"
                    onEnded={() => { confettiLettres([lecture.lettre.letter_arabic]); sonHarpeEtoiles(); }} />)
                : (
                  <div className="text-center text-white space-y-6">
                    <button type="button" onClick={() => jouerUrl(lecture.lettre.audio_url)} aria-label={`Écouter ${lecture.lettre.name_french}`}
                      className="font-arabic text-[11rem] leading-none drop-shadow-xl animate-[wiggle_1.2s_ease-in-out]">{lecture.lettre.letter_arabic}</button>
                    {lecture.lettre.audio_url && (
                      <button type="button" onClick={() => jouerUrl(lecture.lettre.audio_url)} aria-label="Écouter"
                        className="mx-auto h-24 w-24 rounded-full bg-white/90 text-5xl grid place-items-center shadow-xl">🔊</button>
                    )}
                    <p className="rounded-2xl bg-white/20 px-5 py-3 text-lg font-bold">🛠️ En cours de mise à jour pour cette leçon</p>
                    {isAdmin && (
                      <button type="button" onClick={() => { setEdition(lecture.lettre); setLecture(null); }}
                        className="rounded-full bg-white text-slate-900 px-5 py-2.5 font-bold">✏️ Ajouter une vidéo</button>
                    )}
                  </div>
                )}
            </div>
            <button type="button" onClick={() => setLecture(null)} aria-label="Fermer"
              className="absolute end-4 z-20 h-16 w-16 rounded-full bg-red-500 text-white text-4xl font-bold shadow-xl grid place-items-center" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>✕</button>
            {liste.length > 1 && lecture.onglet !== 'jeux' && (
              <button type="button" onClick={() => setLecture({ ...lecture, i: (lecture.i + 1) % liste.length })} aria-label="Vidéo suivante"
                className="absolute start-4 h-16 w-16 rounded-full bg-white/90 text-3xl shadow-xl grid place-items-center" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>⏭️</button>
            )}
          </div>
        );
      })()}

      {aOuvrir && <OuvertureLettrePetits lettre={aOuvrir} onClose={() => setAOuvrir(null)} />}
      {jeu && <JeuEcouteTouche lettres={validees} onClose={() => setJeu(false)} />}

      {/* ⏱️ Choix du minuteur (pour les parents) */}
      <Dialog open={minuteurOuvert} onOpenChange={setMinuteurOuvert}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>⏱️ Minuteur</DialogTitle>
            <DialogDescription>À la fin, un écran doux dit à l'enfant qu'on range.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {[10, 15, 20].map((m) => <Button key={m} variant="outline" className="h-14 text-lg font-bold" onClick={() => lancerMinuteur(m)}>{m} min</Button>)}
          </div>
          {fin && <Button variant="ghost" onClick={() => lancerMinuteur(null)}>Arrêter le minuteur</Button>}
        </DialogContent>
      </Dialog>

      {termine && (
        <div className="fixed inset-0 z-[950] bg-gradient-to-b from-indigo-900 to-sky-700 text-white grid place-items-center p-6 text-center">
          <div className="space-y-4">
            <p className="text-8xl animate-bounce">🧸</p>
            <p className="text-5xl">🌙 ✨</p>
            <p className="text-2xl font-extrabold">On range !</p>
            <p className="text-sm text-white/80">Pour les parents : le temps choisi est fini.</p>
            <div className="flex gap-2 justify-center">
              <Button variant="secondary" onClick={() => lancerMinuteur(5)}>+ 5 min</Button>
              <Button variant="outline" className="bg-transparent text-white" onClick={() => lancerMinuteur(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}

      {edition && <VideosDeLaLettre lettre={edition} videos={videosDe(edition.id)} userId={user?.id ?? null} onClose={() => setEdition(null)}
        rafraichir={() => void queryClient.invalidateQueries({ queryKey: ['alphabet-petits-videos'] })} />}
    </div>
  );
}

/** 🎈 « Écoute et touche » : la lettre se fait entendre, l'enfant touche la bonne. Jamais de « raté » : on réécoute et on réessaie. */
function JeuEcouteTouche({ lettres, onClose }: { lettres: Lettre[]; onClose: () => void }) {
  const tirer = () => {
    const melange = [...lettres].sort(() => Math.random() - 0.5);
    const choix = melange.slice(0, Math.min(lettres.length >= 3 ? 3 : 2, melange.length));
    return { choix, bonne: choix[Math.floor(Math.random() * choix.length)] };
  };
  const [tour, setTour] = useState(tirer);
  const [secoue, setSecoue] = useState<number | null>(null);
  const [bravo, setBravo] = useState(false);
  const premier = useRef(true);

  useEffect(() => {
    // 1er tour : le son part au toucher du bouton 🎈 (le navigateur l'autorise), les suivants après le bravo
    const t = setTimeout(() => jouerUrl(tour.bonne.audio_url), premier.current ? 150 : 400);
    premier.current = false;
    return () => clearTimeout(t);
  }, [tour]);

  const toucher = (l: Lettre) => {
    if (bravo) return;
    if (l.id === tour.bonne.id) {
      setBravo(true);
      confettiLettres([l.letter_arabic]);
      sonHarpeEtoiles();
      setTimeout(() => { setBravo(false); setTour(tirer()); }, 2200);
    } else {
      setSecoue(l.id);
      setTimeout(() => setSecoue(null), 500);
      sonErreur();
      setTimeout(() => jouerUrl(tour.bonne.audio_url), 650);
    }
  };

  return (
    <div className="fixed inset-0 z-[900] bg-gradient-to-b from-sky-300 to-sky-100 dark:from-sky-900 dark:to-indigo-950 flex flex-col items-center justify-center gap-8 p-6"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
      <button type="button" onClick={onClose} aria-label="Fermer"
        className="absolute end-4 h-16 w-16 rounded-full bg-red-500 text-white text-4xl font-bold shadow-xl grid place-items-center" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>✕</button>
      <button type="button" onClick={() => jouerUrl(tour.bonne.audio_url)} aria-label="Réécouter"
        className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 text-white text-6xl shadow-xl grid place-items-center animate-pulse">🔊</button>
      <div dir="rtl" className="flex flex-wrap justify-center gap-5">
        {tour.choix.map((l, i) => (
          <button key={l.id} type="button" onClick={() => toucher(l)} aria-label={l.name_french}
            className={`h-36 w-36 sm:h-44 sm:w-44 rounded-[36px] text-white font-arabic text-8xl leading-none shadow-xl grid place-items-center transition-transform active:scale-90
              ${secoue === l.id ? 'animate-[wiggle_0.5s_ease-in-out]' : ''} ${bravo && l.id === tour.bonne.id ? 'scale-110 ring-8 ring-yellow-300' : ''}`}
            style={{ background: TEINTES[(i * 3 + 1) % TEINTES.length] }}>
            {l.letter_arabic}
          </button>
        ))}
      </div>
      {bravo && <p className="text-7xl animate-bounce" aria-label="Bravo">🌟👏🌟</p>}
    </div>
  );
}

/** ✏️ Vidéos d'une lettre (enseignante) : ajouter (fichier ou YouTube), ranger (appui long + glisser), retirer (corbeille) */
function VideosDeLaLettre({ lettre, videos, userId, onClose, rafraichir }: {
  lettre: Lettre; videos: VideoPetit[]; userId: string | null; onClose: () => void; rafraichir: () => void;
}) {
  const [envoi, setEnvoi] = useState(false);
  const [aRetirer, setARetirer] = useState<VideoPetit | null>(null);
  const maxPos = Math.max(0, ...videos.map((v) => v.position));

  const ajouter = async (row: { url: string; type: 'video' | 'youtube'; nom: string }) => {
    const r = await ecrireOuGarder({ table: 'alphabet_petits_videos', op: 'insert', rows: [{ letter_id: lettre.id, position: maxPos + 10, ...row }] });
    toast.success(r === 'en_attente' ? '📡 Gardé, envoyé au retour du réseau' : '🎬 Vidéo ajoutée ✅');
    rafraichir();
  };
  const envoyer = async (f: File) => {
    if (horsLigne()) { toast.error('📡 Nécessite Internet pour envoyer une vidéo'); return; }
    setEnvoi(true);
    try {
      const r = await envoyerFichierAlphabet(f, `petits/lettre-${lettre.id}`);
      if (r.kind !== 'video') { toast.error('Choisis un fichier vidéo'); return; }
      await ajouter({ url: r.url, type: 'video', nom: r.nom });
    } catch (e) { toast.error(errorMessage(e)); } finally { setEnvoi(false); }
  };
  const retirer = async (v: VideoPetit) => {
    if (!userId) return;
    try {
      await trashThenDelete({ userId, type: 'alphabet_petits_video', id: v.id, label: `${v.nom || 'Vidéo'} (tout-petits, ${lettre.name_french})`, data: v,
        remove: () => untypedDb.from('alphabet_petits_videos').delete().eq('id', v.id) });
      toast.success('🗑️ Dans la corbeille (Paramètres)');
      rafraichir();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🎬 Vidéos de <span className="font-arabic text-2xl">{lettre.letter_arabic}</span> ({lettre.name_french})</DialogTitle>
          <DialogDescription>La 1re vidéo passe quand l'enfant touche la lettre ; ⏭️ pour les suivantes. ✋ Appui long puis glisser pour les ranger.</DialogDescription>
        </DialogHeader>
        {/* ✋ Appui long + glisser pour ranger */}
        <SortableCardList items={videos} onReorder={(n) => { void enregistrerOrdre('alphabet_petits_videos', n.map((x) => x.id)).then(rafraichir, (e) => toast.error(errorMessage(e))); }}
          renderItem={(v, drag) => {
            const { ref, style, isDragging, ...attrs } = drag;
            const i = videos.findIndex((x) => x.id === v.id);
            return (
          <div key={v.id} ref={ref} style={style} {...attrs} className={`rounded-xl border border-border p-2 space-y-1.5 touch-manipulation ${isDragging ? 'opacity-50 ring-2 ring-sky-400' : ''}`}>
            {v.type === 'youtube' ? <SafeYoutubeEmbed embedUrl={v.url} title={v.nom || 'Vidéo'} /> : <LecteurVideo src={v.url} controlsList="nodownload" />}
            <div className="flex items-center gap-1">
              <span className="flex-1 min-w-0 text-xs font-semibold [overflow-wrap:anywhere]">{i + 1}. {v.nom || 'Vidéo'}</span>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setARetirer(v)} aria-label="Retirer">🗑️</Button>
            </div>
          </div>
        );
          }} />
        {!videos.length && <p className="text-sm text-muted-foreground">Pas encore de vidéo pour cette lettre.</p>}
        <ContentUploadTabs isUploading={envoi} accept="video/*" libelleFichier="Choisir une vidéo"
          onUploadFile={(f) => void envoyer(f)}
          onAddYoutubeLink={(u) => void ajouter({ url: u, type: 'youtube', nom: 'Vidéo YouTube' }).catch((e) => toast.error(errorMessage(e)))}
          onUploadAudio={() => toast('Ici, seulement des vidéos 🎬')} />
        <p className="text-[11px] text-muted-foreground">Une vidéo envoyée en fichier reste visible sans Internet une fois regardée ; un lien YouTube a besoin d'Internet.</p>
        <ConfirmDeleteDialog open={!!aRetirer} onOpenChange={(o) => !o && setARetirer(null)}
          onConfirm={() => { const v = aRetirer; setARetirer(null); if (v) void retirer(v); }}
          title="Retirer cette vidéo ?" description="Elle ira dans la corbeille de Paramètres, tu pourras la remettre." />
      </DialogContent>
    </Dialog>
  );
}
