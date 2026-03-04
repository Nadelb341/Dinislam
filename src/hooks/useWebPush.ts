import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PushSubscriptionState {
  isSubscribed: boolean;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useWebPush() {
  const { user } = useAuth();
  const [state, setState] = useState<PushSubscriptionState>({
    isSubscribed: false,
    isSupported: false,
    isLoading: true,
    error: null
  });

  const checkSupport = useCallback(() => {
    const supported = 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
    console.log('[WebPush] Support check:', { serviceWorker: 'serviceWorker' in navigator, PushManager: 'PushManager' in window, Notification: 'Notification' in window, supported });
    return supported;
  }, []);

  const getVapidKey = useCallback(async (): Promise<string | null> => {
    try {
      console.log('[WebPush] Fetching VAPID key...');
      const { data, error } = await supabase.functions.invoke('get-vapid-key');
      if (error) throw error;
      console.log('[WebPush] VAPID key received:', data?.publicKey ? 'yes' : 'no');
      return data?.publicKey || null;
    } catch (err) {
      console.error('[WebPush] Failed to get VAPID key:', err);
      return null;
    }
  }, []);

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const checkSubscription = useCallback(async () => {
    if (!checkSupport()) {
      setState(s => ({ ...s, isSupported: false, isLoading: false }));
      return;
    }
    setState(s => ({ ...s, isSupported: true }));
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('[WebPush] SW ready, checking existing subscription...');
      const subscription = await (registration as any).pushManager.getSubscription();
      console.log('[WebPush] Existing subscription:', subscription ? 'found' : 'none');
      if (subscription && user) {
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('endpoint', subscription.endpoint)
          .eq('user_id', user.id)
          .maybeSingle();
        console.log('[WebPush] DB record:', data ? 'found' : 'not found');
        setState(s => ({ ...s, isSubscribed: !!data, isLoading: false }));
      } else {
        setState(s => ({ ...s, isSubscribed: false, isLoading: false }));
      }
    } catch (err) {
      console.error('[WebPush] checkSubscription error:', err);
      setState(s => ({ ...s, isLoading: false, error: 'Erreur vérification' }));
    }
  }, [user, checkSupport]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user) {
      console.error('[WebPush] No user, cannot subscribe');
      return false;
    }
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      // Step 1: Request permission
      console.log('[WebPush] Step 1: Requesting permission...');
      const permission = await Notification.requestPermission();
      console.log('[WebPush] Permission result:', permission);
      if (permission !== 'granted') {
        setState(s => ({ ...s, isLoading: false, error: 'Permission refusée par l\'utilisateur' }));
        return false;
      }

      // Step 2: Get VAPID key
      console.log('[WebPush] Step 2: Getting VAPID key...');
      const vapidKey = await getVapidKey();
      if (!vapidKey) {
        const err = 'Clé VAPID non disponible — vérifiez les secrets';
        console.error('[WebPush]', err);
        setState(s => ({ ...s, isLoading: false, error: err }));
        return false;
      }
      console.log('[WebPush] VAPID key OK, length:', vapidKey.length);

      // Step 3: Get SW registration & subscribe
      console.log('[WebPush] Step 3: Waiting for SW ready...');
      const registration = await navigator.serviceWorker.ready;
      console.log('[WebPush] SW ready. Subscribing to push...');
      
      const keyArray = urlBase64ToUint8Array(vapidKey);
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray
      });
      console.log('[WebPush] Push subscription created:', subscription.endpoint);

      // Step 4: Extract keys and save to DB
      const subJson = subscription.toJSON();
      const keys = subJson.keys;
      console.log('[WebPush] Step 4: Subscription keys:', { p256dh: !!keys?.p256dh, auth: !!keys?.auth });
      
      if (!keys?.p256dh || !keys?.auth) {
        throw new Error('Clés de souscription invalides (p256dh ou auth manquant)');
      }

      console.log('[WebPush] Saving to push_subscriptions...');
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth
        }, { onConflict: 'user_id,endpoint' });

      if (error) {
        console.error('[WebPush] DB save error:', error);
        throw new Error(`Erreur sauvegarde: ${error.message}`);
      }

      console.log('[WebPush] ✅ Subscription saved successfully!');
      setState(s => ({ ...s, isSubscribed: true, isLoading: false }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[WebPush] Subscribe failed:', message);
      setState(s => ({ ...s, isLoading: false, error: message }));
      return false;
    }
  }, [user, getVapidKey]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setState(s => ({ ...s, isLoading: true }));
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      if (subscription) {
        console.log('[WebPush] Unsubscribing...');
        await subscription.unsubscribe();
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint)
          .eq('user_id', user.id);
        console.log('[WebPush] Unsubscribed successfully');
      }
      setState(s => ({ ...s, isSubscribed: false, isLoading: false }));
      return true;
    } catch (err) {
      console.error('[WebPush] Unsubscribe error:', err);
      setState(s => ({ ...s, isLoading: false }));
      return false;
    }
  }, [user]);

  useEffect(() => { checkSubscription(); }, [checkSubscription]);

  return { ...state, subscribe, unsubscribe, checkSubscription };
}
