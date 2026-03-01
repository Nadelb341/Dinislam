import { supabase } from '@/integrations/supabase/client';

/** Check if OneSignal SDK is available */
export function isOneSignalReady(): boolean {
  return typeof window !== 'undefined' && (window as any).OneSignal !== undefined;
}

/** Login user to OneSignal (set external_id) + auto optIn */
export async function oneSignalLogin(userId: string) {
  (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
  (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
    try {
      await OneSignal.login(userId);
      console.log('[OneSignal] User logged in:', userId);
      // Auto opt-in to push
      if (OneSignal.User?.PushSubscription) {
        await OneSignal.User.PushSubscription.optIn();
        console.log('[OneSignal] User opted in to push');
      }
    } catch (e: any) {
      console.error('[OneSignal] Login/optIn error:', e.message);
    }
  });
}

/** Logout user from OneSignal */
export async function oneSignalLogout() {
  (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
  (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
    try {
      await OneSignal.logout();
      console.log('[OneSignal] User logged out');
    } catch (e: any) {
      console.error('[OneSignal] Logout error:', e.message);
    }
  });
}

/** Prompt user for notification permission via OneSignal */
export async function requestOneSignalPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
    (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
      try {
        const permission = await OneSignal.Notifications.requestPermission();
        console.log('[OneSignal] Permission result:', permission);
        if (permission) {
          await OneSignal.User.PushSubscription.optIn();
        }
        resolve(!!permission);
      } catch (e: any) {
        console.error('[OneSignal] Permission error:', e.message);
        resolve(false);
      }
    });
  });
}

/** Get OneSignal subscription status (synchronous snapshot) */
export function getOneSignalStatus(): { permission: string; subscribed: boolean; userId: string | null } {
  if (!isOneSignalReady()) {
    return { permission: 'sdk_not_loaded', subscribed: false, userId: null };
  }
  const os = (window as any).OneSignal;
  try {
    const permNative = os.Notifications?.permissionNative || 'default';
    const permission = os.Notifications?.permission ? 'granted' : permNative;
    const subscribed = os.User?.PushSubscription?.optedIn || false;
    const userId = os.User?.externalId || null;
    return { permission, subscribed, userId };
  } catch {
    return { permission: 'error', subscribed: false, userId: null };
  }
}

// Keep these for backward compat with notification preferences
export async function getNotificationPreferences(userId: string) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching preferences:', error);
  }

  return data;
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    prayer_reminders?: boolean;
    ramadan_activities?: boolean;
    daily_reminder_time?: string;
    fajr_reminder?: boolean;
    dhuhr_reminder?: boolean;
    asr_reminder?: boolean;
    maghrib_reminder?: boolean;
    isha_reminder?: boolean;
  }
) {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error updating preferences:', error);
    return false;
  }

  return true;
}
