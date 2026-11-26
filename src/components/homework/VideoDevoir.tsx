import { SafeYoutubeEmbed } from '@/components/SafeYoutubeEmbed';
import { LecteurVideo } from '@/components/video/LecteurVideo';
import { idYoutube } from '@/lib/youtube';

/**
 * 🎬 Vidéo d'un devoir libre (2026-11-26) : YouTube lu SANS aucune sortie possible vers youtube.com (règle des applis),
 * un fichier vidéo dans le lecteur de l'appli, sinon un simple lien. YouTube a besoin d'Internet (📡).
 */
export function VideoDevoir({ lien, titre }: { lien: string; titre: string }) {
  const yt = idYoutube(lien);
  if (yt) {
    return (
      <div className="space-y-1">
        <SafeYoutubeEmbed videoId={yt} title={titre} className="rounded-xl overflow-hidden" />
        {typeof navigator !== 'undefined' && navigator.onLine === false && <p className="text-[11px] font-semibold text-muted-foreground">📡 Nécessite Internet pour regarder la vidéo</p>}
      </div>
    );
  }
  if (/\.(mp4|webm|m4v|mov)(\?|#|$)/i.test(lien)) return <LecteurVideo src={lien} className="rounded-xl" videoClassName="max-h-[60dvh] w-full object-contain" />;
  if (/^https?:\/\//i.test(lien)) {
    return (
      <a href={lien} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-extrabold text-white">
        🎬 Ouvrir la vidéo
      </a>
    );
  }
  return null;
}
