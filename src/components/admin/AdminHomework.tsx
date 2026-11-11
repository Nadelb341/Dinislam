import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { moveToTrash } from '@/lib/trash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { sendPushNotification } from '@/lib/pushHelper';
import { takeDraftResume } from '@/lib/pendingDrafts';
import { WeeklyProgramAdmin } from './WeeklyProgramAdmin';
import { useGroupCourse } from '@/hooks/useGroupCourse';
import { courseAfter, courseLabel, toLocalInput, type GroupSchedule } from '@/lib/groupCourse';
import { useHolidays } from '@/hooks/useGroupCourse';
import { RotationProf, type LigneProf } from '@/components/cahier/RotationProf';
import { DecisionsDialog } from '@/components/cahier/DecisionsDialog';
import { aRattraper, coursApres, coursPasses, COURS_PAR_DEFAUT, donneLe, heureDeRendu, horairePour, rangement, renduEnRetard, type Decision } from '@/lib/rotationDevoirs';
import { EnregistreurAudio } from '@/components/cahier/EnregistreurAudio';
import { deposerAudioProf } from '@/lib/audioProf';
import { AudioPrive } from '@/components/shared/FichiersPrives';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { envoyerMessageCorrection } from '@/lib/messageCorrection';
import { PiecesJointesVue } from '@/components/shared/PiecesJointesVue';
import { asPJ, lundiCourant } from '@/lib/devoirFichiers';
import { FormulaireDevoirEleve } from '@/components/cahier/FormulaireDevoirEleve';
import { CLE_BROUILLON, lireBrouillons } from '@/lib/devoirsEleve';
import { useDevoirsEnAttente } from '@/hooks/useDevoirsEnAttente';
import { CopierDevoirsDialog } from '@/components/cahier/CopierDevoirsDialog';


interface AdminHomeworkProps {
  onBack: () => void;
  /** Ouvert depuis un groupe de la carte « Cahier de texte » : un nouveau devoir est proposé pour ce groupe (2026-10-26) */
  groupeId?: string | null;
  /** Élève dont la carte s'ouvre tout de suite (« En faire un devoir » depuis le cahier de texte, 2026-11-11) */
  ouvrirEleveId?: string | null;
}



