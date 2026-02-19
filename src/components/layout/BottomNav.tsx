import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, BookOpen, Hand, BookMarked, Sparkles, MessageSquare, Star, Music, Video, FileText, Image, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LucideIcon } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const ICON_MAP: Record<string, LucideIcon> = {
  Moon, BookOpen, Hand, BookMarked, Sparkles, MessageSquare, Star, Music, Video, FileText, Image,
};

const MAX_VISIBLE = 5;

const BottomNav = React.forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: modules, refetch } = useQuery({
    queryKey: ['learning-modules-nav'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('is_active', true)
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
  const navItems = React.useMemo(() => {
    if (!modules) return [];
    return modules.map((mod) => ({
      icon: ICON_MAP[mod.icon] || BookOpen,
      label: mod.title,
      path: mod.is_builtin && mod.builtin_path ? mod.builtin_path : `/module/${mod.id}`,
      imageUrl: mod.image_url,
    }));
  }, [modules]);

  const needsScroll = navItems.length > MAX_VISIBLE;

  return (
    <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 bottom-nav safe-bottom">
      {needsScroll ? (
        <ScrollArea className="w-full">
          <div className="flex items-center h-16 px-2 min-w-max">
            {navItems.map((item) => (
              <NavButton key={item.path} item={item} location={location} navigate={navigate} compact={needsScroll} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <NavButton key={item.path} item={item} location={location} navigate={navigate} />
          ))}
        </div>
      )}
    </nav>
  );
});

interface NavButtonProps {
  item: { icon: LucideIcon; label: string; path: string; imageUrl?: string | null };
  location: ReturnType<typeof useLocation>;
  navigate: ReturnType<typeof useNavigate>;
  compact?: boolean;
}

const NavButton = ({ item, location, navigate, compact }: NavButtonProps) => {
  const isActive = location.pathname.startsWith(item.path);
  const Icon = item.icon;

  return (
    <button
      onClick={() => navigate(item.path)}
      className={cn(
        'flex flex-col items-center justify-center h-full gap-1 transition-all duration-300',
        compact ? 'px-3 min-w-[64px]' : 'w-full',
        isActive ? 'scale-110' : 'opacity-60 hover:opacity-100'
      )}
    >
      <div
        className={cn(
          'p-2 rounded-xl transition-all duration-300',
          isActive ? 'bg-primary shadow-royal' : 'hover:bg-muted'
        )}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.label} className="h-5 w-5 rounded object-cover" />
        ) : (
          <Icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-gold' : 'text-foreground')} />
        )}
      </div>
      <span
        className={cn(
          'text-[10px] font-medium transition-colors truncate max-w-[60px]',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {item.label}
      </span>
    </button>
  );
};

BottomNav.displayName = 'BottomNav';

export default BottomNav;
