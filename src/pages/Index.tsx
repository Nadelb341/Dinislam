import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Moon, BookOpen, Hand, BookMarked, Sparkles, MessageSquare, Star, Music, Video, FileText, Image, Heart, List, Scroll, Users, MoreVertical, EyeOff, Eye, Bell, X, Sun, MessageCircle, Book, Languages, Library, RefreshCw, Feather, BookHeart, NotebookPen, ClipboardList, ScrollText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import HomeworkCard from '@/components/homework/HomeworkCard';
import BlocDevoirsEleve from '@/components/homework/BlocDevoirsEleve';
import { useUserProgress } from '@/hooks/useUserProgress';
import { usePrayerTimesCity, CITIES, CityOption, getSavedMethod } from '@/hooks/usePrayerTimesCity';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useWebPush } from '@/hooks/useWebPush';
import { sendPushNotification } from '@/lib/pushHelper';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';

const PRAYER_EMOJI: Record<string, string> = {
  'Sobh (Fajr)': '🌅',
  'Lever du soleil': '🌄',
  'Dohr': '☀️',
  'Asr': '🍃',
  'Maghreb': '🌇',
  'Icha': '🌙',
};

const HADITHS = [
  { text: "Les actions ne valent que par leurs intentions.", source: "Sahih Boukhari", theme: "Intention", arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ" },
  { text: "Facilite les choses et ne les complique pas. Réjouis les gens et ne les fais pas fuir.", source: "Sahih Boukhari", theme: "Douceur", arabic: "يَسِّرُوا وَلَا تُعَسِّرُوا" },
  { text: "Le plus aimé parmi vous auprès d'Allah est celui qui a le meilleur caractère.", source: "Sahih Boukhari", theme: "Caractère", arabic: "" },
  { text: "Cherche la science du berceau jusqu'à la tombe.", source: "Sagesse islamique", theme: "Savoir", arabic: "اطلب العلم من المهد إلى اللحد" },
  { text: "Nul d'entre vous n'est croyant tant qu'il n'aime pas pour son frère ce qu'il aime pour lui-même.", source: "Sahih Boukhari", theme: "Fraternité", arabic: "" },
  { text: "Le Musulman est celui dont les autres Musulmans sont préservés de sa langue et de sa main.", source: "Sahih Boukhari", theme: "Bienveillance", arabic: "" },
  { text: "Souriez à votre frère, c'est de la charité.", source: "Tirmidhi", theme: "Générosité", arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ" },
  { text: "Le paradis se trouve sous les pieds des mères.", source: "Nasaï", theme: "Famille", arabic: "الجَنَّةُ تَحْتَ أَقْدَامِ الأُمَّهَاتِ" },
  { text: "Soyez bons envers vos parents, et vos enfants seront bons envers vous.", source: "Sagesse islamique", theme: "Parents", arabic: "" },
  { text: "Celui qui ne remercie pas les gens ne remercie pas Allah.", source: "Tirmidhi", theme: "Gratitude", arabic: "مَنْ لَمْ يَشْكُرِ النَّاسَ لَمْ يَشْكُرِ اللَّه" },
  { text: "La propreté est la moitié de la foi.", source: "Sahih Muslim", theme: "Pureté", arabic: "الطَّهُورُ شَطْرُ الإِيمَانِ" },
  { text: "Le fort n'est pas celui qui terrasse les gens, mais celui qui se maîtrise quand il est en colère.", source: "Sahih Boukhari", theme: "Maîtrise de soi", arabic: "" },
  { text: "Dis la vérité même si elle est amère.", source: "Ibn Hibbane", theme: "Honnêteté", arabic: "قُلِ الحَقَّ وَلَوْ كَانَ مُرًّا" },
  { text: "Quiconque croit en Allah et au Jour dernier doit honorer son voisin.", source: "Sahih Boukhari", theme: "Voisinage", arabic: "" },
  { text: "La miséricorde n'est accordée qu'à ceux qui sont miséricordieux.", source: "Tirmidhi", theme: "Miséricorde", arabic: "" },
  { text: "Le meilleur des gens est celui qui est le plus utile aux autres.", source: "Tabarani", theme: "Utilité", arabic: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ" },
  { text: "Ne méprise aucune bonne action, même si c'est d'accueillir ton frère avec un visage souriant.", source: "Sahih Muslim", theme: "Bonne action", arabic: "" },
  { text: "Aide ton frère, qu'il soit oppresseur ou opprimé.", source: "Sahih Boukhari", theme: "Fraternité", arabic: "" },
  { text: "Le croyant ne se mord pas deux fois au même endroit.", source: "Sahih Boukhari", theme: "Sagesse", arabic: "" },
  { text: "Parle bien ou garde le silence.", source: "Sahih Boukhari & Muslim", theme: "Parole", arabic: "قُلْ خَيْرًا أَوِ اصْمُتْ" },
  { text: "Respectez vos aînés, soyez bienveillants envers vos cadets, vous entrerez au Paradis.", source: "Tirmidhi", theme: "Respect", arabic: "" },
  { text: "Celui qui se lève le matin sans soucier du bien des musulmans n'est pas des nôtres.", source: "Bayhaqi", theme: "Solidarité", arabic: "" },
  { text: "Il n'y a pas de bien dans celui qui ne fait pas confiance et en qui on ne peut pas avoir confiance.", source: "Ahmad", theme: "Confiance", arabic: "" },
  { text: "Craignez Allah où que vous soyez, et faites suivre la mauvaise action d'une bonne qui l'effacera.", source: "Tirmidhi", theme: "Taqwa", arabic: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ" },
  { text: "Le savant dépasse l'adorateur comme la lune dépasse les autres étoiles.", source: "Tirmidhi", theme: "Savoir", arabic: "" },
  { text: "Celui qui suit une voie pour y chercher un savoir, Allah lui facilite une voie vers le Paradis.", source: "Sahih Muslim", theme: "Savoir", arabic: "" },
  { text: "Prenez soin de votre corps, car il vous a été confié.", source: "Sagesse islamique", theme: "Santé", arabic: "" },
  { text: "Ne regardez pas vers ceux qui sont au-dessus de vous, regardez vers ceux qui sont en dessous.", source: "Sahih Boukhari", theme: "Gratitude", arabic: "" },
  { text: "Deux paroles légères sur la langue, lourdes dans la balance : Soubhana Allah wa bihamdihi, Soubhana Allah il Adhim.", source: "Sahih Boukhari", theme: "Dhikr", arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ" },
  { text: "Commencez tout acte important par Bismillah.", source: "Sagesse islamique", theme: "Basmala", arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ" },
  { text: "L'inégalité entre les croyants dans leurs actes de dévotion est comme l'inégalité de la lune et des étoiles.", source: "Tirmidhi", theme: "Dévotion", arabic: "" },
  { text: "Soyez dans ce monde comme un étranger ou un voyageur de passage.", source: "Sahih Boukhari", theme: "Zuhd", arabic: "" },
  { text: "Quiconque construit une mosquée pour Allah, Allah lui construira une maison au Paradis.", source: "Sahih Boukhari", theme: "Mosquée", arabic: "" },
  { text: "Visitez les malades, nourrissez ceux qui ont faim et libérez les captifs.", source: "Sahih Boukhari", theme: "Humanité", arabic: "" },
  { text: "L'Islam est fondé sur cinq piliers : la Shahada, la prière, la zakat, le jeûne et le pèlerinage.", source: "Sahih Boukhari", theme: "Pilliers", arabic: "" },
  { text: "Dis : Allahouma inni as'alouka al-huda wa at-touqa wa al-afafa wa al-ghina.", source: "Sahih Muslim", theme: "Invocation", arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الهُدَى وَالتُّقَى" },
  { text: "Le meilleur de vous est celui qui apprend le Coran et l'enseigne.", source: "Sahih Boukhari", theme: "Coran", arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ" },
  { text: "Toute bonne action est de la charité.", source: "Sahih Boukhari", theme: "Générosité", arabic: "كُلُّ مَعْرُوفٍ صَدَقَةٌ" },
  { text: "Récompensez-vous les uns les autres par des cadeaux, vous vous aimerez.", source: "Boukhari al-Adab", theme: "Générosité", arabic: "تَهَادَوْا تَحَابُّوا" },
  { text: "Invoque Allah avec la certitude d'être exaucé.", source: "Tirmidhi", theme: "Dou'a", arabic: "" },
];

const HIJRI_MONTHS = [
  'Mouharram', 'Safar', "Rabi' Al Awwal", "Rabi' Al Thani",
  'Joumada Al Oula', 'Joumada Al Akhira', 'Rajab', "Cha'bane",
  'Ramadan', 'Chawwal', "Dhou Al Qi'da", 'Dhou Al Hijja',
];

function getGregorianDate(): string {
  const raw = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function getHijriDate(): string {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic', {
      day: 'numeric', month: 'numeric', year: 'numeric',
    }).formatToParts(new Date());
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value?.replace(/\D/g, '');
    if (day && month && year) {
      return `${day} ${HIJRI_MONTHS[parseInt(month) - 1] ?? ''} ${year}`;
    }
  } catch {}
  return '';
}

function getSavedCity(): CityOption {
  try {
    const saved = localStorage.getItem('dinislam_prayer_city');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.lat && parsed.lon) return parsed;
    }
  } catch {}
  return CITIES.find(c => c.label.includes('Montpellier')) ?? CITIES[0];
}

function getDayHadith() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return HADITHS[dayOfYear % HADITHS.length];
}

const ICON_MAP: Record<string, LucideIcon> = {
  Moon, BookOpen, Hand, BookMarked, Sparkles, MessageSquare, Star, Music, Video, FileText, Image, Heart, List, Scroll, Users, Sun, MessageCircle, Book, Languages, Library, RefreshCw, Feather, BookHeart, NotebookPen, ClipboardList, ScrollText
};

const MODULE_EMOJI_FALLBACK: Record<string, { emoji: string; bgColor: string }> = {
  "ramadan": { emoji: "🌙", bgColor: "#fff7ed" },
  "alphabet": { emoji: "أ", bgColor: "#eff6ff" },
  "invocations": { emoji: "🤲", bgColor: "#f5f3ff" },
  "priere": { emoji: "🕌", bgColor: "#ecfeff" },
  "grammaire": { emoji: "📖", bgColor: "#f0fdf4" },
  "99-noms": { emoji: "✨", bgColor: "#fffbeb" },
  "sourates": { emoji: "📿", bgColor: "#eef2ff" },
  "nourania": { emoji: "🌟", bgColor: "#fefce8" },
  "vocabulaire": { emoji: "💬", bgColor: "#fdf2f8" },
  "lecture-coran": { emoji: "📖", bgColor: "#f0fdfa" },
  "darija": { emoji: "🗣️", bgColor: "#fff7ed" },
  "dictionnaire": { emoji: "📚", bgColor: "#f5f3ff" },
  "dhikr": { emoji: "📿", bgColor: "#f0fdf4" },
  "hadiths": { emoji: "🕊️", bgColor: "#eef2ff" },
  "histoires-prophetes": { emoji: "⭐", bgColor: "#fffbeb" },
  "cahier-texte": { emoji: "📝", bgColor: "#eff6ff" },
  "registre-presence": { emoji: "✅", bgColor: "#f0fdf4" },
};

const getModuleSlug = (mod: any): string => {
  if (mod.builtin_path) return mod.builtin_path.replace(/^\//, '');
  return (mod.title || '').toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [activatingNotif, setActivatingNotif] = useState(false);
  const { data: progress } = useUserProgress();

  const [prayerCity] = useState<CityOption>(getSavedCity);
  const { prayerTimes, getNextPrayer } = usePrayerTimesCity(prayerCity, getSavedMethod());
  const nextPrayer = getNextPrayer();
  const todayHadith = getDayHadith();

  // Fetch modules from DB
  const { data: modules } = useQuery({
    queryKey: ['learning-modules', isAdmin],
    queryFn: async () => {
      let query = supabase.from('learning_modules').select('*').order('display_order');
      if (!isAdmin) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Arrow-based reorder (admin only)
  const moveModule = useCallback(async (index: number, direction: 'up' | 'down') => {
    if (!modules) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const reordered = [...modules];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const updated = reordered.map((m, i) => ({ ...m, display_order: i }));
    queryClient.setQueryData(['learning-modules', isAdmin], updated);

    const { error: e1 } = await supabase.from('learning_modules').update({ display_order: targetIndex }).eq('id', updated[targetIndex].id);
    const { error: e2 } = await supabase.from('learning_modules').update({ display_order: index }).eq('id', updated[index].id);

    if (e1 || e2) {
      queryClient.invalidateQueries({ queryKey: ['learning-modules'] });
      toast.error('Erreur lors de la mise à jour');
    } else {
      toast.success('Ordre mis à jour');
    }
  }, [modules, isAdmin, queryClient]);

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active, title }: {id: string;is_active: boolean;title?: string;}) => {
      const { error } = await supabase.from('learning_modules').update({ is_active }).eq('id', id);
      if (error) throw error;
      return { is_active, title };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['learning-modules'] });
      queryClient.invalidateQueries({ queryKey: ['admin-learning-modules'] });
      toast.success(result.is_active ? 'Module affiché aux élèves' : 'Module masqué aux élèves');

      if (result.is_active && result.title) {
        sendPushNotification({
          title: '🌟 Nouvelle activité disponible !',
          body: `Salam ! Le module ${result.title} est maintenant disponible sur Dini Bismillah !`,
          type: 'broadcast'
        });
      }
    },
    onError: () => toast.error('Erreur lors de la mise à jour')
  });

  // Fetch user profile to check if name is set
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.
      from('profiles').
      select('full_name, notification_prompt_dismissed, notification_prompt_later_count, notification_prompt_later_at').
      eq('user_id', user.id).
      maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });


  // Check notification permission and show banner with smart logic
  useEffect(() => {
    if (user && 'Notification' in window && profile) {
      const dismissed = (profile as any).notification_prompt_dismissed;
      const laterCount = (profile as any).notification_prompt_later_count || 0;
      const laterAt = (profile as any).notification_prompt_later_at;

      if (dismissed === 'accepted' || Notification.permission === 'granted') {
        setShowNotifBanner(false);
        return;
      }

      // If clicked "later" 3+ times, wait 7 days
      if (laterCount >= 3 && laterAt) {
        const sevenDaysLater = new Date(laterAt);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        if (new Date() < sevenDaysLater) {
          setShowNotifBanner(false);
          return;
        }
      }

      // Show banner if permission is default
      if (Notification.permission === 'default') {
        setShowNotifBanner(true);
      }
    }
  }, [user, profile]);

  const handleActivateNotifications = async () => {
    if (!user) return;
    setActivatingNotif(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications activées !');
        await supabase.from('profiles').update({ notification_prompt_dismissed: 'accepted' }).eq('user_id', user.id);
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      } else {
        toast.info('Permission refusée');
      }
      setShowNotifBanner(false);
    } catch (e: any) {
      toast.error('Erreur : ' + e.message);
    }
    setActivatingNotif(false);
  };

  const handleDismissNotifBanner = async () => {
    if (!user) return;
    setShowNotifBanner(false);
    const laterCount = ((profile as any)?.notification_prompt_later_count || 0) + 1;
    await supabase.from('profiles').update({
      notification_prompt_dismissed: 'later',
      notification_prompt_later_count: laterCount,
      notification_prompt_later_at: new Date().toISOString()
    }).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
  };

