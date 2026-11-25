import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { untypedDb } from '@/lib/untypedDb';
import { getInvocationEnrichment } from '@/data/invocationsData';
import { LecteurVideo } from '@/components/video/LecteurVideo';
import { SafeYoutubeEmbed } from '@/components/SafeYoutubeEmbed';
import { InvocationSceneSVG } from '@/components/invocations/InvocationSceneSVG';
import { ZonesContenu } from '@/components/shared/ZonesContenu';
import { confettiLettres } from '@/lib/confettiLettres';
import { sonHarpeEtoiles } from '@/lib/sonSaison';
import { cleJour, parler } from '@/lib/petits';

/**
 * 🤲 « Mes invocations » des tout-petits (Nadia, 22/11) : TOUTES les invocations de la carte Invocations de l'appli
 * (même table, mêmes images, mêmes vidéos), en grandes cartes colorées. Dans une invocation : la VIDÉO COURTE d'abord,
 * puis la VIDÉO ENTIÈRE dessous, bien différentes d'un coup d'œil (⚡ jaune / 🎬 violet). ⭐ « Je l'ai dite ! » une fois par jour.
 * Rien à recopier : une invocation ajoutée ou modifiée dans la carte Invocations apparaît ici aussi.
 */
interface Invoc { id: number; title_french: string; title_arabic: string | null; image_url: string | null; display_order: number }

const FONDS = ['from-amber-300 to-orange-500', 'from-sky-300 to-indigo-500', 'from-emerald-300 to-teal-600', 'from-pink-300 to-rose-500',
  'from-violet-300 to-purple-600', 'from-lime-300 to-green-600', 'from-cyan-300 to-blue-600', 'from-yellow-300 to-amber-500'];

const youtubeEmbed = (url: string) => { try { const v = new URL(url).searchParams.get('v'); return v ? `https://www.youtube.com/embed/${v}` : null; } catch { return null; } };

function useInvocationsPetits() {
  return useQuery({
    queryKey: ['invocations-petits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('invocations').select('id, title_french, title_arabic, image_url, display_order').order('display_order');
      if (error) throw error;
      return (data || []) as Invoc[];
    },
  });
}

export function ModeInvocations({ isAdmin, aEtoile, gagnerEtoile }: {
  isAdmin: boolean; aEtoile: (source: string, ref: string) => boolean; gagnerEtoile: (source: string, ref: string) => Promise<boolean>;
}) {
  const { data: liste = [], isLoading } = useInvocationsPetits();
  const [ouverte, setOuverte] = useState<number | null>(null);
  const dite = (i: Invoc) => aEtoile('invocation', `${i.id}:${cleJour()}`);
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {liste.map((inv, n) => (
          <button key={inv.id} type="button" onClick={() => setOuverte(n)} aria-label={inv.title_french}
            className={`relative aspect-square rounded-[32px] bg-gradient-to-br ${FONDS[n % FONDS.length]} shadow-xl p-2 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform`}>
            <span className="h-3/5 w-4/5 rounded-[24px] bg-white/90 shadow-inner grid place-items-center overflow-hidden p-1.5">
              {inv.image_url ? <img src={inv.image_url} alt="" className="h-full w-full object-contain" loading="lazy" /> : <span className="h-full w-full"><InvocationSceneSVG title={inv.title_french} /></span>}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-white text-center leading-tight drop-shadow [overflow-wrap:anywhere]">{inv.title_french}</span>
            {dite(inv) && <span className="absolute top-2 end-2 rounded-full bg-yellow-300 px-2 text-sm font-bold text-slate-900">⭐</span>}
          </button>
        ))}
      </div>
      {!liste.length && !isLoading && <p className="text-center text-white text-lg font-bold">🛠️ En cours de mise à jour</p>}
      {isAdmin && <p className="rounded-2xl bg-white/90 dark:bg-slate-900/90 p-3 text-sm shadow">✏️ Ce sont les invocations de la carte « Invocations » : ajoute, modifie ou range-les là-bas (⋮ › Gérer le contenu), elles changent ici aussi. Dans chaque invocation, « 📝 / 📎 » en bas ajoute un texte ou une vidéo (vu aussi dans la carte Invocations).</p>}
      {ouverte !== null && liste[ouverte] && (
        <InvocationEnGrand inv={liste[ouverte]} fond={FONDS[ouverte % FONDS.length]} isAdmin={isAdmin} dite={dite(liste[ouverte])}
          onDire={() => gagnerEtoile('invocation', `${liste[ouverte].id}:${cleJour()}`)} onClose={() => setOuverte(null)}
          onPrec={liste.length > 1 ? () => setOuverte((ouverte - 1 + liste.length) % liste.length) : undefined}
          onSuiv={liste.length > 1 ? () => setOuverte((ouverte + 1) % liste.length) : undefined} />
      )}
    </>
  );
}

