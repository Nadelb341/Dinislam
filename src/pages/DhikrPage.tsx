import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTitreCarte } from '@/hooks/useTitreCarte';
import { useAccesPetits } from '@/hooks/usePetits';
import { envoyerCarnetUneFois, noterDhikr, useCarnet, useDhikrGestes, useDhikrItems, useDhikrQuiz, type DefiDhikr } from '@/hooks/useDhikr';
import { ZonesContenu } from '@/components/shared/ZonesContenu';
import { FondDhikr, IMAGE_FOND_DHIKR, StylesDhikr, useAmbiance } from '@/components/dhikr/Ambiance';
import { Chapelet, type EtapeChapelet } from '@/components/dhikr/Chapelet';
import { PastilleSource } from '@/components/shared/DegreAuthenticite';
import { ReveilTroisGestes, SerieGestes, TexteDhikr } from '@/components/dhikr/Series';
import { Bibliotheque } from '@/components/dhikr/Bibliotheque';
import { CarnetDhikr } from '@/components/dhikr/Carnet';
import { ajouterAuDefi, DefiGroupe } from '@/components/dhikr/DefiGroupe';
import { QuizMerite } from '@/components/dhikr/QuizMerite';
import { ReglagesDhikr } from '@/components/dhikr/ReglagesDhikr';
import { DhikrPetits } from '@/components/dhikr/DhikrPetits';
import { MessageApresPriere, messageApresAMontrer } from '@/components/dhikr/MessageApresPriere';
import { CHAMPS_GESTE, CHAMPS_ITEM, CHAMPS_QUESTION, EditeurFiche, type Champ } from '@/components/dhikr/EditeurDhikr';
import { QUOTIDIENS, type MomentCarnet } from '@/lib/dhikr';
import type { TrashItemType } from '@/lib/trash';
import { cn } from '@/lib/utils';
import type { DhikrGeste, DhikrItem, DhikrQuestion, SerieDhikr } from '@/data/dhikrContenu';

/**
 * 📿 La carte « Dhikr » (Nadia, 2026-11-27) — remplace l'ancien contenu (vide) de /module/dhikr.
 * Onglets : Chapelet · Séries (Matin, Soir, Réveil) · Après la prière · Bibliothèque · Mon carnet · Défi du groupe · Quiz (+ ⚙️ enseignante).
 * Liens directs : ?onglet=series&serie=soir · ?onglet=chapelet&dhikr=astaghfirullah · ?onglet=apres
 * Hors ligne : tout marche (contenu = dernière copie, sinon la copie de secours du code ; compteur, carnet, séries gardés sur l'appareil),
 * sauf le compteur EN DIRECT du défi et l'envoi de fichiers (📡 Nécessite Internet).
 */
type Onglet = 'chapelet' | 'series' | 'apres' | 'biblio' | 'carnet' | 'defi' | 'quiz' | 'reglages';
const ONGLETS: { cle: Onglet; titre: string; emoji: string; admin?: boolean }[] = [
  { cle: 'chapelet', titre: 'Chapelet', emoji: '📿' }, { cle: 'series', titre: 'Séries', emoji: '🌅' }, { cle: 'apres', titre: 'Après la prière', emoji: '🕌' },
  { cle: 'biblio', titre: 'Bibliothèque', emoji: '📚' }, { cle: 'carnet', titre: 'Mon carnet', emoji: '📒' }, { cle: 'defi', titre: 'Défi du groupe', emoji: '🤝' },
  { cle: 'quiz', titre: 'Quiz', emoji: '❓' }, { cle: 'reglages', titre: 'Réglages', emoji: '⚙️', admin: true },
];
type SousSerie = 'matin' | 'soir' | 'reveil';
const serieParDefaut = (): SousSerie => { const h = new Date().getHours(); return h >= 4 && h < 7 ? 'reveil' : h < 16 ? 'matin' : 'soir'; };

interface EnCours { titre: string; etapes: EtapeChapelet[]; merite: string | null; source: string | null; degre?: string | null; divergence?: string | null; moment: MomentCarnet; cle: string | null; defi?: DefiDhikr }
type Edition = { titre: string; table: string; ligne: Record<string, unknown> | null; defaut: Record<string, unknown>; champs: Champ[]; corbeille: TrashItemType };

