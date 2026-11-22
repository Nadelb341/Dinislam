import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAccesPetits, useEtoiles, useFichesPetits, useGagnerEtoile, useReglage, type FichePetit } from '@/hooks/usePetits';
import { ModeInvocations } from '@/components/petits/InvocationsPetits';
import { QuizHistoire } from '@/components/petits/QuizHistoire';
import { VideosHistoire } from '@/components/petits/VideosHistoire';
import { useSonErreurChoisi } from '@/hooks/useSonErreur';
import { FicheEnGrand } from '@/components/petits/FicheEnGrand';
import { EditionFichePetit, GererFichesPetits } from '@/components/petits/FichesPetitsAdmin';
import { confettiLettres } from '@/lib/confettiLettres';
import { sonHarpeEtoiles, sonPlop } from '@/lib/sonSaison';
import { sonErreur } from '@/lib/sonsErreur';
import { cleJour, ecouterFiche, jourRamadan, luneDuJour, refEtoileDuJour, RUBRIQUES, type CleRubrique } from '@/lib/petits';

/**
 * 🧸 Une rubrique des petits du Groupe 0 en plein écran (Nadia, 2026-11-22) : /petits/douas, /petits/coran… et /petits/jeux.
 * Rien à lire pour l'enfant : de grandes images, sa voix (ou celle de l'appareil), un toucher = la fiche en grand.
 * L'enseignante a son ✏️ partout (fiches, ordre, images, voix, zones de contenu).
 */
const melanger = <T,>(t: T[]) => [...t].sort(() => Math.random() - 0.5);

