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
      <ul className={cn('mx-auto grid max-w-3xl grid-cols-5 gap-x-1 px-2 pt-1.5 pb-1 paysage:flex paysage:max-w-none paysage:justify-around paysage:py-0.5', lignes > 2 && 'gap-y-0')}>
        {navItems.map((item) => (
          <li key={item.path} className="min-w-0 paysage:flex-1">
            <NavButton item={item} location={location} navigate={navigate} serre={lignes > 2} />
          </li>
        ))}
      </ul>
    </nav>
  );
});

/** 🎨 Tuiles colorées du menu (Nadia, 2026-11-26 : « plus agréable à regarder, avec des couleurs », comme l'agenda) */
const TEINTES: Record<string, string> = {
  ramadan: '#fde2c4', alphabet: '#cfe3ff', invocations: '#e2d9ff', priere: '#c9f1f5', grammaire: '#cdf2d8',
  'allah-names': '#ffeeb8', '99-noms': '#ffeeb8', sourates: '#d6dcff', nourania: '#fff1a8', vocabulaire: '#ffd6ea',
  'lecture-coran': '#c4f0e6', darija: '#ffdcc2', dictionnaire: '#e4dcff', dhikr: '#d3f2d1', hadiths: '#d4def9',
  'histoires-prophetes': '#ffe9b3', coran: '#cdeed2', 'cahier-texte': '#d3e5ff', 'registre-presence': '#cfeed8',
};
const TEINTES_SECOURS = ['#fde2c4', '#cfe3ff', '#e2d9ff', '#cdf2d8', '#ffd6ea', '#fff1a8'];
const teinte = (slug: string) => {
  const cle = slug.replace(/^module\//, '');
  return TEINTES[cle] ?? TEINTES_SECOURS[[...cle].reduce((h, c) => h + c.charCodeAt(0), 0) % TEINTES_SECOURS.length];
};

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

  return (
    <button
      onClick={() => navigate(item.path)}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      title={item.label}
      className={cn(
        // 🔍 micro zoom (Nadia, 2026-11-26) : la tuile grossit un peu au survol et se « presse » au toucher
        'group flex w-full flex-col items-center justify-center gap-0.5 rounded-xl transition-transform duration-200 active:scale-90 [-webkit-tap-highlight-color:transparent]',
        serre ? 'h-[50px]' : 'h-[58px]',
        'paysage:h-11',
      )}
    >
      <span
        className={cn(
          'grid place-items-center rounded-[14px] shadow-[0_3px_8px_rgba(120,90,60,.18),inset_0_1px_0_rgba(255,255,255,.7)] transition-transform duration-200 group-hover:scale-110',
          serre ? 'h-8 w-8' : 'h-9 w-9',
          'paysage:h-8 paysage:w-8',
          isActive && 'scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background'
        )}
        style={{ background: `linear-gradient(160deg, #ffffffcc, transparent 60%), ${teinte(item.slug)}` }}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-6 w-6 rounded-lg object-cover" />
        ) : emoji ? (
          <span aria-hidden className={cn('leading-none', serre ? 'text-lg' : 'text-xl', emoji === 'أ' && 'font-arabic font-bold text-[#2457a5]')}>{emoji}</span>
        ) : (
          <Icon className="h-5 w-5 text-foreground" />
        )}
      </span>
      <FitText
        className={cn(
          'max-w-full px-0.5 text-[10px] leading-tight transition-colors paysage:hidden',
          isActive ? 'font-extrabold text-primary' : 'font-semibold text-[#7d6e60] dark:text-muted-foreground'
        )}
      >
        {item.label}
      </FitText>
    </button>
  );
};

BottomNav.displayName = 'BottomNav';

export default BottomNav;
