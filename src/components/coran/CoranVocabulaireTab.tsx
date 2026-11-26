import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { rectSortingStrategy } from '@dnd-kit/sortable';
import { useAuth } from '@/contexts/AuthContext';
import { SortableCardList, type DragItemProps } from '@/components/shared/SortableCardList';
import { ZonesContenu } from '@/components/shared/ZonesContenu';
import { VocabPdfLecteur } from '@/components/coran/VocabPdfLecteur';
import { AccesVocabDialog } from '@/components/coran/AccesVocabDialog';
import { ModifierVocabDialog } from '@/components/coran/ModifierVocabDialog';
import { couleurVocab } from '@/components/coran/couleursVocab';
import { useCoranVocabulaire, CLE_VOCAB } from '@/hooks/useCoranVocabulaire';
import { enregistrerOrdre } from '@/lib/alphabetMedias';
import { badgeVisibilite, cibleZones, enfantsDe, lettreChapitre, pageDeLAdresse, textePages, type CarteVocab } from '@/lib/coranVocabulaire';
import { cn, errorMessage } from '@/lib/utils';

/**
 * 📖 Coran › onglet « Vocabulaire du Coran » (Nadia, 2026-11-26).
 * Niveau 1 : les sous-cartes (une par PDF de Nadia). Niveau 2 : les parties de son sommaire (+ « PDF entier »
 * en haut à droite). Niveau 2 bis (2026-11-26) : le SOUS-SOMMAIRE d'une partie qui a des chapitres (A, B, C…,
 * lignes enfants de la partie). Niveau 3 : le PDF de la partie, ouvert à la page du chapitre touché.
 * Navigation dans l'adresse (?vc=<sous-carte>&vk=<partie> pour le sous-sommaire, &vp=<partie|entier>&vpg=<page>&vch=<chapitre>
 * pour le PDF) → la flèche « retour » du téléphone revient d'un cran.
 * Enseignante : ✏️ titre / PDF, ✋ ranger (appui long), ➕ ajouter, 🗑️ corbeille, « Afficher à » (= « Qui voit »).
 */
const texteAcces = (c: CarteVocab) => (c.mode === 'personne' ? '🔒 Personne' : c.mode === 'certains' ? `🎯 Certains (${(c.group_ids?.length || 0) + (c.user_ids?.length || 0)})` : '🌍 Tout le monde');

const PoigneeDrag = () => (
  <span aria-hidden className="pointer-events-none absolute top-1.5 start-1.5 h-7 min-w-7 px-1 grid place-items-center rounded-full bg-card/90 shadow-sm border border-border text-xs" title="Appui long puis glisser">✋</span>
);

