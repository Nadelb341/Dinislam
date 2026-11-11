import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { trierGroupesParNumero } from '@/lib/studentGroups';
import { aVingtAnsOuPlus, computeUnlocked, dernierStatutFinal, etatLettre, raisonLettre, type EtatLettre, type RaisonLettre } from '@/lib/alphabetProgress';
import { EVT_ATTENTE_LETTRES, envoyerLettresEnAttente, operationsLettresEnAttente } from '@/lib/alphabetOuvertures';

/**
 * 🔤 Toute la classe pour l'Alphabet (enseignante) : élèves, groupes, lettres apprises, ouvertures (élève et groupe),
 * dernières demandes de validation. En direct (clé 'alphabet-classe') ; les changements faits hors ligne s'affichent déjà.
 */
export interface EleveAlphabet { id: string; nom: string; groupes: string[]; adulte: boolean }

export function useAlphabetClasse(enabled = true) {
  const [attenteV, setAttenteV] = useState(0);
  useEffect(() => {
    const maj = () => setAttenteV((v) => v + 1);
    window.addEventListener(EVT_ATTENTE_LETTRES, maj);
    return () => window.removeEventListener(EVT_ATTENTE_LETTRES, maj);
  }, []);
  const q = useQuery({
    queryKey: ['alphabet-classe'],
    enabled,
    queryFn: async () => {
      const [letters, grps, mbrs, profs, roles, prog, perso, grpUnl, finals] = await Promise.all([
        supabase.from('alphabet_letters').select('id, letter_arabic, name_french').order('display_order'),
        supabase.from('student_groups').select('id, name, color, position'),
        supabase.from('student_group_members').select('user_id, group_id'),
        supabase.from('profiles').select('user_id, full_name, email, date_of_birth, age').eq('is_approved', true),
        supabase.from('user_roles').select('user_id').eq('role', 'student'),
        supabase.from('user_alphabet_progress').select('user_id, letter_id').eq('is_validated', true),
        supabase.from('alphabet_admin_unlocks').select('user_id, letter_id'),
        supabase.from('alphabet_group_unlocks').select('group_id, letter_id'),
        supabase.from('alphabet_submissions').select('student_id, letter_id, kind, status, created_at').eq('kind', 'final').order('created_at', { ascending: false }),
      ]);
      const err = [letters, grps, mbrs, profs, roles, prog, perso, grpUnl, finals].find((r) => r.error)?.error;
      if (err) throw err;
      const estEleve = new Set((roles.data || []).map((r) => r.user_id));
      const groupesDe = new Map<string, string[]>();
      for (const m of mbrs.data || []) groupesDe.set(m.user_id, [...(groupesDe.get(m.user_id) || []), m.group_id]);
      const eleves: EleveAlphabet[] = (profs.data || []).filter((p) => estEleve.has(p.user_id))
        .map((p) => ({ id: p.user_id, nom: p.full_name || p.email || 'Sans nom', groupes: groupesDe.get(p.user_id) || [], adulte: aVingtAnsOuPlus(p.date_of_birth, p.age) }))
        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
      return {
        lettres: letters.data || [],
        groupes: trierGroupesParNumero(grps.data || []),
        eleves,
        appris: prog.data || [],
        perso: perso.data || [],
        parGroupe: grpUnl.data || [],
        finals: finals.data || [],
      };
    },
  });

  const calc = useMemo(() => {
    const d = q.data;
    if (!d) return null;
    // 📡 changements pas encore envoyés : déjà visibles
    const perso = new Set(d.perso.map((u) => `${u.user_id}:${u.letter_id}`));
    const grp = new Set(d.parGroupe.map((u) => `${u.group_id}:${u.letter_id}`));
    for (const o of operationsLettresEnAttente()) {
      const s = o.cible === 'groupe' ? grp : perso;
      if (o.sens === 'ouvrir') s.add(`${o.id}:${o.letterId}`); else s.delete(`${o.id}:${o.letterId}`);
    }
    const ordre = d.lettres.map((l) => l.id);
    const apprisDe = new Map<string, Set<number>>();
    for (const p of d.appris) (apprisDe.get(p.user_id) ?? apprisDe.set(p.user_id, new Set()).get(p.user_id)!).add(p.letter_id);
    const statutDe = new Map<string, Map<number, string>>();
    for (const e of d.eleves) statutDe.set(e.id, dernierStatutFinal(d.finals.filter((f) => f.student_id === e.id)));

    /** État et raison d'une lettre pour un élève */
    const pour = (e: EleveAlphabet, letterId: number): { etat: EtatLettre; raison: RaisonLettre } => {
      const learned = apprisDe.get(e.id) ?? new Set<number>();
      const persoE = new Set(ordre.filter((id) => perso.has(`${e.id}:${id}`)));
      const grpE = new Set(ordre.filter((id) => e.groupes.some((g) => grp.has(`${g}:${id}`))));
      const unlocked = e.adulte ? new Set(ordre) : computeUnlocked(ordre, learned, new Set([...persoE, ...grpE]), false).unlocked;
      return { etat: etatLettre(letterId, learned, unlocked, statutDe.get(e.id) ?? new Map()), raison: raisonLettre(letterId, ordre, learned, persoE, grpE, e.adulte) };
    };
    return { pour, groupeOuvert: (g: string, letterId: number) => grp.has(`${g}:${letterId}`), persoOuvert: (u: string, letterId: number) => perso.has(`${u}:${letterId}`) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, attenteV]);

  return { ...q, lettres: q.data?.lettres || [], groupes: q.data?.groupes || [], eleves: q.data?.eleves || [], calc };
}

/** Envoie les ouvertures gardées hors ligne (au retour du réseau, à l'ouverture de la page) */
export function useLettresEnAttente(enabled = true) {
  const [n, setN] = useState(() => operationsLettresEnAttente().length);
  useEffect(() => {
    if (!enabled) return;
    const maj = () => setN(operationsLettresEnAttente().length);
    const tenter = () => { envoyerLettresEnAttente().then(maj, maj); };
    tenter();
    window.addEventListener('online', tenter);
    window.addEventListener(EVT_ATTENTE_LETTRES, maj);
    const t = setInterval(() => { if (operationsLettresEnAttente().length) tenter(); }, 30000);
    return () => { window.removeEventListener('online', tenter); window.removeEventListener(EVT_ATTENTE_LETTRES, maj); clearInterval(t); };
  }, [enabled]);
  return n;
}
