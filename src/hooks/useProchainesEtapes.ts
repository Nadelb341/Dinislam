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

/** Prochaines étapes de PLUSIEURS élèves d'un coup (mêmes règles ; utilisé aussi par « ✨ Donner au groupe ») */
export async function chargerProchainesEtapes(ids: string[]): Promise<Record<string, Suggestion[]>> {
  if (!ids.length) return {};
  const [lecons, nour, sourates, sour, lettres, alpha, noms, nomsP, invs, invP, lignesF, contenus, sDemandes, iDemandes] = await Promise.all([
    supabase.from('nourania_lessons').select('id, lesson_number, title_french').order('lesson_number'),
    supabase.from('user_nourania_progress').select('user_id, lesson_id').in('user_id', ids).eq('is_validated', true),
    supabase.from('sourates').select('id, number, name_french'),
    supabase.from('user_sourate_progress').select('user_id, sourate_id').in('user_id', ids).eq('is_validated', true).eq('context', 'sourates'),
    supabase.from('alphabet_letters').select('id, letter_arabic, name_french').order('display_order'),
    supabase.from('user_alphabet_progress').select('user_id, letter_id').in('user_id', ids).eq('is_validated', true),
    supabase.from('allah_names').select('id, display_order, transliteration, name_french').order('display_order'),
    supabase.from('user_allah_name_progress').select('user_id, name_id').in('user_id', ids).eq('is_validated', true),
    supabase.from('invocations').select('id, title_french, title_arabic, display_order').order('display_order'),
    supabase.from('user_invocation_progress').select('user_id, invocation_id').in('user_id', ids).eq('is_validated', true),
    supabase.from('nourania_lignes_faites').select('user_id, lesson_id, ligne, created_at').in('user_id', ids).order('created_at', { ascending: false }).limit(4000),
    supabase.from('nourania_lesson_content').select('lesson_id, lignes'),
    supabase.from('sourate_validation_requests').select('user_id, sourate_id, created_at').in('user_id', ids).eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('invocation_validation_requests').select('user_id, invocation_id, created_at').in('user_id', ids).eq('status', 'pending').order('created_at', { ascending: false }),
  ]);
  const res: Record<string, Suggestion[]> = {};
  for (const id of ids) {
    const out: Suggestion[] = [];
    const lignesFid = (lignesF.data || []).filter((x) => x.user_id === id);
    const faitesN = new Set((nour.data || []).filter((x) => x.user_id === id).map((x) => x.lesson_id));
    const listeL = lecons.data || [];
    // 🔢 2026-11-11 (Nadia) : la ligne JUSTE EN DESSOUS de la dernière ligne cochée par l'élève (ex. ligne 3 de la leçon 6 → « leçon 6, ligne 4 »)
    const derniere = lignesFid[0];
    const nbLignes = (lessonId: string) => (contenus.data || []).filter((c) => c.lesson_id === lessonId)
      .reduce((s, c) => s + nombreDeLignes(lireLignes(c.lignes)), 0);
    let cible: { lecon: (typeof listeL)[number]; ligne: number } | null = null;
    if (derniere) {
      const lecon = listeL.find((x) => x.id === derniere.lesson_id);
      const max = Math.max(...lignesFid.filter((x) => x.lesson_id === derniere.lesson_id).map((x) => x.ligne));
      const total = nbLignes(derniere.lesson_id);
      if (lecon && (!total || max < total)) cible = { lecon, ligne: max + 1 };
      else if (lecon) { const suivante = listeL.find((x) => x.lesson_number > lecon.lesson_number); if (suivante) cible = { lecon: suivante, ligne: 1 }; }
    }
    const l = cible?.lecon ?? listeL.find((x) => !faitesN.has(x.id));
    if (l) {
      const ligne = cible?.ligne ?? 1;
      out.push({ type: 'nourania', texte: `lire la leçon ${l.lesson_number}, ligne ${ligne}`, cible: { v: String(l.id), l: `Leçon ${l.lesson_number}${l.title_french ? ` · ${l.title_french}` : ''}` } });
    }

    const faitesS = new Set((sour.data || []).filter((x) => x.user_id === id).map((x) => x.sourate_id));
    // La sourate EN COURS DE VALIDATION (envoyée, pas encore validée), sinon la suivante du parcours
    const enCoursS = (sourates.data || []).find((x) => x.id === (sDemandes.data || []).find((x) => x.user_id === id)?.sourate_id && !faitesS.has(x.id));
    const s = enCoursS ?? [...(sourates.data || [])].sort((a, b) => rangParcours(b.number) - rangParcours(a.number)).find((x) => !faitesS.has(x.id) && x.number !== 1);
    if (s) { const nom = s.name_french.split(' (')[0]; out.push({ type: 'sourate', texte: enCoursS ? `terminer ${nom} (en cours de validation)` : `apprendre ${nom}`, cible: { v: String(s.number), l: `${s.number === 1000 ? '2-255' : s.number} · ${nom}` } }); }

    const ordre = (lettres.data || []).map((x) => x.id);
    // La 1ʳᵉ lettre pas encore validée, dans l'ordre (même si le professeur ne l'a pas encore ouverte)
    const apprises = new Set((alpha.data || []).filter((x) => x.user_id === id).map((x) => x.letter_id));
    const lt = (lettres.data || []).find((x) => x.id === ordre.find((id) => !apprises.has(id)));
    if (lt) out.push({ type: 'alphabet', texte: `apprendre la lettre ${lt.letter_arabic} (${lt.name_french})`, cible: { v: String(lt.id), l: `${lt.letter_arabic} · ${lt.name_french}` } });

    const faitsNoms = new Set((nomsP.data || []).filter((x) => x.user_id === id).map((x) => x.name_id));
    const n = (noms.data || []).find((x) => !faitsNoms.has(x.id));
    if (n) out.push({ type: 'allah_names', texte: `apprendre le nom n° ${n.display_order}`, cible: { v: String(n.id), l: `Nom n° ${n.display_order} · ${n.transliteration || n.name_french}` } });

    const faitesI = new Set((invP.data || []).filter((x) => x.user_id === id).map((x) => x.invocation_id));
    // L'invocation EN COURS DE VALIDATION, sinon la suivante
    const enCoursI = (invs.data || []).find((x) => x.id === (iDemandes.data || []).find((x) => x.user_id === id)?.invocation_id && !faitesI.has(x.id));
    const inv = enCoursI ?? (invs.data || []).find((x) => !faitesI.has(x.id));
    if (inv) { const t = inv.title_french || inv.title_arabic || 'Invocation'; out.push({ type: 'invocations', texte: enCoursI ? `terminer l'invocation « ${t} » (en cours de validation)` : `apprendre l'invocation « ${t} »`, cible: { v: String(inv.id), l: t } }); }
    res[id] = out;
  }
  return res;
}

/** Une carte (Nourania, Sourates…) est-elle ouverte à cet élève ? (règle « Qui voit quoi ») */
export function etapeVisible(acces: ReturnType<typeof useCartesAcces>, eleveId: string, type: string) {
  const eleve = acces.eleves.find((e) => e.id === eleveId);
  if (!eleve) return true;
  const c = acces.cartes.find((x) => x.builtin_path === CARTE_DE[type]);
  return !c || (dansLaPeriode(c) && raisonAcces(c.acces, eleve.id, eleve.groupes) !== null);
}

export function useProchainesEtapes(eleveId: string | null) {
  const acces = useCartesAcces(!!eleveId);
  const q = useQuery({
    queryKey: ['devoir-prochaines-etapes', eleveId],
    enabled: !!eleveId,
    staleTime: 60_000,
    queryFn: async (): Promise<Suggestion[]> => (await chargerProchainesEtapes([eleveId!]))[eleveId!] ?? [],
  });
  return (q.data || []).filter((s) => !eleveId || etapeVisible(acces, eleveId, s.type));
}
