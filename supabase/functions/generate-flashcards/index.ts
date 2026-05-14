import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ['https://dinislam.lovable.app', 'http://localhost:8080'];

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY non configurée');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) { 
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { card_id, card_title, module_title, description, content_type, file_url } = await req.json();
    if (!card_id || !card_title) throw new Error('card_id et card_title requis');

    const prompt = `Tu es un assistant pédagogique expert en éducation islamique et en langue arabe.

Génère exactement 10 flashcards pour la carte d'apprentissage suivante :
- Module : ${module_title}
- Sujet : ${card_title}${description ? `\n- Description : ${description}` : ''}

Chaque flashcard doit avoir :
- front_text : expression ou concept en FRANÇAIS (ce que l'élève lit en premier)
- back_arabic : équivalent en ARABE (écriture arabe)
- back_transliteration : prononciation en lettres latines (ex: "ana", "bismillah")

Les flashcards doivent être variées, progressives et adaptées au niveau d'un enfant ou adolescent musulman francophone. 

Réponds UNIQUEMENT avec un tableau JSON valide de 10 objets, sans markdown, sans explication :
[{"front_text":"...","back_arabic":"...","back_transliteration":"..."},...]`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.4,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`Erreur IA (${aiRes.status}) : ${errText.substring(0, 200)}`);
    }

    const aiData = await aiRes.json();
    const rawText = (aiData.choices?.[0]?.message?.content || '').trim();
    const jsonText = rawText.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();

    let flashcards: any[];
    try {
      flashcards = JSON.parse(jsonText);
    } catch {
      throw new Error('Réponse IA non parseable — réessaie');
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error('Aucune flashcard dans la réponse');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existing } = await supabase
      .from('module_flashcards') 
      .select('display_order')
      .eq('module_card_id', card_id)
      .order('display_order', { ascending: false })
      .limit(1);

    const startOrder = existing?.length ? (existing[0].display_order + 1) : 0;
    const rows = flashcards.slice(0, 10).map((f: any, i: number) => ({
      module_card_id: card_id,
      front_text: String(f.front_text || '').trim(),
      back_arabic: f.back_arabic ? String(f.back_arabic).trim() : null,
      back_transliteration: f.back_transliteration ? String(f.back_transliteration).trim() : null,
      display_order: startOrder + i,
    })).filter(r => r.front_text.length > 0);
    
    const { error: insertError } = await supabase.from('module_flashcards').insert(rows);
    if (insertError) throw insertError;
    
    return new Response(JSON.stringify({ success: true, count: rows.length }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, 
    });
    
  } catch (error: any) {
    console.error('generate-flashcards error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
