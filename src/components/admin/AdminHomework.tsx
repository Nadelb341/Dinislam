import { useState, useEffect } from 'react';
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
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import type { TablesInsert } from '@/integrations/supabase/types';

const DRAFT_KEY_HOMEWORK = 'dinislam_homework';
type HomeworkDraft = { titre: string; type: string; description: string; lien_lecon: string; date_limite: string; assigned_to: string; group_id: string; student_id: string; group_ids: string[]; student_ids?: string[]; source_task_id?: string; etapes?: string; lignes?: Record<string, string>; cibles?: Record<string, string>; audios?: Record<string, boolean>; cible_id?: string; audio_requis?: boolean };

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
  const [elevesOuverts, setElevesOuverts] = useState<Record<string, boolean>>({});
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
  });
  const [homeworkDraft, setHomeworkDraft] = useState<HomeworkDraft | null>(null);
  const [devoirToDelete, setDevoirToDelete] = useState<{ id: string; titre: string } | null>(null);
  const { askValidation, validationDialog } = useConfirmValidation();
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
      setForm(prev => ({ ...prev, ...draft, student_ids: draft.student_ids ?? [], source_task_id: draft.source_task_id ?? '', etapes: draft.etapes ?? '', lignes: draft.lignes ?? {}, cibles: draft.cibles ?? {}, audios: draft.audios ?? {}, cible_id: draft.cible_id ?? '', audio_requis: draft.audio_requis ?? false }));
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

  // Fetch approved students
  const { data: eleves = [] } = useQuery({
    queryKey: ['admin-eleves-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name')
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
      if (!items.length || items.some((it) => !it.titre)) throw new Error(parMatiere ? 'Écris au moins une consigne sur une ligne' : 'Le titre est obligatoire');
      let total = 0;
      for (const it of items) total = await creerUn(it.titre, it.type, it.cible, it.audio);
      return total;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      toast.success(parMatiere && lignesRemplies.length > 1 ? `✅ ${lignesRemplies.length} devoirs assignés à ${count} élève(s) !` : `✅ Devoir assigné à ${count} élève(s) !`);
      clearDraft(DRAFT_KEY_HOMEWORK);
      setShowForm(false);
      setForm({ titre: '', type: 'recitation', description: '', lien_lecon: '', date_limite: '', assigned_to: 'all', group_id: '', student_id: '', group_ids: [] as string[], student_ids: [] as string[], source_task_id: '', etapes: '', lignes: {}, cibles: {}, audios: {}, cible_id: '', audio_requis: false });
    },
    onError: (err) => toast.error(err.message),
  });

  /** Crée un devoir (titre + matière) pour les destinataires choisis ; renvoie le nombre d'élèves */
  const creerUn = async (titre: string, type: string, cible: string, audio: boolean): Promise<number> => {
    {
      const payload: TablesInsert<'devoirs'> = {
        titre, type,
        cible_module: cible ? type : null, cible_id: cible || null, audio_requis: audio,
        description: form.description || null,
        lien_lecon: form.lien_lecon || null,
        date_limite: form.date_limite || null,
        etapes: form.etapes.split('\n').map((l) => l.trim()).filter(Boolean),
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

      if (destinataires.length > 0) {
        sendPushNotification({
          userIds: destinataires,
          title: '📚 {prenom}, nouveau devoir !', category: 'hw_new',
          body: `Nouveau devoir : "${titre}" — à rendre bientôt`,
          data: { url: '/?open=devoirs' },
        });
      }

      // La ligne « 📚 Devoirs à préparer » d'origine est faite
      if (form.source_task_id) {
        const now = new Date().toISOString();
        await supabase.from('admin_tasks').update({ done: true, done_at: now, updated_at: now }).eq('id', form.source_task_id).eq('done', false);
      }

      return destinataires.length;
    }
  };

  // Delete devoir
  const deleteDevoir = useMutation({
    mutationFn: async (id: string) => {
      const devoir = devoirs.find((d) => d.id === id);
      // Corbeille d'abord : si elle échoue, rien n'est supprimé
      if (devoir && user?.id) {
        // Les audios rendus et les cases « J'ai travaillé » partent avec le devoir (suppression en cascade) : gardés avec lui dans la corbeille
        const [{ data: checksRows }, { data: rendusRows }, { data: stepsRows }] = await Promise.all([
          supabase.from('devoir_checks').select('*').eq('devoir_id', id),
          supabase.from('devoirs_rendus').select('*').eq('devoir_id', id),
          supabase.from('devoir_steps').select('*').eq('devoir_id', id),
        ]);
        const children = [
          ...(rendusRows?.length ? [{ table: 'devoirs_rendus', rows: rendusRows }] : []),
          ...(checksRows?.length ? [{ table: 'devoir_checks', rows: checksRows }] : []),
          ...(stepsRows?.length ? [{ table: 'devoir_steps', rows: stepsRows }] : []),
        ];
        // Copie = la vraie ligne de la table (sans les noms ajoutés pour l'affichage, sinon la restauration échoue)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        .update({ statut: 'a_refaire', commentaire_admin: commentaire || null })
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
    },
  });

  // Group devoirs by student
  const devoirsParEleve = eleves.map(eleve => {
    const devoirsEleve = devoirs.filter(d =>
      d.assigned_to === 'all' ||
      d.student_id === eleve.user_id ||
      (d.assigned_to === 'group' && !!d.group_id && memberships.some((m) => m.user_id === eleve.user_id && m.group_id === d.group_id))
    );
    const rendusEleve = rendus.filter(r => r.student_id === eleve.user_id);
    const aRefaire = rendusEleve.some(r => r.statut === 'a_refaire');
    const enAttente = rendusEleve.some(r => r.statut === 'rendu');
    const aJour = devoirsEleve.length > 0 &&
      rendusEleve.filter(r => r.statut === 'corrige').length >= devoirsEleve.length;

    return { eleve, devoirsEleve, rendusEleve, aRefaire, enAttente, aJour };
  });

  const couleurCarte = (item: { aRefaire: boolean; enAttente: boolean; aJour: boolean }) => {
    if (item.aRefaire) return 'border-destructive bg-destructive/5';
    if (item.enAttente) return 'border-orange-400 bg-orange-50 dark:bg-orange-950/20';
    if (item.aJour) return 'border-green-400 bg-green-50 dark:bg-green-950/20';
    return 'border-border bg-muted/30';
  };

  const toggleEleve = (id: string) =>
    setElevesOuverts(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleEleveRendu = (id: string) =>
    setElevesRendusOuverts(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
      </Button>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">📚 Devoirs</h2>
        <Button onClick={() => { if (showForm && (form.titre.trim() || Object.values(form.lignes).some((v) => v.trim()))) toast('📝 Brouillon gardé', { description: 'Tu le retrouveras en rouvrant « Nouveau devoir ».' }); if (!showForm && groupeId && form.assigned_to === 'all' && !form.group_id) setForm((f) => ({ ...f, assigned_to: 'group', group_id: groupeId })); if (!showForm && !form.date_limite) { const d = new Date(); d.setHours(18, 0, 0, 0); do d.setDate(d.getDate() + 1); while (d.getDay() !== 3); const p = (n: number) => String(n).padStart(2, '0'); setForm((f) => ({ ...f, date_limite: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T18:00` })); } setShowForm(!showForm); }} size="sm">
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
                <p className="text-xs text-muted-foreground">Les élèves seront rappelés toutes les 2h jusqu'au rendu.</p>
              )}
            </div>
            <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value, group_id: '', group_ids: [], student_ids: [] })}
              className="w-full border rounded-xl p-3 mb-3 text-sm bg-white" style={{ position: 'relative', zIndex: 300 }}>
              <option value="all">👥 Tous les élèves</option>
              <option value="group">👨‍👩‍👧 Un groupe</option>
              <option value="groups">👨‍👩‍👧 Plusieurs groupes</option>
              <option value="student">👤 Un élève</option>
              <option value="students">👥 Plusieurs élèves</option>
            </select>
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
                {eleves.map((e) => (
                  <option key={e.user_id} value={e.user_id}>{e.full_name || 'Sans nom'}</option>
                ))}
              </select>
            )}
            {form.assigned_to === 'students' && (
              <div className="space-y-2 mb-3">
                <p className="text-xs text-muted-foreground font-medium">Sélectionner les élèves :</p>
                <div className="flex flex-wrap gap-2">
                  {eleves.map((e) => {
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
            <Button onClick={() => createDevoir.mutate()} disabled={(parMatiere ? lignesRemplies.length === 0 : !form.titre) || !form.date_limite || createDevoir.isPending || (form.assigned_to === 'groups' && form.group_ids.length === 0) || (form.assigned_to === 'students' && form.student_ids.length === 0)} className="w-full">
              {parMatiere && lignesRemplies.length > 1 ? `✅ Assigner les ${lignesRemplies.length} devoirs` : '✅ Assigner le devoir'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Devoirs grouped by student */}
      <div>
        <h3 className="font-semibold text-foreground mb-2">
          Devoirs assignés ({devoirs.length})
        </h3>
        {devoirsParEleve.filter(({ devoirsEleve }) => devoirsEleve.length > 0).map(({ eleve, devoirsEleve, aRefaire, enAttente, aJour }) => {
          const ouvert = elevesOuverts[eleve.user_id];
          return (
            <Card key={eleve.user_id} className={`mb-2 overflow-hidden border-2 ${couleurCarte({ aRefaire, enAttente, aJour })}`}>
              <button
                onClick={() => toggleEleve(eleve.user_id)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-foreground text-sm">
                  👤 {eleve.full_name} ({devoirsEleve.length} devoir{devoirsEleve.length > 1 ? 's' : ''})
                </span>
                {ouvert ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {ouvert && (
                <div className="px-3 pb-3 space-y-2">
                  {devoirsEleve.map((d) => (
                    <div key={d.id} className="bg-background rounded-xl p-3 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{d.titre}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.date_limite ? `📅 ${new Date(d.date_limite).toLocaleDateString('fr-FR')}` : 'Sans date limite'}
                        </p>
                        {(() => {
                          // État du devoir pour cet élève (2026-10-26) : envoyé par « Je valide mon devoir », puis validé par toi
                          const r = rendus.find((x) => x.devoir_id === d.id && x.student_id === eleve.user_id);
                          return r?.statut === 'corrige'
                            ? <p className="mt-1 inline-block rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 px-2 py-0.5 text-[11px] font-bold">✅ Validé · diamant doré</p>
                            : r?.statut === 'rendu'
                              ? <p className="mt-1 inline-block rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200 px-2 py-0.5 text-[11px] font-bold">🟠 Envoyé le {new Date(r.rendu_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · à valider</p>
                              : r?.statut === 'a_refaire'
                                ? <p className="mt-1 inline-block rounded-full bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200 px-2 py-0.5 text-[11px] font-bold">🔄 À refaire</p>
                                : <p className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">⏳ Pas encore envoyé</p>;
                        })()}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => setDevoirToDelete({ id: d.id, titre: d.titre })} aria-label="Supprimer ce devoir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Rendus grouped by student */}
      <div>
        <h3 className="font-semibold text-foreground mb-2">
          Rendus à corriger ({rendus.filter((r) => r.statut === 'rendu').length})
        </h3>
        {(() => {
          // Group rendus by student_id directly from rendus data
          const rendusParEleve: Record<string, { name: string; items: (typeof rendus)[number][] }> = {};
          rendus.forEach((r) => {
            if (!rendusParEleve[r.student_id]) {
              rendusParEleve[r.student_id] = { name: r.student_name || 'Inconnu', items: [] };
            }
            rendusParEleve[r.student_id].items.push(r);
          });

          if (Object.keys(rendusParEleve).length === 0) {
            return <p className="text-muted-foreground text-sm text-center py-4">Aucun rendu</p>;
          }

          return Object.entries(rendusParEleve).map(([studentId, { name, items }]) => {
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
              <Card key={studentId} className={`mb-2 overflow-hidden border-2 ${colorClass}`}>
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
                setForm({ ...homeworkDraft, group_ids: homeworkDraft.group_ids ?? [], student_ids: homeworkDraft.student_ids ?? [], source_task_id: homeworkDraft.source_task_id ?? '', etapes: homeworkDraft.etapes ?? '', lignes: homeworkDraft.lignes ?? {}, cibles: homeworkDraft.cibles ?? {}, audios: homeworkDraft.audios ?? {}, cible_id: homeworkDraft.cible_id ?? '', audio_requis: homeworkDraft.audio_requis ?? false });
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
