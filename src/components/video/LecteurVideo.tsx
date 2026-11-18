import { forwardRef, useCallback, useEffect, useRef, useState, type VideoHTMLAttributes } from "react";
import { Play } from "lucide-react";
import { BarreVideo } from "./BarreVideo";

/**
 * 🎬 Lecteur des FICHIERS vidéo (balise <video>) avec la même barre maison que les vidéos YouTube
 * (demande de Nadia 2026-11-18 : « toutes les vidéos de l'appli », pour que les élèves gèrent le visionnage).
 * - className : le cadre (fond noir, arrondi, taille) ; videoClassName : la vidéo elle-même.
 * - Les événements (onPlay, onEnded, onTimeUpdate…) et la ref sont transmis à la vraie balise <video>
 *   (Ramadan s'en sert pour suivre les vidéos regardées).
 * - Plein écran : le cadre entier (la barre reste) ; sur iPhone, le plein écran d'Apple.
 *   Si une page met la vidéo seule en plein écran, les commandes du téléphone réapparaissent le temps du plein écran.
 */
type Props = Omit<VideoHTMLAttributes<HTMLVideoElement>, "controls" | "className"> & {
  className?: string;
  videoClassName?: string;
};

type VideoIOS = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export const LecteurVideo = forwardRef<HTMLVideoElement, Props>(function LecteurVideo(
  { className, videoClassName, preload = "metadata", playsInline = true, onPlay, onPause, onEnded, onTimeUpdate, onLoadedMetadata, onDurationChange, onVolumeChange, onError, children, ...rest },
  ref,
) {
  const cadreRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [pleinEcran, setPleinEcran] = useState(false);
  const [videoSeulePleinEcran, setVideoSeulePleinEcran] = useState(false);
  const [erreur, setErreur] = useState(false);

  const brancher = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }, [ref]);

  // Nouvelle vidéo : on repart de zéro
  const source = rest.src;
  useEffect(() => { setReady(false); setIsPlaying(false); setCurrent(0); setDuration(0); setErreur(false); }, [source]);

  useEffect(() => {
    const maj = () => {
      const fe = document.fullscreenElement ?? (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ?? null;
      setPleinEcran(!!fe && fe === cadreRef.current);
      setVideoSeulePleinEcran(!!fe && fe === videoRef.current);
    };
    document.addEventListener("fullscreenchange", maj);
    document.addEventListener("webkitfullscreenchange", maj);
    return () => { document.removeEventListener("fullscreenchange", maj); document.removeEventListener("webkitfullscreenchange", maj); };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) {
      if (v.ended) v.currentTime = 0;
      v.play().catch(() => {});
    } else v.pause();
  };
  const seek = (s: number) => {
    const v = videoRef.current;
    if (!v) return;
    const fin = Number.isFinite(v.duration) ? v.duration : duration;
    const to = Math.max(0, Math.min(fin || 0, s));
    v.currentTime = to;
    setCurrent(to);
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted || v.volume === 0) { v.muted = false; if (v.volume === 0) v.volume = 0.6; }
    else v.muted = true;
  };
  const changerVolume = (n: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = n / 100;
    v.muted = n === 0;
  };

  const cadreFS = typeof document !== "undefined" && !!(document.fullscreenEnabled || (document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled);
  const iosFS = typeof document !== "undefined" && typeof (document.createElement("video") as VideoIOS).webkitEnterFullscreen === "function";
  const basculerPleinEcran = () => {
    const c = cadreRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    const v = videoRef.current as VideoIOS | null;
    if (pleinEcran) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else (document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen?.();
      return;
    }
    if (c && cadreFS) {
      if (c.requestFullscreen) c.requestFullscreen().catch(() => {});
      else c.webkitRequestFullscreen?.();
    } else v?.webkitEnterFullscreen?.();
  };

  return (
    <div ref={cadreRef} className={`relative isolate overflow-hidden bg-black ${pleinEcran ? "flex items-center justify-center" : ""} ${className ?? "rounded-xl"}`}>
      <video
        {...rest}
        ref={brancher}
        preload={preload}
        playsInline={playsInline}
        controls={videoSeulePleinEcran}
        className={`block w-full ${videoClassName ?? ""}`}
        style={pleinEcran ? { ...rest.style, width: "100%", height: "100%", maxHeight: "none", objectFit: "contain" } : rest.style}
        onLoadedMetadata={(e) => { setReady(true); setDuration(e.currentTarget.duration || 0); onLoadedMetadata?.(e); }}
        onDurationChange={(e) => { if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration); onDurationChange?.(e); }}
        onTimeUpdate={(e) => { if (!seeking) setCurrent(e.currentTarget.currentTime); onTimeUpdate?.(e); }}
        onPlay={(e) => { setIsPlaying(true); setReady(true); onPlay?.(e); }}
        onPause={(e) => { setIsPlaying(false); onPause?.(e); }}
        onEnded={(e) => { setIsPlaying(false); onEnded?.(e); }}
        onVolumeChange={(e) => { setVolume(Math.round(e.currentTarget.volume * 100)); setMuted(e.currentTarget.muted); onVolumeChange?.(e); }}
        onError={(e) => { setErreur(true); onError?.(e); }}
      >
        {children}
      </video>

      {erreur ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/70 p-4 text-center text-sm font-semibold text-white">
          {typeof navigator !== "undefined" && !navigator.onLine ? "📡 Nécessite Internet : cette vidéo n'a pas encore été regardée sur cet appareil." : "😕 Cette vidéo ne se lit pas pour le moment."}
        </div>
      ) : (
        <>
          {/* Calque qui capte les appuis sur la vidéo : lecture / pause */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Mettre en pause" : "Lecture"}
            className="absolute inset-0 z-10 flex items-center justify-center bg-transparent [transform:translateZ(0)]"
          >
            {!isPlaying && (
              <span className="flex items-center justify-center h-16 w-16 rounded-full bg-white/90 shadow-lg">
                <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
              </span>
            )}
          </button>
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
            onVolume={changerVolume}
            onFullscreen={cadreFS || iosFS ? basculerPleinEcran : undefined}
            pleinEcran={pleinEcran}
          />
        </>
      )}
    </div>
  );
});

export default LecteurVideo;
