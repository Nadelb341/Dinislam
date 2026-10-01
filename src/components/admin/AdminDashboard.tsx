import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookMarked, Moon, Sparkles, Hand, BookOpen, Bell, Send } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/utils';

const TITLE_TO_DEVOIR_TYPE: Record<string, string> = {
  'Sourates': 'sourate',
  'Nourania': 'nourania',
  'Invocations': 'recitation',
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const [testingSend, setTestingSend] = useState(false);

  const { data: homeworkBadges = {} } = useQuery({
    queryKey: ['admin-homework-badges'],
    queryFn: async () => {
      const { data } = await supabase
        .from('devoirs_rendus')
        .select('devoir_id, statut')
        .eq('statut', 'rendu');
      if (!data?.length) return {};
      const devoirIds = [...new Set(data.map(r => r.devoir_id).filter(Boolean))];
      if (!devoirIds.length) return {};
      const { data: devoirs } = await supabase
        .from('devoirs')
        .select('id, type')
        .in('id', devoirIds);
      const counts: Record<string, number> = {};
      data.forEach((r) => {
        const type = devoirs?.find((d) => d.id === r.devoir_id)?.type;
        if (type) counts[type] = (counts[type] || 0) + 1;
      });
      return counts;
    },
  });

  const handleTestPush = async () => {
    setTestingSend(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: '🧪 Test notification',
          body: 'Si tu vois ceci, les notifications push fonctionnent !',
          type: 'admin',
        },
      });
      if (error) throw error;
      if (data?.sent > 0) {
        toast({ title: `✅ Notification envoyée ! (${data.sent}/${data.total})` });
      } else {
        toast({ title: '⚠️ Aucun abonnement trouvé', description: `Total: ${data?.total || 0}, Expirés: ${data?.expired || 0}`, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: '❌ Erreur', description: errorMessage(err) || String(err), variant: 'destructive' });
    } finally {
      setTestingSend(false);
    }
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalSourates },
        { count: totalRamadanDays },
        { count: totalNouraniaLessons },
        { count: totalInvocations },
        { count: totalPrayerCategories },
        { data: sourateProgress },
        { data: ramadanProgress },
        { data: nouraniaProgress },
        { data: prayerProgress },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('sourates').select('*', { count: 'exact', head: true }),
        supabase.from('ramadan_days').select('*', { count: 'exact', head: true }),
        supabase.from('nourania_lessons').select('*', { count: 'exact', head: true }),
        supabase.from('invocations').select('*', { count: 'exact', head: true }),
        supabase.from('prayer_categories').select('*', { count: 'exact', head: true }),
        supabase.from('user_sourate_progress').select('is_validated'),
        supabase.from('user_ramadan_progress').select('video_watched, quiz_completed, pdf_read'),
        supabase.from('user_nourania_progress').select('is_validated'),
        supabase.from('user_prayer_progress').select('is_validated'),
      ]);

      const sourateValidated = sourateProgress?.filter(p => p.is_validated).length || 0;
      const ramadanCompleted = ramadanProgress?.filter(p => p.video_watched && p.quiz_completed && p.pdf_read).length || 0;
      const nouraniaValidated = nouraniaProgress?.filter(p => p.is_validated).length || 0;
      const prayerValidated = prayerProgress?.filter(p => p.is_validated).length || 0;

      return {
        totalUsers: totalUsers || 0,
        modules: {
          sourates: { total: totalSourates || 0, validated: sourateValidated },
          ramadan: { total: totalRamadanDays || 0, completed: ramadanCompleted },
          nourania: { total: totalNouraniaLessons || 0, validated: nouraniaValidated },
          invocations: { total: totalInvocations || 0 },
          prayer: { total: totalPrayerCategories || 0, validated: prayerValidated },
        },
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24 bg-muted/50" />
          </Card>
        ))}
      </div>
    );
  }

  const moduleCards = [
    {
      title: 'Utilisateurs',
      icon: Users,
      value: stats?.totalUsers || 0,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Sourates',
      icon: BookMarked,
      value: `${stats?.modules.sourates.validated || 0} validées`,
      subtitle: `sur ${stats?.modules.sourates.total || 0} sourates`,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
    },
    {
      title: 'Ramadan',
      icon: Moon,
      value: `${stats?.modules.ramadan.completed || 0} jours complétés`,
      subtitle: `sur ${stats?.modules.ramadan.total || 0} jours`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Nourania',
      icon: Sparkles,
      value: `${stats?.modules.nourania.validated || 0} validées`,
      subtitle: `sur ${stats?.modules.nourania.total || 0} leçons`,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
    },
    {
      title: 'Invocations',
      icon: Hand,
      value: `${stats?.modules.invocations.total || 0} disponibles`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Prière',
      icon: BookOpen,
      value: `${stats?.modules.prayer.validated || 0} validées`,
      subtitle: `sur ${stats?.modules.prayer.total || 0} catégories`,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground mb-4">Vue d'ensemble</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {moduleCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="overflow-hidden relative">
              {(() => {
                const devoirType = TITLE_TO_DEVOIR_TYPE[card.title];
                const count = devoirType ? (homeworkBadges as Record<string, number>)[devoirType] || 0 : 0;
                return count > 0 ? (
                  <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center z-10 shadow">
                    {count}
                  </span>
                ) : null;
              })()}
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-lg font-bold text-foreground [overflow-wrap:anywhere]">{card.value}</p>
                    {card.subtitle && (
                      <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Push Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            🔔 Notifications Push
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Envoyer une notification test</p>
              <p className="text-sm text-muted-foreground">Envoie une notification push à toi-même pour vérifier le fonctionnement</p>
            </div>
            <Button size="sm" onClick={handleTestPush} disabled={testingSend}>
              {testingSend ? '⏳ Envoi...' : '🧪 Tester'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progression globale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Sourates</span>
              <span className="text-muted-foreground">
                {Math.round(((stats?.modules.sourates.validated || 0) / Math.max(stats?.modules.sourates.total || 1, 1)) * 100)}%
              </span>
            </div>
            <Progress 
              value={((stats?.modules.sourates.validated || 0) / Math.max(stats?.modules.sourates.total || 1, 1)) * 100} 
              className="h-2"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Ramadan</span>
              <span className="text-muted-foreground">
                {Math.round(((stats?.modules.ramadan.completed || 0) / Math.max(stats?.modules.ramadan.total || 1, 1)) * 100)}%
              </span>
            </div>
            <Progress 
              value={((stats?.modules.ramadan.completed || 0) / Math.max(stats?.modules.ramadan.total || 1, 1)) * 100} 
              className="h-2"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Nourania</span>
              <span className="text-muted-foreground">
                {Math.round(((stats?.modules.nourania.validated || 0) / Math.max(stats?.modules.nourania.total || 1, 1)) * 100)}%
              </span>
            </div>
            <Progress 
              value={((stats?.modules.nourania.validated || 0) / Math.max(stats?.modules.nourania.total || 1, 1)) * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
