import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ['https://dinislam-app.vercel.app', 'http://localhost:8080'];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) throw new Error("Connexion expirée : reconnecte-toi");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!roleData) throw new Error("Réservé à l'enseignante");

    const { user_id } = await req.json();
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!user_id || !UUID_REGEX.test(user_id)) throw new Error("Élève introuvable");
    if (user_id === caller.id) throw new Error("Tu ne peux pas supprimer ton propre compte");

    // 🗑️ 2026-11-07 (audit ZAT) : on efface d'ABORD le compte. Tout ce qui le concerne part avec lui (liens « on delete cascade »).
    // Avant : la fiche était effacée en premier → si le compte refusait de partir, l'élève disparaissait des listes mais restait.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (error) throw new Error("Le compte n'a pas pu être supprimé : " + error.message);

    // Puis ses fichiers (voix, devoirs, photos), rangés dans un dossier à son nom
    const listAll = async (bucket: string, prefix: string): Promise<string[]> => {
      const out: string[] = [];
      for (let offset = 0; ; offset += 100) {
        const { data } = await supabaseAdmin.storage.from(bucket).list(prefix, { limit: 100, offset });
        if (!data?.length) break;
        for (const f of data) {
          const path = `${prefix}/${f.name}`;
          if (f.id) out.push(path); else out.push(...await listAll(bucket, path));
        }
        if (data.length < 100) break;
      }
      return out;
    };
    let fichiers = 0;
    for (const bucket of ["recitations", "messages-audio", "devoirs-audios", "devoirs-fichiers"]) {
      const paths = await listAll(bucket, user_id);
      for (let i = 0; i < paths.length; i += 100) {
        const { error: e } = await supabaseAdmin.storage.from(bucket).remove(paths.slice(i, i + 100));
        if (!e) fichiers += Math.min(100, paths.length - i);
      }
    }

    return new Response(JSON.stringify({ success: true, fichiers }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
