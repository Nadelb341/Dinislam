import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useHolidays } from '@/hooks/useGroupCourse';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { sendPushNotification } from '@/lib/pushHelper';
import { cn, errorMessage } from '@/lib/utils';
import { matiereOf } from '@/lib/devoirMatieres';
import {
  calculerSnapshot, chargerDonneesBilan, guideAuto, messagesEnfant, periodeBilan, phrasesProposees, prochaineSourate, tendance, titrePeriode,
  type BilanGuide, type BilanSnapshot, type BilanTraduction, type DonneesBilan,
} from '@/lib/bilanTrimestriel';
import { capturerPng, fabriquerPdf, nomFichier, partagerBilan } from '@/lib/bilanExport';
import { BilanVue } from './BilanVue';
import { clearDraft, loadDraft } from '@/hooks/useDraftRecovery';

const GUIDE_TITRES: { k: keyof BilanGuide; t: string }[] = [
  { k: 'forts', t: '🌟 Points forts' }, { k: 'travailler', t: '🎯 À travailler' }, { k: 'maison', t: '🏠 À la maison' }, { k: 'objectif', t: '🚀 Objectif du prochain trimestre' },
];
const frJour = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);

/**
 * 📊 Bilan trimestriel (2026-10-28, carte du bouclier sous « Brouillons ») : bilan du groupe (idée K), bilan de chaque élève
 * (maquette validée : tableau de bord + appréciation + mot pour l'enfant + guide + 3 boutons), phrases proposées (B),
 * note sur 20 en option, arabe classique ou darija (M), envoi : Espace parents + image + PDF + lien (A + C), accusé de lecture.
 */
