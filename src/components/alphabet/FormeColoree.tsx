import { useMemo } from 'react';
import { calqueDessous, calqueDessus, grappes, sansAccolades } from '@/lib/formeColoree';

/** ✨ Les lettres d'une règle, avec en couleur ce qui est entre { } (voir lib/formeColoree : 2 calques superposés pour Chrome) */
export function FormeColoree({ texte, accent, className = '' }: { texte: string; accent: string; className?: string }) {
  const g = useMemo(() => grappes(texte), [texte]);
  const dessus = useMemo(() => calqueDessus(g), [g]);
  const dessous = useMemo(() => calqueDessous(g), [g]);
  return (
    <span dir="rtl" className={`inline-grid font-arabic leading-[1.6] ${className}`} aria-label={sansAccolades(texte)}>
      <span aria-hidden className="[grid-area:1/1] whitespace-pre">
        {dessous.map((m, i) => <span key={i} className={m.couleur ? accent : 'text-transparent'}>{m.texte}</span>)}
      </span>
      <span aria-hidden className="[grid-area:1/1] whitespace-pre">
        {dessus.map((m, i) => <span key={i} className={m.couleur ? accent : undefined}>{m.texte}</span>)}
      </span>
    </span>
  );
}
