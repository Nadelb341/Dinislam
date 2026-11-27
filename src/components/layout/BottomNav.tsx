import { useCartesVisibles, slugCarte } from '@/hooks/useCartesVisibles';
import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Moon, BookOpen, Hand, BookMarked, Sparkles, MessageSquare, Star, Music, Video, FileText, Image, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LucideIcon } from 'lucide-react';
import { FitText } from '@/components/shared/FitText';
import { MODULE_EMOJI_FALLBACK } from '@/lib/emojiCartes';

const ICON_MAP: Record<string, LucideIcon> = {
  Moon, BookOpen, Hand, BookMarked, Sparkles, MessageSquare, Star, Music, Video, FileText, Image,
};

const PAR_LIGNE = 5;

const BottomNav = React.forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: modules, refetch } = useQuery({
    queryKey: ['learning-modules-nav'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_modules')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  // Realtime subscription for instant updates
  React.useEffect(() => {
    const channel = supabase
      .channel('nav-modules-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'learning_modules' }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  // Use refetchInterval for near-realtime without complex setup
  // 2026-11-11 : même règle que l'accueil (avant : « is_active » seul → une carte réservée à un groupe apparaissait chez tout le monde)
  const visibles = useCartesVisibles();
  const navItems = React.useMemo(() => {
    if (!modules || !visibles) return [];
    return modules.filter((mod) => visibles.has(slugCarte(mod))).map((mod) => ({
      icon: ICON_MAP[mod.icon] || BookOpen,
      label: mod.title,
      path: mod.is_builtin && mod.builtin_path ? mod.builtin_path : `/module/${mod.id}`,
      imageUrl: mod.image_url,
      slug: slugCarte(mod),
    }));
  }, [modules, visibles]);

  // 📐 Hauteur réelle du menu → variable CSS « --menu-bas » : le bas des pages et les boutons ⬆️⬇️ restent au-dessus
  const interne = React.useRef<HTMLElement | null>(null);
  const brancher = React.useCallback((el: HTMLElement | null) => {
    interne.current = el;
    if (typeof ref === 'function') ref(el); else if (ref) ref.current = el;
  }, [ref]);
  React.useLayoutEffect(() => {
    const el = interne.current;
    if (!el) return;
    const racine = document.documentElement;
    const mesurer = () => racine.style.setProperty('--menu-bas', `${Math.ceil(el.getBoundingClientRect().height)}px`);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => { ro.disconnect(); racine.style.removeProperty('--menu-bas'); };
  }, []);

  // 2026-11-26 (Nadia : « comme pour l'agenda ») : 5 icônes par ligne, JAMAIS de défilement à gauche / droite.
  // Jusqu'à 5 cartes : une seule ligne. À partir de 6 : une ligne de plus AU-DESSUS, remplie d'abord par les
  // premières cartes de l'accueil (Alphabet, Nourania…), dans le même ordre que l'accueil (lecture de gauche à droite, de haut en bas).
  const lignes = Math.max(1, Math.ceil(navItems.length / PAR_LIGNE));

  return (
    // 2026-11-26 (Nadia : téléphone tourné) : en paysage peu haut, une seule ligne d'icônes (nom en bulle et pour les lecteurs d'écran)
    <nav ref={brancher} aria-label="Menu des cartes" className="fixed bottom-0 left-0 right-0 z-50 bottom-nav safe-bottom">
      <ul className={cn('mx-auto grid max-w-3xl grid-cols-5 gap-x-1 gap-y-1 px-2 pt-1.5 pb-1.5 paysage:flex paysage:max-w-none paysage:justify-around paysage:py-0.5', lignes > 2 && 'gap-y-0')}>
        {navItems.map((item) => (
          <li key={item.path} className={cn('nav-case min-w-0 paysage:flex-1', location.pathname.startsWith(item.path) && 'actif')}>
            <NavButton item={item} location={location} navigate={navigate} serre={lignes > 2} />
          </li>
        ))}
      </ul>
    </nav>
  );
});

interface NavButtonProps {
  item: { icon: LucideIcon; label: string; path: string; imageUrl?: string | null; slug: string };
  location: ReturnType<typeof useLocation>;
  navigate: ReturnType<typeof useNavigate>;
  serre?: boolean;
}

const NavButton = ({ item, location, navigate, serre }: NavButtonProps) => {
  const isActive = location.pathname.startsWith(item.path);
  const emoji = MODULE_EMOJI_FALLBACK[item.slug.replace(/^module\//, '')]?.emoji;
  const Icon = item.icon;

  // 2026-11-27 (Nadia, version « a ») : plus de tuiles pastel ; émoji + nom sur le fond beige, la carte ouverte dans une pilule claire
  return (
    <button
      onClick={() => navigate(item.path)}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      title={item.label}
      className={cn(
        'group flex w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[22px] transition-transform duration-200 active:scale-90 [-webkit-tap-highlight-color:transparent]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b5651d] dark:focus-visible:ring-[#ffd8a3]',
        serre ? 'h-[50px]' : 'h-[58px]',
        'paysage:h-11',
        isActive && 'nav-pilule',
      )}
    >
      <span className={cn('grid place-items-center transition-transform duration-200 group-hover:scale-110', serre ? 'h-6' : 'h-7', 'paysage:h-7')}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-6 w-6 rounded-lg object-cover" />
        ) : emoji ? (
          <span aria-hidden className={cn('leading-none', serre ? 'text-lg' : 'text-xl', emoji === 'أ' && 'font-arabic font-bold text-[#2457a5] dark:text-[#a9c8ff]')}>{emoji}</span>
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </span>
      {/* Nom long en plusieurs mots (« Grammaire & Conjugaison ») : sur 2 lignes, mots entiers ; sinon une ligne qui rétrécit */}
      {item.label.length > 13 && item.label.includes(' ') ? (
        <span className={cn('block max-w-full px-0.5 text-center text-[9.5px] leading-[1.05] [hyphens:none] paysage:hidden', isActive ? 'font-extrabold' : 'font-bold')}>
          {item.label}
        </span>
      ) : (
        <FitText
          className={cn(
            'max-w-full px-0.5 text-[10px] leading-tight paysage:hidden',
            isActive ? 'font-extrabold' : 'font-bold',
          )}
        >
          {item.label}
        </FitText>
      )}
    </button>
  );
};

BottomNav.displayName = 'BottomNav';

export default BottomNav;
