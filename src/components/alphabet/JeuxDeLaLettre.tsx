import { useEffect, useMemo, useRef, useState } from 'react';
import { confettiLettres } from '@/lib/confettiLettres';
import { sonHarpeEtoiles, sonPlop } from '@/lib/sonSaison';
import type { Tables } from '@/integrations/supabase/types';

/**
 * 🎮 Onglet « Jeux » de la carte d'une lettre, côté tout-petits (Nadia, 2026-11-21).
 * Tous les jeux tournent autour de LA lettre de la carte. Les autres lettres utilisées sont seulement celles
 * que l'enfant connaît déjà (validées par Nadia) : plus il en connaît, plus les jeux s'enrichissent.
 * Jamais de « raté » : une mauvaise réponse fait bouger la carte et redit le son de la bonne lettre.
 * Tout marche sans Internet (lettres dessinées par l'appli, sons déjà gardés sur l'appareil).
 */
type Lettre = Tables<'alphabet_letters'>;
type Jeu = 'bulles' | 'trouve' | 'paires' | 'trace';

const TEINTES = ['#f97316', '#10b981', '#ec4899', '#8b5cf6', '#0ea5e9', '#eab308', '#ef4444', '#14b8a6'];

function jouer(url: string | null | undefined) {
  if (!url) return;
  try { void new Audio(url).play().catch(() => {}); } catch { /* son indisponible */ }
}
function melanger<T>(t: T[]): T[] { return [...t].sort(() => Math.random() - 0.5); }
function bravo(l: Lettre) { confettiLettres([l.letter_arabic]); sonHarpeEtoiles(); }

/** Lettres connues pour les jeux : jusqu'à `max` autres lettres validées, tirées au hasard */
function autresConnues(lettre: Lettre, connues: Lettre[], max: number) {
  return melanger(connues.filter((c) => c.id !== lettre.id)).slice(0, max);
}

export function JeuxDeLaLettre({ lettre, connues }: { lettre: Lettre; connues: Lettre[] }) {
  const [jeu, setJeu] = useState<Jeu | null>(null);
  const nbAutres = connues.filter((c) => c.id !== lettre.id).length;
  const jeux: { id: Jeu; emoji: string; nom: string; ouvert: boolean; fond: string }[] = [
    { id: 'bulles', emoji: '🫧', nom: 'Attrape la lettre', ouvert: true, fond: 'from-sky-300 to-blue-500' },
    { id: 'trace', emoji: '✍️', nom: 'Trace la lettre', ouvert: true, fond: 'from-amber-300 to-orange-500' },
    { id: 'trouve', emoji: '👂', nom: 'Écoute et trouve', ouvert: nbAutres >= 1, fond: 'from-emerald-300 to-teal-500' },
    { id: 'paires', emoji: '🃏', nom: 'Les paires', ouvert: nbAutres >= 1, fond: 'from-pink-300 to-fuchsia-500' },
  ];

  if (jeu === 'bulles') return <Bulles lettre={lettre} autres={autresConnues(lettre, connues, 3)} retour={() => setJeu(null)} />;
  if (jeu === 'trace') return <Trace lettre={lettre} retour={() => setJeu(null)} />;
  if (jeu === 'trouve') return <Trouve lettre={lettre} connues={connues} retour={() => setJeu(null)} />;
  if (jeu === 'paires') return <Paires lettre={lettre} autres={autresConnues(lettre, connues, 2)} retour={() => setJeu(null)} />;

  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {jeux.map((j) => (
          <button key={j.id} type="button" aria-label={j.nom} onClick={() => { if (j.ouvert) { jouer(lettre.audio_url); setJeu(j.id); } }}
            className={`aspect-square rounded-[32px] bg-gradient-to-br ${j.fond} shadow-xl grid place-items-center text-7xl transition-transform active:scale-95 ${j.ouvert ? '' : 'opacity-50 grayscale'}`}>
            {j.ouvert ? j.emoji : '🔒'}
          </button>
        ))}
      </div>
      {nbAutres === 0 && <p className="text-center text-sm font-semibold text-white/90">🔒 Deux jeux s'ouvrent dès qu'une 2e lettre est validée.</p>}
    </div>
  );
}

function Retour({ retour }: { retour: () => void }) {
  return (
    <button type="button" onClick={retour} aria-label="Retour aux jeux"
      className="absolute start-4 h-16 w-16 rounded-full bg-white/90 text-3xl shadow-xl grid place-items-center z-10" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>🎮</button>
  );
}

