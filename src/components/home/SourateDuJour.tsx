import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CORAN_ORDERED } from '@/data/sourates';
import { SURA_PAGE, indexOfPage } from '@/data/coranMeta';

/**
 * 📖 Sourate du jour sur l'accueil (idée acceptée par Nadia, 2026-10-25) : une fiche validée par l'enseignante,
 * la même pour tout le monde le même jour. Rien ne s'affiche tant qu'aucune fiche n'est validée.
 * Protégée : une erreur ici n'empêche jamais l'accueil de s'ouvrir (SilentBoundary).
 */
class SilentBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: Error) { console.error('Sourate du jour :', e); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Card() {
  const navigate = useNavigate();
  const { data: stories = [] } = useQuery({
    queryKey: ['sourate-stories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sourate_stories').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
  const validated = stories.filter((s) => s.validated).sort((a, b) => a.sourate_number - b.sourate_number);
  if (!validated.length) return null;
  const now = new Date();
  const dayOfYear = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
  const story = validated[dayOfYear % validated.length];
  const s = CORAN_ORDERED.find((x) => x.number === story.sourate_number);
  if (!s) return null;
  const page = SURA_PAGE[s.number - 1];
  const extract = story.texte.length > 170 ? `${story.texte.slice(0, 170).replace(/\s+\S*$/, '')}…` : story.texte;

  return (
    <div className="rounded-2xl overflow-hidden shadow-md animate-fade-in">
      <div className="bg-gradient-to-br from-[#7a1d22] to-[#561216] px-4 py-3 text-white relative">
        <span className="absolute top-2 right-3 text-2xl opacity-40 pointer-events-none select-none">✨</span>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-base">📖 Sourate du jour</h3>
          <span className="font-arabic text-xl text-[#f3d38b]">{s.name_arabic}</span>
        </div>
        <p className="text-sm text-white/85 [overflow-wrap:anywhere]">{s.name_french} · {s.verses_count} versets · page {page}</p>
      </div>
      <div className="bg-[#fbf7ef] dark:bg-[#221413] px-4 py-3 space-y-2">
        {story.titre && <p className="text-sm font-extrabold text-[#2a1414] dark:text-[#f3e9e4]">{story.titre}</p>}
        <p className="text-sm text-[#4a3330] dark:text-[#e3d3cd] leading-relaxed">{extract}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={() => navigate(`/coran?tab=lieu&sourate=${s.number}`)}
            className="rounded-full bg-[#7a1d22] text-white px-4 py-1.5 text-xs font-bold active:scale-95 transition-transform">🕋 Lire son histoire</button>
          <button type="button" onClick={() => navigate(`/coran?page=${indexOfPage(page)}`)}
            className="rounded-full bg-[#c39a3e] text-white px-4 py-1.5 text-xs font-bold active:scale-95 transition-transform">📖 Ouvrir la sourate</button>
        </div>
      </div>
    </div>
  );
}

export function SourateDuJour() {
  return <SilentBoundary><Card /></SilentBoundary>;
}
