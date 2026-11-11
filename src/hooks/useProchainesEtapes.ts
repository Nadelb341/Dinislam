import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { rangParcours } from '@/lib/souratesPrecedentes';
import { dansLaPeriode, raisonAcces } from '@/lib/cartesAcces';
import { useCartesAcces } from '@/hooks/useCartesAcces';
import type { Cible } from '@/lib/devoirsEleve';
import { lireLignes, nombreDeLignes } from '@/lib/nouraniaLignes';

/**
 * 💡 Idée 2 des devoirs élève par élève (Nadia, 2026-11-11 : « ok mais j'aimerais pouvoir le modifier ») :
 * la prochaine étape de l'élève dans chaque matière, proposée d'un appui. Elle REMPLIT la ligne, que Nadia modifie librement.
 * Seulement pour les cartes que l'élève voit (règle « Qui voit quoi »).
 */
export interface Suggestion { type: string; texte: string; cible: Cible }

const CARTE_DE: Record<string, string> = { nourania: '/nourania', sourate: '/sourates', alphabet: '/alphabet', allah_names: '/allah-names', invocations: '/invocations' };

export function useProchainesEtapes(eleveId: string | null) {
  const acces = useCartesAcces(!!eleveId);
  const q = useQuery({
    queryKey: ['devoir-prochaines-etapes', eleveId],
    enabled: !!eleveId,
    staleTime: 60_000,
    queryFn: async (): Promise<Suggestion[]> => {
      const id = eleveId!;
      const [lecons, nour, sourates, sour, lettres, alpha, noms, nomsP, invs, invP, lignesF, contenus, sDemandes, iDemandes] = await Promise.all([
        supabase.from('nourania_lessons').select('id, lesson_number, title_french').order('lesson_number'),
        supabase.from('user_nourania_progress').select('lesson_id').eq('user_id', id).eq('is_validated', true),
        supabase.from('sourates').select('id, number, name_french'),
        supabase.from('user_sourate_progress').select('sourate_id').eq('user_id', id).eq('is_validated', true).eq('context', 'sourates'),
        supabase.from('alphabet_letters').select('id, letter_arabic, name_french').order('display_order'),
        supabase.from('user_alphabet_progress').select('letter_id').eq('user_id', id).eq('is_validated', true),
        supabase.from('allah_names').select('id, display_order, transliteration, name_french').order('display_order'),
        supabase.from('user_allah_name_progress').select('name_id').eq('user_id', id).eq('is_validated', true),
        supabase.from('invocations').select('id, title_french, title_arabic, display_order').order('display_order'),
        supabase.from('user_invocation_progress').select('invocation_id').eq('user_id', id).eq('is_validated', true),
        supabase.from('nourania_lignes_faites').select('lesson_id, ligne, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(200),
        supabase.from('nourania_lesson_content').select('lesson_id, lignes'),
        supabase.from('sourate_validation_requests').select('sourate_id, created_at').eq('user_id', id).eq('status', 'pending').order('created_at', { ascending: false }).limit(1),
        supabase.from('invocation_validation_requests').select('invocation_id, created_at').eq('user_id', id).eq('status', 'pending').order('created_at', { ascending: false }).limit(1),
      ]);
      const out: Suggestion[] = [];
      const faitesN = new Set((nour.data || []).map((x) => x.lesson_id));
      const listeL = lecons.data || [];
      // 🔢 2026-11-11 (Nadia) : la ligne JUSTE EN DESSOUS de la dernière ligne cochée par l'élève (ex. ligne 3 de la leçon 6 → « leçon 6, ligne 4 »)
      const derniere = (lignesF.data || [])[0];
      const nbLignes = (lessonId: string) => (contenus.data || []).filter((c) => c.lesson_id === lessonId)
        .reduce((s, c) => s + nombreDeLignes(lireLignes(c.lignes)), 0);
      let cible: { lecon: (typeof listeL)[number]; ligne: number } | null = null;
      if (derniere) {
        const lecon = listeL.find((x) => x.id === derniere.lesson_id);
        const max = Math.max(...(lignesF.data || []).filter((x) => x.lesson_id === derniere.lesson_id).map((x) => x.ligne));
        const total = nbLignes(derniere.lesson_id);
        if (lecon && (!total || max < total)) cible = { lecon, ligne: max + 1 };
        else if (lecon) { const suivante = listeL.find((x) => x.lesson_number > lecon.lesson_number); if (suivante) cible = { lecon: suivante, ligne: 1 }; }
      }
      const l = cible?.lecon ?? listeL.find((x) => !faitesN.has(x.id));
      if (l) {
        const ligne = cible?.ligne ?? 1;
        out.push({ type: 'nourania', texte: `lire la leçon ${l.lesson_number}, ligne ${ligne}`, cible: { v: String(l.id), l: `Leçon ${l.lesson_number}${l.title_french ? ` · ${l.title_french}` : ''}` } });
      }

      const faitesS = new Set((sour.data || []).map((x) => x.sourate_id));
      // La sourate EN COURS DE VALIDATION (envoyée, pas encore validée), sinon la suivante du parcours
      const enCoursS = (sourates.data || []).find((x) => x.id === sDemandes.data?.[0]?.sourate_id && !faitesS.has(x.id));
      const s = enCoursS ?? [...(sourates.data || [])].sort((a, b) => rangParcours(b.number) - rangParcours(a.number)).find((x) => !faitesS.has(x.id) && x.number !== 1);
      if (s) { const nom = s.name_french.split(' (')[0]; out.push({ type: 'sourate', texte: enCoursS ? `terminer ${nom} (en cours de validation)` : `apprendre ${nom}`, cible: { v: String(s.number), l: `${s.number === 1000 ? '2-255' : s.number} · ${nom}` } }); }

      const ordre = (lettres.data || []).map((x) => x.id);
      // La 1ʳᵉ lettre pas encore validée, dans l'ordre (même si le professeur ne l'a pas encore ouverte)
      const apprises = new Set((alpha.data || []).map((x) => x.letter_id));
      const lt = (lettres.data || []).find((x) => x.id === ordre.find((id) => !apprises.has(id)));
      if (lt) out.push({ type: 'alphabet', texte: `apprendre la lettre ${lt.letter_arabic} (${lt.name_french})`, cible: { v: String(lt.id), l: `${lt.letter_arabic} · ${lt.name_french}` } });

      const faitsNoms = new Set((nomsP.data || []).map((x) => x.name_id));
      const n = (noms.data || []).find((x) => !faitsNoms.has(x.id));
      if (n) out.push({ type: 'allah_names', texte: `apprendre le nom n° ${n.display_order}`, cible: { v: String(n.id), l: `Nom n° ${n.display_order} · ${n.transliteration || n.name_french}` } });

      const faitesI = new Set((invP.data || []).map((x) => x.invocation_id));
      // L'invocation EN COURS DE VALIDATION, sinon la suivante
      const enCoursI = (invs.data || []).find((x) => x.id === iDemandes.data?.[0]?.invocation_id && !faitesI.has(x.id));
      const inv = enCoursI ?? (invs.data || []).find((x) => !faitesI.has(x.id));
      if (inv) { const t = inv.title_french || inv.title_arabic || 'Invocation'; out.push({ type: 'invocations', texte: enCoursI ? `terminer l'invocation « ${t} » (en cours de validation)` : `apprendre l'invocation « ${t} »`, cible: { v: String(inv.id), l: t } }); }
      return out;
    },
  });
  // Seulement les cartes ouvertes à cet élève
  const eleve = acces.eleves.find((e) => e.id === eleveId);
  const visible = (type: string) => {
    if (!eleve) return true;
    const c = acces.cartes.find((x) => x.builtin_path === CARTE_DE[type]);
    return !c || (dansLaPeriode(c) && raisonAcces(c.acces, eleve.id, eleve.groupes) !== null);
  };
  return (q.data || []).filter((s) => visible(s.type));
}