export default function PetitsPage() {
  const { rubrique = '' } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: toutes = [] } = useFichesPetits();
  const { data: etoiles = [] } = useEtoiles(user?.id);
  const gagnerEtoile = useGagnerEtoile(user?.id);
  const [ouverte, setOuverte] = useState<number | null>(null);
  const [edition, setEdition] = useState<FichePetit | null>(null);
  const jeux = rubrique === 'jeux';
  const r = (RUBRIQUES as Record<string, (typeof RUBRIQUES)[CleRubrique] | undefined>)[rubrique];
  const fiches = useMemo(() => toutes.filter((f) => f.rubrique === rubrique), [toutes, rubrique]);
  const aEtoile = (source: string, ref: string) => etoiles.some((e) => e.source === source && e.ref === ref);
  const etoileDuJour = (f: FichePetit) => aEtoile('fiche', refEtoileDuJour(f));
  const gagner = (f: FichePetit) => gagnerEtoile('fiche', refEtoileDuJour(f));
  const rafraichir = () => void queryClient.invalidateQueries({ queryKey: ['petits-fiches'] });
  // 🔒 Carte fermée pour cet enfant (onglet « 🧸 Tout-petits » de l'enseignante) : la page ne s'ouvre pas non plus par un lien
  const acces = useAccesPetits(user?.id, isAdmin);
  useSonErreurChoisi(); // le son doux choisi par l'enseignante, retenu sur l'appareil
  const cleCarte = ({ prieres5: 'soleil', phrases: 'phrase', aid: 'ramadan' } as Record<string, string>)[rubrique] ?? rubrique;

  if (!isAdmin && acces.pret && !acces.ouverte(cleCarte)) return (
    <div className="min-h-[100dvh] grid place-items-center bg-gradient-to-b from-sky-200 to-indigo-300 p-6 text-center">
      <div className="space-y-4">
        <p className="text-8xl">🔒</p>
        <button type="button" onClick={() => navigate('/')} className="h-16 px-6 rounded-full bg-white shadow-lg text-3xl">‹ 🏠</button>
      </div>
    </div>
  );
  if (!r && !jeux) return <div className="p-6 text-center"><p>Cette page n'existe pas.</p><button type="button" className="underline" onClick={() => navigate('/')}>Accueil</button></div>;
  const fond = jeux ? 'from-fuchsia-300 to-purple-600' : r!.fond;

  return (
    <div className={`min-h-[100dvh] bg-gradient-to-b ${fond}`} style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
      <div className="mx-auto max-w-3xl px-4 space-y-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/')} aria-label="Retour à l'accueil"
            className="h-16 px-4 rounded-full bg-white/90 shadow-lg flex items-center gap-1 text-3xl active:scale-95 transition-transform">
            <span className="text-4xl font-black text-slate-700 leading-none">‹</span>🏠
          </button>
          <h1 className="flex-1 text-2xl sm:text-3xl font-extrabold text-white drop-shadow [overflow-wrap:anywhere]">{jeux ? '🎮 Jeux' : `${r!.emoji} ${r!.titre}`}</h1>
        </div>

        {jeux ? <PageJeux toutes={toutes} gagnerEtoile={gagnerEtoile} />
          : r!.mode === 'coran' ? <ModeCoran fiches={fiches} ouvrir={setOuverte} />
          : r!.mode === 'doigts' ? <ModeDoigts fiches={fiches} ouvrir={setOuverte} />
          : r!.mode === 'etapes' ? <ModeEtapes fiches={fiches} ouvrir={setOuverte} gagner={() => gagnerEtoile('etapes', `${rubrique}:${cleJour()}`)} />
          : rubrique === 'douas' ? <ModeInvocations isAdmin={isAdmin} aEtoile={aEtoile} gagnerEtoile={gagnerEtoile} />
          : r!.mode === 'calendrier' ? <ModeCalendrier fiches={fiches} aid={toutes.filter((f) => f.rubrique === 'aid')} isAdmin={isAdmin} aEtoile={aEtoile} gagnerEtoile={gagnerEtoile} />
          : <ModeImagier fiches={fiches} ouvrir={setOuverte} autocollants={r!.mode === 'autocollants'} etoiles={etoiles} />}

        {/* 🎬 Vidéos de toute la carte « Ramadan et l'Aïd » (22/11), à part de la carte Ramadan des grands */}
        {rubrique === 'ramadan' && <VideosHistoire rubrique="ramadan" titreFiche="Ramadan et l'Aïd (tout-petits)" isAdmin={isAdmin} entete="🎬 Les vidéos du Ramadan et de l'Aïd" />}
        {isAdmin && !jeux && rubrique !== 'douas' && <GererFichesPetits rubrique={rubrique as CleRubrique} fiches={fiches} userId={user?.id ?? null} />}
        {isAdmin && rubrique === 'ramadan' && <GererFichesPetits rubrique="aid" fiches={toutes.filter((f) => f.rubrique === 'aid')} userId={user?.id ?? null} />}
      </div>

      {ouverte !== null && (
        <FicheEnGrand fiches={fiches} index={ouverte} isAdmin={isAdmin} onIndex={setOuverte} onClose={() => setOuverte(null)}
          etoileDuJour={etoileDuJour} gagner={r?.etoile ? gagner : undefined} onModifier={setEdition}
          enBas={rubrique === 'histoires' ? (f) => (
            <div key={f.id} className="space-y-4">
              <VideosHistoire ficheId={f.id} titreFiche={f.titre} isAdmin={isAdmin} />
              <QuizHistoire ficheId={f.id} titre={f.titre} isAdmin={isAdmin} aEtoile={aEtoile} gagnerEtoile={gagnerEtoile} />
            </div>
          ) : undefined} />
      )}
      {ouverte !== null && r?.mode === 'coran' && fiches[ouverte] && <VersetsMotAMot f={fiches[ouverte]} />}
      {edition && <EditionFichePetit rubrique={edition.rubrique} fiche={edition} fiches={fiches} userId={user?.id ?? null} onClose={() => setEdition(null)} rafraichir={rafraichir} />}
    </div>
  );
}

function Tuile({ f, onClick, badge }: { f: FichePetit; onClick: () => void; badge?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={f.titre}
      className="relative aspect-square rounded-[28px] bg-white/90 dark:bg-slate-900/80 shadow-xl p-2 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
      {f.image_url ? <img src={f.image_url} alt="" className="h-3/5 w-full object-contain rounded-2xl" loading="lazy" /> : <span className="text-6xl sm:text-7xl leading-none">{f.emoji || '⭐'}</span>}
      <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white text-center leading-tight [overflow-wrap:anywhere]">{f.titre}</span>
      {badge && <span className="absolute top-2 end-2 rounded-full bg-yellow-300 px-2 text-sm font-bold text-slate-900">{badge}</span>}
    </button>
  );
}

