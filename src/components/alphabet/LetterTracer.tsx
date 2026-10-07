import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { LineCell } from '@/lib/alphabetLines';

/** Idée bonus 5 : repasser la lettre au doigt sur un modèle gris (isolée, début, milieu, fin). Sans note, pour s'entraîner. */
export function LetterTracer({ forms }: { forms: LineCell[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [formIndex, setFormIndex] = useState(0);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const paintModel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * ratio; canvas.height = h * ratio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const dark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.14)' : 'rgba(30,42,77,0.12)';
    ctx.font = `700 ${Math.floor(h * 0.62)}px Amiri, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.fillText(forms[formIndex]?.text ?? '', w / 2, h * 0.52);
  }, [forms, formIndex]);

  useEffect(() => {
    paintModel();
    // La police arabe peut arriver après le premier dessin
    document.fonts?.ready.then(paintModel).catch(() => {});
  }, [paintModel]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    const p = point(e);
    if (!ctx || !last.current) return;
    ctx.strokeStyle = '#2a4aa8';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const up = () => { drawing.current = false; last.current = null; };

  return (
    <div className="space-y-2">
      <div dir="rtl" className="grid grid-cols-4 gap-1.5">
        {forms.map((f, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setFormIndex(i)}
            className={`rounded-xl border-2 py-1 text-xs font-semibold ${i === formIndex ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="w-full h-56 rounded-2xl bg-card border border-border touch-none"
        aria-label="Zone pour tracer la lettre au doigt"
      />
      <Button type="button" variant="outline" className="w-full" onClick={paintModel}>🧽 Effacer et recommencer</Button>
    </div>
  );
}