export default function BilanTrimestriel({ onBack, groupeInitial }: { onBack: () => void; groupeInitial?: string | null }) {
  const { data: holidays = [], isSuccess: vacancesOk } = useHolidays();
  const periode = useMemo(() => periodeBilan(holidays), [holidays]);
  const [groupe, setGroupe] = useState<string | null>(groupeInitial ?? null);
  const [eleveOuvert, setEleveOuvert] = useState<string | null>(null);

  const { data: groupes = [] } = useQuery({
    queryKey: ['bilan-trimestriel', 'groupes'],
    queryFn: async () => {
      const [{ data: g }, { data: m }] = await Promise.all([
        supabase.from('student_groups').select('id, name').order('name'),
        supabase.from('student_group_members').select('group_id, user_id'),
      ]);
      return (g || []).map((x) => ({ ...x, membres: (m || []).filter((y) => y.group_id === x.id).map((y) => y.user_id) }));
    },
  });
  useEffect(() => { if (!groupe && groupes.length) setGroupe(groupes[0].id); }, [groupe, groupes]);
  const membres = useMemo(() => groupes.find((g) => g.id === groupe)?.membres ?? [], [groupes, groupe]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['bilan-trimestriel', 'donnees', groupe, membres.join(','), periode.debut],
    enabled: vacancesOk && membres.length > 0,
    queryFn: () => chargerDonneesBilan(membres, periode.debut),
  });

  const lignes = useMemo(() => {
    if (!data) return [];
    return membres.map((id) => {
      const snap = calculerSnapshot(id, data, holidays, periode);
      const report = data.reports.find((r) => r.student_id === id && r.period_label === periode.label) ?? null;
      const lus = report ? data.reads.filter((r) => r.report_id === report.id) : [];
      return { id, nom: data.profiles.find((p) => p.user_id === id)?.full_name || 'Élève', snap, report, lus };
    }).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [data, membres, holidays, periode]);

  // Idée K : bilan du groupe
  const groupeStats = useMemo(() => {
    const sum = (f: (s: BilanSnapshot) => number) => lignes.reduce((n, l) => n + f(l.snap), 0);
    const parMatiere = new Map<string, { f: number; d: number }>();
    lignes.forEach((l) => l.snap.matieres.forEach((m) => { const x = parMatiere.get(m.type) ?? { f: 0, d: 0 }; parMatiere.set(m.type, { f: x.f + m.faits, d: x.d + m.donnes }); }));
    const difficile = [...parMatiere.entries()].filter(([, v]) => v.d >= 2).sort(([, a], [, b]) => a.f / a.d - b.f / b.d)[0];
    return {
      presence: pct(sum((s) => s.presence.presents + s.presence.retards), sum((s) => s.presence.cours)),
      devoirs: pct(sum((s) => s.devoirs.faits), sum((s) => s.devoirs.donnes)),
      difficile: difficile ? matiereOf(difficile[0]) : null,
      envoyes: lignes.filter((l) => l.report?.sent_at).length,
    };
  }, [lignes]);

  // Idée A : à 7 jours des vacances, les bilans sont prêts à relire
  const joursAvant = periode.prochaines ? Math.ceil((new Date(`${periode.prochaines.start_date}T00:00:00`).getTime() - Date.now()) / 86400000) : null;
  const ouvert = lignes.find((l) => l.id === eleveOuvert) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-extrabold [overflow-wrap:anywhere]">📊 Bilan trimestriel</h2>
          <p className="text-sm text-violet-700 dark:text-violet-300 [overflow-wrap:anywhere]">
            {titrePeriode(periode.label, periode.fin).replace(/^./, (c) => c.toUpperCase())} · du {frJour(periode.debut)} au {frJour(periode.fin)}
          </p>
        </div>
      </div>

      {joursAvant !== null && joursAvant >= 0 && joursAvant <= 7 && periode.prochaines && (
        <div className="rounded-2xl bg-amber-100 dark:bg-amber-950/40 px-3 py-2.5 text-sm font-extrabold text-amber-900 dark:text-amber-100">
          🔔 Les {periode.prochaines.label.toLowerCase()} commencent le {frJour(periode.prochaines.start_date)} : {lignes.length - groupeStats.envoyes} bilan{lignes.length - groupeStats.envoyes > 1 ? 's' : ''} à relire et envoyer dans ce groupe.
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {groupes.map((g) => (
          <button key={g.id} type="button" aria-pressed={g.id === groupe} onClick={() => { setGroupe(g.id); setEleveOuvert(null); }}
            className={cn('rounded-full border px-3 py-1.5 text-sm font-bold', g.id === groupe ? 'bg-[#2457a5] text-white border-[#2457a5]' : 'bg-card')}>{g.name}</button>
        ))}
      </div>

      {!membres.length ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">👥 Ce groupe n'a encore aucun élève.</p>
      ) : error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 p-3 text-sm">😕 Le bilan n'a pas pu être calculé : {errorMessage(error)}</p>
      ) : isLoading || !data ? (
        <p className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Calcul des bilans…</p>
      ) : (
        <>
          <section className="rounded-2xl border border-violet-200 dark:border-violet-900 bg-gradient-to-br from-violet-50 to-sky-50 dark:from-violet-950/30 dark:to-sky-950/30 p-3 space-y-3">
            <h3 className="text-sm font-extrabold text-violet-900 dark:text-violet-100">👥 Bilan du groupe</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Tuile v={groupeStats.presence === null ? '—' : `${groupeStats.presence} %`} l="présence du groupe" cls="bg-sky-100/80 dark:bg-sky-950/50" />
              <Tuile v={groupeStats.devoirs === null ? '—' : `${groupeStats.devoirs} %`} l="devoirs faits" cls="bg-emerald-100/80 dark:bg-emerald-950/50" />
              <Tuile v={groupeStats.difficile ? `${groupeStats.difficile.emoji} ${groupeStats.difficile.label}` : '—'} l="matière la plus difficile" cls="bg-amber-100/80 dark:bg-amber-950/50" petit />
              <Tuile v={`${groupeStats.envoyes} / ${lignes.length}`} l="bilans envoyés" cls="bg-violet-100/80 dark:bg-violet-950/50" />
            </div>
          </section>

          <section className="grid gap-2 md:grid-cols-2">
            {lignes.map((l) => {
              const t = tendance(l.snap);
              return (
                <button key={l.id} type="button" onClick={() => setEleveOuvert(l.id)}
                  className="flex items-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-2.5 text-left hover:border-violet-300">
                  <span className="flex-1 min-w-0">
                    <b className="block text-sm [overflow-wrap:anywhere]">{l.nom}</b>
                    <span className="block text-[11px] text-muted-foreground">🙋 {l.snap.presence.pct ?? '—'}{l.snap.presence.pct !== null ? ' %' : ''} · 📚 {l.snap.devoirs.faits}/{l.snap.devoirs.donnes}{l.lus.length ? ` · 👀 lu par ${l.lus.map((x) => x.label).join(' et ')}` : ''}</span>
                  </span>
                  {t === 'decroche' && <span className="shrink-0 rounded-full bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200 px-2 py-0.5 text-[11px] font-extrabold">📉 décroche</span>}
                  {t === 'progresse' && <span className="shrink-0 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200 px-2 py-0.5 text-[11px] font-extrabold">📈 progresse</span>}
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold', l.report?.sent_at ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200')}>
                    {l.report?.sent_at ? '✅ envoyé' : '✏️ à relire'}
                  </span>
                </button>
              );
            })}
          </section>
        </>
      )}

      {ouvert && data && (
        <EditeurBilan key={ouvert.id} studentId={ouvert.id} nom={ouvert.nom} snap={ouvert.snap} data={data} periode={periode}
          report={ouvert.report} lus={ouvert.lus} onClose={() => setEleveOuvert(null)} />
      )}
    </div>
  );
}