/** Dans le choix du chapelet : les dhikr qu'on répète le plus d'abord, puis les autres dans l'ordre de la bibliothèque */
const PREMIERS = ['subhanallah', 'alhamdulillah', 'allahuakbar', 'astaghfirullah', 'subhanallah_wabihamdihi', 'deux_paroles', 'hawqala', 'tahlil_100', 'tahlil_10'];
const ordreChapelet = (i: DhikrItem) => { const k = PREMIERS.indexOf(i.cle ?? ''); return k === -1 ? 100 + i.position / 1000 : k; };

const etapesDe =(it: DhikrItem): EtapeChapelet[] => [{ titre: it.titre, arabe: it.arabe ?? '', phonetique: it.phonetique ?? '', sens: it.sens ?? '', nombre: Math.max(1, it.nombre), cle: it.cle }];

export default function DhikrPage() {
  const { user, isAdmin } = useAuth();
  const titre = useTitreCarte('/module/dhikr', 'Dhikr');
  const ambiance = useAmbiance();
  const petits = useAccesPetits(user?.id, isAdmin);
  const [params, setParams] = useSearchParams();
  const onglet = (ONGLETS.find((o) => o.cle === params.get('onglet') && (!o.admin || isAdmin))?.cle ?? 'chapelet') as Onglet;
  const serie = (['matin', 'soir', 'reveil'].includes(params.get('serie') ?? '') ? params.get('serie') : serieParDefaut()) as SousSerie;
  const aller = (o: Onglet, extra: Record<string, string> = {}) => setParams({ onglet: o, ...extra }, { replace: true });

  const { items } = useDhikrItems();
  const { gestes } = useDhikrGestes();
  const { questions } = useDhikrQuiz();
  const carnet = useCarnet(user?.id);
  // 📒 Le carnet déjà sur l'appareil part aussi en base (une fois par visite) : l'enseignante le voit dans la fiche de l'élève
  useEffect(() => { envoyerCarnetUneFois(user?.id); }, [user?.id]);
  const itemsVus = useMemo(() => (isAdmin ? items : items.filter((i) => i.visible)), [items, isAdmin]);
  const [enCours, setEnCours] = useState<EnCours | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);
  // 🕌 Message éphémère « Après la prière » : les 2 premières fois sur l'appareil, puis plus jamais
  const [messageApres, setMessageApres] = useState(false);
  const messageApresVu = useRef(false);
  useEffect(() => {
    if (onglet !== 'apres' || enCours || messageApresVu.current) return;
    messageApresVu.current = true;
    if (messageApresAMontrer()) setMessageApres(true);
  }, [onglet, enCours]);
  const fermerMessageApres = useCallback(() => setMessageApres(false), []);

  const cleChapelet = params.get('dhikr') ?? 'subhanallah';
  const itemChapelet = itemsVus.find((i) => i.cle === cleChapelet) ?? itemsVus.find((i) => i.cle === 'subhanallah') ?? itemsVus[0];
  const apres = gestes.find((g) => g.serie === 'apres_priere' && g.genre === 'geste' && g.visible && g.compteur?.length);
  const apresIntro = gestes.find((g) => g.serie === 'apres_priere' && g.genre === 'intro');

  const faire = (it: DhikrItem) => {
    if (it.cle === 'apres_priere') { setEnCours(null); aller('apres'); return; }
    setEnCours({ titre: it.titre, etapes: etapesDe(it), merite: it.merite, source: it.source, degre: it.degre, divergence: it.degre_divergence, moment: 'libre', cle: it.cle });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const fini = async (e: { moment: MomentCarnet; cle: string | null; defi?: DefiDhikr }, nombre: number) => {
    const quotidien = e.cle && (QUOTIDIENS as readonly string[]).includes(e.cle) ? `quotidien:${e.cle}` : undefined;
    await noterDhikr(user?.id, { moment: e.defi ? 'defi' : e.moment, nombre, journee: quotidien,
      dhikr: { cle: e.cle ?? (e.defi ? `defi:${e.defi.id}` : 'chapelet'), titre: (e.cle && items.find((i) => i.cle === e.cle)?.titre) || e.defi?.dhikr_titre || e.defi?.titre || (e.cle === 'apres_priere' ? 'Après la prière' : 'Chapelet') } });
    if (e.defi && user) {
      try { const r = await ajouterAuDefi(e.defi.id, user.id, nombre); toast.success(r === 'en_attente' ? '📡 Gardé, ajouté au défi au retour du réseau' : `🤝 +${nombre} pour le groupe !`); }
      catch { toast.error('Ajout au défi impossible'); }
    }
  };

  // ✏️ Fenêtres de modification (enseignante)
  const editerItem = (it: DhikrItem | null, moment?: string | null) => setEdition({
    titre: it ? 'Modifier le dhikr' : 'Nouveau dhikr', table: 'dhikr_items', ligne: it as unknown as Record<string, unknown> | null,
    defaut: { titre: '', arabe: '', phonetique: '', sens: '', nombre: 33, nombre_texte: '', merite: '', source: '', moments: moment ? [moment] : [], statut: 'a_verifier', visible: false, position: (items.length + 1) * 10 },
    champs: CHAMPS_ITEM, corbeille: 'dhikr_item',
  });
  const editerGeste = (g: DhikrGeste | null, s?: SerieDhikr) => setEdition({
    titre: g ? 'Modifier le geste' : 'Nouveau geste', table: 'dhikr_gestes', ligne: g as unknown as Record<string, unknown> | null,
    defaut: { serie: s ?? 'matin', genre: 'geste', titre: '', consigne: '', arabe: '', phonetique: '', sens: '', compteur: null, merite: '', source: '', lien: '', statut: 'a_verifier', visible: false, position: (gestes.filter((x) => x.serie === s).length + 1) * 10 },
    champs: g ? CHAMPS_GESTE : [{ cle: 'serie', label: 'Série', type: 'serie' }, ...CHAMPS_GESTE], corbeille: 'dhikr_geste',
  });
  const editerQuestion = (q: DhikrQuestion | null) => setEdition({
    titre: q ? 'Modifier la question' : 'Nouvelle question', table: 'dhikr_quiz', ligne: q as unknown as Record<string, unknown> | null,
    defaut: { question: '', choix: ['', '', ''], bonne: 0, explication: '', source: '', visible: false, position: (questions.length + 1) * 10 },
    champs: CHAMPS_QUESTION, corbeille: 'dhikr_question',
  });

  const nuit = ambiance.nom === 'nuit';
  const pastille = nuit ? 'bg-white/10 border-white/25 text-white' : 'bg-[#fff8ec]/90 border-[#ecd6aa] text-[#4a2c1a]';

  // 🧸 Les tout-petits : le gros bouton, 10 fois
  if (!isAdmin && petits.aAccueil) {
    return (
      <AppLayout title={titre}>
        <StylesDhikr />
        <FondDhikr ambiance={ambiance} className="min-h-[70dvh] p-4"><DhikrPetits /></FondDhikr>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={titre}>
      <StylesDhikr />
      <FondDhikr ambiance={ambiance} className="min-h-[100dvh] pb-[calc(var(--menu-bas,0px)+5rem)]">
        <div className="p-3 sm:p-5 max-w-5xl mx-auto space-y-3">
          {/* Le bandeau */}
          {/* Avec l'image de fond, son bandeau dessiné sert de titre (Nadia, 27/11) : le titre écrit reste pour les lecteurs d'écran seulement */}
          <header className={IMAGE_FOND_DHIKR ? 'sr-only' : 'pt-1 pr-24 sm:pr-40'}>
            <p dir="rtl" lang="ar" className="font-arabic text-2xl font-bold" style={{ color: ambiance.or }}>الذِّكْر</p>
            <h1 className="text-2xl sm:text-3xl font-black [overflow-wrap:anywhere]">📿 {titre}</h1>
            <p className="text-sm font-semibold" style={{ color: ambiance.doux }}>Se souvenir d'Allah, avec le cœur et la langue.</p>
          </header>

          {/* Les onglets (27/11, 2ᵉ demande) : TOUS visibles, 4 par ligne, pilules crème ; l'onglet choisi en doré. Jamais coupés. */}
          <nav className="grid grid-cols-4 gap-1.5 sm:gap-2 max-w-3xl" aria-label="Les parties de la carte Dhikr">
            {ONGLETS.filter((o) => !o.admin || isAdmin).map((o) => {
              const choisi = onglet === o.cle && !enCours;
              return (
                <button key={o.cle} type="button" onClick={() => { setEnCours(null); aller(o.cle); }} aria-current={choisi ? 'page' : undefined}
                  className={cn('min-w-0 rounded-[1.25rem] border px-1 py-1.5 flex flex-col items-center justify-center gap-0.5 min-h-[54px] transition active:scale-95',
                    choisi
                      ? 'bg-gradient-to-b from-[#f7d77e] to-[#dfa83a] border-[#b9831f] text-[#3d2500] shadow-[0_3px_10px_rgba(185,131,31,.45)]'
                      : 'bg-[#fff8ec]/95 border-[#ecd6aa] text-[#4a2c1a] shadow-[0_1px_4px_rgba(120,80,30,.15)]')}>
                  <span className="text-lg leading-none" aria-hidden>{o.emoji}</span>
                  <span className="text-[11px] sm:text-xs font-extrabold leading-tight text-center">{o.titre}</span>
                </button>
              );
            })}
          </nav>

          {enCours ? (
            <section className={cn('rounded-3xl border p-3 sm:p-4 space-y-2', nuit ? 'bg-white/5 border-white/15' : 'bg-white/45 border-white')}>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setEnCours(null)} className={cn('rounded-full border px-3 py-1.5 text-sm font-bold', pastille)}>‹ Retour</button>
                <h2 className="flex-1 min-w-0 text-lg font-black [overflow-wrap:anywhere]">{enCours.defi ? `🤝 ${enCours.defi.titre}` : enCours.titre}</h2>
              </div>
              <Chapelet key={`${enCours.cle}-${enCours.defi?.id ?? ''}`} etapes={enCours.etapes} merite={enCours.merite} source={enCours.source} degre={enCours.degre} divergence={enCours.divergence} ambiance={ambiance}
                onFini={(n) => void fini(enCours, n)} onTerminer={() => setEnCours(null)} />
            </section>
          ) : (
            <section>
              {onglet === 'chapelet' && (
                <div className="space-y-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" aria-label="Choisir le dhikr">
                    {itemsVus.filter((i) => i.cle !== 'apres_priere' && i.visible)
                      .sort((a, b) => ordreChapelet(a) - ordreChapelet(b)).map((i) => (
                      <button key={i.id} type="button" onClick={() => aller('chapelet', { dhikr: i.cle ?? '' })} aria-pressed={i.id === itemChapelet?.id}
                        className={cn('shrink-0 rounded-full border-2 px-3 py-1.5 text-sm font-bold whitespace-nowrap', i.id === itemChapelet?.id ? 'bg-amber-400 border-amber-500 text-amber-950' : pastille)}>
                        {i.titre.length > 34 ? i.phonetique?.split(',')[0] ?? i.titre : i.titre} · {i.nombre}
                      </button>
                    ))}
                  </div>
                  {itemChapelet && (
                    <div className={cn('rounded-3xl border p-3 sm:p-4', nuit ? 'bg-white/5 border-white/15' : 'bg-white/45 border-white')}>
                      <Chapelet key={itemChapelet.id} etapes={etapesDe(itemChapelet)} merite={itemChapelet.merite} source={itemChapelet.source} degre={itemChapelet.degre} divergence={itemChapelet.degre_divergence} ambiance={ambiance}
                        onFini={(n) => void fini({ moment: 'libre', cle: itemChapelet.cle }, n)} />
                    </div>
                  )}
                </div>
              )}

              {onglet === 'series' && (
                <div className="space-y-3">
                  <div role="tablist" className={cn('grid grid-cols-3 rounded-full border p-1 max-w-md', pastille)}>
                    {([['matin', '🌅 Matin'], ['soir', '🌙 Soir'], ['reveil', '☀️ Réveil']] as const).map(([s, t]) => (
                      <button key={s} type="button" role="tab" aria-selected={serie === s} onClick={() => aller('series', { serie: s })}
                        className={cn('rounded-full py-1.5 text-sm font-extrabold', serie === s && 'bg-amber-400 text-amber-950 shadow')}>{t}</button>
                    ))}
                  </div>
                  {serie === 'reveil'
                    ? <ReveilTroisGestes gestes={gestes} userId={user?.id ?? null} isAdmin={isAdmin} ambiance={ambiance} onEditer={(g) => editerGeste(g)} />
                    : <SerieGestes key={serie} serie={serie} gestes={gestes} userId={user?.id ?? null} isAdmin={isAdmin} ambiance={ambiance} onEditer={(g) => editerGeste(g)} />}
                </div>
              )}

              {onglet === 'apres' && (
                <div className={cn('rounded-3xl border p-3 sm:p-4 space-y-2', nuit ? 'bg-white/5 border-white/15' : 'bg-white/45 border-white')}>
                  <h2 className="text-lg sm:text-xl font-black">{apresIntro?.titre ?? 'Après la prière'}{apresIntro?.consigne && <span className="font-semibold"> · {apresIntro.consigne}</span>}</h2>
                  {apres ? (
                    <Chapelet key={apres.id} etapes={apres.compteur!} merite={apres.merite} source={apres.source} degre={apres.degre} divergence={apres.degre_divergence} ambiance={ambiance}
                      onFini={(n) => void fini({ moment: 'apres_priere', cle: 'apres_priere' }, n)} />
                  ) : <p className="font-bold">🛠️ En cours de mise à jour</p>}
                  {isAdmin && apres && <button type="button" onClick={() => editerGeste(apres)} className="text-sm font-bold underline">✏️ Modifier les étapes</button>}
                  {(() => { const it = items.find((i) => i.cle === 'istighfar_apres_priere' && i.visible); return it ? (
                    <details className={cn('rounded-2xl border p-2', pastille)}><summary className="cursor-pointer text-sm font-bold">🤲 Juste après le salâm</summary>
                      <TexteDhikr arabe={it.arabe} phonetique={it.phonetique} sens={it.sens} ambiance={nuit ? ambiance : { ...ambiance, texte: '#13254a' }} />
                      <p className="text-xs text-center mt-1">{it.merite} — <b>{it.source}</b> <PastilleSource source={it.source} degre={it.degre} divergence={it.degre_divergence} compact /></p></details>) : null; })()}
                </div>
              )}

              {onglet === 'biblio' && <Bibliotheque items={itemsVus} isAdmin={isAdmin} ambiance={ambiance} onFaire={faire} onEditer={(i) => editerItem(i)} onNouveau={(m) => editerItem(null, m)} />}
              {onglet === 'carnet' && <CarnetDhikr carnet={carnet} ambiance={ambiance} />}
              {onglet === 'defi' && (
                <DefiGroupe isAdmin={isAdmin} userId={user?.id ?? null} items={itemsVus} ambiance={ambiance}
                  onFaireDefi={(d, it) => setEnCours({
                    titre: d.titre, etapes: it ? etapesDe(it) : [{ titre: d.dhikr_titre ?? 'Dhikr', arabe: '', phonetique: d.dhikr_titre ?? '', sens: '', nombre: 33 }],
                    merite: it?.merite ?? null, source: it?.source ?? null, degre: it?.degre ?? null, divergence: it?.degre_divergence ?? null, moment: 'defi', cle: it?.cle ?? null, defi: d,
                  })} />
              )}
              {onglet === 'quiz' && <QuizMerite questions={questions} isAdmin={isAdmin} ambiance={ambiance} onEditer={(q) => editerQuestion(q)} onNouveau={() => editerQuestion(null)} />}
              {onglet === 'reglages' && isAdmin && <ReglagesDhikr gestes={gestes} ambiance={ambiance} onEditer={(g) => editerGeste(g)} onNouveau={(s) => editerGeste(null, s)} />}
            </section>
          )}

          {/* ✏️ Zones de contenu libres de la carte (texte, images, vidéos, PDF, audio), comme sur les autres cartes */}
          <div className={cn('rounded-3xl', nuit ? 'text-white' : 'text-slate-900')}>
            <ZonesContenu cible="carte:dhikr" isAdmin={isAdmin} libelle="Carte Dhikr" />
          </div>
        </div>
      </FondDhikr>
      {messageApres && <MessageApresPriere onFermer={fermerMessageApres} />}
      {edition && (
        <EditeurFiche ouvert titre={edition.titre} table={edition.table} ligne={edition.ligne} defaut={edition.defaut} champs={edition.champs}
          corbeille={edition.corbeille} userId={user?.id ?? null} onFermer={() => setEdition(null)}
          libelle={(l) => String(l.titre ?? l.question ?? 'Dhikr')} />
      )}
    </AppLayout>
  );
}
