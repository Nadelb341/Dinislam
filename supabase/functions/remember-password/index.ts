import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Enregistre le mot de passe d'un élève dans `student_passwords` (lisible par l'admin seulement).
 * Appelée par l'appli juste après une connexion réussie, un mot de passe oublié ou un changement dans Paramètres.
 * Le mot de passe est vérifié (vraie connexion) avant d'être enregistré : impossible d'y écrire n'importe quoi.
 */
const ALLOWED_ORIGINS = ['https://dinislam-app.vercel.app', 'https://dinislam-two.vercel.app', 'http://localhost:8080'];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const SOURCES = ['connexion', 'oubli', 'parametres'];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getCorsHeaders(req) });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user?.email) return json({ error: "Not authenticated" }, 401);

    // Les comptes admin ne sont pas concernés
    const { data: isAdmin } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (isAdmin) return json({ success: true, skipped: true });

    const { password, source } = await req.json();
    if (typeof password !== "string" || password.length < 6 || password.length > 72) return json({ error: "Mot de passe invalide" }, 400);
    const src = SOURCES.includes(source) ? source : "connexion";

    // Vérification : le mot de passe doit vraiment ouvrir ce compte
    const check = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: signed, error: signErr } = await check.auth.signInWithPassword({ email: user.email, password });
    if (signErr || signed.user?.id !== user.id) return json({ error: "Mot de passe non vérifié" }, 400);
    await check.auth.signOut({ scope: "local" }); // on ferme tout de suite la session de vérification

    const { error } = await admin.from("student_passwords")
      .upsert({ user_id: user.id, password, source: src, updated_at: new Date().toISOString() });
    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
});