/** Grandes images ; pour les bonnes manières, le nombre d'autocollants gagnés sur chaque carte */
function ModeImagier({ fiches, ouvrir, autocollants, etoiles }: { fiches: FichePetit[]; ouvrir: (i: number) => void; autocollants: boolean; etoiles: { source: string; ref: string }[] }) {
  const nb = (f: FichePetit) => etoiles.filter((e) => e.source === 'fiche' && e.ref.startsWith(`${f.id}:`)).length;
  const total = autocollants ? fiches.reduce((s, f) => s + nb(f), 0) : 0;
  return (
    <div className="space-y-3">
      {autocollants && (
        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/80 p-3 text-center shadow-xl">
          <p className="text-lg font-extrabold">🏅 Mes autocollants : {total}</p>
          <p className="text-3xl leading-snug break-all" aria-hidden>{'⭐'.repeat(Math.min(total, 40))}</p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {fiches.map((f, i) => <Tuile key={f.id} f={f} onClick={() => ouvrir(i)} badge={autocollants && nb(f) ? `⭐ ${nb(f)}` : undefined} />)}
      </div>
      {!fiches.length && <p className="text-center text-white text-lg font-bold">🛠️ En cours de mise à jour</p>}
    </div>
  );
}

/** 📖 Les sourates des petits : une carte par sourate */
function ModeCoran({ fiches, ouvrir }: { fiches: FichePetit[]; ouvrir: (i: number) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {fiches.map((f, i) => (
        <button key={f.id} type="button" onClick={() => ouvrir(i)} className="rounded-[28px] bg-white/90 dark:bg-slate-900/80 shadow-xl p-4 space-y-1 active:scale-95 transition-transform">
          <span className="block text-6xl">{f.emoji || '📖'}</span>
          {f.arabe && <span dir="rtl" className="block font-arabic text-2xl">{f.arabe}</span>}
          <span className="block font-extrabold">{f.titre}</span>
        </button>
      ))}
    </div>
  );
}

/** Les versets mot à mot, par-dessus la fiche : l'enfant touche chaque mot qu'il dit, il s'allume */
function VersetsMotAMot({ f }: { f: FichePetit }) {
  const [allumes, setAllumes] = useState<Set<string>>(new Set());
  if (!f.versets?.length) return null;
  const toucher = (k: string) => { sonPlop(); setAllumes((s) => new Set(s).add(k)); };
  return (
    <div className="fixed inset-x-0 bottom-0 z-[905] max-h-[48vh] overflow-y-auto rounded-t-[32px] bg-white dark:bg-slate-900 shadow-2xl p-4"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)' }}>
      <div className="flex justify-end mb-1"><button type="button" onClick={() => setAllumes(new Set())} className="rounded-full bg-muted px-3 py-1 text-sm font-bold">🔁 Recommencer</button></div>
      <div dir="rtl" className="space-y-2">
        {f.versets.map((v, i) => (
          <p key={i} className="flex flex-wrap gap-x-2 gap-y-1 font-arabic text-3xl leading-[2]">
            {v.split(/\s+/).filter(Boolean).map((m, j) => {
              const k = `${i}-${j}`;
              return <button key={k} type="button" onClick={() => toucher(k)} className={`rounded-xl px-1 transition-colors ${allumes.has(k) ? 'bg-yellow-300 text-slate-900' : ''}`}>{m}</button>;
            })}
            <span className="text-xl text-amber-600 self-center">﴿{(i + 1).toLocaleString('ar-EG')}﴾</span>
          </p>
        ))}
      </div>
    </div>
  );
}

/** ✋ Les 5 piliers sur les 5 doigts de la main : chaque doigt s'allume quand on l'a touché */
function ModeDoigts({ fiches, ouvrir }: { fiches: FichePetit[]; ouvrir: (i: number) => void }) {
  const [vus, setVus] = useState<Set<string>>(new Set());
  const hauteurs = ['h-40', 'h-52', 'h-56', 'h-52', 'h-44'];
  const teintes = ['bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400', 'bg-violet-400'];
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-center gap-2 sm:gap-3 pt-4">
        {fiches.slice(0, 5).map((f, i) => (
          <button key={f.id} type="button" onClick={() => { setVus((s) => new Set(s).add(f.id)); ouvrir(i); }} aria-label={f.titre}
            className={`${hauteurs[i] ?? 'h-48'} w-16 sm:w-20 rounded-t-full rounded-b-2xl shadow-xl flex flex-col items-center justify-start pt-3 gap-1 transition-all active:scale-95 ${vus.has(f.id) ? `${teintes[i]} ring-4 ring-yellow-200` : 'bg-amber-100'}`}>
            <span className="text-3xl sm:text-4xl">{f.emoji}</span>
            <span className="text-lg font-black text-slate-800">{i + 1}</span>
          </button>
        ))}
      </div>
      <div className="mx-auto h-24 w-80 max-w-full rounded-b-[48px] rounded-t-2xl bg-amber-100 shadow-xl -mt-4 grid place-items-center text-lg font-extrabold text-slate-700">
        {vus.size >= Math.min(5, fiches.length) && fiches.length ? '🌟 Bravo, les 5 piliers !' : '✋ Touche chaque doigt'}
      </div>
      {fiches.length > 5 && <div className="grid grid-cols-2 gap-4">{fiches.slice(5).map((f, i) => <Tuile key={f.id} f={f} onClick={() => ouvrir(i + 5)} />)}</div>}
    </div>
  );
}

