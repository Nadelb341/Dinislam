import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { LineCell } from '@/lib/alphabetLines';
import { LETTER_STROKES, type LetterStroke } from '@/data/letterStrokes';

/**
 * Tracer la lettre au doigt (2026-10-07, choix de Nadia : « T2 » animé + numéros de « T3 ») :
 * modèle gris, numéro au début de chaque trait, « ▶ Montre-moi » dessine la lettre avec une flèche qui avance.
 * Idées bonus : 6 pointillés à suivre (moins de 6 ans), 7 ⭐ si l'enfant part du bon point et suit le chemin, 8 couleur du crayon.
 */
const PENS = [
  { name: 'Bleu', color: '#2563eb' },
  { name: 'Rouge', color: '#e11d48' },
  { name: 'Vert', color: '#16a34a' },
  { name: 'Violet', color: '#9333ea' },
];
const BADGES = ['#2563eb', '#ea580c', '#16a34a', '#9333ea', '#db2777'];
const PEN_KEY = 'dinislam_tracer_pen';

type Pt = { x: number; y: number };
const parsePath = (d: string): Pt[] => d.replace(/[ML]/g, ' ').trim().split(/\s+/).reduce<Pt[]>((acc, v, i, arr) => {
  if (i % 2 === 0) acc.push({ x: Number(v), y: Number(arr[i + 1]) });
  return acc;
}, []);
/** Points tous les ~4 unités le long d'un trait (pour vérifier si l'enfant l'a suivi) */
const samplePath = (pts: Pt[]): Pt[] => {
  const out: Pt[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 4));
    for (let k = 0; k < n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
  }
  if (pts.length) out.push(pts[pts.length - 1]);
  return out;
};
const startOf = (s: LetterStroke): Pt => ('dot' in s ? { x: s.dot[0], y: s.dot[1] } : parsePath(s.d)[0]);

