import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { lundiDeLaSemaine, type ReglagesSaisons, type Saison } from '@/lib/saisons';
import { annoncerNiveau, EVT_TOUCHE, PAUSE_MS, type DetailTouche } from './compagnonEvenement';
import { CacheCache, FeuSemaine } from './FeuEtCacheCache';
import { messagesCompagnon, questionDuJour, type Question } from './jeuxSaisonLogique';
import { depuisJour } from '@/lib/depuisJour';

/**
 * 🎠 Petits jeux des décors de saison (Nadia, 2026-11-11 : idées 2, 4, 6, 7, 9, 10). RIEN À GAGNER : juste des animations.
 * - 🦔 Compagnon = le personnage qui se promène en bas (2026-11-11) : grandit à la 1ʳᵉ connexion du jour (base : compagnon_du_jour,
 *   1 fois par 24 h) ; on le touche → il s'arrête 10 s et dit un message (voir compagnonEvenement.ts).
 * - 🌳 Arbre de la semaine : un fruit (🍎 ✨ 🌸 🍊) par devoir / lettre / leçon / sourate / invocation validé depuis lundi.
 * - 🎁 Secoue l'arbre (toucher l'arbre, le chalet ou le soleil en haut à gauche) : une fois par jour, un nom d'Allah à découvrir.
 * - ❓ Question du coin du feu (toucher la cheminée / le décor en bas à droite) : une question par jour.
 * - Réglages (Décorations des saisons) : chaque jeu allumé/éteint, pour tout le monde ou certains groupes. Hors ligne : copies gardées.
 */
const FRUIT: Record<Saison, string> = { automne: '🍎', hiver: '✨', printemps: '🌸', ete: '🍊' };
const COIN: Record<Saison, string> = { automne: '🔥 La question du coin du feu', hiver: '🔥 La question du coin du feu', printemps: '🌳 La question de l\'arbre', ete: '⛱️ La question du parasol' };
const jourLocal = () => new Date().toLocaleDateString('en-CA');
const lire = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } };

export function JeuxSaison({ saison, r, userId, prenom, isAdmin, largeurHautGauche }: {
  saison: Saison; r: ReglagesSaisons; userId: string | null; prenom: string; isAdmin: boolean; largeurHautGauche: number;
}) {
  const j = r.jeux;
  // Groupes concernés (vide = tout le monde) ; l'enseignante voit toujours, pour vérifier
  const { data: mesGroupes = [] } = useQuery({
    queryKey: ['my-group-ids', userId], enabled: !!userId && j.groupes.length > 0 && !isAdmin,
    queryFn: async () => ((await supabase.from('student_group_members').select('group_id').eq('user_id', userId!)).data || []).map((g) => g.group_id),
  });
  const cheminee = (saison === 'automne' && r.automne.cheminee) || (saison === 'hiver' && r.hiver.cheminee);
  const concerne = isAdmin || !j.groupes.length || mesGroupes.some((g) => j.groupes.includes(g));
  if (!userId || !concerne) return null;
  return (
    <>
      {(j.compagnon || j.parle) && <Compagnon userId={userId} prenom={prenom} grandit={j.compagnon} parle={j.parle} />}
      {(j.arbreSemaine || j.secoue) && <ArbreSemaine saison={saison} userId={userId} fruits={j.arbreSemaine} secoue={j.secoue} largeur={largeurHautGauche} />}
      {j.questionFeu && <QuestionFeu saison={saison} userId={userId} />}
      {/* 🔥 La flamme, ses bûches, le chat et les étincelles : seulement là où il y a une cheminée (automne, hiver) */}
      {cheminee && (j.feuSemaine || j.feuDevoirs || j.feuDecor || j.feuEtincelles) && (
        <FeuSemaine userId={userId} regle={j.feuSemaine} buches={j.feuDevoirs} decor={j.feuDecor} etincelles={j.feuEtincelles} />
      )}
      {j.cacheCache && <CacheCache saison={saison} userId={userId} />}
    </>
  );
}

