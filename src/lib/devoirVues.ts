import { supabase } from '@/integrations/supabase/client';

/** 👂 Idée 3 (2026-11-04) : l'élève a écouté la consigne / ouvert un document (une seule fois par devoir, le professeur le voit) */
export async function marquerVue(devoirId: string, studentId: string | undefined, kind: 'audio' | 'document') {
  if (!studentId) return;
  await supabase.from('devoir_vues').upsert({ devoir_id: devoirId, student_id: studentId, kind }, { onConflict: 'devoir_id,student_id,kind', ignoreDuplicates: true });
}
