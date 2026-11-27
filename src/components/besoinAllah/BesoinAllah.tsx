import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { ZonesContenu } from '@/components/shared/ZonesContenu';
import { useBesoinsAllah } from '@/hooks/useBesoinsAllah';
import {
  basculerFavori, besoinAVerifier, lireFavoris, texteSur, trierAvecFavoris, type Besoin, type NomBase,
} from '@/lib/besoinAllah';

const HistoireBesoin = lazy(() => import('./HistoireBesoin').then((m) => ({ default: m.HistoireBesoin })));
const GestionBesoinsAllah = lazy(() => import('./GestionBesoinsAllah').then((m) => ({ default: m.GestionBesoinsAllah })));

/**
 * 🤲 « Besoin d'Allah » dans la carte 99 noms d'Allah (choix K-L-M de Nadia, 27/11).
 * Bouton → (L) grille des émotions colorées → (M) fiche résumé : noms à invoquer (lien vers leur fiche), conseil,
 * verset / hadith et sa source, ❤️ favori (sur l'appareil) → ▶️ « Commencer la lecture » = (K) histoire animée.
 * Couleurs : ciel bleu clair / couchant orange-violet + or, fond propre à la fenêtre (lisible de jour comme de nuit).
 * Enseignante : ✏️ « Modifier les émotions » (ajouter, modifier, ranger, 🗑️ corbeille) + zones de contenu par émotion.
 */
const FOND = 'linear-gradient(165deg, #cfeafd 0%, #e6f2fb 22%, #fde6cf 55%, #f9c59b 75%, #d7b3ea 100%)';
const OR = '#b7791f';

export function BoutonBesoinAllah({ isAdmin, userId, nomsBase, onOuvrirNom }: {
  isAdmin: boolean; userId: string | null; nomsBase: NomBase[];
  /** Ouvre la fiche d'un des 99 noms (la page décide s'il est ouvert ou verrouillé) */
  onOuvrirNom: (id: number) => void;
}) {
  const [params, setParams] = useSearchParams();
  const [ouvert, setOuvert] = useState(false);
  const [gestionNouvelle, setGestionNouvelle] = useState(false);

  // ⏳ « Continuer » une émotion commencée (brouillon) : /allah-names?besoin=nouveau
  useEffect(() => {
    if (params.get('besoin') !== 'nouveau' || !isAdmin) return;
    setOuvert(true);
    setGestionNouvelle(true);
    const p = new URLSearchParams(params); p.delete('besoin'); setParams(p, { replace: true });
  }, [params, setParams, isAdmin]);

  return (
    <>
      <button type="button" onClick={() => setOuvert(true)}
        className="w-full max-w-md mx-auto flex items-center justify-center gap-3 rounded-2xl px-5 py-4 text-left font-bold shadow-lg active:scale-[0.98] transition border-2"
        style={{ background: FOND, borderColor: '#f3c76b', color: '#3b2410', boxShadow: '0 6px 24px rgba(245,180,60,0.35)' }}>
        <span className="text-3xl leading-none" aria-hidden="true">🤲</span>
        <span className="min-w-0">
          <span className="block text-lg leading-tight">Besoin d'Allah</span>
          <span className="block text-xs font-semibold opacity-80">Choisis ce que tu ressens : les noms à invoquer</span>
        </span>
      </button>
      {ouvert && (
        <FenetreBesoins isAdmin={isAdmin} userId={userId} nomsBase={nomsBase} gestionDepart={gestionNouvelle}
          onClose={() => { setOuvert(false); setGestionNouvelle(false); }}
          onOuvrirNom={(id) => { setOuvert(false); onOuvrirNom(id); }} />
      )}
    </>
  );
}

function FenetreBesoins({ isAdmin, userId, nomsBase, gestionDepart, onClose, onOuvrirNom }: {
  isAdmin: boolean; userId: string | null; nomsBase: NomBase[]; gestionDepart: boolean;
  onClose: () => void; onOuvrirNom: (id: number) => void;
}) {
  const { besoins, enBase } = useBesoinsAllah(nomsBase);
  const [favoris, setFavoris] = useState<string[]>(() => lireFavoris());
  const [choisi, setChoisi] = useState<string | null>(null);
  const [histoire, setHistoire] = useState(false);
  const [gestion, setGestion] = useState(gestionDepart);
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  const liste = useMemo(() => trierAvecFavoris(besoins, favoris), [besoins, favoris]);
  const besoin = besoins.find((b) => b.id === choisi) ?? null;

  // Changement de vue → la fenêtre repart en haut
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [choisi, scrollRef]);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-2" style={{ background: FOND, borderColor: '#f3c76b', color: '#2d1d0e' }}>
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[88dvh] overflow-y-auto p-4 pb-20 sm:p-6 sm:pb-20 space-y-4">
          <DialogTitle className="sr-only">Besoin d'Allah</DialogTitle>
          <DialogDescription className="sr-only">Choisis une émotion pour voir les noms d'Allah à invoquer.</DialogDescription>
          {besoin
            ? <FicheBesoin besoin={besoin} isAdmin={isAdmin} enBase={enBase} favori={favoris.includes(besoin.cle)}
                onFavori={() => setFavoris(basculerFavori(besoin.cle))} onRetour={() => setChoisi(null)}
                onLire={() => setHistoire(true)} onOuvrirNom={onOuvrirNom} />
            : <GrilleBesoins liste={liste} favoris={favoris} isAdmin={isAdmin} onChoisir={(b) => setChoisi(b.id)} onGestion={() => setGestion(true)} />}
        </div>
        <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />
        <Suspense fallback={null}>
          {histoire && besoin && <HistoireBesoin besoin={besoin} onClose={() => setHistoire(false)} />}
          {isAdmin && gestion && (
            <GestionBesoinsAllah besoins={besoins} enBase={enBase} userId={userId} nomsBase={nomsBase} nouvelleDepart={gestionDepart}
              onClose={() => setGestion(false)} />
          )}
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}

