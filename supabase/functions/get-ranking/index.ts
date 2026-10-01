import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://dinislam-app.vercel.app',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Identifier l'appelant
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Non authentifié');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) throw new Error('Non authentifié');

    // Vérifier si admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .single();
    const isAdmin = !!roleData;

    // Classement global depuis profiles (bypass RLS grâce à service_role)
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, full_name, points')
      .eq('is_approved', true)
      .order('points', { ascending: false })
      .limit(200);

    if (profilesError) throw profilesError;
    const profiles = profilesData || [];

    // Anonymisation côté serveur : les vrais noms ne sortent jamais pour les élèves
    const classement = profiles.map((p) => ({
      user_id: p.user_id === caller.id ? caller.id : null,
      display_name: isAdmin
        ? (p.full_name || 'Élève')
        : (p.user_id === caller.id ? 'Moi' : 'Élève'),
      total: p.points ?? 0,
      is_me: p.user_id === caller.id,
    }));

    // Groupes
    const { data: groupes } = await supabaseAdmin
      .from('student_groups')
      .select('id, name, color');
    const { data: membres } = await supabaseAdmin
      .from('student_group_members')
      .select('group_id, user_id');

    const myMembership = (membres || []).find((m: { user_id: string }) => m.user_id === caller.id);
    const myGroupId = myMembership?.group_id || null;

    const groupMembers: { user_id: string | null; display_name: string; total: number; is_me: boolean }[] = [];
    for (const groupe of (groupes || [])) {
      const membreIds = (membres || [])
        .filter((m: { group_id: string }) => m.group_id === groupe.id)
        .map((m: { user_id: string }) => m.user_id);
      for (const uid of membreIds) {
        const profile = profiles.find((p) => p.user_id === uid);
        groupMembers.push({
          user_id: uid === caller.id ? caller.id : null,
          display_name: isAdmin
            ? (profile?.full_name || 'Élève')
            : (uid === caller.id ? 'Moi' : 'Élève'),
          total: profile?.points ?? 0,
          is_me: uid === caller.id,
          group_id: groupe.id,
          group_name: groupe.name,
          group_color: groupe.color,
        });
      }
    }

    return new Response(
      JSON.stringify({ classement, groupMembers, myGroupId, isAdmin }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
