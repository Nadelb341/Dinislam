import { forwardRef, useState, type AudioHTMLAttributes, type ImgHTMLAttributes, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { oublierLien, useUrlLisible } from '@/lib/fichiersPrives';
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

/** 🔒 Image qui peut être dans un espace privé (photos des devoirs, pièces jointes du carnet). Pendant le chargement du lien :
 *  un cadre doux de la même taille. Si l'image ne se charge pas : UN nouvel essai avec un lien neuf, puis `secours`
 *  (jamais l'icône « ? » d'image cassée — 2026-11-12, pièce jointe du carnet). */
export function ImgPrive({ src, alt = '', className, secours, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { secours?: ReactNode }) {
  const lisible = useUrlLisible(src);
  const queryClient = useQueryClient();
  // Adresses qui ont déjà échoué : on n'y revient pas ; un seul nouvel essai avec un lien neuf
  const [echecs, setEchecs] = useState<string[]>([]);
  if (!lisible || (echecs.length === 1 && echecs[0] === lisible)) return <span aria-hidden className={cn('block animate-pulse bg-muted', className)} />;
  if (echecs.length >= 2 || echecs.includes(lisible)) return <>{secours ?? <span aria-hidden className={cn('grid place-items-center bg-muted text-xl', className)}>📎</span>}</>;
  return <img key={lisible} src={lisible} alt={alt} className={className} {...rest}
    onError={() => {
      if (!echecs.length) { oublierLien(src); void queryClient.invalidateQueries({ queryKey: ['url-lisible', src] }); }
      setEchecs((l) => [...l, lisible]);
    }} />;
}