function GrilleBesoins({ liste, favoris, isAdmin, onChoisir, onGestion }: {
  liste: Besoin[]; favoris: string[]; isAdmin: boolean; onChoisir: (b: Besoin) => void; onGestion: () => void;
}) {
  return (
    <>
      <div className="text-center pt-2 pr-8 pl-8">
        <p className="font-arabic text-2xl" style={{ color: OR }}>أسماء الله الحسنى</p>
        <h2 className="text-xl sm:text-2xl font-extrabold">🤲 Besoin d'Allah</h2>
        <p className="text-sm font-medium opacity-80">Que ressens-tu en ce moment ? Touche une émotion.</p>
      </div>
      {isAdmin && (
        <div className="flex justify-center">
          <button type="button" onClick={onGestion}
            className="rounded-full px-4 py-2 text-sm font-bold bg-white/85 border-2 shadow-sm" style={{ borderColor: OR, color: '#5b3a12' }}>
            ✏️ Modifier les émotions
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 paysage:grid-cols-4 gap-3">
        {liste.map((b) => {
          const texte = texteSur(b.couleur);
          return (
            <button key={b.id} type="button" onClick={() => onChoisir(b)}
              className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 min-h-[112px] paysage:min-h-[88px] text-center font-bold shadow-md active:scale-95 transition border-2 overflow-hidden"
              style={{ background: `linear-gradient(150deg, ${b.couleur}, ${b.couleur}cc)`, color: texte, borderColor: '#f6d58a' }}>
              {favoris.includes(b.cle) && <span className="absolute top-1.5 right-2 text-sm" aria-label="Favori">❤️</span>}
              {isAdmin && besoinAVerifier(b) && <span className="absolute top-1.5 left-2 text-sm" title="Un point est à vérifier">⚠️</span>}
              <span className="text-4xl paysage:text-3xl leading-none" aria-hidden="true">{b.emoji}</span>
              <span className="text-sm leading-tight [overflow-wrap:anywhere]" style={{ textShadow: texte === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.35)' : 'none' }}>{b.titre}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function FicheBesoin({ besoin, isAdmin, enBase, favori, onFavori, onRetour, onLire, onOuvrirNom }: {
  besoin: Besoin; isAdmin: boolean; enBase: boolean; favori: boolean;
  onFavori: () => void; onRetour: () => void; onLire: () => void; onOuvrirNom: (id: number) => void;
}) {
  const texte = texteSur(besoin.couleur);
  return (
    <>
      <div className="flex items-center gap-2 pr-9">
        <button type="button" onClick={onRetour}
          className="rounded-full px-3 py-1.5 text-sm font-bold bg-white/85 border-2 shadow-sm shrink-0" style={{ borderColor: OR, color: '#5b3a12' }}>
          ← Les émotions
        </button>
        <button type="button" onClick={onFavori} aria-pressed={favori}
          className="ml-auto rounded-full px-3 py-1.5 text-sm font-bold bg-white/85 border-2 shadow-sm shrink-0" style={{ borderColor: '#f43f5e', color: '#9f1239' }}>
          {favori ? '❤️ Favori' : '🤍 Favori'}
        </button>
      </div>

      <div className="rounded-2xl p-4 text-center shadow-md border-2" style={{ background: `linear-gradient(150deg, ${besoin.couleur}, ${besoin.couleur}d9)`, color: texte, borderColor: '#f6d58a' }}>
        <p className="text-5xl leading-none" aria-hidden="true">{besoin.emoji}</p>
        <h2 className="text-2xl font-extrabold mt-1 [overflow-wrap:anywhere]">{besoin.titre}</h2>
        <p className="text-sm font-semibold opacity-90 [overflow-wrap:anywhere]">{besoin.accroche} {besoin.accroche_doree}</p>
      </div>

      {isAdmin && besoinAVerifier(besoin) && (
        <div className="rounded-xl p-3 text-sm bg-amber-50 border-2 border-amber-400 text-amber-900 space-y-1">
          <p className="font-bold">⚠️ À vérifier (visible par toi seulement)</p>
          {besoin.note && <p className="[overflow-wrap:anywhere]">{besoin.note}</p>}
          {besoin.noms.filter((n) => n.a_verifier).map((n) => (
            <p key={n.id} className="[overflow-wrap:anywhere]"><b>{n.phonetique}</b> : {n.note || 'à confirmer.'}</p>
          ))}
        </div>
      )}

      <section className="space-y-2">
        <h3 className="font-extrabold text-base" style={{ color: '#5b3a12' }}>✨ Les noms à invoquer</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {besoin.noms.map((n) => {
            const contenu = (
              <>
                <span className="flex items-baseline justify-between gap-2 w-full">
                  <span className="font-bold text-base [overflow-wrap:anywhere]" style={{ color: '#3b2410' }}>{n.phonetique}</span>
                  <span dir="rtl" className="font-arabic text-2xl leading-tight shrink-0" style={{ color: OR }}>{n.arabe}</span>
                </span>
                <span className="block text-sm [overflow-wrap:anywhere]" style={{ color: '#4a3520' }}>{n.sens}</span>
                {n.attestation && <span className="block text-xs opacity-70 [overflow-wrap:anywhere]">📖 {n.attestation}</span>}
                {n.nom_id != null
                  ? <span className="block text-xs font-bold mt-1" style={{ color: '#1d4ed8' }}>Voir sa fiche dans les 99 noms ›</span>
                  : <span className="block text-xs mt-1 opacity-70">Nom attesté, absent de la liste des 99 de l'appli</span>}
              </>
            );
            const classe = 'block w-full text-left rounded-xl p-3 bg-white/85 border-2 shadow-sm overflow-hidden';
            return n.nom_id != null ? (
              <button key={n.id} type="button" onClick={() => onOuvrirNom(n.nom_id!)} className={`${classe} active:scale-[0.98] transition hover:bg-white`}
                style={{ borderColor: '#f3c76b' }}>{contenu}</button>
            ) : (
              <div key={n.id} className={classe} style={{ borderColor: '#f3c76b' }}>{contenu}</div>
            );
          })}
        </div>
      </section>

      {besoin.conseil && (
        <section className="rounded-xl p-3 bg-white/80 border-2 shadow-sm" style={{ borderColor: '#a5d8f7' }}>
          <h3 className="font-extrabold text-base mb-1" style={{ color: '#075985' }}>🤲 Comment les utiliser dans ton invocation</h3>
          <p className="text-sm leading-relaxed [overflow-wrap:anywhere]" style={{ color: '#1e3a4a' }}>{besoin.conseil}</p>
        </section>
      )}

      {(besoin.fin_arabe || besoin.fin_traduction) && (
        <section className="rounded-xl p-4 text-center border-2 shadow-sm" style={{ background: 'linear-gradient(160deg, #0f1f47, #1b2f63)', borderColor: '#f3c76b', color: '#fff' }}>
          {besoin.fin_arabe && <p dir="rtl" className="font-arabic text-2xl leading-loose text-[#fdf1c7] [overflow-wrap:anywhere]">{besoin.fin_arabe}</p>}
          {besoin.fin_phonetique && <p className="text-sm italic text-[#f5d27a] [overflow-wrap:anywhere]">{besoin.fin_phonetique}</p>}
          {besoin.fin_traduction && <p className="text-base font-semibold mt-1 [overflow-wrap:anywhere]">«{'\u00a0'}{besoin.fin_traduction}{'\u00a0'}»</p>}
          {besoin.fin_source && <p className="text-xs font-bold tracking-[0.2em] text-[#f5c451] mt-1">{besoin.fin_source.toLocaleUpperCase('fr-FR')}</p>}
        </section>
      )}

      {/* ✏️ Zones de contenu de l'émotion (texte, images, vidéos, PDF, audio) — seulement quand l'émotion est en base */}
      {enBase && !besoin.id.startsWith('secours:') && (
        // Fond propre (thème clair ou sombre de l'appli) : le texte des zones reste lisible sur le dégradé clair de la fenêtre
        <div className="rounded-xl bg-background text-foreground p-2 empty:hidden">
          <ZonesContenu cible={`besoin-allah:${besoin.id}`} isAdmin={isAdmin} libelle={`Besoin d'Allah · ${besoin.titre}`} />
        </div>
      )}

      <button type="button" onClick={onLire}
        className="w-full rounded-2xl py-4 text-lg font-extrabold shadow-lg active:scale-[0.98] transition border-2"
        style={{ background: 'linear-gradient(135deg, #f5c451, #e08a2c)', color: '#2d1806', borderColor: '#fff3c4' }}>
        ▶️ Commencer la lecture
      </button>
    </>
  );
}
