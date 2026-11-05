import { Component, useState, useCallback, useEffect, useMemo, useRef, type ReactNode, type MouseEvent } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// Version « anciens appareils » du moteur PDF (vieux iPad/Safari), assortie à celle de la page (voir vite.config.ts)
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { loadDraft, saveDraft, clearDraft } from '@/hooks/useDraftRecovery';
import { moveToTrash } from '@/lib/trash';
import { cn, errorMessage } from '@/lib/utils';
import {
  BORD_TABLEAU, couperEnDeux, deplacerBord, enChiffresArabes, ligneEnDessous, lireLignes, margeDroite,
  nombreDeLignes, numeroter, statutSuivant, taillePastille, trierLignes, type LigneCours,
} from '@/lib/nouraniaLignes';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface Props {
  fileUrl: string;
  /** 🔢 Numéros de lignes (2026-11-05) : sans contentId, le cours s'affiche comme avant, sans numéros */
  contentId?: string;
  lessonId?: string;
  lessonTitle?: string;
  lignes?: unknown;
  lignesAuto?: unknown;
}

/** Plan B : le cours s'ouvre dans le lecteur PDF du téléphone/de la tablette */
const OpenPdfLink = ({ fileUrl }: { fileUrl: string }) => (
  <div className="py-6 text-center space-y-2">
    <p className="text-sm text-muted-foreground">Le cours ne s'affiche pas ici sur cet appareil.</p>
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
    >
      📄 Ouvrir le cours
    </a>
  </div>
);

/** Un souci d'affichage du PDF ne doit jamais faire planter toute la page Nourania (2026-10-14) */
class PdfSafetyNet extends Component<{ fileUrl: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('Lecteur PDF Nourania :', error); }
  render() { return this.state.failed ? <OpenPdfLink fileUrl={this.props.fileUrl} /> : this.props.children; }
}

const LIBELLE_STATUT: Record<LigneCours['s'], string> = {
  lecon: '✅ Ligne de cette leçon',
  autre: '⬜ Ligne d\'une autre leçon (pâle)',
  aucune: '🚫 Pas une ligne à lire',
};

const memes = (a: LigneCours[], b: LigneCours[]) => JSON.stringify(a) === JSON.stringify(b);

