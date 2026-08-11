export const extractYoutubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/embed\/)([^?&#]+)/,
    /(?:v=|youtu\.be\/)([^&\s?#]+)/,
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[match.length > 2 ? 2 : 1] || null;
  }
  return null;
};

export const isYoutubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Réexporté pour compatibilité : tout affichage YouTube passe par SafeYoutubeEmbed
// (aucun lien natif vers youtube.com — logo, cartes de fin de vidéo bloqués).
export { SafeYoutubeEmbed as YoutubePlayer } from '@/components/SafeYoutubeEmbed';
