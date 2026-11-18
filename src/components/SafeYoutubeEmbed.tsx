import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { BarreVideo } from "@/components/video/BarreVideo";

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(volume: number): void;
  getVolume(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  destroy(): void;
}

interface YTPlayerStateChangeEvent {
  data: number;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        options: {
          videoId: string;
          playerVars: Record<string, number | string>;
          events: { onReady?: () => void; onStateChange: (e: YTPlayerStateChangeEvent) => void };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface SafeYoutubeEmbedProps {
  embedUrl?: string;
  videoId?: string;
  title?: string;
  className?: string;
}

function extractVideoId(url: string): string | null {
  const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

let apiPromise: Promise<void> | null = null;
function loadYoutubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

/**
 * Lecteur YouTube sans aucun lien de sortie possible : le logo, les cartes de
 * fin de vidéo et toute la UI native YouTube sont masqués (controls: 0), et un
 * overlay transparent capte tous les clics à la place de l'iframe — aucun
 * enfant ne peut donc jamais atterrir sur youtube.com.
 * Commandes maison (demande de Nadia 2026-10-07) : reculer/avancer de 10 s, barre de progression, son.
 * Avant la lecture : image de la vidéo au lieu de l'écran YouTube (titre, « Regarder sur YouTube »).
 */
export function SafeYoutubeEmbed({ embedUrl, videoId: videoIdProp, title, className }: SafeYoutubeEmbedProps) {
  const videoId = videoIdProp || (embedUrl ? extractVideoId(embedUrl) : null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(100);
  const [muted, setMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);

  useEffect(() => {
    if (!videoId || !mountRef.current) return;
    let cancelled = false;
    setReady(false); setStarted(false); setEnded(false); setCurrent(0); setDuration(0);

    loadYoutubeApi().then(() => {
      if (cancelled || !mountRef.current) return;
      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            const p = playerRef.current;
            if (!p) return;
            setReady(true);
            setDuration(p.getDuration() || 0);
            setVolumeState(p.getVolume?.() ?? 100);
            setMuted(p.isMuted?.() ?? false);
          },
          onStateChange: (e) => {
            const playing = e.data === window.YT.PlayerState.PLAYING;
            setIsPlaying(playing);
            if (playing) { setStarted(true); setEnded(false); setDuration(playerRef.current?.getDuration() || 0); }
            if (e.data === window.YT.PlayerState.ENDED) setEnded(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId]);

  // Avancement de la barre pendant la lecture
  useEffect(() => {
    if (!isPlaying || seeking) return;
    const t = setInterval(() => {
      const p = playerRef.current;
      if (p) setCurrent(p.getCurrentTime() || 0);
    }, 500);
    return () => clearInterval(t);
  }, [isPlaying, seeking]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) p.pauseVideo();
    else {
      if (ended) { p.seekTo(0, true); setCurrent(0); }
      p.playVideo();
    }
  }, [isPlaying, ended]);

  const seek = (seconds: number) => {
    const p = playerRef.current;
    if (!p) return;
    const to = Math.max(0, Math.min(duration || p.getDuration() || 0, seconds));
    p.seekTo(to, true);
    setCurrent(to);
    setEnded(false);
  };

  const changeVolume = (v: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.setVolume(v);
    setVolumeState(v);
    if (v > 0 && muted) { p.unMute(); setMuted(false); }
    if (v === 0) { p.mute(); setMuted(true); }
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) { p.unMute(); if (volume === 0) { p.setVolume(60); setVolumeState(60); } setMuted(false); }
    else { p.mute(); setMuted(true); }
  };

  if (!videoId) return null;

  return (
    // isolate + z-0 : l'iframe YouTube reste SOUS le calque et la barre, même dans une fenêtre qui défile (iPhone)
    <div className={`${className ?? "aspect-video relative overflow-hidden rounded-md bg-black"} isolate`}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div ref={mountRef} className="w-full h-full" />
      </div>

      {/* Avant la lecture et à la fin : l'image de la vidéo cache l'écran YouTube (titre, liens) */}
      {(!started || ended) && (
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          className="absolute inset-0 z-[1] h-full w-full object-cover pointer-events-none"
        />
      )}

      {/* Calque qui capte tous les clics sur la vidéo : lecture / pause */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Mettre en pause" : "Lecture"}
        title={title}
        className="absolute inset-0 z-10 flex items-center justify-center bg-transparent [transform:translateZ(0)]"
      >
        {!isPlaying && (
          <span className="flex items-center justify-center h-16 w-16 rounded-full bg-white/90 shadow-lg">
            <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
          </span>
        )}
      </button>

      {/* Barre de commandes (au-dessus du calque) : la même pour toutes les vidéos de l'appli */}
      <BarreVideo
        ready={ready}
        isPlaying={isPlaying}
        current={current}
        duration={duration}
        muted={muted}
        volume={volume}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onScrub={(v, enCours) => { setSeeking(enCours); setCurrent(v); }}
        onToggleMute={toggleMute}
        onVolume={changeVolume}
      />
    </div>
  );
}