const PdfDocument = ({ fileUrl, contentId, lessonId, lessonTitle, lignes, lignesAuto }: Props) => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const lignesBase = useMemo(() => trierLignes(lireLignes(lignes)), [lignes]);
  const lignesDetectees = useMemo(() => trierLignes(lireLignes(lignesAuto)), [lignesAuto]);
  /** Mode « 🔢 Régler les lignes » (admin) : copie de travail, enregistrée seulement avec 💾 */
  const [edition, setEdition] = useState<LigneCours[] | null>(null);
  const [choisie, setChoisie] = useState<number | null>(null);
  const [allumee, setAllumee] = useState<number | null>(null);
  const [confirmer, setConfirmer] = useState<null | 'enregistrer' | 'quitter' | 'auto'>(null);
  const [busy, setBusy] = useState(false);
  const cleBrouillon = contentId && lessonId ? `dinislam_nourania_lignes_${lessonId}__${contentId}` : null;
  const repris = useRef(false);

  const affichees = edition ?? lignesBase;
  const numeros = useMemo(() => numeroter(affichees), [affichees]);
  const maxNumero = nombreDeLignes(affichees);
  const marge = margeDroite(containerWidth, edition ? Math.max(maxNumero, 9) : maxNumero);
  const largeurPage = Math.max(0, containerWidth - marge);
  const modifie = !!edition && !memes(edition, lignesBase);

  // Les lignes changent (réglage enregistré par le professeur, en direct) : la ligne allumée s'éteint
  useEffect(() => { setAllumee(null); }, [lignesBase]);

  // Brouillon d'un réglage pas encore enregistré : repris tout seul (message « Actions inachevées » à l'ouverture de l'appli)
  useEffect(() => {
    if (!isAdmin || !cleBrouillon || repris.current) return;
    const b = loadDraft<{ titre?: string; lignes?: unknown }>(cleBrouillon);
    if (!b) return;
    repris.current = true;
    setEdition(trierLignes(lireLignes(b.lignes)));
    toast('📝 Réglage des lignes repris', { description: 'Tes changements pas encore enregistrés sont revenus.' });
  }, [isAdmin, cleBrouillon]);

  // Brouillon gardé à chaque changement (jamais perdu si l'appli se ferme)
  useEffect(() => {
    if (!cleBrouillon || !edition) return;
    if (modifie) saveDraft(cleBrouillon, { titre: lessonTitle ?? 'Leçon Nourania', lignes: edition });
    else clearDraft(cleBrouillon);
  }, [cleBrouillon, edition, modifie, lessonTitle]);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0].contentRect.width);
      if (width > 0) setContainerWidth(width);
    });
    observer.observe(node);
    const w = Math.floor(node.offsetWidth);
    if (w > 0) setContainerWidth(w);
  }, []);

  const changer = (l: LigneCours[], garderChoix?: number | null) => {
    setEdition(trierLignes(l));
    setChoisie(garderChoix ?? null);
  };
  const modifierChoisie = (f: (l: LigneCours) => LigneCours | LigneCours[]) => {
    if (!edition || choisie == null) return;
    const l = edition[choisie];
    const r = f(l);
    const nouvelles = [...edition.slice(0, choisie), ...(Array.isArray(r) ? r : [r]), ...edition.slice(choisie + 1)];
    const triees = trierLignes(nouvelles);
    const cible = Array.isArray(r) ? r[0] : r;
    setEdition(triees);
    setChoisie(triees.findIndex((x) => x === cible));
  };

  /** Mode réglage : toucher un endroit vide de la page = une nouvelle ligne à cet endroit */
  const ajouterIci = (e: MouseEvent<HTMLDivElement>, page: number) => {
    if (!edition || e.target !== e.currentTarget) return;
    const r = e.currentTarget.getBoundingClientRect();
    const y = ((e.clientY - r.top) / r.height) * 100;
    const t = Math.round(Math.max(0, y - 4) * 10) / 10;
    const nouvelle: LigneCours = { p: page, t, b: Math.round(Math.min(100, t + 8.3) * 10) / 10, s: 'lecon' };
    const triees = trierLignes([...edition, nouvelle]);
    setEdition(triees);
    setChoisie(triees.indexOf(nouvelle));
  };

  const enregistrer = async () => {
    if (!edition || !contentId || !user) return;
    setBusy(true);
    try {
      // L'ancien réglage n'est jamais perdu : il part dans la corbeille de Paramètres
      if (lignesBase.length && !memes(lignesBase, edition)) {
        const ok = await moveToTrash(user.id, 'nourania_lignes', contentId, `Numéros de lignes — ${lessonTitle ?? 'leçon Nourania'}`, { content_id: contentId, lignes: lignesBase });
        if (!ok) { toast.error('Mise en corbeille de l\'ancien réglage impossible : rien n\'a été changé'); return; }
      }
      const { error } = await supabase.from('nourania_lesson_content').update({ lignes: edition as unknown as Json }).eq('id', contentId);
      if (error) { toast.error(errorMessage(error)); return; }
      if (cleBrouillon) clearDraft(cleBrouillon);
      await queryClient.invalidateQueries({ queryKey: ['nourania-lesson-contents'] });
      setEdition(null); setChoisie(null);
      toast.success(`🔢 ${nombreDeLignes(edition)} lignes numérotées enregistrées`, { description: 'Les élèves les voient tout de suite.' });
    } finally { setBusy(false); }
  };

  const quitterSansGarder = async () => {
    if (cleBrouillon && edition && user && modifie) {
      await moveToTrash(user.id, 'draft', cleBrouillon, `Brouillon — réglage des lignes « ${lessonTitle ?? 'leçon Nourania'} »`, { key: cleBrouillon, data: { titre: lessonTitle, lignes: edition } });
      clearDraft(cleBrouillon);
    }
    setEdition(null); setChoisie(null);
  };

  const { hauteur, police } = taillePastille(largeurPage);
  const ligneChoisie = edition && choisie != null ? edition[choisie] : null;
  const peutRegler = isAdmin && !!contentId;

  return (
    <div className="w-full space-y-2">
      {peutRegler && !edition && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" className="border-sky-400 text-sky-800 dark:text-sky-200"
            onClick={() => { setEdition(lignesBase.length ? lignesBase : []); setChoisie(null); }}>
            🔢 Régler les lignes
          </Button>
        </div>
      )}

      {edition && (
        <div className="sticky z-40 rounded-xl border-2 border-sky-400 bg-sky-50 dark:bg-sky-950/90 p-2.5 space-y-2 shadow-md"
          style={{ top: 'calc(3.5rem + env(safe-area-inset-top, 0px) + 4px)' }}>
          <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">
            🔢 Réglage des lignes · {nombreDeLignes(edition)} lignes numérotées
          </p>
          {ligneChoisie ? (
            <div className="space-y-2">
              <p className="text-xs text-sky-900 dark:text-sky-100">
                Ligne choisie : {numeros[choisie!] ? `n° ${numeros[choisie!]}` : 'sans numéro'} · page {ligneChoisie.p}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Button type="button" size="sm" variant="secondary" onClick={() => modifierChoisie((l) => ({ ...l, s: statutSuivant(l.s) }))}>
                  {LIBELLE_STATUT[ligneChoisie.s]}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => modifierChoisie((l) => deplacerBord(l, 't', -0.4))}>Haut ⬆️</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => modifierChoisie((l) => deplacerBord(l, 't', 0.4))}>Haut ⬇️</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => modifierChoisie((l) => deplacerBord(l, 'b', -0.4))}>Bas ⬆️</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => modifierChoisie((l) => deplacerBord(l, 'b', 0.4))}>Bas ⬇️</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => modifierChoisie((l) => couperEnDeux(l))}>✂️ Couper en deux</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => modifierChoisie((l) => [l, ligneEnDessous(l)])}>➕ Ligne en dessous</Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-sky-900 dark:text-sky-100">
              Touche une ligne pour la régler, ou un endroit vide de la page pour ajouter une ligne.
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 border-t border-sky-200 dark:border-sky-800 pt-2">
            <Button type="button" size="sm" disabled={!modifie || busy} onClick={() => setConfirmer('enregistrer')}>💾 Enregistrer</Button>
            {modifie && (
              <Button type="button" size="sm" variant="outline" onClick={() => changer(lignesBase)}>↩️ Revenir à la version d'origine</Button>
            )}
            {lignesDetectees.length > 0 && !memes(edition, lignesDetectees) && (
              <Button type="button" size="sm" variant="outline" onClick={() => setConfirmer('auto')}>🤖 Détection automatique</Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={() => (modifie ? setConfirmer('quitter') : (setEdition(null), setChoisie(null)))}>Fermer le réglage</Button>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full">
        {containerWidth > 0 && (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={
              <div className="py-8 text-center text-sm text-muted-foreground">
                Chargement du cours...
              </div>
            }
            error={<OpenPdfLink fileUrl={fileUrl} />}
          >
            {Array.from({ length: numPages }, (_, i) => {
              const page = i + 1;
              return (
                <div key={page} className="relative" style={{ width: largeurPage }}>
                  <Page
                    pageNumber={page}
                    width={largeurPage}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    className="block w-full"
                  />
                  {(affichees.length > 0 || edition) && (
                    <div
                      className={cn('absolute inset-0', edition ? 'cursor-crosshair' : 'pointer-events-none')}
                      onClick={edition ? (e) => ajouterIci(e, page) : undefined}
                    >
                      {affichees.map((l, idx) => {
                        if (l.p !== page) return null;
                        const zone = { top: `${l.t}%`, height: `${l.b - l.t}%` };
                        const n = numeros[idx];
                        if (edition) {
                          return (
                            <button
                              key={idx}
                              type="button"
                              aria-label={`Régler la ligne ${n ?? ''}`}
                              onClick={(e) => { e.stopPropagation(); setChoisie(idx); }}
                              className={cn(
                                'absolute left-[1.2%] rounded-sm',
                                l.s === 'lecon' && 'border-2 border-emerald-500 bg-emerald-400/10',
                                l.s === 'autre' && 'border-2 border-slate-400 bg-white/50',
                                l.s === 'aucune' && 'border-2 border-dashed border-red-400 bg-red-200/20',
                                choisie === idx && 'ring-4 ring-sky-500 ring-offset-1',
                              )}
                              style={{ ...zone, right: `${100 - BORD_TABLEAU}%` }}
                            >
                              {n != null && <Pastille n={n} hauteur={hauteur} police={police} allumee={choisie === idx} />}
                            </button>
                          );
                        }
                        if (l.s === 'aucune') return null;
                        if (l.s === 'autre') {
                          return <div key={idx} className="absolute left-[1.2%] bg-white/55 rounded-sm" style={{ ...zone, right: `${100 - BORD_TABLEAU}%` }} />;
                        }
                        const on = allumee === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            aria-label={`Ligne ${n}`}
                            aria-pressed={on}
                            onClick={() => setAllumee(on ? null : idx)}
                            className={cn(
                              'pointer-events-auto absolute left-[1.2%] rounded-[4px] transition-colors duration-200',
                              on ? 'bg-yellow-300/35 outline outline-[3px] -outline-offset-[3px] outline-amber-400' : 'bg-transparent',
                            )}
                            style={{ ...zone, right: `${100 - BORD_TABLEAU}%` }}
                          >
                            {n != null && <Pastille n={n} hauteur={hauteur} police={police} allumee={on} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </Document>
        )}
      </div>

      <AlertDialog open={confirmer === 'enregistrer'} onOpenChange={(o) => { if (!o) setConfirmer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enregistrer les numéros de lignes ?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">
              {edition ? `${nombreDeLignes(edition)} lignes numérotées` : ''} pour « {lessonTitle ?? 'cette leçon'} ». Les élèves les verront tout de suite. L'ancien réglage ira dans la corbeille de Paramètres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmer(null); void enregistrer(); }}>💾 Enregistrer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmer === 'auto'} onOpenChange={(o) => { if (!o) setConfirmer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revenir à la détection automatique ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les lignes reprennent la place trouvée automatiquement au départ. Rien n'est enregistré tant que tu n'appuies pas sur 💾 Enregistrer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmer(null); changer(lignesDetectees); }}>🤖 Reprendre la détection</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmer === 'quitter'} onOpenChange={(o) => { if (!o) setConfirmer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter le réglage des lignes ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tes changements ne sont pas encore enregistrés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Continuer le réglage</AlertDialogCancel>
            <AlertDialogAction className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              onClick={() => { setConfirmer(null); setEdition(null); setChoisie(null); toast('📝 Brouillon gardé', { description: 'Il te sera reproposé.' }); }}>
              📝 Garder en brouillon
            </AlertDialogAction>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setConfirmer(null); void quitterSansGarder(); }}>
              Abandonner (corbeille)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/** Pastille posée sur le cadre bleu : chiffre français collé aux lignes, chiffre arabe à sa droite (choix de Nadia, 2026-11-05) */
const Pastille = ({ n, hauteur, police, allumee }: { n: number; hauteur: number; police: number; allumee: boolean }) => (
  <span
    dir="ltr"
    className={cn(
      'absolute top-1/2 -translate-y-1/2 flex items-center whitespace-nowrap rounded-full border-2 font-bold leading-none shadow-sm transition-colors duration-200',
      allumee ? 'bg-amber-400 border-amber-400 text-white' : 'bg-white border-[#1b5e9c] text-[#1b5e9c]',
    )}
    style={{ left: 'calc(100% + 2px)', height: hauteur, fontSize: police, gap: Math.round(police * 0.35), paddingInline: Math.round(hauteur * 0.25) }}
  >
    <span>{n}</span>
    <span className="font-arabic" style={{ fontSize: Math.round(police * 1.08) }}>{enChiffresArabes(n)}</span>
  </span>
);

const NouraniaPdfViewer = (props: Props) => (
  <PdfSafetyNet fileUrl={props.fileUrl}>
    <PdfDocument {...props} />
  </PdfSafetyNet>
);

export default NouraniaPdfViewer;
