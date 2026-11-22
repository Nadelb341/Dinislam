import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * 🎯 Quiz de 10 questions pour une vidéo (Nadia, 22/11 : « lorsque je mets une vidéo n'importe où dans l'appli, il doit y avoir
 * automatiquement un quiz de 10 questions »). Réservé à l'enseignante. L'IA gratuite (Gemini, clé AI Studio) REGARDE la vidéo
 * quand c'est une vidéo YouTube ; pour une vidéo envoyée en fichier, elle s'appuie sur le sujet (titre de la leçon / de la vidéo).
 * Ne fait que PROPOSER : l'appli range le quiz en brouillon, caché aux élèves jusqu'à ce que l'enseignante le valide.
 */
const ALLOWED_ORIGINS = ['https://dinislam-app.vercel.app', 'http://localhost:8080'];
const cors = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};
const json = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } });

interface Q { question: string; arabe?: string | null; choix: string[]; bonne: number; explication?: string | null; emoji?: string | null }

function nettoyer(liste: unknown): Q[] {
  if (!Array.isArray(liste)) return [];
  return liste.map((x) => {
    const o = x as Record<string, unknown>;
    const choix = Array.isArray(o.choix) ? o.choix.map((c) => String(c ?? '').trim()).filter(Boolean).slice(0, 4) : [];
    const bonne = Number(o.bonne);
    return {
      question: String(o.question ?? '').trim(), arabe: o.arabe ? String(o.arabe).trim() : null, choix,
      bonne: Number.isInteger(bonne) && bonne >= 0 && bonne < choix.length ? bonne : 0,
      explication: o.explication ? String(o.explication).trim() : null, emoji: o.emoji ? String(o.emoji).trim().slice(0, 8) : null,
    };
  }).filter((q) => q.question && q.choix.length >= 2).slice(0, 10);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
  try {
    const url = Deno.env.get('SUPABASE_URL')!, service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, cle = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!cle) return json(req, { error: 'Clé de l\'IA non configurée' }, 500);
    const auth = req.headers.get('Authorization');
    if (!auth) return json(req, { error: 'Non autorisé' }, 401);
    const admin = createClient(url, service);
    const { data: { user } } = await admin.auth.getUser(auth.replace('Bearer ', ''));
    const { data: role } = user ? await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle() : { data: null };
    if (!user || !role) return json(req, { error: 'Réservé à l\'enseignante' }, user ? 403 : 401);

    const { sujet, details, youtube_id, public: pour } = await req.json() as { sujet?: string; details?: string; youtube_id?: string | null; public?: 'petits' | 'grands' };
    if (!sujet) return json(req, { error: 'sujet requis' }, 400);
    const petits = pour === 'petits';
    const consigne = `Tu es une enseignante musulmane (école malikite) qui prépare un quiz pour ses élèves francophones${petits ? ' de 3 à 7 ans qui ne savent pas encore lire (questions courtes et simples, une image emoji par réponse)' : ' (enfants et ados)'}.
Sujet : ${sujet}${details ? `\nPrécisions : ${details}` : ''}
${youtube_id ? 'Appuie-toi UNIQUEMENT sur ce que dit et montre la vidéo jointe.' : 'Appuie-toi sur le sujet ; reste sur des faits sûrs.'}
Règles : uniquement des faits du Coran ou des hadiths authentiques (Al-Boukhari, Mouslim) quand il s'agit de religion ; jamais d'histoire inventée ; aucune question sur l'apparence d'un prophète ; français simple sans faute ; arabe avec voyelles quand il y en a.
${petits ? 'Chaque choix COMMENCE par un emoji qui le dessine (ex. "🚢 Un bateau"), pour les enfants qui ne savent pas lire.\n' : ''}Réponds UNIQUEMENT par un tableau JSON de 10 objets : {"question": "...", "arabe": "texte arabe ou null", "choix": ["bonne ou mauvaise", "...", "..."], "bonne": index de la bonne réponse (0, 1 ou 2), "explication": "une phrase courte", "emoji": "${petits ? 'un emoji pour la bonne réponse' : 'null'}"}. 3 choix par question.`;

    const parts: unknown[] = [];
    if (youtube_id && /^[\w-]{11}$/.test(youtube_id)) parts.push({ file_data: { file_uri: `https://www.youtube.com/watch?v=${youtube_id}` } });
    parts.push({ text: consigne });
    const appel = async (avecVideo: boolean) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${cle}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: avecVideo ? parts : parts.slice(-1) }], generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 6000 } }),
    });
    let source = youtube_id ? 'video' : 'sujet';
    let rep = await appel(!!youtube_id);
    // Vidéo illisible pour l'IA (privée, trop longue…) : on se rabat sur le sujet, et on le dit
    if (!rep.ok && youtube_id) { source = 'sujet'; rep = await appel(false); }
    if (!rep.ok) return json(req, { error: `L'IA n'a pas répondu (${rep.status})` }, 502);
    const data = await rep.json();
    const texte = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('').trim()
      .replace(/^```json?\s*/i, '').replace(/```\s*$/i, '');
    let questions: Q[] = [];
    try { questions = nettoyer(JSON.parse(texte)); } catch { return json(req, { error: 'Réponse de l\'IA illisible : réessaie' }, 502); }
    if (questions.length < 5) return json(req, { error: 'L\'IA a donné trop peu de questions : réessaie' }, 502);
    return json(req, { questions, source });
  } catch (e) {
    return json(req, { error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
