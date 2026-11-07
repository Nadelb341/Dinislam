import { forwardRef, type AudioHTMLAttributes, type ImgHTMLAttributes } from 'react';
import { useUrlLisible } from '@/lib/fichiersPrives';
import { cn } from '@/lib/utils';

/**
 * 🔒 Lecteur audio pour un fichier qui peut être dans un espace privé (voix des enfants, du professeur…).
 * Mêmes réglages qu'un <audio>. Tant que le lien signé n'est pas prêt : lecteur sans source (rien de cassé).
 * `key` = le lien : Safari / iPhone recharge bien le lecteur quand l'adresse change.
 */
export const AudioPrive = forwardRef<HTMLAudioElement, AudioHTMLAttributes<HTMLAudioElement>>(function AudioPrive({ src, ...rest }, ref) {
  const lisible = useUrlLisible(src);
  return <audio key={lisible ?? 'attente'} ref={ref} src={lisible} {...rest} />;
});

/** 🔒 Image qui peut être dans un espace privé (photos des devoirs). Pendant le chargement du lien : un cadre doux de la même taille. */
export function ImgPrive({ src, alt = '', className, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  const lisible = useUrlLisible(src);
  if (!lisible) return <span aria-hidden className={cn('block animate-pulse bg-muted', className)} />;
  return <img key={lisible} src={lisible} alt={alt} className={className} {...rest} />;
}
