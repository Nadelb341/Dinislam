import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";

/**
 * 🎬 Barre de commandes maison, la MÊME pour toutes les vidéos de l'appli (demande de Nadia 2026-10-07, redite le 2026-11-18) :
 * barre de progression, reculer / avancer de 10 s, lecture / pause, temps « 0:00 / 7:28 », son (+ volume sauf iPhone),
 * plein écran si le lecteur le permet. Utilisée par SafeYoutubeEmbed (YouTube) et LecteurVideo (fichiers vidéo).
 */

const fmtTemps = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};

// iPhone/iPad : le volume ne se règle qu'avec les boutons de l'appareil (limite d'Apple), on garde seulement « couper le son »
const estAppleTactile = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export interface BarreVideoProps {
  ready: boolean;
  isPlaying: boolean;
  current: number;
  duration: number;
  muted: boolean;
  volume: number; // 0 à 100
  onTogglePlay: () => void;
  /** Aller à cette seconde */
  onSeek: (seconds: number) => void;
  /** Le doigt glisse sur la barre (true) / est relâché (false) */
  onScrub: (seconds: number, enCours: boolean) => void;
  onToggleMute: () => void;
  onVolume: (v: number) => void;
  /** Absent = pas de bouton plein écran */
  onFullscreen?: () => void;
  pleinEcran?: boolean;
}

const btn = "flex items-center justify-center h-9 w-9 shrink-0 rounded-full text-white hover:bg-white/20 active:scale-95 disabled:opacity-40";

export function BarreVideo(p: BarreVideoProps) {
  const appleTouch = estAppleTactile();
  const ref = useRef<HTMLDivElement>(null);
  // Lecteur étroit (téléphone, fenêtre) : on cache le curseur de volume pour que rien ne soit coupé (le bouton son reste)
  const [etroit, setEtroit] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((e) => setEtroit(e[0].contentRect.width < 380));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const stop = (e: SyntheticEvent) => e.stopPropagation();
  const max = Math.max(p.duration, 1);

  return (
    <div
      ref={ref}
      // translateZ(0) : la barre garde sa propre couche, jamais recouverte par la vidéo (iPhone, fenêtres qui défilent)
      className="absolute inset-x-0 bottom-0 z-20 [transform:translateZ(0)] bg-gradient-to-t from-black/80 via-black/50 to-transparent px-2 pb-1.5 pt-5"
      onClick={stop}
      onPointerDown={stop}
    >
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={Math.min(p.current, max)}
        disabled={!p.ready}
        onChange={(e) => p.onScrub(Number(e.target.value), true)}
        onPointerUp={(e) => { const v = Number((e.target as HTMLInputElement).value); p.onSeek(v); p.onScrub(v, false); }}
        onKeyUp={(e) => { const v = Number((e.target as HTMLInputElement).value); p.onSeek(v); p.onScrub(v, false); }}
        aria-label="Position dans la vidéo"
        className="block w-full h-1.5 accent-white cursor-pointer"
      />
      <div className="mt-1 flex min-w-0 items-center gap-0.5">
        <button type="button" className={`${btn} w-auto gap-0.5 px-1.5`} disabled={!p.ready} onClick={() => p.onSeek(p.current - 10)} aria-label="Reculer de 10 secondes">
          <RotateCcw className="h-4 w-4" /><span className="text-[11px] font-bold">10</span>
        </button>
        <button type="button" className={btn} disabled={!p.ready} onClick={p.onTogglePlay} aria-label={p.isPlaying ? "Pause" : "Lecture"}>
          {p.isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4 ml-0.5" fill="currentColor" />}
        </button>
        <button type="button" className={`${btn} w-auto gap-0.5 px-1.5`} disabled={!p.ready} onClick={() => p.onSeek(p.current + 10)} aria-label="Avancer de 10 secondes">
          <span className="text-[11px] font-bold">10</span><RotateCw className="h-4 w-4" />
        </button>
        <span className="ms-1 shrink-0 text-[11px] font-medium text-white tabular-nums whitespace-nowrap">
          {fmtTemps(p.current)} / {fmtTemps(p.duration)}
        </span>
        <span className="min-w-0 flex-1" />
        <button type="button" className={btn} disabled={!p.ready} onClick={p.onToggleMute} aria-label={p.muted ? "Remettre le son" : "Couper le son"}>
          {p.muted || p.volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        {!appleTouch && !etroit && (
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={p.muted ? 0 : p.volume}
            disabled={!p.ready}
            onChange={(e) => p.onVolume(Number(e.target.value))}
            aria-label="Volume"
            className="w-16 sm:w-24 min-w-0 shrink h-1.5 accent-white cursor-pointer"
          />
        )}
        {p.onFullscreen && (
          <button type="button" className={btn} onClick={p.onFullscreen} aria-label={p.pleinEcran ? "Quitter le plein écran" : "Plein écran"}>
            {p.pleinEcran ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
