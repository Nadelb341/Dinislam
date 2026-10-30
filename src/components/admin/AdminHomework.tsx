import { useState, useEffect, useRef } from 'react';
import { DraftDot } from '@/components/shared/DraftDot';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { moveToTrash } from '@/lib/trash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { sendPushNotification } from '@/lib/pushHelper';
import { saveDraft, loadDraft, clearDraft } from '@/hooks/useDraftRecovery';
import { takeDraftResume } from '@/lib/pendingDrafts';
import { WeeklyProgramAdmin } from './WeeklyProgramAdmin';
import { MATIERES } from '@/lib/devoirMatieres';
import { CibleSelect } from './CibleSelect';
import { useGroupCourse } from '@/hooks/useGroupCourse';
import { useNiveaux } from '@/hooks/useNiveaux';
import { courseAfter, courseLabel, toLocalInput, type GroupSchedule } from '@/lib/groupCourse';
import { useHolidays } from '@/hooks/useGroupCourse';
import { RotationProf, type LigneProf } from '@/components/cahier/RotationProf';
import { DecisionsDialog } from '@/components/cahier/DecisionsDialog';
import { aRattraper, coursApres, coursPasses, COURS_PAR_DEFAUT, donneLe, heureDeRendu, horairePour, rangement, renduEnRetard, type Decision } from '@/lib/rotationDevoirs';
import { EnregistreurAudio } from '@/components/cahier/EnregistreurAudio';
import { deposerAudioProf } from '@/lib/audioProf';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import type { TablesInsert } from '@/integrations/supabase/types';

const DRAFT_KEY_HOMEWORK = 'dinislam_homework';
type HomeworkDraft = { titre: string; type: string; description: string; lien_lecon: string; date_limite: string; assigned_to: string; group_id: string; student_id: string; group_ids: string[]; student_ids?: string[]; source_task_id?: string; etapes?: string; lignes?: Record<string, string>; cibles?: Record<string, string>; audios?: Record<string, boolean>; cible_id?: string; audio_requis?: boolean; programme?: boolean };

interface AdminHomeworkProps {
  onBack: () => void;
  /** Ouvert depuis un groupe de la carte « Cahier de texte » : un nouveau devoir est proposé pour ce groupe (2026-10-26) */
  groupeId?: string | null;
}

const TYPE_OPTIONS = [
  { value: 'recitation', label: '🎙️ Récitation' },
  { value: 'sourate', label: '📖 Sourate à mémoriser' },
  { value: 'nourania', label: '✨ Leçon Nourania' },
  { value: 'allah_names', label: "🌟 99 noms d'Allah" },
  { value: 'alphabet', label: '🔤 Alphabet' },
  { value: 'invocations', label: '🤲 Invocations' },
  { value: 'priere', label: '🕌 Prière' },
  { value: 'coran', label: '📗 Coran' },
  { value: 'exercice_pdf', label: '📄 Exercice PDF' },
  { value: 'autre', label: '✏️ Autre' },
];

