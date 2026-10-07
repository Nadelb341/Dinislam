import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Admin : renommer un élève (fiche + compte de connexion, pour que le nouveau nom apparaisse partout). */
const ALLOWED_ORIGINS = ['https://dinislam-app.vercel.app', 'https://dinislam-two.vercel.app', 'http://localhost:8080'];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getCorsHeaders(req) });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user: caller } } = await admin.auth.getUser(token);
    if (!caller) return json({ error: "Not authenticated" }, 401);
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "Not authorized" }, 403);

    const { user_id, full_name } = await req.json();
    const name = typeof full_name === "string" ? full_name.trim().replace(/\s+/g, " ") : "";
    if (!user_id || name.length < 1 || name.length > 60) return json({ error: "Nom invalide (1 à 60 caractères)" }, 400);

    const { data: target, error: getErr } = await admin.auth.admin.getUserById(user_id);
    if (getErr || !target?.user) return json({ error: "Élève introuvable" }, 404);
    const { error: authErr } = await admin.auth.admin.updateUserById(user_id, {
      user_metadata: { ...(target.user.user_metadata ?? {}), full_name: name },
    });
    if (authErr) throw authErr;
    const { error: profErr } = await admin.from("profiles").update({ full_name: name }).eq("user_id", user_id);
    if (profErr) throw profErr;
    return json({ success: true, full_name: name });
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
});
