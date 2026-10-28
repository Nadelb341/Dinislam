import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * 🌍 Traduction du bilan trimestriel en arabe (2026-10-28, demande de Nadia) : son appréciation, le message pour l'enfant
 * et les lignes du guide de la réunion, en arabe classique (fusha) ou en darija marocain écrit en lettres arabes.
 * Réservé à l'enseignante ; Nadia relit et corrige avant l'envoi. Les titres du bilan sont traduits une fois pour toutes dans l'appli.
 */
const ALLOWED_ORIGINS = ['https://dinislam-app.vercel.app', 'http://localhost:8080'];
const cors = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const aiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!aiKey) throw new Error('GOOGLE_AI_API_KEY non configurée');

    // Seule l'enseignante (admin) peut traduire
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json(req, { error: 'Non autorisé' }, 401);
    const { data: role } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!role) return json(req, { error: 'Réservé à l\'enseignante' }, 403);

    const { variante, prenom, fille, textes } = await req.json() as {
      variante: 'fusha' | 'darija'; prenom: string; fille: boolean;
      textes: { appreciation?: string; motivation?: string; guide?: Record<string, string[]> };
    };
    const langue = variante === 'darija'
      ? "en darija marocain (arabe dialectal du Maroc), écrit en lettres arabes, naturel et simple, comme un professeur marocain qui parle aux parents"
      : "en arabe classique (fusha) simple et correct, avec les voyelles seulement si nécessaire";
    const prompt = `Tu es une professeure d'arabe et d'éducation islamique. Traduis fidèlement ${langue} les textes d'un bilan scolaire destiné aux parents.
L'élève s'appelle ${prenom} (${fille ? 'une fille : accorde au féminin' : 'un garçon : accorde au masculin'}). Garde le prénom tel quel (écris-le en lettres arabes).
Ne résume rien, n'ajoute rien, garde les nombres et les emojis. Garde les noms de sourates sous leur nom arabe habituel.
Réponds UNIQUEMENT avec un objet JSON valide, avec exactement les mêmes clés et le même nombre de lignes que l'entrée :
${JSON.stringify(textes)}`;

    const ai = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemini-3.6-flash', reasoning_effort: 'low', messages: [{ role: 'user', content: prompt }], max_tokens: 3000, temperature: 0.2 }),
    });
    if (!ai.ok) throw new Error(`Erreur IA (${ai.status}) : ${(await ai.text()).substring(0, 200)}`);
    const raw = ((await ai.json()).choices?.[0]?.message?.content || '').trim().replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    let traduction: unknown;
    try { traduction = JSON.parse(raw); } catch { throw new Error('Réponse de traduction illisible, réessaie'); }
    return json(req, { traduction });
  } catch (e) {
    return json(req, { error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
