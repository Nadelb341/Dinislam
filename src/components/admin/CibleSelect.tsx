import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SOURATES_DATA } from '@/data/sourates';

/**
 * Élément visé par un devoir (2026-10-26) : la leçon, la sourate, le nom… que « Commencer mon travail » ouvrira chez l'élève.
 * Facultatif : sans choix, le bouton ouvre simplement la carte de la matière.
 */
type Option = { value: string; label: string };

async function optionsFor(type: string): Promise<Option[]> {
  switch (type) {
    case 'nourania': {
      const { data } = await supabase.from('nourania_lessons').select('id, lesson_number, title_french').order('lesson_number');
      return (data || []).map((l) => ({ value: String(l.id), label: `Leçon ${l.lesson_number}${l.title_french ? ` · ${l.title_french}` : ''}` }));
    }
    case 'sourate':
    case 'recitation':
      return [...SOURATES_DATA].sort((a, b) => (a.number === 1000 ? 255.5 : a.number) - (b.number === 1000 ? 255.5 : b.number))
        .map((s) => ({ value: String(s.number), label: `${s.number === 1000 ? '2-255' : s.number} · ${s.name_french.split(' (')[0]}` }));
    case 'allah_names': {
      const { data } = await supabase.from('allah_names').select('id, display_order, transliteration, name_french').order('display_order');
      return (data || []).map((n) => ({ value: String(n.id), label: `Nom n° ${n.display_order} · ${n.transliteration || n.name_french}` }));
    }
    case 'alphabet': {
      const { data } = await supabase.from('alphabet_letters').select('id, name_french, letter_arabic, display_order').order('display_order');
      return (data || []).map((l) => ({ value: String(l.id), label: `${l.letter_arabic} · ${l.name_french}` }));
    }
    case 'invocations': {
      const { data } = await supabase.from('invocations').select('id, title_french, title_arabic, display_order').order('display_order');
      return (data || []).map((i) => ({ value: String(i.id), label: i.title_french || i.title_arabic || 'Invocation' }));
    }
    case 'priere': {
      const { data } = await supabase.from('prayer_cards').select('id, title_french, title, display_order').order('display_order');
      return (data || []).map((c) => ({ value: String(c.id), label: c.title_french || c.title || 'Carte' }));
    }
    case 'coran':
      return Array.from({ length: 604 }, (_, i) => ({ value: String(i + 1), label: `Page ${i + 1}` }));
    default:
      return [];
  }
}

export function CibleSelect({ type, value, onChange, className = '' }: { type: string; value: string; onChange: (v: string) => void; className?: string }) {
  const { data: options = [] } = useQuery({ queryKey: ['devoir-cibles', type], queryFn: () => optionsFor(type), staleTime: 10 * 60 * 1000 });
  if (!options.length) return null;
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Élément à ouvrir"
      className={`rounded-lg border bg-background px-2 py-1.5 text-xs max-w-[11rem] ${className}`}>
      <option value="">📍 Ouvrir…</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
