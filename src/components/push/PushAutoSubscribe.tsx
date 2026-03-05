import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useWebPush } from '@/hooks/useWebPush';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

const PushAutoSubscribe = () => {
  const { user } = useAuth();
  const { isSupported, isSubscribed, subscribe, isLoading } = useWebPush();
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const autoTriedRef = useRef(false);

  // Check if user has a push subscription in DB
  useEffect(() => {
    if (!user || !isSupported || isSubscribed || isLoading) return;

    const checkDB = async () => {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) {
        setNeedsSubscription(true);
      }
    };
    checkDB();
  }, [user, isSupported, isSubscribed, isLoading]);

  // Detect iOS
  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  // Auto-subscribe on non-iOS (no user gesture needed on Android/desktop)
  useEffect(() => {
    if (!needsSubscription || isIOS || autoTriedRef.current || isSubscribed) return;
    // Only auto-try if permission is already granted
    if ('Notification' in window && Notification.permission === 'granted') {
      autoTriedRef.current = true;
      subscribe().then((ok) => {
        if (ok) {
          setNeedsSubscription(false);
          console.log('[PushAuto] Auto-subscribed successfully');
        }
      });
    }
  }, [needsSubscription, isIOS, isSubscribed, subscribe]);

  // Hide if already subscribed or not needed
  if (!needsSubscription || isSubscribed || !isSupported) return null;

  // On non-iOS with permission !== granted, also show button
  const handleTap = async () => {
    setSubscribing(true);
    const ok = await subscribe();
    if (ok) {
      setNeedsSubscription(false);
      toast.success('✅ Notifications activées !');
    }
    setSubscribing(false);
  };

  return (
    <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
      <Bell className="h-6 w-6 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          🔔 Activer les notifications push
        </p>
        <p className="text-xs text-muted-foreground">
          {isIOS
            ? 'Touche le bouton pour autoriser les notifications'
            : 'Recevez les rappels et nouvelles activités'}
        </p>
      </div>
      <Button size="sm" onClick={handleTap} disabled={subscribing}>
        {subscribing ? '...' : 'Activer'}
      </Button>
    </div>
  );
};

export default PushAutoSubscribe;
