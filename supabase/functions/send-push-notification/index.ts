import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  type: 'all' | 'prayer' | 'ramadan' | 'admin' | 'user' | 'broadcast';
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY') || '';
    const oneSignalAppId = 'c3387e75-7457-4db6-bbe1-541307fc5bea';

    if (!oneSignalApiKey) {
      return new Response(
        JSON.stringify({ error: 'ONESIGNAL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: NotificationPayload = await req.json();
    const { title, body: notifBody, url, type, userId } = body;

    // Health-check: just confirm the edge function is alive, don't send anything
    if (type === 'health-check') {
      return new Response(
        JSON.stringify({ success: true, healthCheck: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!title || !notifBody) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build OneSignal request body
    const osBody: any = {
      app_id: oneSignalAppId,
      headings: { en: title, fr: title },
      contents: { en: notifBody, fr: notifBody },
      url: url || 'https://dini-ramadan-learn.lovable.app',
      chrome_web_icon: '/icon-192.png',
      firefox_icon: '/icon-192.png',
    };

    if (type === 'user' && userId) {
      // Send to a specific user by external_id
      osBody.include_aliases = { external_id: [userId] };
      osBody.target_channel = 'push';
    } else if (type === 'admin') {
      // Send to admin users only
      const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
      const adminIds = (adminRoles || []).map((r: any) => r.user_id);
      if (adminIds.length === 0) {
        return new Response(
          JSON.stringify({ success: true, sent: 0, total: 0, detail: 'No admin users found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      osBody.include_aliases = { external_id: adminIds };
      osBody.target_channel = 'push';
    } else {
      // Broadcast to all subscribers
      osBody.included_segments = ['All'];
    }

    console.log('OneSignal request:', JSON.stringify({ type, hasUserId: !!userId }));

    const osResponse = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${oneSignalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(osBody),
    });

    const osResult = await osResponse.text();
    let osData: any = {};
    try { osData = JSON.parse(osResult); } catch { osData = { raw: osResult }; }

    console.log(`OneSignal response: ${osResponse.status} → ${osResult.substring(0, 200)}`);

    // Log to app_logs
    try {
      await supabase.from('app_logs').insert({
        level: osResponse.ok ? 'info' : 'error',
        message: `OneSignal push ${osResponse.ok ? 'OK' : 'FAIL'} (${osResponse.status})`,
        context: JSON.stringify({
          type,
          status: osResponse.status,
          recipients: osData.recipients || 0,
          id: osData.id || null,
          errors: osData.errors || null,
        }),
      });
    } catch (_) { /* best effort */ }

    const sent = osData.recipients || 0;

    return new Response(
      JSON.stringify({
        success: osResponse.ok,
        sent,
        total: sent,
        onesignal_id: osData.id || null,
        errors: osData.errors || undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
