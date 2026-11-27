import { ImageCadree } from '@/components/shared/ImageCadree';
import { CheckCircle2, Lock } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { tailleArabeTuile } from '@/lib/ficheNomAllah';
import { TexteAjuste } from './TexteAjuste';

/** Tuile d'un nom dans la grille des 99 noms (sortie de AllahNamesPage le 27/11 pour être testée en image). */
export function TuileNom({ name, accessible, validated, pending, onOpen }: {
  name: Pick<Tables<'allah_names'>, 'id' | 'display_order' | 'name_arabic' | 'transliteration' | 'name_french' | 'image_url' | 'image_cadrage'>;
  accessible: boolean; validated: boolean; pending: boolean; onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="relative flex min-w-0 flex-col items-center rounded-2xl p-4 active:scale-95 transition-all duration-200 overflow-hidden text-left border"
      style={{
        background: accessible
          ? 'linear-gradient(145deg, hsl(222 55% 11%), hsl(222 65% 8%))'
          : 'hsl(222 40% 8%)',
        borderColor: validated
          ? 'rgba(234,179,8,0.65)'
          : accessible
            ? 'rgba(217, 119, 6, 0.2)'
            : 'rgba(217,119,6,0.07)',
        minHeight: '148px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        // Verrouillé : plus de grisé fade, on garde le noir et l'or de la carte (2026-10-23)
        opacity: accessible ? 1 : 0.85,
      }}
    >
      {/* Order badge */}
      <span
        className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
        style={{ color: 'hsl(38 92% 55%)', background: 'rgba(217,119,6,0.18)' }}
      >
        {name.display_order}
      </span>

      {/* Lock or check icon */}
      {validated ? (
        <span className="absolute top-2 right-2">
          {/* Tailles voulues par Nadia (2026-10-23) : coche et cadenas ×3, badge « En attente » ×1,5 */}
          <CheckCircle2 className="h-12 w-12" style={{ color: 'hsl(45 93% 55%)', filter: 'drop-shadow(0 0 6px hsla(45, 93%, 55%, 0.45))' }} />
        </span>
      ) : pending ? (
        <span className="absolute top-2 right-2 text-[15px] font-bold px-2 py-1 rounded-lg"
          style={{ color: 'hsl(38 92% 62%)', background: 'rgba(217,119,6,0.18)', border: '1px solid rgba(217,119,6,0.4)' }}>
          ⏳ En attente
        </span>
      ) : !accessible ? (
        <span className="absolute top-2 right-2">
          <Lock className="h-[42px] w-[42px]" style={{ color: 'hsl(38 70% 45%)' }} />
        </span>
      ) : null}

      {/* Image or decorative element */}
      {name.image_url ? (
        <ImageCadree src={name.image_url} alt={name.name_french} cadrages={name.image_cadrage} emplacement="carte"
          className="w-full h-14 rounded-xl mb-2 mt-12 opacity-80" />
      ) : (
        <div className="w-full flex items-center justify-center mt-12 mb-1">
          <svg width="44" height="28" viewBox="0 0 44 28" fill="none" opacity={accessible ? 0.3 : 0.12}>
            <path d="M2 28 Q2 6 22 2 Q42 6 42 28" stroke="hsl(38 92% 55%)" strokeWidth="1.5" fill="none"/>
            <line x1="2" y1="28" x2="42" y2="28" stroke="hsl(38 92% 55%)" strokeWidth="1.5"/>
          </svg>
        </div>
      )}

      {/* Tailles DOUBLÉES (Nadia, 27/11) : arabe 24 → 48 px, phonétique 12 → 24 px, sens 11 → 22 px ;
          le mot le plus long réduit la taille juste ce qu'il faut, rien n'est jamais coupé */}
      {accessible ? (
        <TexteAjuste taille={tailleArabeTuile(name.name_arabic)} min={18} dir="rtl" lang="ar"
          className="font-arabic font-bold leading-snug mt-1" style={{ color: 'hsl(0 0% 95%)' }}>
          {name.name_arabic}
        </TexteAjuste>
      ) : (
        <p className="text-4xl text-center leading-none w-full mt-1" aria-hidden="true"
          style={{ filter: 'drop-shadow(0 0 10px hsla(38, 92%, 55%, 0.55))' }}>
          ✨
        </p>
      )}
      {name.transliteration && accessible && (
        <TexteAjuste taille={24} min={12} className="font-bold mt-1 leading-tight" style={{ color: 'hsl(38 92% 62%)' }}>
          {/* Chaque mot reste entier (« Al-Mouqtadir » ne se sépare pas au tiret) : la taille diminue plutôt */}
          {name.transliteration.split(' ').map((mot, i) => (
            <span key={i}>{i > 0 && ' '}<span className="whitespace-nowrap">{mot}</span></span>
          ))}
        </TexteAjuste>
      )}
      <TexteAjuste taille={22} min={12} className="mt-1 leading-tight" style={{ color: accessible ? 'hsl(222 20% 78%)' : 'hsl(38 60% 66%)' }}>
        {accessible ? name.name_french : '🔒 Verrouillé'}
      </TexteAjuste>

      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: validated
          ? 'linear-gradient(90deg, transparent, hsl(142 70% 45%), transparent)'
          : 'linear-gradient(90deg, transparent, hsl(38 92% 50%), transparent)'
        }}
      />
    </button>
  );
}