// ——— 🦔 Le compagnon = le personnage qui se promène en bas (le petit personnage fixe est retiré, Nadia 2026-11-11) ———
function Compagnon({ userId, prenom, grandit, parle }: { userId: string; prenom: string; grandit: boolean; parle: boolean }) {
  const cle = `dinislam_compagnon_${userId}`;
  const { data: etat } = useQuery({
    queryKey: ['compagnon', userId, jourLocal()],
    staleTime: Infinity,
    enabled: grandit,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('compagnon_du_jour');
        if (error) throw error;
        const e = { niveau: data?.[0]?.niveau ?? 0, grandi: !!data?.[0]?.a_grandi };
        ecrire(cle, String(e.niveau));
        return e;
      } catch {
        // 📡 Hors ligne : la dernière taille connue (il grandira au retour du réseau)
        return { niveau: Number(lire(cle) || 0), grandi: false };
      }
    },
  });
  const niveau = grandit ? (etat?.niveau ?? Number(lire(cle) || 0)) : 0;
  // Le personnage qui marche prend sa taille (rien si « Le compagnon grandit » est éteint)
  useEffect(() => { annoncerNiveau(niveau); return () => annoncerNiveau(0); }, [niveau]);

  const { data: aFaire = 0 } = useQuery({
    queryKey: ['compagnon-devoirs', userId],
    enabled: parle,
    queryFn: async () => {
      const depuis = depuisJour(21);
      const [{ data: d }, { data: rendus }] = await Promise.all([
        supabase.from('devoirs').select('id').gte('created_at', depuis),
        supabase.from('devoirs_rendus').select('devoir_id, statut').eq('student_id', userId),
      ]);
      const faits = new Set((rendus || []).filter((x) => x.statut !== 'a_refaire').map((x) => x.devoir_id));
      return (d || []).filter((x) => !faits.has(x.id)).length;
    },
  });
  const messages = useMemo(() => messagesCompagnon({ prenom, grandi: !!etat?.grandi, niveau, aFaire }), [prenom, etat?.grandi, niveau, aFaire]);
  const refMessages = useRef(messages);
  refMessages.current = messages;
  const suivant = useRef(0);
  const [bulle, setBulle] = useState<{ x: number; y: number; nom: string; texte: string } | null>(null);

  // 💬 On le touche : il s'arrête 10 s (le décor s'en charge) et dit le message suivant
  useEffect(() => {
    if (!parle) return;
    let t = 0;
    const f = (e: Event) => {
      const d = (e as CustomEvent<DetailTouche>).detail;
      d.ecoute = true;
      const l = refMessages.current;
      setBulle({ x: d.x, y: d.y, nom: d.nom, texte: l[suivant.current % l.length] });
      suivant.current += 1;
      window.clearTimeout(t);
      t = window.setTimeout(() => setBulle(null), PAUSE_MS);
    };
    window.addEventListener(EVT_TOUCHE, f);
    return () => { window.removeEventListener(EVT_TOUCHE, f); window.clearTimeout(t); };
  }, [parle]);

  if (!bulle) return null;
  const larg = Math.min(260, window.innerWidth * 0.72);
  const gauche = Math.max(8, Math.min(window.innerWidth - larg - 8, bulle.x - 24));
  return createPortal(
    <div role="status" className="jeux-bulle fixed z-[60] rounded-2xl rounded-bl-sm bg-white/95 dark:bg-card px-3 py-2 text-sm shadow-lg border border-amber-200"
      style={{ left: gauche, bottom: Math.max(60, window.innerHeight - bulle.y + 6), width: larg }}>
      <button type="button" aria-label="Fermer" onClick={() => setBulle(null)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#EF4444] text-white text-xs font-bold">✕</button>
      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">{bulle.nom}</p>
      <p className="[overflow-wrap:anywhere]">{bulle.texte}</p>
    </div>,
    document.body,
  );
}