const AdminHomework = ({ onBack, groupeId }: AdminHomeworkProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [elevesRendusOuverts, setElevesRendusOuverts] = useState<Record<string, boolean>>({});
  const [modalARefaire, setModalARefaire] = useState<{
    renduId: string; studentId: string; devoirTitre: string;
  } | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [form, setForm] = useState({
    titre: '', type: 'recitation', description: '',
    lien_lecon: '', date_limite: '', assigned_to: 'all',
    group_id: '', student_id: '', group_ids: [] as string[], student_ids: [] as string[],
    // 💎 Devoir en étapes (une par ligne, ex. « Ligne 1 ») : le diamant de l'élève se remplit étape par étape (2026-10-26)
    etapes: '',
    // ✍️ Consignes écrites sur les lignes des matières (gardées dans le brouillon, 2026-10-26)
    lignes: {} as Record<string, string>,
    // 📍 Élément ouvert par « Commencer mon travail » et 🎙️ audio demandé, par matière (2026-10-26)
    cibles: {} as Record<string, string>,
    audios: {} as Record<string, boolean>,
    cible_id: '',
    audio_requis: false,
    // Ligne « 📚 Devoirs à préparer » d'où vient ce devoir : cochée toute seule une fois le devoir envoyé (2026-10-08)
    source_task_id: '' as string,
    // 🕑 Idée 2 (rotation, 2026-10-27) : préparé à l'avance, visible par les élèves au début du prochain cours
    programme: false,
  });
  const [homeworkDraft, setHomeworkDraft] = useState<HomeworkDraft | null>(null);
  const [devoirToDelete, setDevoirToDelete] = useState<{ id: string; titre: string } | null>(null);
  const { askValidation, validationDialog } = useConfirmValidation();
  // Ouvert depuis un groupe : date à rendre = son prochain cours (vacances sautées, idée 2) et ses niveaux (idée 1)
  const { next: prochainCours, schedule: horaireGroupe } = useGroupCourse(groupeId);
  const { data: niveaux = [] } = useNiveaux(groupeId);
  // Idée 3 : consigne audio ; idée 4 : correction audio
  const [consigneAudio, setConsigneAudio] = useState<Blob | null>(null);
  const [correctionAudio, setCorrectionAudio] = useState<Blob | null>(null);
  const [enregistreurKey, setEnregistreurKey] = useState(0);
  // ✍️ Matières prêtes à compléter (2026-10-26) : une ligne par matière, il suffit d'écrire la consigne
  const [parMatiere, setParMatiere] = useState(true);
  const lignes = form.lignes;
  const setLignes = (f: (l: Record<string, string>) => Record<string, string>) => setForm((cur) => ({ ...cur, lignes: f(cur.lignes) }));
  const lignesRemplies = MATIERES.filter((m) => (lignes[m.type] || '').trim());

  useEffect(() => {
    const draft = loadDraft<HomeworkDraft>(DRAFT_KEY_HOMEWORK);
    const remplie = (d: HomeworkDraft) => !!d.titre?.trim() || Object.values(d.lignes || {}).some((v) => v.trim());
    if (!draft || !remplie(draft)) return;
    if (takeDraftResume(DRAFT_KEY_HOMEWORK)) {
      // Choix déjà fait dans le message d'ouverture de l'appli : on reprend directement
      setForm(prev => ({ ...prev, ...draft, student_ids: draft.student_ids ?? [], source_task_id: draft.source_task_id ?? '', etapes: draft.etapes ?? '', lignes: draft.lignes ?? {}, cibles: draft.cibles ?? {}, audios: draft.audios ?? {}, cible_id: draft.cible_id ?? '', audio_requis: draft.audio_requis ?? false, programme: draft.programme ?? false }));
      setShowForm(true);
    } else {
      setHomeworkDraft(draft);
    }
  }, []);

  useEffect(() => {
    if (!showForm || (!form.titre.trim() && !Object.values(form.lignes).some((v) => v.trim()))) return;
    saveDraft(DRAFT_KEY_HOMEWORK, form);
  }, [showForm, form]);

  // « Supprimer » le brouillon : il part dans la corbeille (Paramètres), jamais effacé directement
  const trashHomeworkDraft = async () => {
    const d = loadDraft<HomeworkDraft>(DRAFT_KEY_HOMEWORK);
    if (d && user) {
      const ok = await moveToTrash(user.id, 'draft', DRAFT_KEY_HOMEWORK, `Brouillon — nouveau devoir « ${d.titre.slice(0, 80)} »`, { key: DRAFT_KEY_HOMEWORK, data: d });
      if (!ok) { toast.error('Mise en corbeille impossible — le brouillon est conservé'); return; }
      toast.success('Brouillon mis dans la corbeille (Paramètres)');
    }
    clearDraft(DRAFT_KEY_HOMEWORK);
    setHomeworkDraft(null);
  };

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
      const { data } = await supabase.from('student_groups').select('id, name');
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

  // Create devoir
  const createDevoir = useMutation({
    mutationFn: async () => {
      // Par matière : un devoir par ligne remplie ; sinon le devoir détaillé du formulaire
      const items = parMatiere
        ? lignesRemplies.map((m) => ({ titre: (lignes[m.type] || '').trim(), type: m.type, cible: form.cibles[m.type] || '', audio: !!form.audios[m.type] }))
        : [{ titre: form.titre.trim(), type: form.type, cible: form.cible_id, audio: form.audio_requis }];
      if (!form.date_limite) throw new Error('Choisis la date à rendre 📅');
      consigneUrl.current = consigneAudio && user ? await deposerAudioProf(user.id, consigneAudio, 'consignes') : null;
      if (!items.length || items.some((it) => !it.titre)) throw new Error(parMatiere ? 'Écris au moins une consigne sur une ligne' : 'Le titre est obligatoire');
      const destinataires = new Set<string>();
      for (const it of items) (await creerUn(it.titre, it.type, it.cible, it.audio)).forEach((id) => destinataires.add(id));
      // 📓 Une seule notification par distribution (idée 4, texte choisi par Nadia)
      const ids = [...destinataires];
      const liste = items.map((it) => it.titre).join(' · ');
      if (ids.length && form.programme && heureVisible) {
        // Préparé à l'avance : la notification part à l'heure du cours (process-scheduled-notifications, toutes les 5 min)
        const p = (n: number) => String(n).padStart(2, '0');
        const jour = `${heureVisible.getFullYear()}-${p(heureVisible.getMonth() + 1)}-${p(heureVisible.getDate())}`;
        const { error } = await supabase.from('scheduled_notifications').insert({
          module: 'devoirs', message: liste, start_date: jour, end_date: jour,
          send_time: `${p(heureVisible.getHours())}:${p(heureVisible.getMinutes())}`, recipients: ids, is_active: true, created_by: user?.id,
        });
        if (error) toast.error("La notification de l'heure du cours n'a pas pu être programmée");
      } else if (ids.length) {
        sendPushNotification({ userIds: ids, title: '📓 Tes nouveaux devoirs sont prêts !', category: 'hw_new', body: liste, data: { url: '/?open=devoirs' } });
      }
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      toast.success(parMatiere && lignesRemplies.length > 1 ? `✅ ${lignesRemplies.length} devoirs assignés à ${count} élève(s) !` : `✅ Devoir assigné à ${count} élève(s) !`);
      clearDraft(DRAFT_KEY_HOMEWORK);
      setShowForm(false);
      setForm({ titre: '', type: 'recitation', description: '', lien_lecon: '', date_limite: '', assigned_to: 'all', group_id: '', student_id: '', group_ids: [] as string[], student_ids: [] as string[], source_task_id: '', etapes: '', lignes: {}, cibles: {}, audios: {}, cible_id: '', audio_requis: false, programme: false });
      setConsigneAudio(null); setEnregistreurKey((k) => k + 1);
    },
    onError: (err) => toast.error(err.message),
  });
  const consigneUrl = useRef<string | null>(null);

  /** Crée un devoir (titre + matière) pour les destinataires choisis ; renvoie le nombre d'élèves */
  const creerUn = async (titre: string, type: string, cible: string, audio: boolean): Promise<string[]> => {
    {
      const payload: TablesInsert<'devoirs'> = {
        titre, type,
        cible_module: cible ? type : null, cible_id: cible || null, audio_requis: audio,
        consigne_audio_url: consigneUrl.current,
        description: form.description || null,
        lien_lecon: form.lien_lecon || null,
        date_limite: form.date_limite || null,
        etapes: form.etapes.split('\n').map((l) => l.trim()).filter(Boolean),
        visible_a: form.programme && heureVisible ? heureVisible.toISOString() : null,
        assigned_to: form.assigned_to,
        created_by: user?.id,
      };
      if (form.assigned_to === 'group' && form.group_id) payload.group_id = form.group_id;
      if (form.assigned_to === 'student' && form.student_id) payload.student_id = form.student_id;

      // Determine recipients for push notification
      let destinataires: string[] = [];

      if (form.assigned_to === 'students' && form.student_ids.length > 0) {
        // Plusieurs élèves précis (2026-10-07) : un devoir par élève coché
        const insertResults = await Promise.all(
          form.student_ids.map(studentId =>
            supabase.from('devoirs').insert({ ...payload, assigned_to: 'student', student_id: studentId })
          )
        );
        const firstError = insertResults.find(r => r.error)?.error;
        if (firstError) throw firstError;
        destinataires = [...new Set(form.student_ids)];
      } else if (form.assigned_to === 'groups' && form.group_ids.length > 0) {
        // Insert one devoir per selected group
        const insertResults = await Promise.all(
          form.group_ids.map(groupId =>
            supabase.from('devoirs').insert({ ...payload, assigned_to: 'group', group_id: groupId })
          )
        );
        const firstError = insertResults.find(r => r.error)?.error;
        if (firstError) throw firstError;

        // Collect all recipients from all selected groups (deduplicated)
        const { data: membres } = await supabase
          .from('student_group_members')
          .select('user_id')
          .in('group_id', form.group_ids);
        if (membres) {
          const seen = new Set<string>();
          for (const m of membres) { if (!seen.has(m.user_id)) { seen.add(m.user_id); destinataires.push(m.user_id); } }
        }
      } else {
        const { error } = await supabase.from('devoirs').insert(payload);
        if (error) throw error;

        if (form.assigned_to === 'all') {
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('is_approved', true);
          if (allProfiles) destinataires = allProfiles.map(p => p.user_id);
        } else if (form.assigned_to === 'group' && form.group_id) {
          const { data: membres } = await supabase
            .from('student_group_members')
            .select('user_id')
            .eq('group_id', form.group_id);
          if (membres) destinataires = membres.map(m => m.user_id);
        } else if (form.assigned_to === 'student' && form.student_id) {
          destinataires = [form.student_id];
        }
      }

      // La ligne « 📚 Devoirs à préparer » d'origine est faite
      if (form.source_task_id) {
        const now = new Date().toISOString();
        await supabase.from('admin_tasks').update({ done: true, done_at: now, updated_at: now }).eq('id', form.source_task_id).eq('done', false);
      }

      return destinataires;
    }
  };

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
      const { error } = await supabase
        .from('devoirs_rendus')
        .update({ statut: 'a_refaire', commentaire_admin: commentaire || null,
          correction_audio_url: correctionAudio && user ? await deposerAudioProf(user.id, correctionAudio, 'corrections') : null })
        .eq('id', modalARefaire.renduId);
      if (error) throw error;

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
  const elevesVus = membresGroupe ? eleves.filter((e) => membresGroupe.has(e.user_id)) : eleves;
  const nomGroupe = groupeId ? groupes.find((g) => g.id === groupeId)?.name : null;
  // Dans le formulaire : élèves du groupe + ceux déjà choisis (un brouillon peut en contenir d'autres)
  const elevesFormulaire = membresGroupe
    ? eleves.filter((e) => membresGroupe.has(e.user_id) || e.user_id === form.student_id || form.student_ids.includes(e.user_id))
    : eleves;

  // Group devoirs by student
  const devoirsParEleve = elevesVus.map(eleve => {
    const devoirsEleve = devoirs.filter(d =>
      d.assigned_to === 'all' ||
      d.student_id === eleve.user_id ||
      (d.assigned_to === 'group' && !!d.group_id && memberships.some((m) => m.user_id === eleve.user_id && m.group_id === d.group_id))
    );
    return { eleve, devoirsEleve };
  });

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
  const [formApresDecisions, setFormApresDecisions] = useState(false);
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

  const ouvrirFormulaire = () => {
    if (showForm && (form.titre.trim() || Object.values(form.lignes).some((v) => v.trim()))) toast('📝 Brouillon gardé', { description: 'Tu le retrouveras en rouvrant « Nouveau devoir ».' });
    if (!showForm && groupeId && form.assigned_to === 'all' && !form.group_id) setForm((f) => ({ ...f, assigned_to: 'group', group_id: groupeId }));
    if (!showForm && !form.date_limite) {
      if (prochainCours) setForm((f) => ({ ...f, date_limite: toLocalInput(prochainCours) }));
      else { const d = new Date(); d.setHours(18, 0, 0, 0); do d.setDate(d.getDate() + 1); while (d.getDay() !== 3); const p = (n: number) => String(n).padStart(2, '0'); setForm((f) => ({ ...f, date_limite: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T18:00` })); }
    }
    setShowForm(!showForm);
  };
  const nouveauDevoir = () => {
    // Avant de donner de nouveaux devoirs : décider pour les anciens pas faits (demande de Nadia, 2026-10-27)
    if (!showForm && nonDecides.length) { setFormApresDecisions(true); setDecisionsOuvert(true); return; }
    ouvrirFormulaire();
  };
  const fermerDecisions = () => {
    setDecisionsOuvert(false);
    if (formApresDecisions) { setFormApresDecisions(false); if (!showForm) ouvrirFormulaire(); }
  };

  const toggleEleveRendu = (id: string) =>
    setElevesRendusOuverts(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
      </Button>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">📚 Devoirs</h2>
        <Button onClick={nouveauDevoir} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nouveau devoir <DraftDot draftKey="dinislam_homework" className="ml-1.5" />
        </Button>
      </div>

      {/* 💎 Chemin de la semaine automatique (2026-10-08) */}
      <WeeklyProgramAdmin />

      {/* Create form */}
      {showForm && (
        <Card className="border-dashed border-2 border-primary/30">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">✏️ Créer un devoir</p>
            <div className="flex rounded-xl bg-muted p-1">
              <button type="button" onClick={() => setParMatiere(true)} aria-pressed={parMatiere}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${parMatiere ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}>✍️ Par matière</button>
              <button type="button" onClick={() => setParMatiere(false)} aria-pressed={!parMatiere}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${!parMatiere ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}>📝 Devoir détaillé</button>
            </div>
            {parMatiere ? (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Écris la consigne sur la ligne de la matière : un devoir (et un diamant 💎) par ligne remplie. Les lignes vides sont ignorées.</p>
                {MATIERES.map((m) => {
                  const rempli = !!(lignes[m.type] || '').trim();
                  return (
                    <div key={m.type} data-ligne className={`rounded-xl px-2 py-1.5 ${rempli ? 'bg-sky-50 dark:bg-sky-950/30' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-[7.5rem] shrink-0 text-sm font-semibold [overflow-wrap:anywhere]">{m.emoji} {m.label}</span>
                        <Input value={lignes[m.type] || ''} placeholder={`ex. ${m.exemple}`} aria-label={`Devoir de ${m.label}`}
                          onChange={(e) => setLignes((l) => ({ ...l, [m.type]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget.closest('[data-ligne]')?.nextElementSibling?.querySelector('input') as HTMLInputElement | null)?.focus(); } }} />
                      </div>
                      {/* 📍 Leçon / sourate / nom… ouvert par « Commencer mon travail » · 🎙️ audio demandé */}
                      {rempli && (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 ps-[7.5rem]">
                          <CibleSelect type={m.type} value={form.cibles[m.type] || ''} onChange={(v) => setForm((f) => ({ ...f, cibles: { ...f.cibles, [m.type]: v } }))} />
                          <label className="flex items-center gap-1.5 text-xs font-semibold">
                            <input type="checkbox" checked={!!form.audios[m.type]} onChange={(e) => setForm((f) => ({ ...f, audios: { ...f.audios, [m.type]: e.target.checked } }))} className="h-4 w-4 accent-orange-500" />
                            🎙️ audio demandé
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (<>
            <Input placeholder="Titre du devoir *" value={form.titre}
              onChange={e => setForm({ ...form, titre: e.target.value })} />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full border rounded-xl p-3 mb-3 text-sm bg-white" style={{ position: 'relative', zIndex: 300 }}>
              {TYPE_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <div className="flex flex-wrap items-center gap-2">
              <CibleSelect type={form.type} value={form.cible_id} onChange={(v) => setForm({ ...form, cible_id: v })} />
              <label className="flex items-center gap-1.5 text-xs font-semibold">
                <input type="checkbox" checked={form.audio_requis} onChange={(e) => setForm({ ...form, audio_requis: e.target.checked })} className="h-4 w-4 accent-orange-500" />
                🎙️ audio demandé
              </label>
            </div>
            <Textarea placeholder="Description (optionnel)" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            <Input placeholder="Lien vers la leçon (optionnel)" value={form.lien_lecon}
              onChange={e => setForm({ ...form, lien_lecon: e.target.value })} />
            <div className="space-y-1 mb-3">
              <label className="text-xs font-medium text-muted-foreground">💎 Étapes (optionnel, une par ligne) : le diamant de l'élève se remplit à chaque étape cochée</label>
              <Textarea placeholder={'Ex. :\nLigne 1\nLigne 2\nLigne 3'} value={form.etapes} rows={3}
                onChange={e => setForm({ ...form, etapes: e.target.value })} />
            </div>
            </>)}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">📅 Date à rendre * (pas de cours pendant les vacances : choisis la bonne date)</label>
              <Input type="datetime-local" value={form.date_limite}
                onChange={e => setForm({ ...form, date_limite: e.target.value })} />
              {form.date_limite && (
                <p className="text-xs text-muted-foreground">Rappel aux élèves chaque jour à 18 h, et la veille de la date à rendre.</p>
              )}
            </div>
            {/* 🕑 Idée 2 : préparer à l'avance, les élèves les voient au début du prochain cours */}
            <label className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 cursor-pointer ${form.programme ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/30' : 'border-border'}`}>
              <input type="checkbox" checked={form.programme} className="mt-0.5 h-4 w-4 accent-sky-600"
                onChange={(e) => {
                  const on = e.target.checked;
                  // Visibles au début du cours → à rendre pour le cours d'après
                  setForm((f) => ({ ...f, programme: on, date_limite: on ? toLocalInput(courseAfter({ group_id: '', ...horaireVu }, holidays, heureVisible)) : (prochainCours ? toLocalInput(prochainCours) : f.date_limite) }));
                }} />
              <span className="text-xs">
                <b>🕑 Préparer à l'avance</b> : les élèves verront ces devoirs au début du cours, {courseLabel(heureVisible)}, et recevront « 📓 Tes nouveaux devoirs sont prêts ! » à ce moment-là.
                {!horaireGroupe && <span className="block text-amber-700 dark:text-amber-400 font-semibold">⚠️ Heure du groupe pas réglée : mercredi 14 h par défaut.</span>}
              </span>
            </label>
            <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value, group_id: '', group_ids: [], student_ids: [] })}
              className="w-full border rounded-xl p-3 mb-3 text-sm bg-white" style={{ position: 'relative', zIndex: 300 }}>
              <option value="all">👥 Tous les élèves</option>
              <option value="group">👨‍👩‍👧 Un groupe</option>
              <option value="groups">👨‍👩‍👧 Plusieurs groupes</option>
              <option value="student">👤 Un élève</option>
              <option value="students">👥 Plusieurs élèves</option>
            </select>
            {niveaux.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-muted-foreground">🎚️ Niveau :</span>
                {niveaux.map((n) => {
                  const actif = form.assigned_to === 'students' && form.student_ids.length === n.member_ids.length && n.member_ids.every((i) => form.student_ids.includes(i));
                  return (
                    <button key={n.id} type="button" aria-pressed={actif} disabled={!n.member_ids.length}
                      onClick={() => setForm((f) => ({ ...f, assigned_to: 'students', student_ids: [...n.member_ids], group_id: '', group_ids: [] }))}
                      className={`rounded-full px-3 py-1 text-xs font-bold border ${actif ? 'bg-[#2457a5] text-white border-[#2457a5]' : 'bg-card'} disabled:opacity-40`}>
                      {n.name} ({n.member_ids.length})
                    </button>
                  );
                })}
              </div>
            )}
            {form.assigned_to === 'group' && (
              <select value={form.group_id} onChange={e => setForm({ ...form, group_id: e.target.value })}
                className="w-full border rounded-xl p-3 mb-3 text-sm bg-white" style={{ position: 'relative', zIndex: 300 }}>
                <option value="">Sélectionner un groupe...</option>
                {groupes.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
            {form.assigned_to === 'groups' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Sélectionner les groupes :</p>
                <div className="flex flex-wrap gap-2">
                  {groupes.map((g) => {
                    const selected = form.group_ids.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          group_ids: selected
                            ? prev.group_ids.filter(id => id !== g.id)
                            : [...prev.group_ids, g.id],
                        }))}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {selected ? '✓ ' : ''}{g.name}
                      </button>
                    );
                  })}
                </div>
                {form.group_ids.length > 0 && (
                  <p className="text-xs text-primary font-medium">{form.group_ids.length} groupe(s) sélectionné(s)</p>
                )}
              </div>
            )}
            {form.assigned_to === 'student' && (
              <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}
                className="w-full border rounded-xl p-3 mb-3 text-sm bg-white" style={{ position: 'relative', zIndex: 300 }}>
                <option value="">Sélectionner un élève...</option>
                {elevesFormulaire.map((e) => (
                  <option key={e.user_id} value={e.user_id}>{e.full_name || 'Sans nom'}</option>
                ))}
              </select>
            )}
            {form.assigned_to === 'students' && (
              <div className="space-y-2 mb-3">
                <p className="text-xs text-muted-foreground font-medium">Sélectionner les élèves :</p>
                <div className="flex flex-wrap gap-2">
                  {elevesFormulaire.map((e) => {
                    const selected = form.student_ids.includes(e.user_id);
                    return (
                      <button
                        key={e.user_id}
                        type="button"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          student_ids: selected ? prev.student_ids.filter(id => id !== e.user_id) : [...prev.student_ids, e.user_id],
                        }))}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                          selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {selected ? '✓ ' : ''}{e.full_name || 'Sans nom'}
                      </button>
                    );
                  })}
                </div>
                {form.student_ids.length > 0 && (
                  <p className="text-xs text-primary font-medium">{form.student_ids.length} élève(s) sélectionné(s)</p>
                )}
              </div>
            )}
            <EnregistreurAudio key={enregistreurKey} label="Consigne audio pour les élèves (facultatif)" onChange={setConsigneAudio} />
            <Button onClick={() => createDevoir.mutate()} disabled={(parMatiere ? lignesRemplies.length === 0 : !form.titre) || !form.date_limite || createDevoir.isPending || (form.assigned_to === 'groups' && form.group_ids.length === 0) || (form.assigned_to === 'students' && form.student_ids.length === 0)} className="w-full">
              {parMatiere && lignesRemplies.length > 1 ? `✅ Assigner les ${lignesRemplies.length} devoirs` : '✅ Assigner le devoir'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Devoirs grouped by student */}
      <div>
        <h3 className="font-semibold text-foreground mb-2">
          Devoirs assignés ({membresGroupe ? new Set(devoirsParEleve.flatMap(({ devoirsEleve }) => devoirsEleve.map((d) => d.id))).size : devoirs.length})
        </h3>
        {nomGroupe && <p className="text-xs text-muted-foreground mb-2">👥 Seulement les élèves du groupe « {nomGroupe} »</p>}
        {/* 🔄 Rotation à l'heure du cours (2026-10-27) : onglets, « À rattraper », bilan, historique. Depuis un groupe : TOUS ses élèves */}
        <RotationProf
          eleves={devoirsParEleve.filter(({ devoirsEleve }) => membresGroupe || devoirsEleve.length > 0).map(({ eleve }) => eleve)}
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
          onDonner={nouveauDevoir}
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
                        {!r.audio_url && r.statut === 'rendu' && (
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">✅ L'élève a validé son devoir (sans audio demandé)</p>
                        )}
                        {r.audio_url && (
                          <div className="mb-2">
                            <audio
                              src={r.audio_url}
                              controls
                              preload="auto"
                              style={{ width: '100%', height: '40px', borderRadius: '12px' }}
                            />
                          </div>
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
                              onClick={() => setModalARefaire({ renduId: r.id, studentId: r.student_id, devoirTitre: r.devoir_titre })}>
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

      {/* Dialog récupération brouillon devoir */}
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

      <AlertDialog open={!!homeworkDraft} onOpenChange={(open) => { if (!open) setHomeworkDraft(null); }}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>⏳ Action inachevée</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tu as commencé à créer un devoir :{" "}
              <span className="font-semibold text-foreground">« {homeworkDraft?.titre} »</span>
              <br />Souhaites-tu continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 flex-row justify-end">
            <button
              onClick={trashHomeworkDraft}
              className="px-4 py-2 text-sm rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
            >
              Supprimer
            </button>
            <button
              onClick={() => {
                if (!homeworkDraft) return;
                setForm({ ...homeworkDraft, group_ids: homeworkDraft.group_ids ?? [], student_ids: homeworkDraft.student_ids ?? [], source_task_id: homeworkDraft.source_task_id ?? '', etapes: homeworkDraft.etapes ?? '', lignes: homeworkDraft.lignes ?? {}, cibles: homeworkDraft.cibles ?? {}, audios: homeworkDraft.audios ?? {}, cible_id: homeworkDraft.cible_id ?? '', audio_requis: homeworkDraft.audio_requis ?? false, programme: homeworkDraft.programme ?? false });
                setShowForm(true);
                setHomeworkDraft(null);
              }}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continuer
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHomework;
