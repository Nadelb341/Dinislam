import { supabase } from '@/integrations/supabase/client';
import { idYoutube } from '@/lib/youtube';

/**
 * 🎯 Règle de Nadia (22/11) : « lorsque je mets une vidéo n'importe où dans l'appli, il doit y avoir automatiquement
 * un quiz de 10 questions sur la vidéo ». L'IA gratuite (fonction `quiz-video`) PROPOSE ; le quiz reste un BROUILLON
 * caché aux élèves tant que l'enseignante ne l'a pas validé. Internet nécessaire pour le préparer (pas pour y jouer).
 */
export interface QuestionVideo { question: string; arabe?: string | null; choix: string[]; bonne: number; explication?: string | null; emoji?: string | null }

// Une seule demande à la fois (la version gratuite de l'IA refuse trop d'appels en même temps : 14 vidéos sur une page)
let file: Promise<unknown> = Promise.resolve();
export function preparerQuiz(o: { sujet: string; details?: string; video?: string | null; public?: 'petits' | 'grands' }) {
  const p = file.then(() => preparerMaintenant(o), () => preparerMaintenant(o));
  file = p.catch(() => undefined).then(() => new Promise((r) => setTimeout(r, 1500)));
  return p;
}

async function preparerMaintenant(o: { sujet: string; details?: string; video?: string | null; public?: 'petits' | 'grands' }) {
  const youtube_id = o.video ? idYoutube(o.video) : null;
  const { data, error } = await supabase.functions.invoke('quiz-video', { body: { sujet: o.sujet, details: o.details, youtube_id, public: o.public ?? 'grands' } });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    let msg = error.message;
    try { const j = ctx ? await ctx.json() : null; if (j?.error) msg = j.error; } catch { /* message par défaut */ }
    throw new Error(msg);
  }
  const r = data as { questions?: QuestionVideo[]; source?: 'video' | 'sujet'; error?: string };
  if (r?.error || !r?.questions?.length) throw new Error(r?.error || 'Aucune question reçue');
  return { questions: r.questions, source: r.source ?? 'sujet' };
}