const AdminHomework = ({ onBack, groupeId, ouvrirEleveId }: AdminHomeworkProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [elevesRendusOuverts, setElevesRendusOuverts] = useState<Record<string, boolean>>({});
  const [modalARefaire, setModalARefaire] = useState<{
    renduId: string; studentId: string; devoirTitre: string; devoirId?: string | null;
  } | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [devoirToDelete, setDevoirToDelete] = useState<{ id: string; titre: string } | null>(null);
  const { askValidation, validationDialog } = useConfirmValidation();
  // Ouvert depuis un groupe : date à rendre = son prochain cours (vacances sautées, idée 2)
  const { next: prochainCours, schedule: horaireGroupe } = useGroupCourse(groupeId);
  // Idée 4 : correction audio (la consigne audio est maintenant sur chaque ligne, 2026-11-04)
  const [correctionAudio, setCorrectionAudio] = useState<Blob | null>(null);
  const [copierOuvert, setCopierOuvert] = useState(false);
  // 📅 2026-11-11 (Nadia) : en haut, seulement « Pour quand ? » (date + préparer à l'avance), pour tous les élèves de la liste
  const [quand, setQuand] = useState<{ date_limite: string; programme: boolean }>({ date_limite: '', programme: false });
  // Carte d'élève à ouvrir (devoir préparé depuis le cahier de texte, ou « 📚 Donner les devoirs » à l'heure du cours)
  const [eleveAOuvrir, setEleveAOuvrir] = useState<string | null>(ouvrirEleveId ?? null);
  const devoirsEnAttente = useDevoirsEnAttente();
  // ⏳ « Continuer » un brouillon depuis le message d'ouverture : la carte du 1er élève qui a un brouillon s'ouvre
  useEffect(() => {
    if (!takeDraftResume(CLE_BROUILLON)) return;
    const id = Object.keys(lireBrouillons().parEleve)[0];
    if (id) setEleveAOuvrir(id);
  }, []);

  // Fetch devoirs with enriched names
  const { data: devoirs = [] } = useQuery({
    queryKey: ['admin-devoirs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devoirs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data?.length) return [];

      const studentIds = [...new Set(data.filter(d => d.student_id).map(d => d.student_id!))];
      const groupIds = [...new Set(data.filter(d => d.group_id).map(d => d.group_id!))];

      const [{ data: profiles }, { data: groups }] = await Promise.all([
        studentIds.length
          ? supabase.from('profiles').select('user_id, full_name').in('user_id', studentIds)
          : Promise.resolve({ data: [] as { user_id: string; full_name: string | null }[] }),
        groupIds.length
          ? supabase.from('student_groups').select('id, name').in('id', groupIds)
          : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      ]);

      return data.map(d => ({
        ...d,
        student_name: profiles?.find(p => p.user_id === d.student_id)?.full_name || null,
        group_name: groups?.find(g => g.id === d.group_id)?.name || null,
      }));
    },
  });

  // Fetch rendus with student info
  const { data: rendus = [] } = useQuery({
    queryKey: ['admin-devoirs-rendus'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devoirs_rendus')
        .select('*')
        .order('rendu_at', { ascending: false });
      if (error) throw error;
      if (!data?.length) return [];

      const studentIds = [...new Set(data.map(r => r.student_id))];
      const devoirIds = [...new Set(data.map(r => r.devoir_id).filter(Boolean))];

      const [{ data: profiles }, { data: devoirsList }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').in('user_id', studentIds),
        devoirIds.length
          ? supabase.from('devoirs').select('id, titre, type').in('id', devoirIds)
          : Promise.resolve({ data: [] }),
      ]);

      return data.map((r) => ({
        ...r,
        student_name: profiles?.find(p => p.user_id === r.student_id)?.full_name || 'Inconnu',
        devoir_titre: devoirsList?.find((d) => d.id === r.devoir_id)?.titre || '',
      }));
    },
  });

  // Fetch groups
  const { data: groupes = [] } = useQuery({
    queryKey: ['admin-student-groups'],
    queryFn: async () => {
      const { data } = await supabase.from('student_groups').select('id, name').order('position', { ascending: true, nullsFirst: false }).order('name');
      return data || [];
    },
  });

  // Appartenance aux groupes : un devoir de groupe ne s'affiche que chez les élèves de CE groupe (corrigé le 2026-10-26)
  const { data: memberships = [] } = useQuery({
    queryKey: ['admin-devoirs', 'group-members'],
    queryFn: async () => {
      const { data } = await supabase.from('student_group_members').select('user_id, group_id');
      return data || [];
    },
  });

  // 🔄 Rotation à l'heure du cours (2026-10-27) : heures de cours de tous les groupes, vacances, choix « à rattraper / historique »
  const { data: horaires = [] } = useQuery({
    queryKey: ['group-course', 'all-schedules'],
    queryFn: async () => {
      const { data } = await supabase.from('group_schedules').select('group_id, weekday, start_time');
      return (data || []) as GroupSchedule[];
    },
  });
  const { data: holidays = [] } = useHolidays();
  const { data: decisions = [], isSuccess: decisionsChargees } = useQuery({
    queryKey: ['admin-devoirs', 'decisions'],
    queryFn: async () => {
      const { data } = await supabase.from('devoir_decisions').select('devoir_id, student_id, decision');
      return data || [];
    },
  });
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  const { data: rolesEleves = [] } = useQuery({
    queryKey: ['admin-devoirs', 'roles-eleves'],
    queryFn: async () => ((await supabase.from('user_roles').select('user_id').eq('role', 'student')).data || []),
  });
  const idsEleves = new Set(rolesEleves.map((r) => r.user_id));

  // Fetch approved students
  const { data: eleves = [] } = useQuery({
    queryKey: ['admin-eleves-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, created_at')
        .eq('is_approved', true)
        .order('full_name');
      return data || [];
    },
  });

  // Delete devoir
  const deleteDevoir = useMutation({
    mutationFn: async (id: string) => {
      const devoir = devoirs.find((d) => d.id === id);
      // Corbeille d'abord : si elle échoue, rien n'est supprimé
      if (devoir && user?.id) {
        // Les audios rendus et les cases « J'ai travaillé » partent avec le devoir (suppression en cascade) : gardés avec lui dans la corbeille
        const [{ data: checksRows }, { data: rendusRows }, { data: stepsRows }, { data: decisionsRows }] = await Promise.all([
          supabase.from('devoir_checks').select('*').eq('devoir_id', id),
          supabase.from('devoirs_rendus').select('*').eq('devoir_id', id),
          supabase.from('devoir_steps').select('*').eq('devoir_id', id),
          supabase.from('devoir_decisions').select('*').eq('devoir_id', id),
        ]);
        const children = [
          ...(rendusRows?.length ? [{ table: 'devoirs_rendus', rows: rendusRows }] : []),
          ...(checksRows?.length ? [{ table: 'devoir_checks', rows: checksRows }] : []),
          ...(stepsRows?.length ? [{ table: 'devoir_steps', rows: stepsRows }] : []),
          ...(decisionsRows?.length ? [{ table: 'devoir_decisions', rows: decisionsRows }] : []),
        ];
        // Copie = la vraie ligne de la table (sans les noms ajoutés pour l'affichage, sinon la restauration échoue)
        const { student_name, group_name, ...row } = devoir;
        const ok = await moveToTrash(user.id, 'devoir', id, devoir.titre || 'Devoir',
          children.length ? { ...row, __children: children } : row);
        if (!ok) throw new Error("Le devoir n'a pas pu être mis dans la corbeille, rien n'a été supprimé");
      }
      const { error } = await supabase.from('devoirs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs-rendus'] });
      toast.success('Devoir supprimé');
    },
  });

  // Mark as corrected
  const markCorrige = useMutation({
    mutationFn: async ({ renduId, studentId, devoirTitre }: { renduId: string; studentId: string; devoirTitre: string }) => {
      const { error } = await supabase
        .from('devoirs_rendus')
        .update({ statut: 'corrige' })
        .eq('id', renduId);
      if (error) throw error;

      sendPushNotification({
        userIds: [studentId],
        title: '🎉 Devoir validé, bravo {prenom} !', category: 'hw_res',
        body: `Ton devoir "${devoirTitre}" a été corrigé ✅`,
        data: { url: '/?open=devoirs' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs-rendus'] });
      toast.success('✅ Corrigé — élève notifié !');
    },
  });

  // Mark as "à refaire"
  const markARefaire = useMutation({
    mutationFn: async () => {
      if (!modalARefaire) throw new Error('Aucun rendu sélectionné');
      const correctionUrl = correctionAudio && user ? await deposerAudioProf(user.id, correctionAudio, 'corrections') : null;
      const { error } = await supabase
        .from('devoirs_rendus')
        .update({ statut: 'a_refaire', commentaire_admin: commentaire || null, correction_audio_url: correctionUrl })
        .eq('id', modalARefaire.renduId);
      if (error) throw error;
      // 📝 Aussi dans la messagerie de l'élève, avec l'audio et le lien vers son cahier (2026-11-04)
      void envoyerMessageCorrection({ studentId: modalARefaire.studentId, notifier: false, sorte: 'retravailler', audioUrl: correctionUrl, commentaire,
        quoi: `ton devoir « ${modalARefaire.devoirTitre} »`, lien: '/?open=devoirs', devoirId: modalARefaire.devoirId });

      sendPushNotification({
        userIds: [modalARefaire.studentId],
        title: '🔄 {prenom}, devoir à refaire', category: 'hw_res',
        body: `"${modalARefaire.devoirTitre}" est à refaire${commentaire ? ` : ${commentaire}` : ''}`,
        data: { url: '/?open=devoirs' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs-rendus'] });
      toast.success('📢 Élève notifié — devoir à refaire');
      setModalARefaire(null);
      setCommentaire('');
      setCorrectionAudio(null);
    },
  });

  // Ouvert depuis un groupe (2026-10-26, demande de Nadia) : seulement les élèves de CE groupe
  const membresGroupe = groupeId ? new Set(memberships.filter((m) => m.group_id === groupeId).map((m) => m.user_id)) : null;
  // « Général » (2026-11-11) : tous les ÉLÈVES (sans les comptes enseignante / parents), pour leur donner leurs devoirs un par un
  const elevesVus = membresGroupe ? eleves.filter((e) => membresGroupe.has(e.user_id)) : eleves.filter((e) => idsEleves.has(e.user_id));
  const nomGroupe = groupeId ? groupes.find((g) => g.id === groupeId)?.name : null;
  // Group devoirs by student
  const devoirsParEleve = elevesVus.map(eleve => {
    const devoirsEleve = devoirs.filter(d =>
      d.assigned_to === 'all' ||
      d.student_id === eleve.user_id ||
      (d.assigned_to === 'group' && !!d.group_id && memberships.some((m) => m.user_id === eleve.user_id && m.group_id === d.group_id))
    );
    return { eleve, devoirsEleve };
  });

  // 👂 Idée 3 (2026-11-04) : qui a écouté la consigne audio / ouvert les documents
  const { data: vues = [] } = useQuery({
    queryKey: ['devoir-vues'],
    queryFn: async () => ((await supabase.from('devoir_vues').select('devoir_id, student_id, kind')).data || []),
  });
  const aVu = (devoirId: string, eleveId: string, kind: 'audio' | 'document') => vues.some((v) => v.devoir_id === devoirId && v.student_id === eleveId && v.kind === kind);

  useEffect(() => {
    if (quand.date_limite) return;
    if (prochainCours) { setQuand((q) => (q.date_limite ? q : { ...q, date_limite: toLocalInput(prochainCours) })); return; }
    const d = new Date(); d.setHours(18, 0, 0, 0); do d.setDate(d.getDate() + 1); while (d.getDay() !== 3);
    const p = (n: number) => String(n).padStart(2, '0');
    setQuand((q) => (q.date_limite ? q : { ...q, date_limite: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T18:00` }));
  }, [prochainCours, quand.date_limite]);

  // 🔄 Chaque devoir de chaque élève, rangé : Cette semaine / Semaine passée / Historique / À rattraper
  const groupesDe = (id: string) => memberships.filter((m) => m.user_id === id).map((m) => m.group_id);
  const lignesProf: LigneProf[] = devoirsParEleve.flatMap(({ eleve, devoirsEleve }) => devoirsEleve.map((d) => {
    const horaire = horairePour(d.group_id ?? groupeId, groupesDe(eleve.user_id), horaires, holidays);
    const r = rendus.find((x) => x.devoir_id === d.id && x.student_id === eleve.user_id);
    const ligneR = { id: d.id, created_at: d.created_at, visible_a: d.visible_a, date_limite: d.date_limite };
    const heureRendu = heureDeRendu(ligneR, horaire, holidays);
    const rang = rangement(ligneR, horaire, holidays, now);
    const fait = !!r && r.statut !== 'a_refaire';
    const decision = decisions.find((x) => x.devoir_id === d.id && x.student_id === eleve.user_id)?.decision as Decision | undefined;
    const arrivee = (eleve as { created_at?: string | null }).created_at ?? null;
    return {
      eleveId: eleve.user_id, devoirId: d.id, titre: d.titre, type: d.type, statut: r?.statut ?? null, renduAt: r?.rendu_at ?? null,
      visibleLe: d.visible_a && new Date(d.visible_a) > now ? new Date(d.visible_a) : null,
      fait, rang, heureRendu, decision, rattraper: aRattraper(ligneR, fait, rang, decision, arrivee), retard: renduEnRetard(r?.rendu_at, heureRendu),
      emoji: d.matiere_emoji ?? undefined,
      ecoute: d.consigne_audio_url ? aVu(d.id, eleve.user_id, 'audio') : null,
      ouvert: asPJ(d.pieces_jointes).length ? aVu(d.id, eleve.user_id, 'document') : null,
    };
  }));
  // Prochain cours du groupe ouvert (sinon mercredi 14 h) et cours passés pour la bande de semaines
  const horaireVu = horaireGroupe ?? COURS_PAR_DEFAUT;
  const prochainCoursVu = coursApres(horaireVu, holidays, now);
  const premierDevoir = devoirs.length ? new Date(Math.min(...devoirs.map((d) => donneLe(d).getTime()))) : now;
  const coursHisto = coursPasses(horaireVu, holidays, premierDevoir, now).slice(0, -1);
  // 🕑 Idée 2 : heure où les devoirs préparés à l'avance apparaissent (début du prochain cours) et leur date à rendre
  const heureVisible = prochainCoursVu;

  // 📋 Devoirs précédents pas faits sur lesquels Nadia n'a pas encore choisi (rattraper ou historique)
  const nonDecides = lignesProf.filter((l) => l.rattraper && !l.decision);
  const [decisionsOuvert, setDecisionsOuvert] = useState(false);
  const decisionsDemandees = useRef(false);
  useEffect(() => {
    // Ouvert depuis « Distribuer les devoirs » d'un groupe : la liste s'affiche d'abord, une fois par ouverture
    if (!groupeId || decisionsDemandees.current || !decisionsChargees || !nonDecides.length) return;
    decisionsDemandees.current = true;
    setDecisionsOuvert(true);
  }, [groupeId, decisionsChargees, nonDecides.length]);

  const enregistrerDecisions = useMutation({
    mutationFn: async (choix: { devoirId: string; studentId: string; decision: Decision }[]) => {
      if (!choix.length) return;
      const { error } = await supabase.from('devoir_decisions').upsert(
        choix.map((c) => ({ devoir_id: c.devoirId, student_id: c.studentId, decision: c.decision, decided_at: new Date().toISOString(), decided_by: user?.id ?? null })),
        { onConflict: 'devoir_id,student_id' });
      if (error) throw error;
    },
    onSuccess: (_d, choix) => {
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs', 'decisions'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-program'] });
      const r = choix.filter((c) => c.decision === 'rattraper').length;
      toast.success(choix.length === 1 ? (r ? '🔁 Devoir redonné : il est en haut du cahier de l\'élève' : '📚 Rangé dans l\'historique') : `✅ Choix enregistrés : ${r} à rattraper, ${choix.length - r} dans l'historique`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fermerDecisions = () => setDecisionsOuvert(false);

  const toggleEleveRendu = (id: string) =>
    setElevesRendusOuverts(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
      </Button>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">📚 Devoirs</h2>
        {groupeId && (
          <Button onClick={() => setCopierOuvert(true)} size="sm" variant="outline" className="ms-auto">📋 Copier vers un groupe</Button>
        )}
      </div>

      {devoirsEnAttente > 0 && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-sm">📡 {devoirsEnAttente} distribution{devoirsEnAttente > 1 ? 's' : ''} de devoirs pas encore envoyée{devoirsEnAttente > 1 ? 's' : ''} (hors connexion) : elle{devoirsEnAttente > 1 ? 's partiront' : ' partira'} toute seule au retour du réseau.</p>
      )}

      {/* 📅 Pour quand ? (2026-11-11, Nadia : on garde la date et « Préparer à l'avance », le reste se fait élève par élève) */}
      <div className="rounded-2xl border-2 border-sky-300 dark:border-sky-800 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/30 p-3 space-y-3 shadow-sm">
        <p className="text-sm font-extrabold text-sky-900 dark:text-sky-100">📅 Pour quand ?</p>
        <div className="space-y-1">
          <label htmlFor="devoirs-date" className="text-xs font-medium text-muted-foreground">📅 Date à rendre * (pas de cours pendant les vacances : choisis la bonne date)</label>
          <Input id="devoirs-date" type="datetime-local" value={quand.date_limite} onChange={(e) => setQuand((q) => ({ ...q, date_limite: e.target.value }))} />
          {quand.date_limite && <p className="text-xs text-muted-foreground">Rappel aux élèves chaque jour à 18 h, et la veille de la date à rendre.</p>}
        </div>
        {/* 🕑 Idée 2 : préparer à l'avance, les élèves les voient au début du prochain cours */}
        <label className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 cursor-pointer ${quand.programme ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/30' : 'border-border'}`}>
          <input type="checkbox" checked={quand.programme} className="mt-0.5 h-4 w-4 accent-sky-600"
            onChange={(e) => {
              const on = e.target.checked;
              // Visibles au début du cours → à rendre pour le cours d'après
              setQuand((q) => ({ programme: on, date_limite: on ? toLocalInput(courseAfter({ group_id: '', ...horaireVu }, holidays, heureVisible)) : (prochainCours ? toLocalInput(prochainCours) : q.date_limite) }));
            }} />
          <span className="text-xs">
            <b>🕑 Préparer à l'avance</b> : les élèves verront ces devoirs au début du cours, {courseLabel(heureVisible)}, et recevront « 📓 Tes nouveaux devoirs sont prêts ! » à ce moment-là.
            {!horaireGroupe && <span className="block text-amber-700 dark:text-amber-400 font-semibold">⚠️ Heure du groupe pas réglée : mercredi 14 h par défaut.</span>}
          </span>
        </label>
        <p className="text-xs text-sky-900 dark:text-sky-100">👇 Touche un élève dans la liste pour lui donner ses devoirs.</p>
      </div>

      {/* 💎 Chemin de la semaine automatique (2026-10-08) — sous le formulaire depuis le 2026-11-05 (demande de Nadia) */}
      <WeeklyProgramAdmin />

      {/* Devoirs grouped by student */}
      <div>
        <h3 className="font-semibold text-foreground mb-2">
          Devoirs assignés ({membresGroupe ? new Set(devoirsParEleve.flatMap(({ devoirsEleve }) => devoirsEleve.map((d) => d.id))).size : devoirs.length})
        </h3>
        {nomGroupe && <p className="text-xs text-muted-foreground mb-2">👥 Seulement les élèves du groupe « {nomGroupe} »</p>}
        {/* 👂 Idée 3 : consignes écoutées et documents ouverts, devoir par devoir (cette semaine) */}
        {(() => {
          const semaine = [...new Map(lignesProf.filter((l) => l.rang === 'semaine' && (l.ecoute !== null || l.ouvert !== null)).map((l) => [l.devoirId, l])).values()];
          if (!semaine.length) return null;
          return (
            <div className="mb-2 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/20 p-2 space-y-1">
              <p className="text-xs font-extrabold">👂 Qui a écouté / ouvert (cette semaine)</p>
              {semaine.map((l) => {
                const tous = lignesProf.filter((x) => x.devoirId === l.devoirId);
                const n = (k: 'ecoute' | 'ouvert') => tous.filter((x) => x[k]).length;
                return (
                  <p key={l.devoirId} className="text-xs [overflow-wrap:anywhere]">
                    <span className="cahier-main text-sm">{l.titre}</span>
                    {l.ecoute !== null && <span className="ms-1.5 rounded-full bg-card border px-1.5 font-bold">🎧 écouté par {n('ecoute')}/{tous.length}</span>}
                    {l.ouvert !== null && <span className="ms-1.5 rounded-full bg-card border px-1.5 font-bold">📎 ouvert par {n('ouvert')}/{tous.length}</span>}
                  </p>
                );
              })}
            </div>
          );
        })()}
        {/* 🔄 Rotation à l'heure du cours (2026-10-27) : onglets, « À rattraper », bilan, historique. Depuis un groupe : TOUS ses élèves */}
        <RotationProf
          eleves={devoirsParEleve.map(({ eleve }) => eleve)}
          ouvrirEleveId={eleveAOuvrir}
          aUnBrouillon={(id) => !!lireBrouillons().parEleve[id]}
          formulaire={(e, suivant) => {
            const autres = elevesVus.filter((x) => x.user_id !== e.user_id);
            const siens = devoirsParEleve.find((x) => x.eleve.user_id === e.user_id)?.devoirsEleve ?? [];
            const passes = lignesProf.filter((l) => l.eleveId === e.user_id && l.rang === 'passee')
              .map((l) => devoirs.find((d) => d.id === l.devoirId)).filter((d): d is NonNullable<typeof d> => !!d)
              .map((d) => ({ titre: d.titre, type: d.type, cible_id: d.cible_id, matiere_emoji: d.matiere_emoji }));
            return (
              <FormulaireDevoirEleve key={e.user_id} eleve={e} groupeId={groupeId ?? null} autres={autres}
                dateLimite={quand.date_limite} visibleA={quand.programme && heureVisible ? heureVisible.toISOString() : null}
                dejaCetteSemaine={siens.filter((d) => new Date(d.created_at || 0).getTime() >= lundiCourant(now).getTime()).length}
                semainePassee={passes} onSuivant={suivant} />
            );
          }}
          lignes={lignesProf} prochainCours={prochainCoursVu} coursHistorique={coursHisto}
          onDecision={(items, decision) => {
            enregistrerDecisions.mutate(items.map((it) => ({ ...it, decision })));
            // Idée 3 : l'élève est prévenu qu'un devoir lui est redonné
            if (decision === 'rattraper') {
              const titre = lignesProf.find((l) => l.devoirId === items[0]?.devoirId)?.titre || '';
              sendPushNotification({ userIds: [...new Set(items.map((it) => it.studentId))], title: '🔁 {prenom}, un devoir à rattraper', category: 'hw_new', body: `« ${titre} » est en haut de ton cahier de texte`, data: { url: '/?open=devoirs' } });
            }
          }}
          onDelete={(id, titre) => setDevoirToDelete({ id, titre })}
          onDonner={() => setEleveAOuvrir(elevesVus[0]?.user_id ?? null)}
          onValider={(id) => {
            // Ouvre ses rendus (écoute, ✅ Valider, 🔄 À refaire) et descend jusqu'à eux
            setElevesRendusOuverts((prev) => ({ ...prev, [id]: true }));
            setTimeout(() => document.getElementById(`rendu-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
          }} />
        {!groupeId && <p className="text-[11px] text-muted-foreground mt-1">🕑 Chaque devoir tourne à l'heure du cours de son groupe (mercredi 14 h si le groupe n'a pas d'heure réglée).</p>}
      </div>

      {/* Rendus grouped by student */}
      <div>
        <h3 className="font-semibold text-foreground mb-2">
          Rendus à corriger ({rendus.filter((r) => r.statut === 'rendu' && (!membresGroupe || membresGroupe.has(r.student_id))).length})
        </h3>
        {(() => {
          // Group rendus by student_id directly from rendus data
          const rendusParEleve: Record<string, { name: string; items: (typeof rendus)[number][] }> = {};
          rendus.forEach((r) => {
            if (membresGroupe && !membresGroupe.has(r.student_id)) return;
            if (!rendusParEleve[r.student_id]) {
              rendusParEleve[r.student_id] = { name: r.student_name || 'Inconnu', items: [] };
            }
            rendusParEleve[r.student_id].items.push(r);
          });

          if (Object.keys(rendusParEleve).length === 0) {
            return <p className="text-muted-foreground text-sm text-center py-4">Aucun rendu</p>;
          }

          // Ceux qui ont un devoir à valider d'abord (2026-10-30), puis par prénom
          return Object.entries(rendusParEleve)
            .sort(([, a], [, b]) => b.items.filter((r) => r.statut === 'rendu').length - a.items.filter((r) => r.statut === 'rendu').length || a.name.localeCompare(b.name, 'fr'))
            .map(([studentId, { name, items }]) => {
            const ouvert = elevesRendusOuverts[studentId];
            const pendingCount = items.filter(r => r.statut === 'rendu').length;
            const hasARefaire = items.some(r => r.statut === 'a_refaire');
            const hasEnAttente = items.some(r => r.statut === 'rendu');
            const colorClass = hasARefaire
              ? 'border-destructive bg-destructive/5'
              : hasEnAttente
              ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20'
              : 'border-green-400 bg-green-50 dark:bg-green-950/20';

            return (
              <Card key={studentId} id={`rendu-${studentId}`} className={`mb-2 overflow-hidden border-2 scroll-mt-24 ${colorClass}`}>
                <button
                  onClick={() => toggleEleveRendu(studentId)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold text-foreground text-sm flex items-center gap-2">
                    👤 {name} ({items.length} rendu{items.length > 1 ? 's' : ''})
                    {pendingCount > 0 && (
                      <span className="bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </span>
                  {ouvert ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {ouvert && (
                  <div className="px-3 pb-3 space-y-2">
                    {items.map((r) => (
                      <div key={r.id} className={`rounded-xl p-3 ${
                        r.statut === 'corrige'
                          ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                          : r.statut === 'a_refaire'
                          ? 'bg-destructive/5 border border-destructive/20'
                          : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                      }`}>
                        <p className="font-semibold text-foreground text-sm mb-1">{r.devoir_titre}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(r.rendu_at).toLocaleDateString('fr-FR')}
                        </p>
                        {!r.audio_url && !asPJ(r.photos).length && r.statut === 'rendu' && (
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">✅ L'élève a validé son devoir (sans audio demandé)</p>
                        )}
                        {r.audio_url && (
                          <div className="mb-2">
                            <AudioPrive
                              src={r.audio_url}
                              controls
                              preload="auto"
                              style={{ width: '100%', height: '40px', borderRadius: '12px' }}
                            />
                          </div>
                        )}
                        {asPJ(r.photos).length > 0 && (
                          <div className="mb-2 space-y-1"><p className="text-xs font-bold">📷 Photos de l'élève</p><PiecesJointesVue items={asPJ(r.photos)} grand /></div>
                        )}
                        {r.commentaire_admin && (
                          <p className="text-xs text-destructive bg-destructive/5 rounded-lg p-2 mb-2">
                            💬 {r.commentaire_admin}
                          </p>
                        )}
                        {r.statut === 'rendu' && (
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1 gap-1"
                              onClick={() => askValidation('Valider ce devoir ?', `« ${r.devoir_titre} » de ${r.student_name} : son diamant va briller ✨`, () => markCorrige.mutate({ renduId: r.id, studentId: r.student_id, devoirTitre: r.devoir_titre }))}
                              disabled={markCorrige.isPending}>
                              ✅ Valider le devoir
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1 gap-1"
                              onClick={() => setModalARefaire({ renduId: r.id, studentId: r.student_id, devoirTitre: r.devoir_titre, devoirId: r.devoir_id })}>
                              <RefreshCw className="h-3 w-3" /> À Refaire
                            </Button>
                          </div>
                        )}
                        {r.statut === 'corrige' && (
                          <Badge className="bg-green-500 text-white">✅ Validé</Badge>
                        )}
                        {r.statut === 'a_refaire' && (
                          <Badge variant="destructive">🔄 À refaire</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          });
        })()}
      </div>

      {/* Modal "À refaire" */}
      <Dialog open={!!modalARefaire} onOpenChange={(open) => { if (!open) { setModalARefaire(null); setCommentaire(''); } }}>
        <DialogContent level="nested">
          <DialogHeader>
            <DialogTitle>🔄 Devoir à refaire</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{modalARefaire?.devoirTitre}</p>
          <Textarea
            placeholder="Commentaire pour l'élève (optionnel)"
            value={commentaire}
            onChange={e => setCommentaire(e.target.value)}
            rows={3}
          />
          <EnregistreurAudio label="Correction audio (facultatif) : l'élève l'écoute avant de refaire" onChange={setCorrectionAudio} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setModalARefaire(null); setCommentaire(''); }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => markARefaire.mutate()} disabled={markARefaire.isPending}>
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 📋 Devoirs précédents pas faits : à rattraper ou historique (demande de Nadia, 2026-10-27) */}
      <DecisionsDialog open={decisionsOuvert} items={nonDecides}
        nom={(id) => eleves.find((e) => e.user_id === id)?.full_name || 'Élève'}
        onClose={fermerDecisions}
        onSave={(choix) => { enregistrerDecisions.mutate(choix); fermerDecisions(); }} />

      {groupeId && <CopierDevoirsDialog open={copierOuvert} onClose={() => setCopierOuvert(false)} groupeId={groupeId} groupeNom={nomGroupe ?? 'Groupe'} groupes={groupes} devoirs={devoirs} memberships={memberships} />}
      {validationDialog}
      {/* Supprimer un devoir : confirmation d'abord, il part dans la corbeille (corrigé le 2026-10-26) */}
      <AlertDialog open={!!devoirToDelete} onOpenChange={(open) => { if (!open) setDevoirToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devoir ?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">
              « {devoirToDelete?.titre} » ira dans la corbeille de Paramètres, avec les audios rendus et les cases cochées par les élèves. Tu pourras le restaurer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (devoirToDelete) deleteDevoir.mutate(devoirToDelete.id); setDevoirToDelete(null); }}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default AdminHomework;