/** 🫧 Des bulles montent : l'enfant touche celles qui portent SA lettre (les autres bulles = lettres déjà connues) */
function Bulles({ lettre, autres, retour }: { lettre: Lettre; autres: Lettre[]; retour: () => void }) {
  const fabriquer = () => {
    const bonnes = Array.from({ length: 5 }, () => lettre);
    const pieges = autres.length ? Array.from({ length: 4 }, (_, i) => autres[i % autres.length]) : [];
    return melanger([...bonnes, ...pieges]).map((l, i) => ({ cle: `${Date.now()}-${i}`, l, x: 6 + ((i * 37) % 78), duree: 7 + (i % 4) * 1.6, delai: i * 0.9, teinte: TEINTES[i % TEINTES.length] }));
  };
  const [bulles, setBulles] = useState(fabriquer);
  const [eclatees, setEclatees] = useState<Set<string>>(new Set());
  const [secoue, setSecoue] = useState<string | null>(null);
  const reste = bulles.filter((b) => b.l.id === lettre.id && !eclatees.has(b.cle)).length;

  useEffect(() => {
    if (reste > 0) return;
    bravo(lettre);
    const t = setTimeout(() => { setBulles(fabriquer()); setEclatees(new Set()); }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reste]);

  const toucher = (b: (typeof bulles)[number]) => {
    if (b.l.id === lettre.id) { sonPlop(); setEclatees((s) => new Set(s).add(b.cle)); }
    else { setSecoue(b.cle); setTimeout(() => setSecoue(null), 500); jouer(lettre.audio_url); }
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-200 to-sky-400">
      <Retour retour={retour} />
      <p className="absolute top-6 inset-x-0 text-center font-arabic text-6xl text-white drop-shadow-lg pointer-events-none">{lettre.letter_arabic}</p>
      {bulles.map((b) => !eclatees.has(b.cle) && (
        <button key={b.cle} type="button" onClick={() => toucher(b)} aria-label={b.l.name_french}
          className="absolute bottom-[-140px] h-28 w-28 rounded-full grid place-items-center font-arabic text-6xl text-white shadow-xl border-4 border-white/70"
          style={{ left: `${b.x}%`, background: `radial-gradient(circle at 30% 30%, #ffffffaa, ${b.teinte})`,
            animation: `bulle-monte ${b.duree}s linear ${b.delai}s infinite${secoue === b.cle ? ', wiggle 0.5s ease-in-out' : ''}` }}>
          {b.l.letter_arabic}
        </button>
      ))}
      {reste === 0 && <p className="absolute inset-0 grid place-items-center text-8xl animate-bounce pointer-events-none">🌟👏🌟</p>}
    </div>
  );
}

/** ✍️ Trace la lettre du doigt par-dessus la grande lettre pâle ; ⭐ quand c'est fini (jamais noté) */
function Trace({ lettre, retour }: { lettre: Lettre; retour: () => void }) {
  const cadre = useRef<HTMLCanvasElement>(null);
  const dessine = useRef(false);
  const [couleur, setCouleur] = useState(TEINTES[0]);

  const preparer = () => {
    const c = cadre.current; if (!c) return;
    const r = c.getBoundingClientRect();
    c.width = r.width * devicePixelRatio; c.height = r.height * devicePixelRatio;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, r.width, r.height);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.min(r.width, r.height) * 0.75}px "Amiri", "Noto Naskh Arabic", serif`;
    ctx.fillText(lettre.letter_arabic, r.width / 2, r.height / 2);
  };
  useEffect(() => { preparer(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => { const r = e.currentTarget.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
  const debut = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext('2d'); if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dessine.current = true;
    const [x, y] = point(e);
    ctx.strokeStyle = couleur; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y); ctx.stroke();
  };
  const bouge = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dessine.current) return;
    const ctx = e.currentTarget.getContext('2d'); if (!ctx) return;
    const [x, y] = point(e); ctx.lineTo(x, y); ctx.stroke();
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-amber-50 dark:bg-amber-950" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 88px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
      <Retour retour={retour} />
      <canvas ref={cadre} className="flex-1 min-h-0 w-full touch-none" aria-label={`Trace ${lettre.name_french}`}
        onPointerDown={debut} onPointerMove={bouge} onPointerUp={() => { dessine.current = false; }} onPointerCancel={() => { dessine.current = false; }} />
      <div className="flex items-center justify-center gap-3 px-4 pt-3">
        {TEINTES.slice(0, 4).map((t) => (
          <button key={t} type="button" aria-label="Couleur" onClick={() => setCouleur(t)}
            className={`h-14 w-14 rounded-full shadow ${couleur === t ? 'ring-4 ring-slate-800 dark:ring-white' : ''}`} style={{ background: t }} />
        ))}
        <button type="button" aria-label="Effacer" onClick={preparer} className="h-14 w-14 rounded-full bg-white shadow text-3xl grid place-items-center">🧽</button>
        <button type="button" aria-label="Fini" onClick={() => { bravo(lettre); jouer(lettre.audio_url); }} className="h-16 w-16 rounded-full bg-yellow-300 shadow-lg text-4xl grid place-items-center">⭐</button>
      </div>
    </div>
  );
}

/** 👂 Le son de LA lettre ; l'enfant la retrouve parmi les lettres qu'il connaît déjà (2 puis 3 cartes) */
function Trouve({ lettre, connues, retour }: { lettre: Lettre; connues: Lettre[]; retour: () => void }) {
  const tirer = () => melanger([lettre, ...autresConnues(lettre, connues, 2)]);
  const [choix, setChoix] = useState(tirer);
  const [secoue, setSecoue] = useState<number | null>(null);
  const [gagne, setGagne] = useState(false);
  useEffect(() => { const t = setTimeout(() => jouer(lettre.audio_url), 400); return () => clearTimeout(t); }, [choix, lettre.audio_url]);

  const toucher = (l: Lettre) => {
    if (gagne) return;
    if (l.id === lettre.id) { setGagne(true); bravo(lettre); setTimeout(() => { setGagne(false); setChoix(tirer()); }, 2200); }
    else { setSecoue(l.id); setTimeout(() => setSecoue(null), 500); jouer(lettre.audio_url); }
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-emerald-200 to-teal-100 dark:from-emerald-900 dark:to-teal-950 flex flex-col items-center justify-center gap-8 p-6">
      <Retour retour={retour} />
      <button type="button" onClick={() => jouer(lettre.audio_url)} aria-label="Réécouter"
        className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 text-white text-6xl shadow-xl grid place-items-center animate-pulse">🔊</button>
      <div dir="rtl" className="flex flex-wrap justify-center gap-5">
        {choix.map((l, i) => (
          <button key={l.id} type="button" onClick={() => toucher(l)} aria-label={l.name_french}
            className={`h-36 w-36 sm:h-44 sm:w-44 rounded-[36px] text-white font-arabic text-8xl leading-none shadow-xl grid place-items-center transition-transform active:scale-90
              ${secoue === l.id ? 'animate-[wiggle_0.5s_ease-in-out]' : ''} ${gagne && l.id === lettre.id ? 'scale-110 ring-8 ring-yellow-300' : ''}`}
            style={{ background: TEINTES[(i * 3 + 1) % TEINTES.length] }}>{l.letter_arabic}</button>
        ))}
      </div>
    </div>
  );
}

/** 🃏 Les paires : retourne 2 cartes ; LA lettre + 1 ou 2 lettres connues (4 ou 6 cartes) */
function Paires({ lettre, autres, retour }: { lettre: Lettre; autres: Lettre[]; retour: () => void }) {
  const distribuer = () => melanger([lettre, ...autres].flatMap((l) => [l, l])).map((l, i) => ({ cle: i, l }));
  const [cartes, setCartes] = useState(distribuer);
  const [vues, setVues] = useState<number[]>([]);
  const [trouvees, setTrouvees] = useState<Set<number>>(new Set());
  const fini = useMemo(() => trouvees.size === cartes.length, [trouvees, cartes]);

  useEffect(() => {
    if (!fini) return;
    bravo(lettre);
    const t = setTimeout(() => { setCartes(distribuer()); setTrouvees(new Set()); setVues([]); }, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fini]);

  const retourner = (cle: number) => {
    if (vues.length === 2 || vues.includes(cle) || trouvees.has(cle)) return;
    const c = cartes[cle];
    jouer(c.l.audio_url);
    const n = [...vues, cle];
    setVues(n);
    if (n.length === 2) {
      const [a, b] = n.map((k) => cartes[k]);
      setTimeout(() => {
        if (a.l.id === b.l.id) { sonPlop(); setTrouvees((s) => new Set([...s, a.cle, b.cle])); }
        setVues([]);
      }, a.l.id === b.l.id ? 500 : 1100);
    }
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-pink-200 to-fuchsia-100 dark:from-pink-900 dark:to-fuchsia-950 grid place-items-center p-6">
      <Retour retour={retour} />
      <div dir="rtl" className={`grid gap-4 ${cartes.length > 4 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {cartes.map((c) => {
          const visible = vues.includes(c.cle) || trouvees.has(c.cle);
          return (
            <button key={c.cle} type="button" onClick={() => retourner(c.cle)} aria-label={visible ? c.l.name_french : 'Carte cachée'}
              className={`h-28 w-28 sm:h-36 sm:w-36 rounded-[28px] shadow-xl grid place-items-center font-arabic text-7xl leading-none transition-transform active:scale-90
                ${visible ? 'text-white' : 'bg-white/90 text-5xl'} ${trouvees.has(c.cle) ? 'ring-4 ring-yellow-300' : ''}`}
              style={visible ? { background: TEINTES[(c.l.id * 3) % TEINTES.length] } : undefined}>
              {visible ? c.l.letter_arabic : '⭐'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
