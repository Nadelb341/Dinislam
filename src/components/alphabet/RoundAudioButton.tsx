import { useEffect, useRef, useState } from 'react';

/** Proposition « 1 » (2026-10-07) : gros bouton rond ▶, le tour se remplit pendant l'écoute. */
export function RoundAudioButton({ url, label, from, to, size = 76 }: { url: string; label: string; from: string; to: string; size?: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => () => { audioRef.current?.pause(); }, []);
  useEffect(() => { audioRef.current?.pause(); audioRef.current = null; setPlaying(false); setProgress(0); }, [url]);

  const toggle = () => {
    if (!audioRef.current) {
      const a = new Audio(url);
      a.ontimeupdate = () => setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
      a.onended = () => { setPlaying(false); setProgress(0); };
      a.onpause = () => setPlaying(false);
      a.onplay = () => setPlaying(true);
      audioRef.current = a;
    }
    const a = audioRef.current;
    if (a.paused) a.play().catch(() => setPlaying(false)); else a.pause();
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Pause : ${label}` : `Écouter : ${label}`}
        className="relative grid place-items-center rounded-full shadow-md transition-transform active:scale-95"
        style={{ width: size, height: size, background: `conic-gradient(${from} ${progress}%, rgba(148,163,184,0.35) 0)` }}
      >
        <span className="absolute inset-[6px] rounded-full" style={{ background: `linear-gradient(150deg, ${from}, ${to})` }} />
        <span className="relative text-white text-2xl leading-none">{playing ? '❚❚' : '▶'}</span>
      </button>
      <span className="text-xs font-bold text-muted-foreground text-center">{label}</span>
    </div>
  );
}