// ——— 🌳 Arbre de la semaine + 🎁 Secoue l'arbre ———
function ArbreSemaine({ saison, userId, fruits, secoue, largeur }: { saison: Saison; userId: string; fruits: boolean; secoue: boolean; largeur: number }) {
  const lundi = lundiDeLaSemaine();
  const { data: n = 0 } = useQuery({
    queryKey: ['arbre-semaine', userId, lundi],
    enabled: fruits,
    queryFn: async () => {
      const depuis = new Date(`${lundi}T00:00:00`).toISOString();
      const res = await Promise.all([
        supabase.from('devoirs_rendus').select('id', { count: 'exact', head: true }).eq('student_id', userId).eq('statut', 'corrige').gte('rendu_at', depuis),
        supabase.from('user_alphabet_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_validated', true).gte('created_at', depuis),
        supabase.from('user_nourania_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_validated', true).gte('completed_at', depuis),
        supabase.from('user_sourate_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_validated', true).gte('validated_at', depuis),
        supabase.from('user_invocation_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_validated', true).gte('updated_at', depuis),
      ]);
      return res.reduce((s, x) => s + (x.count ?? 0), 0);
    },
  });
  const [surprise, setSurprise] = useState<null | { arabe: string; translit: string; sens: string; explication: string | null; audio: string | null; deja: boolean }>(null);
  const [tombe, setTombe] = useState(false);
  const places = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const a = (i * 137.5 * Math.PI) / 180, d = 0.18 + 0.22 * ((i * 7) % 10) / 10;
    return { x: 50 + Math.cos(a) * d * 100, y: 34 + Math.sin(a) * d * 70 };
  }), []);
  const secouer = async () => {
    const cle = `dinislam_secoue_${userId}`;
    const deja = lire(cle) === jourLocal();
    setTombe(true); setTimeout(() => setTombe(false), 1200);
    // Le nom d'Allah du jour (le même toute la journée)
    const debut = new Date(new Date().getFullYear(), 0, 0).getTime();
    const ordre = (Math.floor((Date.now() - debut) / 86400000) % 99) + 1;
    try {
      const { data } = await supabase.from('allah_names').select('name_arabic, transliteration, name_french, explanation, audio_url').eq('display_order', ordre).maybeSingle();
      if (!data) return;
      ecrire(cle, jourLocal());
      setTimeout(() => setSurprise({ arabe: data.name_arabic, translit: data.transliteration || '', sens: data.name_french, explication: data.explanation, audio: data.audio_url, deja }), 700);
    } catch { /* hors ligne et jamais vu : rien */ }
  };
  const nbFruits = Math.min(n, 12);
  return (
    <>
      <div className="absolute z-[6] pointer-events-none" style={{ top: 6, left: -6, width: largeur, height: largeur * 0.9 }}>
        {fruits && places.slice(0, nbFruits).map((p, i) => (
          <span key={i} className={`absolute text-[15px] leading-none ${tombe ? 'jeux-secoue' : 'jeux-fruit'}`} style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${i * 0.12}s` }}>{FRUIT[saison]}</span>
        ))}
        {tombe && <span className="absolute text-2xl jeux-tombe" style={{ left: '45%', top: '40%' }}>{FRUIT[saison] === '✨' ? '🎁' : FRUIT[saison]}</span>}
        {secoue && (
          <button type="button" onClick={() => void secouer()} aria-label="Secoue l'arbre pour une surprise"
            className="pointer-events-auto absolute inset-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500" />
        )}
      </div>
      {surprise && createPortal(
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/30 px-4" onClick={() => setSurprise(null)}>
          <div className="jeux-bulle max-w-sm w-full rounded-3xl bg-card p-5 text-center space-y-2 shadow-2xl border-2 border-amber-300" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">{surprise.deja ? '🎁 Ta surprise du jour (déjà ouverte)' : '🎁 Surprise ! Le nom d\'Allah du jour'}</p>
            <p className="font-arabic text-5xl leading-snug">{surprise.arabe}</p>
            <p className="font-bold text-lg">{surprise.translit}</p>
            <p className="text-sm">{surprise.sens}</p>
            {surprise.explication && <p className="text-xs text-muted-foreground">{surprise.explication}</p>}
            {surprise.audio && <audio controls src={surprise.audio} className="w-full h-10" />}
            <p className="text-[11px] text-muted-foreground">Reviens demain : un nouveau fruit t'attendra {FRUIT[saison]}</p>
            <button type="button" onClick={() => setSurprise(null)} className="mt-1 rounded-xl bg-amber-500 text-white px-4 py-2 text-sm font-bold">Merci !</button>
          </div>
        </div>, document.body)}
    </>
  );
}

// ——— ❓ La question du coin du feu ———
function QuestionFeu({ saison, userId }: { saison: Saison; userId: string }) {
  const cle = `dinislam_question_feu_${userId}`;
  const [repondu, setRepondu] = useState(() => lire(cle) === jourLocal());
  const [ouvert, setOuvert] = useState(false);
  const [choix, setChoix] = useState<string | null>(null);
  const { data: apprises = [] } = useQuery({
    queryKey: ['question-feu-lettres', userId],
    queryFn: async () => {
      const { data } = await supabase.from('user_alphabet_progress').select('letter_id, alphabet_letters(letter_arabic, name_french)').eq('user_id', userId).eq('is_validated', true);
      return (data || []).map((x) => (x as unknown as { alphabet_letters: { letter_arabic: string; name_french: string } | null }).alphabet_letters).filter((x): x is { letter_arabic: string; name_french: string } => !!x);
    },
  });
  const q: Question = useMemo(() => questionDuJour(jourLocal(), apprises), [apprises]);
  const repondre = (o: string) => { setChoix(o); setRepondu(true); ecrire(cle, jourLocal()); };
  return createPortal(
    <>
      {/* Petit bouton posé sur la cheminée (44 px) : il ne cache jamais les cartes */}
      <button type="button" onClick={() => { setOuvert(true); setChoix(null); }} aria-label={COIN[saison]}
        className={`fixed z-[31] grid place-items-center rounded-full w-11 h-11 ${repondu ? 'opacity-40' : 'jeux-question'}`}
        style={{ right: 'calc(max(4px, env(safe-area-inset-right, 0px)) + 22px)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 58px)' }}>
        <span className={`rounded-full text-sm font-extrabold w-7 h-7 grid place-items-center shadow ${repondu ? 'bg-white/80 text-orange-700' : 'bg-amber-400 text-amber-950'}`}>{repondu ? '🔥' : '?'}</span>
      </button>
      {ouvert && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/30 px-4" onClick={() => setOuvert(false)}>
          <div className="jeux-bulle max-w-sm w-full rounded-3xl bg-card p-5 space-y-3 shadow-2xl border-2 border-orange-300" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-bold text-orange-700 dark:text-orange-300">{COIN[saison]}</p>
            <p className="font-bold text-base">{q.question}</p>
            {q.grand && <p className="font-arabic text-6xl text-center leading-snug">{q.grand}</p>}
            <div className="grid gap-2">
              {q.options.map((o) => (
                <button key={o} type="button" disabled={!!choix} onClick={() => repondre(o)}
                  className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold text-start ${choix && o === q.bonne ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : choix === o ? 'border-red-400 bg-red-50 dark:bg-red-950/30' : 'bg-card'}`}>{o}</button>
              ))}
            </div>
            {choix && <p className="text-sm font-bold">{choix === q.bonne ? '🎉 Bravo, ma shā\' Allah !' : `Presque ! La bonne réponse : ${q.bonne}`}</p>}
            <p className="text-[11px] text-muted-foreground">Une nouvelle question chaque jour.</p>
            <button type="button" onClick={() => setOuvert(false)} className="w-full rounded-xl bg-orange-500 text-white py-2 text-sm font-bold">Fermer</button>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