function InvocationEnGrand({ inv, fond, isAdmin, dite, onDire, onClose, onPrec, onSuiv }: {
  inv: Invoc; fond: string; isAdmin: boolean; dite: boolean; onDire: () => Promise<boolean>; onClose: () => void; onPrec?: () => void; onSuiv?: () => void;
}) {
  const e = getInvocationEnrichment(inv.title_french);
  // Vidéo masquée par l'enseignante dans la carte Invocations (✏️ « vidéo de départ ») : masquée ici aussi
  const { data: extras } = useQuery({
    queryKey: ['invocation-extras', inv.id],
    queryFn: async () => {
      const { data, error } = await untypedDb.from('invocation_extras').select('masquer_video').eq('invocation_id', inv.id).maybeSingle();
      if (error) throw error;
      return data as { masquer_video: boolean } | null;
    },
  });
  const masquee = !!extras?.masquer_video;
  const courte = masquee ? null : e?.video ?? null;
  const entiere = masquee ? null : e?.videoEntiere ?? null;
  const yt = !masquee && !courte && e?.videoUrl ? youtubeEmbed(e.videoUrl) : null;
  const arabe = e?.arabic || inv.title_arabic || '';
  const [bravo, setBravo] = useState(false);
  useEffect(() => { document.getElementById('invocation-petit-haut')?.scrollIntoView({ block: 'start' }); }, [inv.id]);

  const dire = async () => {
    const nouvelle = await onDire();
    setBravo(true); setTimeout(() => setBravo(false), 2200);
    if (nouvelle) { confettiLettres(['⭐']); sonHarpeEtoiles(); }
  };

  return (
    // 2026-11-26 (Nadia : téléphone tourné) : en paysage peu haut, image + titre à gauche, vidéos et texte à droite,
    // boutons ‹ › sur les côtés (dans la marge) pour ne plus rien cacher
    <div className={`fixed inset-0 z-[900] bg-gradient-to-b ${fond} overflow-y-auto pt-[calc(env(safe-area-inset-top,0px)+84px)] pb-[calc(env(safe-area-inset-bottom,0px)+96px)] paysage:pt-[calc(env(safe-area-inset-top,0px)+64px)] paysage:pb-[calc(env(safe-area-inset-bottom,0px)+16px)]`}>
      <button type="button" onClick={onClose} aria-label="Fermer"
        className="fixed end-4 z-10 h-16 w-16 paysage:h-12 paysage:w-12 rounded-full bg-red-500 text-white text-4xl paysage:text-3xl font-bold shadow-xl grid place-items-center" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>✕</button>
      <div id="invocation-petit-haut" className="mx-auto max-w-xl px-4 space-y-4 text-center paysage:max-w-none paysage:px-20 paysage:flex paysage:items-start paysage:gap-4 paysage:space-y-0">
        <div className="space-y-4 paysage:w-[30%] paysage:shrink-0">
        <div className="mx-auto h-40 w-40 paysage:h-32 paysage:w-32 rounded-[32px] bg-white/90 shadow-xl p-3 grid place-items-center">
          {inv.image_url ? <img src={inv.image_url} alt="" className="max-h-full object-contain" /> : <InvocationSceneSVG title={inv.title_french} />}
        </div>
        <h2 className="text-3xl paysage:text-2xl font-extrabold text-white drop-shadow [overflow-wrap:anywhere]">{inv.title_french}</h2>
        </div>
        <div className="space-y-4 paysage:flex-1 paysage:min-w-0">

        {/* ⚡ 1 · La vidéo courte */}
        {(courte || yt) && (
          <section className="rounded-[28px] border-[6px] border-yellow-300 bg-yellow-50 shadow-xl overflow-hidden text-start">
            <p className="bg-yellow-300 px-4 py-2 text-lg font-extrabold text-slate-900">⚡ {entiere ? 'La vidéo courte' : 'La vidéo'}</p>
            {courte ? <LecteurVideo src={courte} playsInline controlsList="nodownload" className="aspect-video" videoClassName="h-full" />
              : <SafeYoutubeEmbed embedUrl={yt!} title={inv.title_french} />}
          </section>
        )}

        {/* 🎬 2 · La vidéo entière */}
        {entiere && (
          <section className="rounded-[28px] border-[6px] border-indigo-500 bg-indigo-50 shadow-xl overflow-hidden text-start">
            <p className="bg-indigo-500 px-4 py-2 text-lg font-extrabold text-white">🎬 La vidéo entière <span className="text-sm font-bold opacity-90">(plus longue)</span></p>
            <LecteurVideo src={entiere} playsInline preload="none" controlsList="nodownload" className="aspect-video" videoClassName="h-full" />
          </section>
        )}

        {arabe && (
          <button type="button" onClick={() => parler(arabe, 'ar')} className="w-full rounded-3xl bg-white/90 p-4 shadow-xl active:scale-[0.98] transition-transform">
            <span dir="rtl" className="block font-arabic text-3xl leading-[1.9] text-slate-900">{arabe}</span>
            {e?.translation && <span className="block text-sm text-slate-700 mt-1">{e.translation}</span>}
          </button>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {arabe && <button type="button" onClick={() => parler(arabe, 'ar')} aria-label="Écouter"
            className="h-20 w-20 rounded-full bg-white text-5xl shadow-xl grid place-items-center active:scale-95 transition-transform">🔊</button>}
          <button type="button" onClick={() => void dire()}
            className={`h-20 rounded-full px-6 text-xl font-extrabold shadow-xl active:scale-95 transition-transform ${dite ? 'bg-yellow-300 text-slate-900' : 'bg-white text-slate-900'}`}>
            {dite ? '⭐ Bravo !' : '⭐ Je l\'ai dite !'}
          </button>
        </div>
        {bravo && <p className="text-6xl animate-bounce" aria-hidden>🌟👏🌟</p>}
        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 p-3 text-start empty:hidden">
          <ZonesContenu cible={`invocation:${inv.id}`} isAdmin={isAdmin} libelle={inv.title_french} />
        </div>
        </div>
      </div>
      {(onPrec || onSuiv) && (
        <div className="fixed inset-x-0 flex justify-between px-4 pointer-events-none bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] paysage:bottom-auto paysage:top-1/2 paysage:-translate-y-1/2">
          <button type="button" onClick={onPrec} aria-label="Précédente" className="pointer-events-auto h-16 w-16 paysage:h-12 paysage:w-12 rounded-full bg-white/90 text-4xl font-black text-slate-700 shadow-xl">‹</button>
          <button type="button" onClick={onSuiv} aria-label="Suivante" className="pointer-events-auto h-16 w-16 paysage:h-12 paysage:w-12 rounded-full bg-white/90 text-4xl font-black text-slate-700 shadow-xl">›</button>
        </div>
      )}
    </div>
  );
}
