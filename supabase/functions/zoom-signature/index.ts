// 🎥 Cours Zoom DANS Dinislam (Nadia, 2026-11-27, choix A) : fabrique la « signature » du kit Zoom (Meeting SDK)
// pour rejoindre SA salle personnelle en simple participant (role 0). Réservé aux comptes connectés.
// Secrets (Supabase › Edge Functions › Secrets) : ZOOM_SDK_KEY (ID client), ZOOM_SDK_SECRET (secret client, posé par Nadia),
// ZOOM_MEETING_NUMBER, ZOOM_MEETING_PASSCODE. Le secret client ne quitte JAMAIS le serveur.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ['https://dinislam-app.vercel.app', 'http://localhost:8080'];
const cors = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Vary': 'Origin',
  };
};
const b64url = (data: Uint8Array | string) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
};

Deno.serve(async (req) => {
  const h = { ...cors(req), 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: h });

  try {
    // 1. Seulement un compte connecté
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Non connecté' }, 401);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: 'Non connecté' }, 401);

    const sdkKey = Deno.env.get('ZOOM_SDK_KEY');
    const sdkSecret = Deno.env.get('ZOOM_SDK_SECRET');
    const meetingNumber = Deno.env.get('ZOOM_MEETING_NUMBER');
    const passcode = Deno.env.get('ZOOM_MEETING_PASSCODE') ?? '';
    if (!sdkKey || !sdkSecret || !meetingNumber) return json({ error: 'Zoom pas encore réglé' }, 500);

    // 2. La signature (JWT HS256), valable 2 h
    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;
    const entete = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const corps = b64url(JSON.stringify({ appKey: sdkKey, sdkKey, mn: meetingNumber, role: 0, iat, exp, tokenExp: exp }));
    const cle = await crypto.subtle.importKey('raw', new TextEncoder().encode(sdkSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', cle, new TextEncoder().encode(`${entete}.${corps}`)));

    return json({ signature: `${entete}.${corps}.${b64url(sig)}`, meetingNumber, passcode });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erreur' }, 500);
  }
});