const handleModuleClick = (mod: any) => {
    if (mod.is_builtin && mod.builtin_path) {
      navigate(mod.builtin_path);
    } else {
      navigate(`/module/${mod.id}`);
    }
  };

  return (
    <>
<AppLayout showBottomNav={false}>
        <div className="p-4 space-y-6">
          {/* Notification Permission Banner */}
          {showNotifBanner &&
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
              <Bell className="h-6 w-6 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">🔔 Active les notifications pour ne rien manquer !</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="ghost" onClick={handleDismissNotifBanner}>
                  Plus tard
                </Button>
                <Button size="sm" onClick={handleActivateNotifications} disabled={activatingNotif}>
                  {activatingNotif ? '...' : 'Activer'}
                </Button>
              </div>
            </div>
          }
          <div className="text-center py-6 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                <span className="font-arabic text-base text-primary">﷽</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Dini Bismillah</h1>
            </div>
            <p className="text-muted-foreground mb-1">Assalamou Alaykoum</p>
            <h2 className="text-2xl font-bold text-foreground">
              Bienvenue{profile?.full_name ? `, ${profile.full_name}` : ''} !
            </h2>
            <p className="font-arabic text-gold mt-2 text-3xl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>

          {/* Prochaine Prière */}
          <div className="rounded-2xl overflow-hidden shadow-md animate-fade-in">
            {/* Header dégradé pastel */}
            <div className="bg-gradient-to-r from-violet-100 via-indigo-100 to-blue-100 dark:from-violet-900/40 dark:via-indigo-900/40 dark:to-blue-900/40 px-4 pt-4 pb-6 relative">
              <div className="absolute inset-0 opacity-40 pointer-events-none select-none overflow-hidden">
                <span className="absolute top-1 right-3 text-4xl">🌙</span>
                <span className="absolute bottom-1 left-2 text-2xl">⭐</span>
                <span className="absolute top-2 left-1/2 text-xl">✨</span>
              </div>
              <div className="relative text-center mb-2">
                <p className="text-base font-bold text-indigo-800 dark:text-indigo-100 capitalize">{getGregorianDate()}</p>
                {getHijriDate() && (
                  <p className="text-sm text-indigo-500 dark:text-indigo-400 mt-0.5">{getHijriDate()}</p>
                )}
              </div>
              <div className="relative flex items-center justify-between">
                <h3 className="font-bold text-indigo-800 dark:text-indigo-200 text-base flex items-center gap-2">
                  🕌 Prochaine prière
                </h3>
                <span className="text-xs text-indigo-500 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-800/50 px-2 py-0.5 rounded-full">{prayerCity.label}</span>
              </div>
              {nextPrayer && (
                <div className="relative mt-3 flex items-center justify-center gap-4">
                  <span className="text-5xl drop-shadow">{PRAYER_EMOJI[nextPrayer.name] ?? '🕌'}</span>
                  <div>
                    <p className="text-indigo-400 dark:text-indigo-400 text-xs font-medium uppercase tracking-wide">Prochaine</p>
                    <p className="text-indigo-700 dark:text-indigo-200 font-extrabold text-xl leading-tight">{nextPrayer.name}</p>
                    <p className="text-indigo-900 dark:text-white font-black text-4xl leading-none">{nextPrayer.time}</p>
                  </div>
                </div>
              )}
            </div>
            {/* Grille horaires */}
            <div className="bg-white dark:bg-slate-800 px-3 py-3">
              {!prayerTimes ? (
                <p className="text-sm text-muted-foreground text-center py-1">Chargement...</p>
              ) : (
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {[
                    { name: 'Fajr', emoji: '🌅', time: prayerTimes.fajr, color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
                    { name: 'Dohr', emoji: '☀️', time: prayerTimes.dhuhr, color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
                    { name: 'Asr', emoji: '🍃', time: prayerTimes.asr, color: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' },
                    { name: 'Maghrib', emoji: '🌇', time: prayerTimes.maghrib, color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' },
                    { name: 'Icha', emoji: '🌙', time: prayerTimes.isha, color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' },
                  ].map(p => (
                    <div key={p.name} className={`rounded-xl py-1.5 px-0.5 ${p.color}`}>
                      <p className="text-base leading-none mb-0.5">{p.emoji}</p>
                      <p className="text-[10px] font-semibold">{p.name}</p>
                      <p className="text-xs font-bold">{p.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hadith du Jour */}
          <div className="rounded-2xl overflow-hidden shadow-md animate-fade-in">
            {/* Header dégradé vert pastel */}
            <div className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 dark:from-emerald-900/40 dark:via-teal-900/40 dark:to-cyan-900/40 px-4 py-4 relative">
              <div className="absolute inset-0 opacity-40 pointer-events-none select-none overflow-hidden">
                <span className="absolute top-1 right-3 text-3xl">🌿</span>
                <span className="absolute bottom-0 left-2 text-2xl">🕊️</span>
              </div>
              <div className="relative flex items-center justify-between">
                <h3 className="font-bold text-emerald-800 dark:text-emerald-200 text-base flex items-center gap-2">
                  🕊️ Hadith du jour
                </h3>
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-200 dark:bg-emerald-800/50 px-2.5 py-0.5 rounded-full shrink-0">
                  {todayHadith.theme}
                </span>
              </div>
              {todayHadith.arabic && (
                <p className="font-arabic text-right text-lg text-emerald-800 dark:text-emerald-200 mt-2 leading-loose">
                  {todayHadith.arabic}
                </p>
              )}
            </div>
            {/* Corps */}
            <div className="bg-white dark:bg-slate-800 px-4 py-3">
              <div className="flex gap-2 items-start">
                <span className="text-emerald-400 text-4xl leading-none font-serif mt-[-6px] shrink-0">"</span>
                <p className="text-sm font-medium text-foreground leading-relaxed pt-1">
                  {todayHadith.text}
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-right mt-2">— {todayHadith.source}</p>
            </div>
          </div>

          {/* Quick Stats - right after welcome message */}
          {progress && modules && (() => {
            const PROGRESS_MAP: Record<string, {label: string;value: string;color: string;}> = {
              '/sourates': { label: 'Sourates', value: `${progress.sourates.validated} sur ${progress.sourates.total}`, color: 'text-gold' },
              '/nourania': { label: 'Nourania', value: `${progress.nourania.validated} sur ${progress.nourania.total}`, color: 'text-primary' },
              '/ramadan': { label: 'Ramadan', value: `${progress.ramadan.completed} sur ${progress.ramadan.total}`, color: 'text-gold' },
              '/alphabet': { label: 'Alphabet', value: `${progress.alphabet.validated} sur ${progress.alphabet.total}`, color: 'text-primary' },
              '/invocations': { label: 'Invocations', value: `${progress.invocations.memorized} sur ${progress.invocations.total}`, color: 'text-gold' },
              '/priere': { label: 'Prière', value: `${progress.prayer.validated} validées`, color: 'text-primary' }
            };
            const activeItems = (modules || []).
            filter((m) => m.is_active && m.is_builtin && m.builtin_path && PROGRESS_MAP[m.builtin_path]).
            map((m) => ({ ...PROGRESS_MAP[m.builtin_path!], order: m.display_order })).
            sort((a, b) => a.order - b.order);

            if (activeItems.length === 0) return null;

            return (
              <div className="bg-card rounded-2xl p-4 shadow-card border border-border animate-fade-in">
                <h3 className="font-bold text-foreground mb-3">Votre progression</h3>
                <div className={cn('grid gap-2', activeItems.length <= 3 ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6')}>
                  {activeItems.map((item) =>
                  <div key={item.label} className="text-center">
                      <div className={cn('text-lg font-bold', item.color)}>{item.value}</div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  )}
                </div>
              </div>);
          })()}

          {/* Homework Card - only for admin */}
          {isAdmin && <HomeworkCard />}
          <BlocDevoirsEleve />

          {/* Module Cards Grid - Dynamic from DB */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {(modules || []).map((mod, index) => {
              const Icon = ICON_MAP[mod.icon] || null;
              const slug = getModuleSlug(mod);
              const fallback = MODULE_EMOJI_FALLBACK[slug];
              return (
                <div
                  key={mod.id}
                  className="flex flex-col items-center relative"
                >
                  <button
                    onClick={() => handleModuleClick(mod)}
                    className={cn(
                      'relative bg-card rounded-2xl p-4 shadow-sm border border-border w-full',
                      'flex flex-col items-center justify-center min-h-[160px]',
                      'animate-slide-up',
                      `stagger-${index % 6 + 1}`,
                      !mod.is_active && isAdmin && 'opacity-50 grayscale'
                    )}
                    style={{ animationFillMode: 'both' }}>

                    {/* Hidden badge for admin */}
                    {isAdmin && !mod.is_active &&
                    <div className="absolute top-2 left-2 z-20 bg-destructive/80 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                        Masqué
                      </div>
                    }

                    {/* Icon */}
                    <div className="relative z-10">
                      {mod.image_url ?
                      <img src={mod.image_url} alt={mod.title} className="w-14 h-14 rounded-2xl object-cover shadow-lg mx-auto mb-2" loading="lazy" width={56} height={56} /> :
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-2"
                        style={{ backgroundColor: fallback?.bgColor || '#f3f4f6' }}>
                        {fallback?.emoji ?? '📚'}
                      </div>
                      }
                    </div>

                    {/* Text */}
                    <p className="font-arabic text-xs text-muted-foreground text-center">
                      {mod.title_arabic}
                    </p>
                    <p className="font-bold text-center text-sm text-foreground">
                      {mod.title}
                    </p>
                    <p className="text-xs text-muted-foreground text-center mt-0.5">
                      {mod.description}
                    </p>
                  </button>


                  {/* Admin arrow reorder buttons */}
                  {isAdmin && modules &&
                  <div className="absolute top-1 left-1 z-20 flex flex-col gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveModule(index, 'up'); }}
                        disabled={index === 0}
                        className="w-5 h-5 rounded bg-muted hover:bg-muted-foreground/20 disabled:opacity-30 flex items-center justify-center text-[10px] text-foreground"
                      >▲</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveModule(index, 'down'); }}
                        disabled={index === (modules?.length ?? 0) - 1}
                        className="w-5 h-5 rounded bg-muted hover:bg-muted-foreground/20 disabled:opacity-30 flex items-center justify-center text-[10px] text-foreground"
                      >▼</button>
                    </div>
                  }
                  {/* Admin 3-dot menu */}
                  {isAdmin &&
                  <div className="absolute top-2 right-2 z-20">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                          onClick={(e) => e.stopPropagation()}
                          className="w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm">
                          
                            <MoreVertical className="h-3.5 w-3.5 text-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActiveMutation.mutate({ id: mod.id, is_active: !mod.is_active, title: mod.title });
                          }}>
                          
                            {mod.is_active ?
                          <><EyeOff className="h-4 w-4 mr-2 text-destructive" /><span className="text-destructive">Masquer aux élèves</span></> :
                          <><Eye className="h-4 w-4 mr-2 text-green-600" /><span className="text-green-600">Afficher aux élèves</span></>
                          }
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  }
                </div>);

            })}
          </div>

        </div>
      </AppLayout>
    </>);

};

export default Index;