export function LetterTracer({ letter, forms, dotted }: { letter: string; forms: LineCell[]; dotted: boolean }) {
  const [formIndex, setFormIndex] = useState(0);
  const [pen, setPen] = useState(() => { try { return localStorage.getItem(PEN_KEY) || PENS[0].color; } catch { return PENS[0].color; } });
  const [lines, setLines] = useState<Pt[][]>([]);
  const [feedback, setFeedback] = useState<'good' | 'start' | null>(null);
  const [demo, setDemo] = useState<{ stroke: number; len: number; head: Pt & { a: number } | null; dots: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const demoPathRef = useRef<SVGPathElement>(null);
  const drawing = useRef(false);
  const rafRef = useRef<number | null>(null);
  const endTimer = useRef<number | null>(null);

  const strokes = useMemo(() => LETTER_STROKES[letter]?.[formIndex] ?? [], [letter, formIndex]);
  const paths = useMemo(() => strokes.filter((s): s is { d: string } => 'd' in s), [strokes]);
  const dots = useMemo(() => strokes.filter((s): s is { dot: [number, number] } => 'dot' in s), [strokes]);
  const samples = useMemo(() => paths.map((p) => samplePath(parsePath(p.d))), [paths]);

  const stopDemo = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (endTimer.current) window.clearTimeout(endTimer.current);
    rafRef.current = null; endTimer.current = null;
    setDemo(null);
  }, []);
  const clear = useCallback(() => { setLines([]); setFeedback(null); }, []);
  useEffect(() => { stopDemo(); clear(); }, [letter, formIndex, stopDemo, clear]);
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (endTimer.current) window.clearTimeout(endTimer.current);
  }, []);

  const choosePen = (c: string) => { setPen(c); try { localStorage.setItem(PEN_KEY, c); } catch { /* appareil sans stockage */ } };

  // ── « Montre-moi » : chaque trait se dessine à son tour, puis les points apparaissent ──
  const showMe = () => {
    stopDemo();
    clear();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let index = 0;
    let t0 = performance.now() + 150;
    setDemo({ stroke: 0, len: 0, head: null, dots: 0 });
    const step = (now: number) => {
      if (index < paths.length) {
        const el = demoPathRef.current;
        // Attendre que le trait à dessiner soit affiché
        if (!el || el.dataset.i !== String(index) || now < t0) { rafRef.current = requestAnimationFrame(step); return; }
        const total = el.getTotalLength();
        const duration = reduce ? 1 : Math.max(700, total * 7);
        const k = Math.min(1, (now - t0) / duration);
        const d = total * k;
        const p = el.getPointAtLength(d);
        const q = el.getPointAtLength(Math.min(total, d + 1));
        const r = el.getPointAtLength(Math.max(0, d - 1));
        setDemo({ stroke: index, len: d, head: { x: p.x, y: p.y, a: (Math.atan2(q.y - r.y, q.x - r.x) * 180) / Math.PI }, dots: 0 });
        if (k >= 1) {
          index += 1;
          t0 = now + 250;
          setDemo({ stroke: index, len: 0, head: null, dots: 0 });
        }
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      const shown = Math.min(dots.length, Math.max(0, Math.floor((now - t0) / 350) + 1));
      setDemo({ stroke: paths.length, len: 0, head: null, dots: shown });
      if (shown < dots.length) rafRef.current = requestAnimationFrame(step);
      else { rafRef.current = null; endTimer.current = window.setTimeout(() => setDemo(null), 1500); }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  // ── Dessin au doigt (coordonnées du cadre 300 × 200) ──
  const toSvg = (e: React.PointerEvent): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 300, y: ((e.clientY - r.top) / r.height) * 200 };
  };
  const down = (e: React.PointerEvent<SVGSVGElement>) => {
    stopDemo();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    setLines((l) => [...l, [toSvg(e)]]);
  };
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing.current) return;
    const p = toSvg(e);
    setLines((l) => {
      const last = l[l.length - 1];
      const prev = last[last.length - 1];
      if (Math.hypot(p.x - prev.x, p.y - prev.y) < 1.5) return l;
      return [...l.slice(0, -1), [...last, p]];
    });
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    // Idée 7 : ⭐ si tout le chemin est recouvert et que le 1er trait commence au point ①
    setLines((l) => {
      const all = l.flat();
      const near = (s: Pt) => all.some((p) => Math.hypot(p.x - s.x, p.y - s.y) < 20);
      const flat = samples.flat();
      const covered = flat.length ? flat.filter(near).length / flat.length : 0;
      if (covered >= 0.8 && l[0]?.length) {
        const s = startOf(strokes[0]);
        setFeedback(Math.hypot(l[0][0].x - s.x, l[0][0].y - s.y) < 30 ? 'good' : 'start');
      }
      return l;
    });
  };

  const demoPath = demo && demo.stroke < paths.length ? paths[demo.stroke] : null;

  return (
    <div className="space-y-2">
      <div dir="rtl" className="grid grid-cols-4 gap-1.5">
        {forms.map((f, i) => (
          <button key={i} type="button" onClick={() => setFormIndex(i)}
            className={`rounded-xl border-2 py-1 text-xs font-semibold ${i === formIndex ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 300 200"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="w-full h-auto rounded-2xl bg-card border border-border touch-none select-none"
        aria-label="Zone pour tracer la lettre au doigt"
      >
        {/* Modèle : gris plein, ou pointillés à suivre pour les moins de 6 ans */}
        {paths.map((p, i) => (
          <path key={`m${i}`} d={p.d} fill="none" strokeLinecap="round" strokeLinejoin="round"
            className={dotted ? 'stroke-sky-400/70' : 'stroke-slate-200 dark:stroke-slate-700'}
            strokeWidth={dotted ? 5 : 22} strokeDasharray={dotted ? '1 11' : undefined} />
        ))}
        {dots.map((s, i) => (
          <circle key={`md${i}`} cx={s.dot[0]} cy={s.dot[1]} r={dotted ? 9 : 11}
            className={dotted ? 'fill-none stroke-sky-400/70' : 'fill-slate-200 dark:fill-slate-700'} strokeWidth={dotted ? 3 : 0} strokeDasharray={dotted ? '2 5' : undefined} />
        ))}

        {/* Ce que l'enfant a tracé */}
        {lines.map((l, i) => (
          <polyline key={`u${i}`} points={l.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={pen} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* Démonstration « Montre-moi » */}
        {demo && paths.slice(0, demo.stroke).map((p, i) => (
          <path key={`dd${i}`} d={p.d} fill="none" stroke="#2563eb" strokeOpacity={0.55} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {demoPath && (
          <path ref={demoPathRef} data-i={demo!.stroke} d={demoPath.d} fill="none" stroke="#2563eb" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={`${demo!.len} 10000`} />
        )}
        {demo?.head && (
          <polygon points="-2,-11 18,0 -2,11" fill="#2563eb" transform={`translate(${demo.head.x} ${demo.head.y}) rotate(${demo.head.a})`} />
        )}
        {demo && dots.slice(0, demo.dots).map((s, i) => <circle key={`dp${i}`} cx={s.dot[0]} cy={s.dot[1]} r={10} fill="#2563eb" />)}

        {/* Numéros au début de chaque trait (et de chaque point) */}
        {strokes.map((s, i) => {
          const p = startOf(s);
          return (
            <g key={`n${i}`} pointerEvents="none">
              <circle cx={p.x} cy={p.y} r={10} fill={BADGES[i % BADGES.length]} stroke="white" strokeWidth={2} />
              <text x={p.x} y={p.y + 4.5} textAnchor="middle" fontSize={13} fontWeight={800} fill="white">{i + 1}</text>
            </g>
          );
        })}
      </svg>

      {feedback === 'good' && <p className="rounded-xl bg-amber-100 dark:bg-amber-950/40 py-2 text-center font-bold">⭐ Bravo, tu es parti(e) du bon point !</p>}
      {feedback === 'start' && <p className="rounded-xl bg-sky-100 dark:bg-sky-950/40 py-2 text-center font-semibold">Presque ! Essaie de commencer au point ①</p>}

      <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Couleur du crayon">
        {PENS.map((p) => (
          <button key={p.color} type="button" role="radio" aria-checked={pen === p.color} aria-label={`Crayon ${p.name}`} onClick={() => choosePen(p.color)}
            className={`h-8 w-8 rounded-full border-4 transition-transform ${pen === p.color ? 'scale-110 border-foreground/70' : 'border-transparent'}`}
            style={{ background: p.color }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" className="bg-sky-600 hover:bg-sky-700 text-white" onClick={showMe}>▶ Montre-moi</Button>
        <Button type="button" variant="outline" onClick={() => { stopDemo(); clear(); }}>🧽 Effacer</Button>
      </div>
    </div>
  );
}
