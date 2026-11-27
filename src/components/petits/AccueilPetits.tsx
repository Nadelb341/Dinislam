import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { useEtoiles, useFichesPetits, useGagnerEtoile, useReglage, type FichePetit } from '@/hooks/usePetits';
import { EditionFichePetit } from './FichesPetitsAdmin';
import { GrandeEtoile, WeeklyPath } from '@/components/homework/WeeklyPath';
import { TreasureChest } from '@/components/homework/TreasureChest';
import { supabase } from '@/integrations/supabase/client';
import type { WeeklyProgram } from '@/lib/weeklyProgram';
import { confettiLettres } from '@/lib/confettiLettres';
import { sonHarpeEtoiles } from '@/lib/sonSaison';
import { duJour, ecouterFiche, momentPriere, refEtoileDuJour, RUBRIQUES, TUILES_AUTRES, TUILES_GRANDES } from '@/lib/petits';
import type { PrayerTimesData } from '@/hooks/usePrayerTimesCity';

/**
 * 🧸 L'accueil du Groupe 0 (1 à 6 ans, parfois 7-8) — Nadia, 2026-11-22, les 15 idées gardées :
 * 15 mot pour les parents · 1 le soleil et les 5 prières · 2 la petite phrase du jour · 3 mes étoiles (à la place des devoirs) ·
 * 4 quatre grosses tuiles · 5 aucun compteur de progression · 6 à 14 les cartes des petits (dou'as, Coran, histoires…).
 * Rien à lire pour l'enfant : grandes images, sa voix. L'enseignante a son ✏️ partout.
 */
const SCENES = [
  { ciel: 'from-orange-200 via-pink-200 to-sky-300', astre: '🌅', haut: 34 },
  { ciel: 'from-sky-300 to-sky-500', astre: '☀️', haut: 4 },
  { ciel: 'from-sky-300 to-amber-200', astre: '🌤️', haut: 18 },
  { ciel: 'from-orange-300 via-rose-400 to-purple-500', astre: '🌇', haut: 32 },
  { ciel: 'from-indigo-800 to-slate-900', astre: '🌙', haut: 8 },
];

/** Carte fermée : invisible pour l'enfant ; pour l'enseignante, grisée avec « 🔒 Fermée » */
function Bloc({ cle, ouverte, fermee, children, className = '' }: { cle: string; ouverte: (c: string) => boolean; fermee: (c: string) => boolean; children: React.ReactNode; className?: string }) {
  if (!ouverte(cle)) return null;
  if (!fermee(cle)) return <>{children}</>;
  return (
    <div className={`relative ${className}`}>
      <div className="opacity-45 grayscale">{children}</div>
      <span className="pointer-events-none absolute top-2 start-2 z-10 rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-extrabold text-white shadow">🔒 Fermée</span>
    </div>
  );
}

