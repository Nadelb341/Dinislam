import { useEffect, useState } from 'react';
import { ZonesContenu } from '@/components/shared/ZonesContenu';
import { confettiLettres } from '@/lib/confettiLettres';
import { sonHarpeEtoiles } from '@/lib/sonSaison';
import { ecouterFiche, RUBRIQUES } from '@/lib/petits';
import type { FichePetit } from '@/hooks/usePetits';

/**
 * 🧸 Une fiche des petits en plein écran : grande image (ou emoji), le titre, l'arabe, la petite phrase, 🔊 ta voix,
 * ⭐ « Je l'ai dite / fait ! » (une étoile par jour), et les zones de contenu (vidéos, images…) que tu ajoutes.
 * ‹ › pour passer d'une fiche à l'autre, grosse croix rouge pour revenir.
 */
export function FicheEnGrand({ fiches, index, isAdmin, onIndex, onClose, etoileDuJour, gagner, onModifier, enBas, auMilieu }: {
  fiches: FichePetit[]; index: number; isAdmin: boolean; onIndex: (i: number) => void; onClose: () => void;
  etoileDuJour: (f: FichePetit) => boolean; gagner?: (f: FichePetit) => Promise<boolean>; onModifier?: (f: FichePetit) => void;
  /** Sous les zones de contenu (ex. le quiz audio des histoires) */
  enBas?: (f: FichePetit) => React.ReactNode;
  /** À la place du texte (ex. les vidéos des Histoires des Prophètes) */
  auMilieu?: (f: FichePetit) => React.ReactNode;
}) {
  const f = fiches[index];
  const r = f ? RUBRIQUES[f.rubrique] : null;
  const [vient, setVient] = useState(false);
  useEffect(() => { if (f) ecouterFiche(f); }, [f?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!f || !r) return null;

  const etoile = async () => {
    if (!gagner) return;
    const nouvelle = await gagner(f);
    setVient(true); setTimeout(() => setVient(false), 2200);
    if (nouvelle) { confettiLettres(['⭐']); sonHarpeEtoiles(); }
  };

  return (
    <div className={`fixed inset-0 z-[900] bg-gradient-to-b ${r.fond} overflow-y-auto`}
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 84px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
      <button type="button" onClick={onClose} aria-label="Fermer"
        className="fixed end-4 z-10 h-16 w-16 rounded-full bg-red-500 text-white text-4xl font-bold shadow-xl grid place-items-center" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>✕</button>
      {isAdmin && onModifier && (
        <button type="button" onClick={() => onModifier(f)} aria-label="Modifier la fiche"
          className="fixed start-4 z-10 h-14 px-4 rounded-full bg-white text-slate-900 font-bold shadow-xl" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}>✏️ Modifier</button>
      )}
      <div className="mx-auto max-w-xl px-4 space-y-4 text-center">
        <button type="button" onClick={() => ecouterFiche(f)} aria-label={`Écouter ${f.titre}`} className="mx-auto block active:scale-95 transition-transform">
          {f.image_url
            ? <img src={f.image_url} alt={f.titre} className="mx-auto max-h-[38vh] rounded-[32px] shadow-xl object-contain bg-white/40" />
            : <span className="block text-[9rem] leading-none drop-shadow-xl">{f.emoji || r.emoji}</span>}
        </button>
        <h2 className="text-3xl font-extrabold text-white drop-shadow [overflow-wrap:anywhere]">{f.titre}</h2>
        {f.arabe && <p dir="rtl" className="font-arabic text-4xl leading-[1.9] text-white drop-shadow">{f.arabe}</p>}
        {auMilieu?.(f)}
        {f.texte && <p className="rounded-3xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white p-4 text-lg leading-relaxed whitespace-pre-wrap text-start">{f.texte}</p>}
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => ecouterFiche(f)} aria-label="Écouter"
            className="h-20 w-20 rounded-full bg-white text-5xl shadow-xl grid place-items-center active:scale-95 transition-transform">🔊</button>
          {r.etoile && gagner && (
            <button type="button" onClick={() => void etoile()}
              className={`h-20 rounded-full px-6 text-xl font-extrabold shadow-xl active:scale-95 transition-transform ${etoileDuJour(f) ? 'bg-yellow-300 text-slate-900' : 'bg-white text-slate-900'}`}>
              {etoileDuJour(f) ? '⭐ Bravo !' : `⭐ ${r.etoile}`}
            </button>
          )}
        </div>
        {vient && <p className="text-6xl animate-bounce" aria-hidden>🌟👏🌟</p>}
        <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 p-3 text-start empty:hidden">
          <ZonesContenu cible={`petits:${f.id}`} isAdmin={isAdmin} libelle={f.titre} />
        </div>
        {enBas?.(f)}
      </div>
      {fiches.length > 1 && (
        <div className="fixed inset-x-0 flex justify-between px-4 pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
          <button type="button" onClick={() => onIndex((index - 1 + fiches.length) % fiches.length)} aria-label="Précédente"
            className="pointer-events-auto h-16 w-16 rounded-full bg-white/90 text-4xl font-black text-slate-700 shadow-xl">‹</button>
          <button type="button" onClick={() => onIndex((index + 1) % fiches.length)} aria-label="Suivante"
            className="pointer-events-auto h-16 w-16 rounded-full bg-white/90 text-4xl font-black text-slate-700 shadow-xl">›</button>
        </div>
      )}
    </div>
  );
}