function Tuile({ v, l, cls, petit }: { v: string; l: string; cls: string; petit?: boolean }) {
  return (
    <div className={cn('rounded-xl p-2.5 min-w-0', cls)}>
      <p className={cn('font-extrabold [overflow-wrap:anywhere]', petit ? 'text-sm' : 'text-xl tabular-nums')}>{v}</p>
      <p className="text-[11px] font-bold text-muted-foreground leading-tight">{l}</p>
    </div>
  );
}

type Report = DonneesBilan['reports'][number];

function EditeurBilan({ studentId, nom, snap, data, periode, report, lus, onClose }: {
  studentId: string; nom: string; snap: BilanSnapshot; data: DonneesBilan; periode: { debut: string; fin: string; label: string };
  report: Report | null; lus: { label: string; read_at: string }[]; onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { askValidation, validationDialog } = useConfirmValidation();
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  const profil = data.profiles.find((p) => p.user_id === studentId);
  const fille = profil?.gender === 'fille';
  const prochaine = prochaineSourate(snap, data.sourateInfo);

  // Brouillon de l'ancien écran « 📈 Bilans » (même période) : repris ici, rien n'est perdu
  const [ancien] = useState(() => {
    const d = loadDraft<{ period?: string; note?: string; appreciation?: string; motivation?: string }>(`dinislam_bilan_${studentId}`);
    return d && d.period === periode.label ? d : null;
  });
  useEffect(() => { if (ancien) { clearDraft(`dinislam_bilan_${studentId}`); toast('📝 Brouillon de l\'ancien écran repris'); } }, [ancien, studentId]);
  const [appreciation, setAppreciation] = useState(report?.appreciation || ancien?.appreciation || '');
  const [motivation, setMotivation] = useState(report?.motivation || ancien?.motivation || '');
  const [avecNote, setAvecNote] = useState(!!report?.show_note || report?.note != null || !!ancien?.note);
  const [note, setNote] = useState(report?.note != null ? String(report.note).replace('.', ',') : ancien?.note ?? '');
  const [guide, setGuide] = useState<BilanGuide>(report?.guide ?? guideAuto(snap, fille, prochaine));
  const [arabe, setArabe] = useState<'' | 'fusha' | 'darija'>((report?.langue_ar ?? profil?.bilan_arabe ?? '') as '' | 'fusha' | 'darija');
  const [traduction, setTraduction] = useState<BilanTraduction | null>(report?.traduction ?? null);
  const [traduisant, setTraduisant] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const exportFr = useRef<HTMLDivElement>(null);
  const exportAr = useRef<HTMLDivElement>(null);
  const noteNombre = (() => { const n = Number(note.replace(',', '.')); return note.trim() && Number.isFinite(n) && n >= 0 && n <= 20 ? Math.round(n * 10) / 10 : null; })();

  // 💾 Enregistrement automatique (brouillon en base, rien n'est perdu si l'appli se ferme)
  const premier = useRef(true);
  const sauver = useMutation({
    mutationFn: async (extra: Record<string, unknown> = {}) => {
      const { error } = await supabase.from('student_reports').upsert({
        student_id: studentId, period_label: periode.label, period_start: periode.debut, period_end: periode.fin,
        appreciation: appreciation.trim() || null, motivation: motivation.trim() || null, note: noteNombre, show_note: avecNote && noteNombre !== null,
        guide: guide as unknown as never, traduction: (arabe ? traduction : null) as unknown as never, langue_ar: arabe || null, updated_at: new Date().toISOString(), ...extra,
      }, { onConflict: 'student_id,period_label' });
      if (error) throw error;
    },
    onError: (e) => toast.error(`Bilan non enregistré : ${errorMessage(e)}`),
  });
  useEffect(() => {
    if (premier.current) { premier.current = false; return; }
    const t = setTimeout(() => sauver.mutate({}), 900);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appreciation, motivation, avecNote, note, guide, arabe, traduction]);

  // Arabe : choix gardé dans la fiche de la famille
  const choisirArabe = async (v: '' | 'fusha' | 'darija') => {
    setArabe(v);
    await supabase.from('profiles').update({ bilan_arabe: v || null }).eq('user_id', studentId);
  };

  const traduire = async () => {
    if (!arabe) return;
    setTraduisant(true);
    try {
      const { data: r, error } = await supabase.functions.invoke('translate-bilan', {
        body: { variante: arabe, prenom: snap.prenom, fille, textes: { appreciation: appreciation.trim(), motivation: motivation.trim(), guide } },
      });
      if (error || r?.error) throw new Error(r?.error || error?.message);
      setTraduction(r.traduction as BilanTraduction);
      toast.success('🌍 Traduction prête : relis-la et corrige si besoin');
    } catch (e) { toast.error(`Traduction impossible : ${errorMessage(e)}`); } finally { setTraduisant(false); }
  };

  const envoyer = async () => {
    setEnvoi(true);
    try {
      const token = report?.share_token || crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const premiereFois = !report?.sent_at;
      await sauver.mutateAsync({ snapshot: snap as unknown as never, sent_at: new Date().toISOString(), share_token: token });
      queryClient.invalidateQueries({ queryKey: ['bilan-trimestriel'] });
      // Idée 1 : notification « nouveau bilan » à l'enfant et à ses parents reliés
      if (premiereFois) {
        const { data: liens } = await supabase.from('parent_links').select('parent_id').eq('child_id', studentId);
        sendPushNotification({ userIds: [studentId, ...(liens || []).map((l) => l.parent_id)], category: 'par_bilan',
          title: `📊 Nouveau bilan de ${snap.prenom}`, body: 'Il vous attend dans l\'Espace parents (Paramètres), avec votre code parents.', data: { url: '/settings?espace=parents' } });
      }
      // Image(s) + PDF + lien de secours
      const images: Blob[] = [];
      if (exportFr.current) images.push(await capturerPng(exportFr.current));
      if (arabe && traduction && exportAr.current) images.push(await capturerPng(exportAr.current));
      const base = nomFichier(snap.prenom, titrePeriode(periode.label, periode.fin));
      const fichiers = [
        ...images.map((b, i) => new File([b], `${base}${i ? '_arabe' : ''}.png`, { type: 'image/png' })),
        new File([await fabriquerPdf(images)], `${base}.pdf`, { type: 'application/pdf' }),
      ];
      const lien = `${window.location.origin}/bilan/${token}`;
      const texte = `Assalamou alaykoum, voici le bilan de ${snap.prenom} (${titrePeriode(periode.label, periode.fin)}). Il est aussi dans l'Espace parents de l'appli. Si l'image ou le PDF ne s'ouvre pas : ${lien} (votre code parents vous sera demandé).`;
      const mode = await partagerBilan(fichiers, texte);
      toast.success(mode === 'partage' ? '📨 Bilan envoyé' : '📥 Image et PDF téléchargés, message copié : colle-le dans WhatsApp ou Messages');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast.error(errorMessage(e));
    } finally { setEnvoi(false); }
  };

  const contenu = { snapshot: snap, appreciation: appreciation.trim() || null, motivation: motivation.trim() || null, note: avecNote ? noteNombre : null, guide, traduction: arabe ? traduction : null, langueAr: arabe || null };
  const phrases = phrasesProposees(snap, fille);
  const ajouter = (txt: string) => setAppreciation((a) => (a.trim() ? `${a.trim()} ${txt}` : txt));

  return (
    <Dialog open onOpenChange={(o) => { if (!o) { if (!premier.current) sauver.mutate({}); onClose(); } }}>
      <DialogContent className="p-0 overflow-hidden max-w-5xl">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[88vh] overflow-y-auto p-4 sm:p-5">
          <DialogHeader className="mb-3">
            <DialogTitle className="[overflow-wrap:anywhere]">✏️ Bilan de {nom}</DialogTitle>
            <DialogDescription>
              {report?.sent_at ? `✅ Envoyé le ${new Date(report.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}${lus.length ? ` · 👀 lu par ${lus.map((x) => `${x.label} le ${new Date(x.read_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`).join(', ')}` : ' · pas encore lu'}` : 'Tout est enregistré automatiquement pendant que tu écris.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 min-w-0">
              <div className="space-y-1.5">
                <label htmlFor="bilan-appr" className="text-sm font-extrabold">💬 Appréciation</label>
                <Textarea id="bilan-appr" value={appreciation} onChange={(e) => setAppreciation(e.target.value)} rows={4} className="cahier-main text-lg" placeholder="Ton appréciation pour les parents…" />
                <p className="text-[11px] font-bold text-muted-foreground">Phrases proposées d'après ses chiffres (touche pour ajouter) :</p>
                <div className="flex flex-wrap gap-1.5">
                  {phrases.map((p) => <button key={p} type="button" onClick={() => ajouter(p)} className="rounded-full border border-dashed border-sky-500 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 text-xs font-bold text-sky-800 dark:text-sky-200">{p}</button>)}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="bilan-motiv" className="text-sm font-extrabold">💌 Un mot pour {snap.prenom}</label>
                <Textarea id="bilan-motiv" value={motivation} onChange={(e) => setMotivation(e.target.value)} rows={2} placeholder="Un petit message d'encouragement" />
                <div className="flex flex-wrap gap-1.5">
                  {messagesEnfant(snap).map((p) => <button key={p} type="button" onClick={() => setMotivation(p)} className="rounded-full border border-dashed border-violet-500 bg-violet-50 dark:bg-violet-950/40 px-2.5 py-1 text-xs font-bold text-violet-800 dark:text-violet-200">{p}</button>)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-border p-2.5">
                <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={avecNote} onChange={(e) => setAvecNote(e.target.checked)} className="h-4 w-4" /> Ajouter une note sur 20</label>
                {avecNote && <Input value={note} onChange={(e) => setNote(e.target.value)} inputMode="decimal" className="w-24" placeholder="15,5" aria-label="Note sur 20"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />}
                {avecNote && note.trim() && noteNombre === null && <span className="text-xs text-destructive">Note entre 0 et 20</span>}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-extrabold">🧭 Guide de la réunion <span className="font-normal text-muted-foreground">(une ligne par point, pré-rempli par l'appli)</span></p>
                {GUIDE_TITRES.map(({ k, t }) => (
                  <div key={k} className="space-y-1">
                    <label htmlFor={`guide-${k}`} className="text-xs font-bold">{t}</label>
                    <Textarea id={`guide-${k}`} rows={Math.max(2, guide[k].length)} value={guide[k].join('\n')}
                      onChange={(e) => setGuide((g) => ({ ...g, [k]: e.target.value.split('\n') }))}
                      onBlur={() => setGuide((g) => ({ ...g, [k]: g[k].map((x) => x.trim()).filter(Boolean) }))} />
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-xl border-2 border-sky-300 dark:border-sky-800 p-2.5">
                <p className="text-sm font-extrabold">🌍 Envoyer aussi en arabe <span className="font-normal text-muted-foreground">(le français est toujours envoyé)</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {([['', 'Non'], ['fusha', 'Arabe classique'], ['darija', 'Darija marocain']] as const).map(([v, t]) => (
                    <button key={v} type="button" aria-pressed={arabe === v} onClick={() => void choisirArabe(v)}
                      className={cn('rounded-full border px-3 py-1 text-xs font-bold', arabe === v ? 'bg-sky-600 text-white border-sky-600' : 'bg-card')}>{t}</button>
                  ))}
                </div>
                {arabe && (
                  <>
                    <Button type="button" variant="outline" size="sm" disabled={traduisant} onClick={() => void traduire()}>
                      {traduisant && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{traduction ? '🔁 Retraduire' : '🌍 Traduire'}
                    </Button>
                    {traduction && (
                      <div className="space-y-2" dir="rtl">
                        <p className="text-xs font-bold text-muted-foreground" dir="ltr">Relis et corrige la traduction :</p>
                        <Textarea rows={3} className="font-arabic text-base" value={traduction.appreciation ?? ''} onChange={(e) => setTraduction((t) => ({ ...t, appreciation: e.target.value }))} aria-label="Appréciation en arabe" />
                        <Textarea rows={2} className="font-arabic text-base" value={traduction.motivation ?? ''} onChange={(e) => setTraduction((t) => ({ ...t, motivation: e.target.value }))} aria-label="Mot pour l'enfant en arabe" />
                        {GUIDE_TITRES.map(({ k }) => (
                          <Textarea key={k} rows={2} className="font-arabic text-base" value={(traduction.guide?.[k] ?? []).join('\n')} aria-label={`Guide en arabe : ${k}`}
                            onChange={(e) => setTraduction((t) => ({ ...t, guide: { ...(t?.guide ?? { forts: [], travailler: [], maison: [], objectif: [] }), [k]: e.target.value.split('\n') } }))} />
                        ))}
                        {(appreciation.trim() !== '' && !traduction.appreciation) && <p className="text-xs text-amber-700" dir="ltr">⚠️ L'appréciation a changé : pense à retraduire.</p>}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2 min-w-0">
              <p className="text-sm font-extrabold">👨‍👩‍👧 Aperçu : ce que verront les parents</p>
              <div className="rounded-3xl bg-slate-900 p-2 max-w-md mx-auto w-full"><BilanVue {...contenu} /></div>
            </div>
          </div>

          <div className="sticky bottom-0 mt-4 grid gap-2 bg-background/95 pt-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => { sauver.mutate({}); onClose(); }}>💾 Enregistrer et fermer</Button>
            <Button className="bg-[#2457a5] hover:bg-[#1d4685]" disabled={envoi || (arabe !== '' && !traduction)}
              onClick={() => askValidation(report?.sent_at ? 'Renvoyer le bilan ?' : 'Envoyer le bilan aux parents ?',
                `Le bilan de ${snap.prenom} sera rangé dans son Espace parents${report?.sent_at ? '' : ' (avec une notification)'}, puis WhatsApp ou Messages s'ouvrira avec l'image, le PDF et le lien.`, () => void envoyer())}>
              {envoi && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}📨 {report?.sent_at ? 'Renvoyer le message' : 'Envoyer aux parents'}
            </Button>
            {arabe !== '' && !traduction && <p className="sm:col-span-2 text-xs text-amber-700 dark:text-amber-300">Traduis d'abord en arabe (ou choisis « Non »).</p>}
          </div>
        </div>
        <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />

        {/* Versions à photographier pour l'image et le PDF (tout déplié), hors de l'écran */}
        <div aria-hidden className="fixed -left-[10000px] top-0 w-[440px]">
          <BilanVue ref={exportFr} {...contenu} exportMode langueForcee="fr" />
          {arabe && traduction && <BilanVue ref={exportAr} {...contenu} exportMode langueForcee="ar" />}
        </div>
        {validationDialog}
      </DialogContent>
    </Dialog>
  );
}
