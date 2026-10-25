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

export const BOOKMARK_COLORS: Record<BookmarkColor, { dot: string; hex: string; emoji: string; label: string }> = {
  rouge: { dot: 'bg-[#c0392b]', hex: '#c0392b', emoji: '🔴', label: 'À réviser' },
  or: { dot: 'bg-[#c39a3e]', hex: '#c39a3e', emoji: '🟡', label: 'À apprendre' },
  vert: { dot: 'bg-[#1f7a52]', hex: '#1f7a52', emoji: '🟢', label: 'Ma page préférée' },
  bleu: { dot: 'bg-[#2457a5]', hex: '#2457a5', emoji: '🔵', label: 'Important' },
};

/** Rappel de révision (idée acceptée le 2026-10-25) : « À réviser » revient 3 jours après, puis 7 jours après chaque révision */
export const REVIEW_FIRST_DAYS = 3;
export const REVIEW_NEXT_DAYS = 7;

/** Fiches à relire avec attention avant validation (doutes signalés le 2026-10-25) */
export const STORIES_WITH_DOUBT = [3, 8, 16, 17, 24, 30, 36, 60, 64, 66, 83, 96];