/** 💧🕌 Les étapes (ablutions, prière) : les regarder dans l'ordre, ou le jeu « Remets dans l'ordre » */
function ModeEtapes({ fiches, ouvrir, gagner }: { fiches: FichePetit[]; ouvrir: (i: number) => void; gagner: () => Promise<boolean> }) {
  const [jeu, setJeu] = useState(false);
  if (jeu) return <JeuOrdre fiches={fiches} gagner={gagner} fin={() => setJeu(false)} />;
  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setJeu(true)} className="w-full rounded-[28px] bg-white text-slate-900 shadow-xl py-4 text-2xl font-extrabold active:scale-95 transition-transform">🎮 Remets dans l'ordre !</button>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {fiches.map((f, i) => (
          <div key={f.id} className="relative">
            <Tuile f={f} onClick={() => ouvrir(i)} />
            <span className="absolute -top-2 -start-2 h-10 w-10 rounded-full bg-yellow-300 text-slate-900 text-xl font-black grid place-items-center shadow">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Jeu : toucher les étapes dans le bon ordre. Erreur = son doux, on continue ; à la fin, Bravo doré + une étoile (1 par jour) */
function JeuOrdre({ fiches, gagner, fin }: { fiches: FichePetit[]; gagner: () => Promise<boolean>; fin: () => void }) {
  const [cartes] = useState(() => melanger(fiches));
  const [faites, setFaites] = useState(0);
  const [secoue, setSecoue] = useState<string | null>(null);
  const toucher = (f: FichePetit) => {
    if (faites >= fiches.length || fiches.findIndex((x) => x.id === f.id) < faites) return;
    if (fiches[faites]?.id === f.id) {
      ecouterFiche(f);
      const n = faites + 1; setFaites(n);
      if (n === fiches.length) { confettiLettres(['⭐', '🌙']); sonHarpeEtoiles(); void gagner(); }
    } else { sonErreur(); setSecoue(f.id); setTimeout(() => setSecoue(null), 500); }
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button type="button" onClick={fin} className="rounded-full bg-white/90 px-4 py-2 font-bold shadow">‹ Les étapes</button>
        <p className="flex-1 self-center text-end text-white text-xl font-extrabold drop-shadow">{faites} / {fiches.length}</p>
      </div>
      {faites === fiches.length && <p className="text-center text-7xl animate-bounce">🌟👏🌟</p>}
      <div className="grid grid-cols-3 gap-3">
        {cartes.map((f) => {
          const rang = fiches.findIndex((x) => x.id === f.id);
          const ok = rang < faites;
          return (
            <button key={f.id} type="button" onClick={() => toucher(f)} aria-label={f.titre}
              className={`relative aspect-square rounded-[24px] shadow-xl grid place-items-center text-5xl transition-all ${ok ? 'bg-yellow-300 scale-95' : 'bg-white'} ${secoue === f.id ? 'animate-[wiggle_0.5s_ease-in-out]' : ''}`}>
              {f.image_url ? <img src={f.image_url} alt="" className="h-4/5 w-4/5 object-contain" /> : f.emoji}
              {ok && <span className="absolute top-1 start-1 h-8 w-8 rounded-full bg-emerald-500 text-white text-lg font-black grid place-items-center">{rang + 1}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 🌙 Calendrier du Ramadan : une case par jour (la lune grandit), qui s'ouvre le jour venu ; puis l'Aïd */
function ModeCalendrier({ fiches, aid, isAdmin, aEtoile, gagnerEtoile }: {
  fiches: FichePetit[]; aid: FichePetit[]; isAdmin: boolean; aEtoile: (s: string, r: string) => boolean; gagnerEtoile: (s: string, r: string) => Promise<boolean>;
}) {
  const { valeur: debut, changer } = useReglage<string>('ramadan_debut', '2027-02-08');
  const [vue, setVue] = useState<number | null>(null);
  const jour = jourRamadan(debut);
  const annee = debut.slice(0, 4);
  const ficheDe = (j: number) => (j > 30 ? aid[0] : fiches.length ? fiches[(j - 1) % fiches.length] : null);
  const ouvrir = async (j: number) => {
    if (!isAdmin && j > jour) { sonErreur(); return; }
    setVue(j);
    const f = ficheDe(j); if (f) ecouterFiche(f);
    if (j <= jour && await gagnerEtoile('ramadan', `${annee}:${j}`)) { confettiLettres(['🌙', '⭐']); sonHarpeEtoiles(); }
  };
  const f = vue !== null ? ficheDe(vue) : null;
  return (
    <div className="space-y-4">
      <p className="rounded-3xl bg-white/90 dark:bg-slate-900/80 p-3 text-center text-lg font-bold shadow">
        {jour < 1 ? `🌙 Le Ramadan commence le ${new Date(debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}, in cha Allah.`
          : jour <= 30 ? `🌙 Jour ${jour} du Ramadan : ouvre ta case !` : '🎉 Aïd moubarak !'}
      </p>
      {isAdmin && (
        <label className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/90 dark:bg-slate-900/80 p-3 text-sm font-semibold">
          ✏️ 1er jour du Ramadan :
          <input type="date" value={debut} onChange={(e) => { if (e.target.value) void changer(e.target.value); }} className="rounded-lg border bg-background px-2 py-1" />
          <span className="text-xs text-muted-foreground">(toi, tu peux ouvrir toutes les cases pour voir)</span>
        </label>
      )}
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((j) => {
          const ouverte = j <= jour;
          const prise = aEtoile('ramadan', `${annee}:${j}`);
          return (
            <button key={j} type="button" onClick={() => void ouvrir(j)} aria-label={j > 30 ? 'Aïd' : `Jour ${j}`}
              className={`aspect-square rounded-2xl shadow-lg flex flex-col items-center justify-center transition-transform active:scale-95 ${prise ? 'bg-yellow-300 text-slate-900' : ouverte ? 'bg-white text-slate-900' : 'bg-white/25 text-white'}`}>
              <span className="text-2xl leading-none">{j > 30 ? '🎉' : ouverte || isAdmin ? luneDuJour(j) : '🎁'}</span>
              <span className="text-xs font-black">{j > 30 ? 'Aïd' : j}</span>
            </button>
          );
        })}
      </div>
      {vue !== null && f && (
        <div className="fixed inset-0 z-[900] bg-black/50 grid place-items-center p-4" onClick={() => setVue(null)}>
          <div className="w-full max-w-md rounded-[32px] bg-white dark:bg-slate-900 p-5 text-center space-y-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-7xl">{vue > 30 ? '🎉' : luneDuJour(vue)}</p>
            <p className="text-sm font-bold text-muted-foreground">{vue > 30 ? 'L\'Aïd' : `Jour ${vue}`}</p>
            <p className="text-5xl">{f.emoji}</p>
            {f.arabe && <p dir="rtl" className="font-arabic text-3xl">{f.arabe}</p>}
            <p className="text-xl font-extrabold">{f.texte || f.titre}</p>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={() => ecouterFiche(f)} className="h-16 w-16 rounded-full bg-muted text-4xl">🔊</button>
              <button type="button" onClick={() => setVue(null)} className="h-16 rounded-full bg-red-500 px-6 text-white text-xl font-bold">✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 🎮 Les jeux des petits : les lettres (onglet tout-petits de l'Alphabet) et « Remets dans l'ordre » */
function PageJeux({ toutes, gagnerEtoile }: { toutes: FichePetit[]; gagnerEtoile: (s: string, r: string) => Promise<boolean> }) {
  const navigate = useNavigate();
  const [jeu, setJeu] = useState<'ablutions' | 'priere' | null>(null);
  if (jeu) return <JeuOrdre fiches={toutes.filter((f) => f.rubrique === jeu)} gagner={() => gagnerEtoile('etapes', `${jeu}:${cleJour()}`)} fin={() => setJeu(null)} />;
  const cartes = [
    { emoji: '🔤', nom: 'Les lettres', fond: 'from-orange-300 to-red-500', action: () => navigate('/alphabet') },
    { emoji: '💧', nom: 'Les ablutions dans l\'ordre', fond: RUBRIQUES.ablutions.fond, action: () => setJeu('ablutions') },
    { emoji: '🕌', nom: 'Ma prière dans l\'ordre', fond: RUBRIQUES.priere.fond, action: () => setJeu('priere') },
  ];
  return (
    <div className="grid grid-cols-2 gap-4">
      {cartes.map((c) => (
        <button key={c.nom} type="button" onClick={c.action} aria-label={c.nom}
          className={`aspect-square rounded-[32px] bg-gradient-to-br ${c.fond} shadow-xl flex flex-col items-center justify-center gap-2 text-white active:scale-95 transition-transform`}>
          <span className="text-7xl">{c.emoji}</span>
          <span className="text-base font-extrabold px-2 text-center drop-shadow">{c.nom}</span>
        </button>
      ))}
    </div>
  );
}
