import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
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
          events: { onStateChange: (e: YTPlayerStateChangeEvent) => void };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: number };
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
 */
export function SafeYoutubeEmbed({ embedUrl, videoId: videoIdProp, title, className }: SafeYoutubeEmbedProps) {
  const videoId = videoIdProp || (embedUrl ? extractVideoId(embedUrl) : null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!videoId || !mountRef.current) return;
    let cancelled = false;

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
          onStateChange: (e) => setIsPlaying(e.data === window.YT.PlayerState.PLAYING),
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  if (!videoId) return null;

  return (
    <div className={className ?? "aspect-video relative overflow-hidden rounded-md bg-black"}>
      <div className="absolute inset-0 pointer-events-none">
        <div ref={mountRef} className="w-full h-full" />
      </div>
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Mettre en pause" : "Lecture"}
        title={title}
        className="absolute inset-0 z-10 flex items-center justify-center bg-transparent"
      >
        {!isPlaying ? (
          <span className="flex items-center justify-center h-16 w-16 rounded-full bg-white/90 shadow-lg">
            <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
          </span>
        ) : (
          <span className="absolute bottom-2 right-2 flex items-center justify-center h-9 w-9 rounded-full bg-black/40">
            <Pause className="h-4 w-4 text-white" fill="currentColor" />
          </span>
        )}
      </button>
    </div>
  );
}
