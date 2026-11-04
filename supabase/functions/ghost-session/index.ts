import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * 👻 Mode fantôme (demande de Nadia, 2026-11-05) : l'enseignante entre dans le compte d'un élève pour agir
 * EXACTEMENT comme lui (cocher, envoyer, valider…), pour les enfants qui ne savent pas lire ou sont perdus.
 * Délivre une VRAIE session de l'élève (jamais un simple drapeau côté client) : la sécurité de la base
 * s'applique comme pour l'élève lui-même. Réservé à l'admin (vérifié ici dans user_roles, jamais d'après le client).
 * Aucun e-mail n'est envoyé (generateLink ne fait que fabriquer le jeton) ; le mot de passe de l'élève ne change pas.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getCorsHeaders(req) });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user: caller } } = await admin.auth.getUser(token);
    if (!caller) return json({ error: "Non connecté" }, 401);
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "Réservé à l'enseignante" }, 403);

    const { user_id } = await req.json();
    if (!user_id || typeof user_id !== "string") return json({ error: "Compte manquant" }, 400);
    if (user_id === caller.id) return json({ error: "C'est déjà ton compte" }, 400);
    // Jamais dans un autre compte admin
    const { data: cibleAdmin } = await admin.from("user_roles").select("role").eq("user_id", user_id).eq("role", "admin").maybeSingle();
    if (cibleAdmin) return json({ error: "Impossible d'entrer dans un compte administrateur" }, 403);

    const { data: target, error: getErr } = await admin.auth.admin.getUserById(user_id);
    if (getErr || !target?.user?.email) return json({ error: "Compte introuvable" }, 404);

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: target.user.email });
    if (linkErr || !link?.properties?.hashed_token) return json({ error: linkErr?.message || "Impossible d'ouvrir le compte" }, 500);
    return json({ token_hash: link.properties.hashed_token });
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
});