export function CoranVocabulaireTab() {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const { data: toutes = [], isLoading, isError } = useCoranVocabulaire();
  const [edition, setEdition] = useState<{ carte: CarteVocab | null; parentId: string | null; chapitre?: boolean } | null>(null);
  const [acces, setAcces] = useState<CarteVocab | null>(null);

  const sousCarte = toutes.find((c) => c.id === params.get('vc') && !c.parent_id) ?? null;
  const vp = params.get('vp');
  const partie = sousCarte && vp && vp !== 'entier' ? toutes.find((c) => c.id === vp && c.parent_id === sousCarte.id) ?? null : null;
  const entier = !!sousCarte && vp === 'entier';
  const vk = params.get('vk');
  const partieSommaire = sousCarte && vk && !vp ? toutes.find((c) => c.id === vk && c.parent_id === sousCarte.id) ?? null : null;
  const pageDepart = pageDeLAdresse(params.get('vpg'));

  // Ouvrir = nouvelle entrée dans l'historique (le « retour » du téléphone referme) ; page affichée depuis le haut
  const aller = (vc: string | null, p: string | null, plus: { vk?: string | null; vpg?: number | null; vch?: string | null } = {}) => {
    setParams((old) => {
      const n = new URLSearchParams(old);
      const mettre = (cle: string, v: string | null | undefined) => { if (v) n.set(cle, v); else n.delete(cle); };
      mettre('vc', vc); mettre('vp', p); mettre('vk', plus.vk); mettre('vpg', plus.vpg ? String(plus.vpg) : null); mettre('vch', plus.vch);
      return n;
    });
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };
  // 📑 Une partie qui a des chapitres ouvre son sous-sommaire ; sans chapitres, son PDF (comme avant)
  const ouvrirPartie = (s: CarteVocab, p: CarteVocab) => {
    if (enfantsDe(toutes, p.id).length) aller(s.id, null, { vk: p.id }); else aller(s.id, p.id);
  };
  const nbChapitres = (p: CarteVocab) => enfantsDe(toutes, p.id).length;
  const texteChapitres = (n: number) => (n ? `📑 ${n} chapitre${n > 1 ? 's' : ''}` : '');

  const ranger = async (liste: CarteVocab[]) => {
    const positions = new Map(liste.map((c, i) => [c.id, (i + 1) * 10]));
    queryClient.setQueriesData<CarteVocab[]>({ queryKey: CLE_VOCAB }, (old) => (old || []).map((c) => (positions.has(c.id) ? { ...c, position: positions.get(c.id)! } : c)));
    try {
      const r = await enregistrerOrdre('coran_vocabulaire', liste.map((c) => c.id));
      toast.success(r === 'en_attente' ? '📡 Ordre gardé, envoyé au retour du réseau' : '✋ Ordre enregistré (les élèves voient le même)');
    } catch (e) { toast.error(errorMessage(e)); void queryClient.invalidateQueries({ queryKey: CLE_VOCAB }); }
  };
  const vibrer = () => { try { navigator.vibrate?.(15); } catch { /* rien */ } };

  if (isLoading) return <div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}</div>;
  if (isError && !toutes.length) return <p className="text-sm text-center text-muted-foreground py-8">📡 Nécessite Internet : ouvre cet onglet une fois avec le réseau pour le garder sur ton appareil.</p>;

  const dialogues = (
    <>
      {isAdmin && edition && (
        <ModifierVocabDialog carte={edition.carte} parentId={edition.parentId} userId={user?.id ?? null} chapitre={!!edition.chapitre}
          freres={enfantsDe(toutes, edition.parentId)} onClose={() => setEdition(null)}
          onSupprimee={() => {
            if (edition.carte?.id === sousCarte?.id) aller(null, null);
            else if (edition.carte && edition.carte.id === (partie ?? partieSommaire)?.id) aller(sousCarte?.id ?? null, null);
          }} />
      )}
      {isAdmin && <AccesVocabDialog carte={acces} onClose={() => setAcces(null)} />}
    </>
  );

  // ─── Niveau 3 : le PDF d'une partie, ou le PDF entier ───
  if (sousCarte && (partie || entier)) {
    const c = couleurVocab(sousCarte.couleur);
    const parties = enfantsDe(toutes, sousCarte.id);
    const i = partie ? parties.findIndex((p) => p.id === partie.id) : -1;
    const url = entier ? sousCarte.pdf_url : partie?.pdf_url;
    const chapitres = partie ? enfantsDe(toutes, partie.id) : [];
    // Chapitre touché (son id dans l'adresse ; sinon le 1er chapitre qui commence à cette page)
    const vch = params.get('vch');
    const kParId = vch ? chapitres.findIndex((ch) => ch.id === vch) : -1;
    const kChap = kParId >= 0 ? kParId : pageDepart ? chapitres.findIndex((ch) => ch.page_debut === pageDepart) : -1;
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => aller(sousCarte.id, null)} className={cn('text-sm font-bold [overflow-wrap:anywhere] text-left', c.texte)}>
          ← {sousCarte.emoji} {sousCarte.titre}
        </button>
        <div className={cn('rounded-2xl px-4 py-3 text-white shadow-sm bg-gradient-to-br', c.degrade)}>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold leading-snug [overflow-wrap:anywhere]">{entier ? `📄 ${sousCarte.titre} : PDF entier` : partie!.titre}</h2>
              {partie && textePages(partie) && <p className="text-xs text-white/85">{textePages(partie)}{sousCarte.pdf_url ? ' du PDF entier' : ' du livre'}</p>}
              {kChap >= 0 && <p className="mt-1 text-xs font-bold [overflow-wrap:anywhere]">📍 {lettreChapitre(kChap)} · {chapitres[kChap].titre}</p>}
            </div>
            {isAdmin && partie && (
              <button type="button" onClick={() => setEdition({ carte: partie, parentId: sousCarte.id })} aria-label={`Modifier ${partie.titre}`}
                className="shrink-0 h-8 w-8 grid place-items-center rounded-full bg-white/20 hover:bg-white/30"><Pencil className="h-4 w-4" /></button>
            )}
          </div>
          {partie && (chapitres.length > 0 || isAdmin) && (
            <button type="button" onClick={() => aller(sousCarte.id, null, { vk: partie.id })}
              className="mt-2 rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-bold">
              📑 {chapitres.length ? `Sommaire de la partie (${chapitres.length})` : 'Ajouter des chapitres'}
            </button>
          )}
        </div>
        {url ? <VocabPdfLecteur url={url} pageDepart={partie ? pageDepart : null} /> : <p className="text-sm text-center text-muted-foreground py-6">🛠️ En cours de mise à jour : pas encore de PDF.</p>}
        {partie && <ZonesContenu cible={cibleZones(partie.id)} isAdmin={isAdmin} libelle={`${partie.titre} (Vocabulaire du Coran)`} />}
        {partie && parties.length > 1 && (
          <div className="flex gap-2">
            {i > 0 && (
              <button type="button" onClick={() => aller(sousCarte.id, parties[i - 1].id)} className={cn('flex-1 min-w-0 rounded-xl border px-3 py-2 text-left text-xs font-bold', c.doux)}>
                ‹ Précédente<span className="block font-semibold text-muted-foreground [overflow-wrap:anywhere]">{parties[i - 1].titre}</span>
              </button>
            )}
            {i < parties.length - 1 && (
              <button type="button" onClick={() => aller(sousCarte.id, parties[i + 1].id)} className={cn('flex-1 min-w-0 rounded-xl border px-3 py-2 text-right text-xs font-bold', c.doux)}>
                Suivante ›<span className="block font-semibold text-muted-foreground [overflow-wrap:anywhere]">{parties[i + 1].titre}</span>
              </button>
            )}
          </div>
        )}
        {dialogues}
      </div>
    );
  }

  // ─── Niveau 2 bis : le sous-sommaire d'une partie (ses chapitres A, B, C…) ───
  if (sousCarte && partieSommaire) {
    const c = couleurVocab(sousCarte.couleur);
    const p = partieSommaire;
    const chapitres = enfantsDe(toutes, p.id);
    const ligneChap = (ch: CarteVocab, k: number, drag?: DragItemProps) => {
      const { ref, style, isDragging, ...attrs } = drag ?? ({} as Partial<DragItemProps>);
      return (
        <div key={ch.id} ref={ref} style={style} {...attrs} className={cn('relative touch-manipulation', isDragging && 'opacity-40')}>
          <button type="button" onClick={() => aller(sousCarte.id, p.id, { vpg: ch.page_debut, vch: ch.id })}
            className={cn('w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-transform active:scale-[0.99]', c.doux, isAdmin && 'ps-10 pe-11')}>
            <span className={cn('shrink-0 h-9 w-9 grid place-items-center rounded-full text-white text-sm font-extrabold bg-gradient-to-br', c.degrade)}>{lettreChapitre(k)}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold leading-snug [overflow-wrap:anywhere]">{ch.titre}</span>
              {ch.page_debut && <span className="block text-[11px] text-muted-foreground">page {ch.page_debut} de la partie</span>}
            </span>
          </button>
          {isAdmin && <PoigneeDrag />}
          {isAdmin && (
            <button type="button" onClick={() => setEdition({ carte: ch, parentId: p.id, chapitre: true })} onPointerDown={(e) => e.stopPropagation()} aria-label={`Modifier ${ch.titre}`}
              className="absolute top-1/2 -translate-y-1/2 end-2 h-8 w-8 grid place-items-center rounded-full bg-card/90 shadow-sm border border-border"><Pencil className="h-3.5 w-3.5" /></button>
          )}
        </div>
      );
    };
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => aller(sousCarte.id, null)} className={cn('text-sm font-bold [overflow-wrap:anywhere] text-left', c.texte)}>
          ← {sousCarte.emoji} {sousCarte.titre}
        </button>
        <div className={cn('rounded-2xl px-4 py-3 text-white shadow-sm bg-gradient-to-br', c.degrade)}>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-white/90">📑 Sommaire de la partie</p>
              <h2 className="text-lg font-extrabold leading-snug [overflow-wrap:anywhere]">{p.titre}</h2>
              <p className="text-xs text-white/85">{[textePages(p) ? `${textePages(p)}${sousCarte.pdf_url ? ' du PDF entier' : ' du livre'}` : '', texteChapitres(chapitres.length)].filter(Boolean).join(' · ')}</p>
            </div>
            {isAdmin && (
              <button type="button" onClick={() => setEdition({ carte: p, parentId: sousCarte.id })} aria-label={`Modifier ${p.titre}`}
                className="shrink-0 h-8 w-8 grid place-items-center rounded-full bg-white/20 hover:bg-white/30"><Pencil className="h-4 w-4" /></button>
            )}
          </div>
          <button type="button" onClick={() => aller(sousCarte.id, p.id)}
            className="mt-2 rounded-full bg-white text-slate-900 px-3 py-1.5 text-xs font-extrabold shadow-sm active:scale-95 transition-transform">
            📄 Ouvrir toute la partie
          </button>
        </div>
        {isAdmin && <p className="text-[11px] text-muted-foreground px-1">👆 Touche un chapitre pour ouvrir le PDF à sa page · ✏️ pour le modifier · ✋ appui long puis glisser pour le ranger (les élèves voient le même ordre).</p>}
        <div className="space-y-2">
          {isAdmin ? (
            <SortableCardList items={chapitres} onReorder={(l) => void ranger(l)} onDragStart={vibrer} renderItem={(ch, drag) => ligneChap(ch, chapitres.indexOf(ch), drag)} />
          ) : chapitres.map((ch, k) => ligneChap(ch, k))}
          {!chapitres.length && <p className="text-sm text-center text-muted-foreground py-4">Pas encore de chapitre : touche « 📄 Ouvrir toute la partie ».</p>}
          {isAdmin && (
            <button type="button" onClick={() => setEdition({ carte: null, parentId: p.id, chapitre: true })}
              className="w-full rounded-xl border-2 border-dashed border-primary/50 py-3 text-sm font-bold text-primary hover:bg-primary/5">➕ Ajouter un chapitre</button>
          )}
        </div>
        {dialogues}
      </div>
    );
  }

  // ─── Niveau 2 : une sous-carte et les parties de son sommaire ───
  if (sousCarte) {
    const c = couleurVocab(sousCarte.couleur);
    const parties = enfantsDe(toutes, sousCarte.id);
    const badge = isAdmin ? badgeVisibilite(sousCarte) : null;
    const ligne = (p: CarteVocab, n: number, drag?: DragItemProps) => {
      const { ref, style, isDragging, ...attrs } = drag ?? ({} as Partial<DragItemProps>);
      return (
        <div key={p.id} ref={ref} style={style} {...attrs} className={cn('relative touch-manipulation', isDragging && 'opacity-40')}>
          <button type="button" onClick={() => ouvrirPartie(sousCarte, p)}
            className={cn('w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-transform active:scale-[0.99]', c.doux, isAdmin && 'ps-10 pe-11')}>
            <span className={cn('shrink-0 h-9 w-9 grid place-items-center rounded-full text-white text-sm font-extrabold bg-gradient-to-br', c.degrade)}>{n}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold leading-snug [overflow-wrap:anywhere]">{p.titre}</span>
              {(textePages(p) || nbChapitres(p) > 0) && (
                <span className="block text-[11px] text-muted-foreground">{[textePages(p), texteChapitres(nbChapitres(p))].filter(Boolean).join(' · ')}</span>
              )}
            </span>
          </button>
          {isAdmin && <PoigneeDrag />}
          {isAdmin && (
            <button type="button" onClick={() => setEdition({ carte: p, parentId: sousCarte.id })} onPointerDown={(e) => e.stopPropagation()} aria-label={`Modifier ${p.titre}`}
              className="absolute top-1/2 -translate-y-1/2 end-2 h-8 w-8 grid place-items-center rounded-full bg-card/90 shadow-sm border border-border"><Pencil className="h-3.5 w-3.5" /></button>
          )}
        </div>
      );
    };
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => aller(null, null)} className="text-sm font-bold text-[#7a1d22] dark:text-[#e08a8f]">← Vocabulaire du Coran</button>
        <div className={cn('rounded-2xl px-4 py-3 text-white shadow-sm bg-gradient-to-br', c.degrade)}>
          <div className="flex items-start gap-2">
            <span className="text-3xl leading-none shrink-0">{sousCarte.emoji}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold leading-snug [overflow-wrap:anywhere]">{sousCarte.titre}</h2>
              <p className="text-xs text-white/85">{parties.length} partie{parties.length > 1 ? 's' : ''}</p>
            </div>
            {sousCarte.pdf_url && (
              <button type="button" onClick={() => aller(sousCarte.id, 'entier')}
                className="shrink-0 rounded-full bg-white text-slate-900 px-3 py-1.5 text-xs font-extrabold shadow-sm active:scale-95 transition-transform">
                📄 PDF entier
              </button>
            )}
          </div>
          {isAdmin && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setAcces(sousCarte)} className="rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-bold">
                👁️ Afficher à : {texteAcces(sousCarte)}
              </button>
              {badge && <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', badge.classe)}>{badge.texte}</span>}
              <button type="button" onClick={() => setEdition({ carte: sousCarte, parentId: null })} className="rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-bold">
                ✏️ Modifier
              </button>
            </div>
          )}
        </div>
        <ZonesContenu cible={cibleZones(sousCarte.id)} isAdmin={isAdmin} libelle={`${sousCarte.titre} (Vocabulaire du Coran)`} />
        {isAdmin && <p className="text-[11px] text-muted-foreground px-1">👆 Touche une partie pour l'ouvrir · ✏️ pour la modifier · ✋ appui long puis glisser pour la ranger (les élèves voient le même ordre).</p>}
        <div className="space-y-2">
          {isAdmin ? (
            <SortableCardList items={parties} onReorder={(l) => void ranger(l)} onDragStart={vibrer} renderItem={(p, drag) => ligne(p, parties.indexOf(p) + 1, drag)} />
          ) : parties.map((p, n) => ligne(p, n + 1))}
          {!parties.length && <p className="text-sm text-center text-muted-foreground py-4">🛠️ En cours de mise à jour.</p>}
          {isAdmin && (
            <button type="button" onClick={() => setEdition({ carte: null, parentId: sousCarte.id })}
              className="w-full rounded-xl border-2 border-dashed border-primary/50 py-3 text-sm font-bold text-primary hover:bg-primary/5">➕ Ajouter une partie</button>
          )}
        </div>
        {dialogues}
      </div>
    );
  }

  // ─── Niveau 1 : les sous-cartes ───
  const sousCartes = enfantsDe(toutes, null);
  const tuile = (s: CarteVocab, drag?: DragItemProps) => {
    const { ref, style, isDragging, ...attrs } = drag ?? ({} as Partial<DragItemProps>);
    const c = couleurVocab(s.couleur);
    const parties = enfantsDe(toutes, s.id);
    const n = parties.length;
    const badge = isAdmin ? badgeVisibilite(s) : null;
    // 📑 2026-11-26 (Nadia) : le SOMMAIRE en tête de chaque carte ; un thème touché → on y va directement
    return (
      <div key={s.id} ref={ref} style={style} {...attrs} className={cn('relative touch-manipulation', isDragging && 'opacity-40')}>
        <div className={cn('h-full rounded-2xl text-white shadow-sm bg-gradient-to-br flex flex-col', c.degrade)}>
          <button type="button" onClick={() => aller(s.id, null)} className={cn('w-full p-4 pb-2 text-left flex flex-col gap-2 transition-transform active:scale-[0.98]', isAdmin && 'pe-12')}>
            <span className="text-4xl leading-none">{s.emoji}</span>
            <span>
              <span className="block font-extrabold leading-snug [overflow-wrap:anywhere]">{s.titre}</span>
              <span className="block text-xs text-white/85">{n} partie{n > 1 ? 's' : ''}{s.pdf_url ? ' · PDF entier' : ''}</span>
              {badge && <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold', badge.classe)}>{badge.texte}</span>}
            </span>
          </button>
          {n > 0 && (
            <nav aria-label={`Sommaire : ${s.titre}`} className="mx-3 mb-3 rounded-xl bg-white/15 p-2">
              <p className="px-1 pb-1 text-[11px] font-extrabold uppercase tracking-wide text-white/90">📑 Sommaire</p>
              <ol className="max-h-56 overflow-y-auto overscroll-contain space-y-0.5 pe-1">
                {parties.map((p, k) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => ouvrirPartie(s, p)} onPointerDown={(e) => e.stopPropagation()}
                      className="w-full flex items-start gap-2 rounded-lg px-1.5 py-1 text-left text-xs font-semibold leading-snug hover:bg-white/20 active:bg-white/25">
                      <span className="shrink-0 min-w-5 text-white/80 tabular-nums">{k + 1}.</span>
                      <span className="flex-1 min-w-0 [overflow-wrap:anywhere]">{p.titre}</span>
                      <span aria-hidden className="shrink-0 text-white/70">{nbChapitres(p) ? '📑' : '›'}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
        {isAdmin && <PoigneeDrag />}
        {isAdmin && (
          <button type="button" onClick={() => setEdition({ carte: s, parentId: null })} onPointerDown={(e) => e.stopPropagation()} aria-label={`Modifier ${s.titre}`}
            className="absolute top-1.5 end-1.5 h-8 w-8 grid place-items-center rounded-full bg-card/90 text-foreground shadow-sm border border-border"><Pencil className="h-3.5 w-3.5" /></button>
        )}
      </div>
    );
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground px-1">
        {isAdmin ? '👆 Touche une carte pour l’ouvrir · ✏️ pour la modifier · ✋ appui long puis glisser pour la ranger.' : 'Les mots et les signes du Coran, partie par partie. 👆 Touche une carte pour l’ouvrir.'}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {isAdmin ? (
          <SortableCardList items={sousCartes} strategy={rectSortingStrategy} onReorder={(l) => void ranger(l)} onDragStart={vibrer} renderItem={(s, drag) => tuile(s, drag)} />
        ) : sousCartes.map((s) => tuile(s))}
        {isAdmin && (
          <button type="button" onClick={() => setEdition({ carte: null, parentId: null })}
            className="min-h-[128px] rounded-2xl border-2 border-dashed border-primary/50 text-primary font-bold text-sm grid place-items-center hover:bg-primary/5">➕ Nouvelle sous-carte</button>
        )}
      </div>
      {!sousCartes.length && !isAdmin && <p className="text-sm text-center text-muted-foreground py-6">Ton professeur va bientôt ajouter du contenu ici. 🤲</p>}
      {dialogues}
    </div>
  );
}

export default CoranVocabulaireTab;
