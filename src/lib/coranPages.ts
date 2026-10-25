import { supabase } from '@/integrations/supabase/client';
import { READER_COUNT, pageOfIndex, juzOfPage, suraOfPage } from '@/data/coranMeta';
import { SOURATES_DATA } from '@/data/sourates';
import type { BookmarkColor } from '@/hooks/useCoranProgress';

/** Carte « Coran » : adresse d'une page du lecteur (bucket coran-pages, dossier coran_pages) */
export const pageUrl = (index: number) =>
  supabase.storage.from('coran-pages').getPublicUrl(`coran_pages/${String(index).padStart(3, '0')}.webp`).data.publicUrl;

/** Titre et sous-titre d'une page du lecteur (couverture, page du Coran, À savoir) */
export function describeIndex(index: number): { title: string; sub: string } {
  if (index === 1) return { title: 'Couverture', sub: 'Coran Al-Tajwid' };
  if (index === 2) return { title: 'Les règles du tajwid', sub: 'Un exemple qui explique' };
  if (index === 3) return { title: 'Avant-propos', sub: 'Al-Azhar' };
  const page = pageOfIndex(index);
  if (!page) return { title: 'À savoir', sub: `Fin du livre · ${index - 607}/${READER_COUNT - 607}` };
  const sura = SOURATES_DATA.find((s) => s.number === suraOfPage(page));
  return { title: `Page ${page}`, sub: `${sura?.name_french.split(' (')[0] ?? ''} · Juz' ${juzOfPage(page)}` };
}

export const BOOKMARK_COLORS: Record<BookmarkColor, { dot: string; label: string }> = {
  rouge: { dot: 'bg-[#c0392b]', label: 'À réviser' },
  or: { dot: 'bg-[#c39a3e]', label: 'À apprendre' },
  vert: { dot: 'bg-[#1f7a52]', label: 'Ma page préférée' },
  bleu: { dot: 'bg-[#2457a5]', label: 'Important' },
};
