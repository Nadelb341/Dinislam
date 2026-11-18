import { lireCadre, styleCadre } from '@/lib/cadrage';
import { cn } from '@/lib/utils';

/** 📐 Photo affichée dans son cadre avec le cadrage choisi par l'enseignante pour CET emplacement (2026-11-18) */
export function ImageCadree({ src, alt, cadrages, emplacement, className, imgClassName }: {
  src: string; alt: string; cadrages: unknown; emplacement: string; className?: string; imgClassName?: string;
}) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <img src={src} alt={alt} loading="lazy" className={cn('h-full w-full object-cover', imgClassName)} style={styleCadre(lireCadre(cadrages, emplacement))} />
    </div>
  );
}
