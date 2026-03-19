import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = ['https://dinislam.lovable.app', 'http://localhost:8080'];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter(t => now - t < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // ── Auth: verify caller ──
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ response: 'Non autorisé' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ response: 'Non autorisé' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ response: '⏰ Doucement ! Tu poses beaucoup de questions. Attends une minute avant de réessayer 😊' }),
        { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const { message, userAge, context } = await req.json();

    // Input validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ response: 'Dis-moi quelque chose !' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }
    const sanitizedMessage = message.slice(0, 500);
    const validAge = Math.min(18, Math.max(3, Number(userAge) || 7));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Age-appropriate system prompts
    const getSystemPrompt = (age: number) => {
      if (age <= 6) {
        return `Tu es une étoile magique ✨ qui aide les tout-petits musulmans (3-6 ans) à apprendre l'Islam.
        Sois très simple, utilise des emojis, des mots faciles, et reste toujours positif et encourageant.
        Parle de façon mignonne et affectueuse. Maximum 2 phrases courtes.
        Sujets : lettres arabes, courtes sourates, belles manières islamiques.`;
      }

      if (age <= 10) {
        return `Tu es une étoile guide ✨ pour les enfants musulmans (7-10 ans).
        Tu peux les aider à réviser leurs leçons, les encourager, et répondre à des questions simples sur l'Islam.
        Reste bienveillant, utilise des emojis, et propose des actions concrètes.
        Sujets : sourates, invocations, prières, alphabet arabe, bonnes manières.`;
      }

      return `Tu es une étoile guide ✨ pour les jeunes musulmans (12+ ans). Tu peux :
      1. Les encourager dans leur apprentissage islamique
      2. Les aider à réviser sourates, invocations, nourania
      3. Répondre à des questions éducatives sur l'Islam
      4. Faire des recherches sur des sujets appropriés et éducatifs

      Sois bienveillant, informatif et adapte tes réponses à leur âge.
      Pour les recherches, privilégie des sources fiables et éducatives.
      Évite les sujets controversés ou inadaptés aux mineurs.`;
    };

    // Determine if this needs web search (for 12+ users asking questions)
    const needsWebSearch = validAge >= 12 && (
      sanitizedMessage.toLowerCase().includes('recherche') ||
      sanitizedMessage.toLowerCase().includes('qu\'est-ce que') ||
      sanitizedMessage.toLowerCase().includes('explique') ||
      sanitizedMessage.toLowerCase().includes('comment') ||
      sanitizedMessage.toLowerCase().includes('pourquoi') ||
      sanitizedMessage.includes('?')
    );

    let systemPrompt = getSystemPrompt(validAge);

    if (needsWebSearch) {
      systemPrompt += `

      IMPORTANT : Cette question semble nécessiter une recherche. Utilise tes connaissances et fournis une réponse éducative appropriée pour un mineur musulman. Si tu n'es pas sûr d'une information, dis-le clairement.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Contexte de l'application : ${context}\n\nQuestion de l'élève : ${sanitizedMessage}` }
        ],
        max_tokens: validAge <= 6 ? 100 : validAge <= 10 ? 200 : 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            response: '⏰ Je suis un peu fatiguée, peux-tu réessayer dans quelques minutes ?'
          }),
          { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            response: '💫 J\'ai besoin de recharger mes étoiles ! Demande à ton professeur.'
          }),
          { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Mascot chat error:', error);

    let fallbackResponse = '😅 Désolée, je n\'ai pas bien compris. Peux-tu reformuler ?';

    return new Response(
      JSON.stringify({ response: fallbackResponse }),
      {
        status: 200,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});