export function AccueilPetits({ isAdmin, userId, prayerTimes, lettresValidees, ouverte, fermee = () => false }: {
  isAdmin: boolean; userId: string | null; prayerTimes: PrayerTimesData | null; lettresValidees: number;
  /** La carte est-elle visible ? (élève : ouverte pour lui ; enseignante : toujours) */
  ouverte: (cle: string) => boolean;
  /** Enseignante : la carte est fermée à tous (affichée grisée) */
  fermee?: (cle: string) => boolean;
}) {
  const b = { ouverte, fermee };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: fiches = [] } = useFichesPetits();
  const { data: etoiles = [] } = useEtoiles(userId);
  const gagnerEtoile = useGagnerEtoile(userId);
  const mot = useReglage<string>('mot_parents_g0', '');
  const [motEdition, setMotEdition] = useState<string | null>(null);
  const [edition, setEdition] = useState<FichePetit | null>(null);
  const [coffre, setCoffre] = useState(false);
  const de = (r: string) => fiches.filter((f) => f.rubrique === r);
  const prieres = de('prieres5');
  const phrase = useMemo(() => duJour(fiches.filter((f) => f.rubrique === 'phrases')), [fiches]);
  const moment = prayerTimes ? momentPriere(new Date(), prayerTimes) : 1;
  const scene = SCENES[moment];
  const nbEtoiles = etoiles.length + lettresValidees;
  const rafraichir = () => void queryClient.invalidateQueries({ queryKey: ['petits-fiches'] });
  // ⭐ Les devoirs de la semaine de l'enfant (même chemin que les diamants des grands)
  const { data: programme = null } = useQuery({
    queryKey: ['weekly-program', userId],
    enabled: !!userId && !isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('weekly_program_view', { p_student: userId! });
      if (error) throw error;
      const row = (data || [])[0];
      return row ? ({ ...row, items: (row.items ?? []) as unknown as WeeklyProgram['items'] } as WeeklyProgram) : null;
    },
  });

  const phraseDite = phrase ? etoiles.some((e) => e.source === 'fiche' && e.ref === refEtoileDuJour(phrase)) : false;
  const direPhrase = async () => {
    if (!phrase) return;
    ecouterFiche(phrase);
    if (await gagnerEtoile('fiche', refEtoileDuJour(phrase))) setTimeout(() => { confettiLettres(['⭐']); sonHarpeEtoiles(); }, 900);
  };

  return (
    <div className="space-y-4">
      {/* 15 · Un mot pour les parents */}
      {(mot.valeur || isAdmin) && (
        <Bloc cle="mot" {...b}>
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3">
          {motEdition !== null ? (
            <div className="space-y-2">
              <TextareaDictee rows={2} maxLength={300} value={motEdition} onChange={(e) => setMotEdition(e.target.value)} placeholder="Ex. : Cette semaine, la lettre ب et la dou'a du repas 🍽️"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void mot.changer(motEdition.trim()).then(() => setMotEdition(null)); } }} />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setMotEdition(null)}>Annuler</Button>
                <Button size="sm" onClick={() => void mot.changer(motEdition.trim()).then(() => setMotEdition(null))}>💾 Enregistrer</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <p className="flex-1 text-sm"><span className="font-bold">👨‍👩‍👧 Pour les parents : </span>
                <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{mot.valeur || <span className="text-muted-foreground">(vide : touche ✏️ pour écrire un petit mot)</span>}</span></p>
              {isAdmin && <button type="button" onClick={() => setMotEdition(mot.valeur)} aria-label="Modifier le mot pour les parents" className="h-8 w-8 rounded-full bg-card border border-border shrink-0">✏️</button>}
            </div>
          )}
        </div>
        </Bloc>
      )}

      {/* 1 · Le soleil et les 5 prières : une grande image du moment, sans chiffres ; un toucher = le nom de la prière */}
      <Bloc cle="soleil" {...b}>
      <div className={`relative rounded-[32px] overflow-hidden shadow-xl bg-gradient-to-b ${scene.ciel} p-4 pt-24 sm:pt-28`}>
        <span className="absolute start-1/2 -translate-x-1/2 text-7xl drop-shadow-xl transition-all duration-1000" style={{ top: scene.haut }} aria-hidden>{scene.astre}</span>
        <div className="relative grid grid-cols-5 gap-1.5 sm:gap-3">
          {(prieres.length ? prieres : []).slice(0, 5).map((p, i) => (
            <button key={p.id} type="button" onClick={() => ecouterFiche(p)} aria-label={p.titre}
              className={`rounded-2xl py-2 flex flex-col items-center gap-0.5 shadow-lg transition-transform active:scale-95 ${i === moment ? 'bg-yellow-300 ring-4 ring-white scale-105' : 'bg-white/85'}`}>
              {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 object-contain" /> : <span className="text-3xl sm:text-4xl leading-none">{p.emoji}</span>}
              <span className="text-[11px] sm:text-sm font-extrabold text-slate-800 leading-tight">{p.titre}</span>
            </button>
          ))}
        </div>
        {isAdmin && <button type="button" onClick={() => navigate('/petits/prieres5')} className="absolute top-3 end-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold shadow">✏️ Les 5 prières</button>}
      </div>
      </Bloc>

      {/* 2 · La petite phrase du jour */}
      {phrase && (
        <Bloc cle="phrase" {...b}>
        <div className="relative rounded-[32px] bg-gradient-to-br from-yellow-200 to-amber-400 shadow-xl p-4 text-center space-y-1">
          <p className="text-xs font-bold text-amber-900">💬 La petite phrase du jour</p>
          <button type="button" onClick={() => void direPhrase()} className="w-full space-y-1 active:scale-[0.98] transition-transform">
            {phrase.image_url ? <img src={phrase.image_url} alt="" className="mx-auto h-20 object-contain" /> : <span className="block text-5xl">{phrase.emoji}</span>}
            {phrase.arabe && <span dir="rtl" className="block font-arabic text-4xl leading-[1.8] text-slate-900">{phrase.arabe}</span>}
            <span className="block text-xl font-extrabold text-slate-900">{phrase.titre}</span>
            {phrase.texte && <span className="block text-sm text-amber-950">{phrase.texte}</span>}
          </button>
          <div className="flex justify-center gap-2 pt-1">
            <button type="button" onClick={() => ecouterFiche(phrase)} aria-label="Écouter" className="h-14 w-14 rounded-full bg-white text-3xl shadow">🔊</button>
            <button type="button" onClick={() => void direPhrase()} className={`h-14 rounded-full px-4 font-extrabold shadow ${phraseDite ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900'}`}>{phraseDite ? '⭐ Bravo !' : '⭐ Je l\'ai dite !'}</button>
          </div>
          {isAdmin && (
            <div className="absolute top-3 end-3 flex gap-1">
              <button type="button" onClick={() => setEdition(phrase)} className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold shadow">✏️</button>
              <button type="button" onClick={() => navigate('/petits/phrases')} className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold shadow">Toutes</button>
            </div>
          )}
        </div>
        </Bloc>
      )}

      {/* 3 · Mes étoiles (22/11) : une GRANDE étoile par devoir de la semaine, puis le trésor (comme les diamants des grands) */}
      <Bloc cle="etoiles" {...b}>
      <div className="rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-700 shadow-xl p-3 text-white space-y-2">
        <button type="button" onClick={() => { setCoffre(true); sonHarpeEtoiles(); setTimeout(() => setCoffre(false), 1500); }}
          className="w-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <span className={`text-4xl ${coffre ? 'animate-bounce' : ''}`}>⭐</span>
          <span className="text-2xl font-extrabold">Mes étoiles : {nbEtoiles}</span>
        </button>
        {programme ? (
          <div className="rounded-3xl bg-white/95 text-slate-900 [&>div]:mb-0">
            <WeeklyPath program={programme} etoiles />
          </div>
        ) : (
          <div className="rounded-3xl bg-white/15 p-3 flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: Math.min(Math.max(nbEtoiles, 3), 8) }, (_, i) => (
              <GrandeEtoile key={i} fill={i < nbEtoiles ? 1 : 0} uid={`acc-${i}`} />
            ))}
            <TreasureChest open={false} locked className="h-16 w-20" />
          </div>
        )}
      </div>
      </Bloc>

      {/* 4 · Quatre grosses tuiles */}
      <div className="grid grid-cols-2 gap-4">
        {TUILES_GRANDES.map((t) => (
          <Bloc key={t.cle} cle={t.cle} {...b}>
          <button type="button" onClick={() => navigate(t.lien)} aria-label={t.titre}
            className={`w-full aspect-square rounded-[36px] bg-gradient-to-br ${t.fond} shadow-xl flex flex-col items-center justify-center gap-1 text-white active:scale-95 transition-transform`}>
            <span className="text-7xl sm:text-8xl leading-none drop-shadow">{t.emoji}</span>
            <span className="text-lg sm:text-xl font-extrabold drop-shadow">{t.titre}</span>
          </button>
          </Bloc>
        ))}
      </div>
      {/* 6 à 14 · Les autres cartes des petits */}
      <div className="grid grid-cols-3 gap-3">
        {TUILES_AUTRES.map((c) => {
          const r = RUBRIQUES[c];
          return (
            <Bloc key={c} cle={c} {...b}>
            <button type="button" onClick={() => navigate(`/petits/${c}`)} aria-label={r.titre}
              className={`w-full aspect-square rounded-[28px] bg-gradient-to-br ${r.fond} shadow-lg flex flex-col items-center justify-center gap-1 text-white active:scale-95 transition-transform p-1`}>
              <span className="text-5xl leading-none drop-shadow">{r.emoji}</span>
              <span className="text-[11px] sm:text-sm font-extrabold text-center leading-tight drop-shadow [overflow-wrap:anywhere]">{r.titre}</span>
            </button>
            </Bloc>
          );
        })}
      </div>

      {edition && <EditionFichePetit rubrique={edition.rubrique} fiche={edition} fiches={de(edition.rubrique)} userId={userId} onClose={() => setEdition(null)} rafraichir={rafraichir} />}
    </div>
  );
}
