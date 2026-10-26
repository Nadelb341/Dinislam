/**
 * 📈 Bilans (idée 9 choisie par Nadia, 2026-10-26) : évolution du groupe et de chaque élève depuis les dernières
 * vacances, puis bilan de chaque élève envoyé aux parents PAR TEXTO avant les vacances (note, appréciation,
 * message de motivation). Saisie dans `student_reports` (une ligne par élève et par période `period_label`).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { nextHolidays, periodStart, type Holiday } from '@/lib/groupCourse';
import { saveDraft, loadDraft, clearDraft } from '@/hooks/useDraftRecovery';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { errorMessage, byName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ─────────────────────────────── Types ───────────────────────────────

interface Profile { user_id: string; full_name: string | null; gender: string | null; parent_phone: string | null; phone: string | null }
interface Report { student_id: string; period_label: string; note: number | null; appreciation: string | null; motivation: string | null; sent_at: string | null }
interface Stats {
  given: number; validated: number;
  tresors: number; bonus: number;
  present: number; late: number; absent: number; presencePct: number | null;
  sourates: number; lessons: number; names: number;
}
interface StudentRow { id: string; profile: Profile | null; name: string; firstName: string; stats: Stats; report: Report | null }
type Level = 'tb' | 'b' | 'enc';
interface DraftData { period: string; note: string; appreciation: string; motivation: string; phone: string }

// ─────────────────────────────── Outils ───────────────────────────────

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const frDate = (ymd: string) => new Date(`${ymd}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
const frDateTime = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
const firstNameOf = (full: string | null) => (full ?? '').trim().split(/\s+/)[0] || 'Élève';
const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Téléphone : 10 chiffres commençant par 0, ou +33 suivi de 9 chiffres (espaces, points et tirets acceptés). */
const cleanPhone = (raw: string) => raw.replace(/[\s.-]/g, '');
const isValidPhone = (raw: string) => /^0[1-9]\d{8}$/.test(cleanPhone(raw)) || /^\+33[1-9]\d{8}$/.test(cleanPhone(raw));

function parseNote(raw: string): number | null | 'invalide' {
  const t = raw.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 20) return 'invalide';
  return Math.round(n * 10) / 10;
}
const noteText = (n: number) => String(n).replace('.', ',');

function levelOf(s: Stats): Level {
  const dev = s.given > 0 ? s.validated / s.given : null;
  const pres = s.presencePct;
  const score = [dev, pres === null ? null : pres / 100].filter((x): x is number => x !== null);
  if (score.length === 0) return 'b';
  const avg = score.reduce((a, b) => a + b, 0) / score.length;
  return avg >= 0.8 ? 'tb' : avg >= 0.5 ? 'b' : 'enc';
}

const LEVEL_INFO: Record<Level, { label: string; cls: string }> = {
  tb: { label: '🌟 Très bien', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  b: { label: '👍 Bien', cls: 'bg-sky-100 text-sky-800 border-sky-300' },
  enc: { label: '💪 À encourager', cls: 'bg-orange-100 text-orange-800 border-orange-300' },
};

function appreciations(level: Level, p: string, girl: boolean): string[] {
  const g = (m: string, f: string) => (girl ? f : m);
  if (level === 'tb') return [
    `Excellent travail ! ${p} est ${g('très sérieux', 'très sérieuse')} et ${g('motivé', 'motivée')}, bravo.`,
    `Très belle période : les devoirs sont faits avec soin et ${p} participe bien en cours.`,
    `${p} progresse très bien, c'est un plaisir de l'avoir en classe.`,
  ];
  if (level === 'b') return [
    `Bon travail dans l'ensemble. ${p} peut aller encore plus loin avec un peu plus de régularité.`,
    `${p} fait des efforts, c'est bien. Il faut continuer à travailler un peu chaque jour.`,
    `Période correcte : quelques devoirs manquent, mais ${p} est sur la bonne voie.`,
  ];
  return [
    `${p} peut faire beaucoup mieux : il faut faire les devoirs chaque semaine.`,
    `Période difficile : plus de présence et de travail à la maison aideront ${p} à progresser.`,
    `${p} a des capacités, il faut maintenant s'accrocher et travailler un peu chaque jour.`,
  ];
}

function motivations(level: Level, girl: boolean): string[] {
  const g = (m: string, f: string) => (girl ? f : m);
  if (level === 'tb') return [
    'Bravo, continue comme ça, tu es sur un très beau chemin ! 🌟',
    "Qu'Allah te récompense pour tes efforts, continue ainsi ! 💎",
    `Tu peux être ${g('fier', 'fière')} de toi, bonnes vacances ! 🎉`,
  ];
  if (level === 'b') return [
    'Tu es sur la bonne voie, encore un petit effort et tu vas briller ! ✨',
    "Un peu chaque jour, et tu vas faire de grands progrès, inch'Allah ! 💪",
    'Je crois en toi : après les vacances, on vise encore plus haut ! 🚀',
  ];
  return [
    "Ne te décourage pas, chaque petit pas compte, inch'Allah ! 🌱",
    'Je sais que tu peux y arriver, on recommence ensemble après les vacances ! 💪',
    'Allah aime les efforts réguliers, même petits : courage ! 🤲',
  ];
}

function progressParts(s: Stats): string[] {
  const parts: string[] = [];
  if (s.sourates) parts.push(`${plural(s.sourates, 'sourate apprise', 'sourates apprises')} 📖`);
  if (s.lessons) parts.push(`${plural(s.lessons, 'leçon Nourania validée', 'leçons Nourania validées')} 🔤`);
  if (s.names) parts.push(`${plural(s.names, "nom d'Allah appris", "noms d'Allah appris")} ✨`);
  if (s.tresors) parts.push(`${plural(s.tresors, 'trésor ouvert', 'trésors ouverts')} 🎁`);
  return parts;
}

function buildSms(o: {
  firstName: string; avantLes: string; stats: Stats; note: number | null;
  appreciation: string; motivation: string; teacher: string;
}): string {
  const facts: string[] = [];
  if (o.stats.given > 0) facts.push(`devoirs validés ${o.stats.validated}/${o.stats.given}`);
  if (o.stats.presencePct !== null) facts.push(`présence ${o.stats.presencePct} %`);
  facts.push(...progressParts(o.stats));
  const lines = [`Assalamou alaykoum, voici le bilan de ${o.firstName} ${o.avantLes}${facts.length ? ` : ${facts.join(', ')}.` : '.'}`];
  if (o.note !== null) lines.push(`Note : ${noteText(o.note)}/20.`);
  if (o.appreciation.trim()) lines.push(`Appréciation : ${o.appreciation.trim()}`);
  if (o.motivation.trim()) lines.push(`Message pour ${o.firstName} : ${o.motivation.trim()}`);
  lines.push(`— ${o.teacher} (Dinislam)`);
  return lines.join('\n');
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* repli ci-dessous */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ─────────────────────────────── Écran principal ───────────────────────────────

export default function Bilans({ groupId, groupName, memberIds, onBack }: {
  groupId: string | null; groupName: string; memberIds: string[]; onBack: () => void;
}) {
  const { user } = useAuth();
  const [openId, setOpenId] = useState<string | null>(null);
  const membersKey = useMemo(() => [...memberIds].sort().join(','), [memberIds]);

  const { data: holidays = [], isLoading: loadingHolidays } = useQuery({
    queryKey: ['bilans', 'holidays'],
    queryFn: async () => {
      const { data, error } = await supabase.from('school_holidays').select('label, start_date, end_date').order('start_date');
      if (error) throw error;
      return (data ?? []) as Holiday[];
    },
  });

  const start = useMemo(() => periodStart(holidays), [holidays]);
  const next = useMemo(() => nextHolidays(holidays), [holidays]);
  const periodLabel = next ? `Avant les ${next.label}` : "Bilan de l'année";
  const avantLes = next ? `avant les ${lowerFirst(next.label)}` : "de l'année";

  const { data: teacherName = 'Votre professeur' } = useQuery({
    queryKey: ['bilans', 'teacher', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('full_name').eq('user_id', user!.id).maybeSingle();
      return data?.full_name?.trim() || 'Votre professeur';
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['bilans', 'data', groupId, membersKey, start, periodLabel],
    enabled: !loadingHolidays && memberIds.length > 0,
    queryFn: async () => {
      const ids = memberIds;
      const [profiles, memberships, devoirs, rendus, rewards, attendance, sourates, lessons, names, reports] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, gender, parent_phone, phone').in('user_id', ids),
        supabase.from('student_group_members').select('user_id, group_id').in('user_id', ids),
        supabase.from('devoirs').select('id, assigned_to, group_id, student_id, created_at').gte('created_at', start),
        supabase.from('devoirs_rendus').select('devoir_id, student_id, statut').in('student_id', ids).eq('statut', 'corrige'),
        supabase.from('program_rewards').select('user_id, kind, created_at').in('user_id', ids).gte('created_at', start),
        supabase.from('attendance_records').select('user_id, date, status').in('user_id', ids).gte('date', start),
        supabase.from('user_sourate_progress').select('user_id, validated_at, created_at').in('user_id', ids).eq('is_validated', true).eq('context', 'sourates'),
        supabase.from('user_nourania_progress').select('user_id, completed_at, created_at').in('user_id', ids).eq('is_validated', true),
        supabase.from('user_allah_name_progress').select('user_id, validated_at').in('user_id', ids).eq('is_validated', true).gte('validated_at', start),
        supabase.from('student_reports').select('student_id, period_label, note, appreciation, motivation, sent_at').in('student_id', ids).eq('period_label', periodLabel),
      ]);
      for (const r of [profiles, memberships, devoirs, rendus, rewards, attendance, sourates, lessons, names, reports]) {
        if (r.error) throw r.error;
      }
      return {
        profiles: (profiles.data ?? []) as Profile[],
        memberships: memberships.data ?? [],
        devoirs: devoirs.data ?? [],
        rendus: rendus.data ?? [],
        rewards: rewards.data ?? [],
        attendance: attendance.data ?? [],
        sourates: sourates.data ?? [],
        lessons: lessons.data ?? [],
        names: names.data ?? [],
        reports: (reports.data ?? []) as Report[],
      };
    },
  });

  const rows: StudentRow[] = useMemo(() => {
    if (!data) return [];
    const groupsOf = new Map<string, Set<string>>();
    for (const m of data.memberships) {
      if (!groupsOf.has(m.user_id)) groupsOf.set(m.user_id, new Set());
      groupsOf.get(m.user_id)!.add(m.group_id);
    }
    const validatedSet = new Set(data.rendus.map((r) => `${r.devoir_id}|${r.student_id}`));
    const inPeriod = (iso: string | null | undefined) => !!iso && iso.slice(0, 10) >= start;
    const list = memberIds.map((sid) => {
      const profile = data.profiles.find((p) => p.user_id === sid) ?? null;
      const groups = groupsOf.get(sid) ?? new Set<string>();
      const mine = data.devoirs.filter((d) =>
        d.student_id ? d.student_id === sid : d.group_id ? groups.has(d.group_id) : d.assigned_to === 'all');
      const att = data.attendance.filter((a) => a.user_id === sid);
      const present = att.filter((a) => a.status === 'present').length;
      const late = att.filter((a) => a.status === 'late').length;
      const absent = att.filter((a) => a.status === 'absent').length;
      const total = present + late + absent;
      const stats: Stats = {
        given: mine.length,
        validated: mine.filter((d) => validatedSet.has(`${d.id}|${sid}`)).length,
        tresors: data.rewards.filter((r) => r.user_id === sid && r.kind === 'tresor').length,
        bonus: data.rewards.filter((r) => r.user_id === sid && r.kind === 'bonus').length,
        present, late, absent,
        presencePct: total ? Math.round(((present + late) / total) * 100) : null,
        sourates: data.sourates.filter((s) => s.user_id === sid && inPeriod(s.validated_at ?? s.created_at)).length,
        lessons: data.lessons.filter((l) => l.user_id === sid && inPeriod(l.completed_at ?? l.created_at)).length,
        names: data.names.filter((n) => n.user_id === sid).length,
      };
      const name = profile?.full_name?.trim() || 'Élève';
      return { id: sid, profile, name, firstName: firstNameOf(profile?.full_name ?? null), stats, report: data.reports.find((r) => r.student_id === sid) ?? null };
    });
    return list.sort(byName<StudentRow>((r) => r.profile?.full_name ?? r.name));
  }, [data, memberIds, start]);

  const group = useMemo(() => {
    const sum = (f: (s: Stats) => number) => rows.reduce((a, r) => a + f(r.stats), 0);
    const given = sum((s) => s.given);
    const validated = sum((s) => s.validated);
    const attTotal = sum((s) => s.present + s.late + s.absent);
    return {
      devoirsPct: given ? Math.round((validated / given) * 100) : null,
      validated, given,
      presencePct: attTotal ? Math.round((sum((s) => s.present + s.late) / attTotal) * 100) : null,
      tresors: sum((s) => s.tresors),
      bonus: sum((s) => s.bonus),
      sourates: sum((s) => s.sourates),
      lessons: sum((s) => s.lessons),
      names: sum((s) => s.names),
      sent: rows.filter((r) => r.report?.sent_at).length,
    };
  }, [rows]);

  const openRow = rows.find((r) => r.id === openId) ?? null;

  return (
    <div className="space-y-4 p-3 md:p-6">
      <div className="flex items-start gap-2">
        <Button variant="outline" size="sm" onClick={onBack} className="shrink-0">← Retour</Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold leading-snug sm:text-xl [overflow-wrap:anywhere]">
            📈 Bilans · {groupName}
          </h2>
          <p className="text-sm text-violet-700 [overflow-wrap:anywhere]">
            {periodLabel} <span className="text-muted-foreground">(du {frDate(start)} au {frDate(today())})</span>
          </p>
        </div>
      </div>

      {memberIds.length === 0 ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          👥 Ce groupe n'a encore aucun élève : le bilan apparaîtra dès qu'un élève y sera ajouté.
        </p>
      ) : error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          😕 Le bilan n'a pas pu être chargé : {errorMessage(error)}
        </p>
      ) : isLoading || loadingHolidays ? (
        <p className="p-4 text-center text-sm text-muted-foreground">⏳ Calcul du bilan…</p>
      ) : (
        <>
          {/* Bilan du groupe */}
          <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-sky-50 p-3 md:p-4">
            <h3 className="mb-3 text-sm font-bold text-violet-900 sm:text-base">👥 Bilan du groupe</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Tile color="green" emoji="✅" value={group.devoirsPct === null ? '—' : `${group.devoirsPct} %`} label="Devoirs validés" sub={group.given ? `${group.validated}/${group.given}` : 'aucun devoir'} />
              <Tile color="blue" emoji="🙋" value={group.presencePct === null ? '—' : `${group.presencePct} %`} label="Présence" />
              <Tile color="orange" emoji="🎁" value={String(group.tresors)} label={group.tresors > 1 ? 'Trésors ouverts' : 'Trésor ouvert'} sub={group.bonus ? `🌟 ${group.bonus} bonus` : undefined} />
              <Tile color="violet" emoji="📖" value={String(group.sourates)} label={group.sourates > 1 ? 'Sourates apprises' : 'Sourate apprise'} />
              <Tile color="pink" emoji="🔤" value={String(group.lessons)} label={group.lessons > 1 ? 'Leçons validées' : 'Leçon validée'} />
              <Tile color="amber" emoji="✨" value={String(group.names)} label={group.names > 1 ? "Noms d'Allah appris" : "Nom d'Allah appris"} />
            </div>
            <p className="mt-3 text-center text-sm font-semibold text-emerald-800">
              📱 {group.sent} {group.sent > 1 ? 'bilans envoyés' : 'bilan envoyé'} / {rows.length}
            </p>
          </section>

          {/* Élèves */}
          <section className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => {
              const lvl = LEVEL_INFO[levelOf(r.stats)];
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setOpenId(r.id)}
                  className="min-w-0 overflow-hidden rounded-xl border-2 border-sky-200 bg-white p-3 text-left shadow-sm transition hover:border-violet-400 hover:shadow-md active:scale-[0.99]"
                >
                  <div className="flex items-start gap-2">
                    <span className="min-w-0 flex-1 font-bold [overflow-wrap:anywhere]">{r.name}</span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${lvl.cls}`}>{lvl.label}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                    <Chip cls="bg-emerald-50 text-emerald-800">✅ {r.stats.validated}/{r.stats.given}</Chip>
                    <Chip cls="bg-sky-50 text-sky-800">🙋 {r.stats.presencePct === null ? '—' : `${r.stats.presencePct} %`}</Chip>
                    {r.stats.tresors > 0 && <Chip cls="bg-orange-50 text-orange-800">🎁 {r.stats.tresors}</Chip>}
                    {r.stats.sourates > 0 && <Chip cls="bg-violet-50 text-violet-800">📖 {r.stats.sourates}</Chip>}
                    {r.stats.lessons > 0 && <Chip cls="bg-pink-50 text-pink-800">🔤 {r.stats.lessons}</Chip>}
                    {r.stats.names > 0 && <Chip cls="bg-amber-50 text-amber-800">✨ {r.stats.names}</Chip>}
                  </div>
                  <div className="mt-2 text-xs font-semibold">
                    {r.report?.sent_at ? (
                      <span className="text-emerald-700">✅ Envoyé le {frDateTime(r.report.sent_at)}</span>
                    ) : (
                      <span className="text-orange-700">📮 À envoyer{r.report ? ' (bilan enregistré)' : ''}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </section>
        </>
      )}

      {openRow && (
        <StudentSheet
          key={openRow.id}
          row={openRow}
          periodLabel={periodLabel}
          avantLes={avantLes}
          start={start}
          teacher={teacherName}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

const TILE_COLORS: Record<string, string> = {
  green: 'from-emerald-400 to-green-500',
  blue: 'from-sky-400 to-blue-500',
  orange: 'from-orange-400 to-amber-500',
  violet: 'from-violet-400 to-purple-500',
  pink: 'from-pink-400 to-rose-500',
  amber: 'from-amber-400 to-yellow-500',
};

function Tile({ color, emoji, value, label, sub }: { color: string; emoji: string; value: string; label: string; sub?: string }) {
  return (
    <div className={`min-w-0 rounded-xl bg-gradient-to-br ${TILE_COLORS[color]} p-2.5 text-center text-white shadow`}>
      <div className="text-lg leading-none">{emoji}</div>
      <div className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">{value}</div>
      <div className="text-[11px] font-semibold leading-tight sm:text-xs">{label}</div>
      {sub && <div className="mt-0.5 text-[10px] opacity-90">{sub}</div>}
    </div>
  );
}

function Chip({ cls, children }: { cls: string; children: ReactNode }) {
  return <span className={`rounded-full px-2 py-0.5 font-semibold ${cls}`}>{children}</span>;
}

// ─────────────────────────────── Fiche d'un élève ───────────────────────────────

function StudentSheet({ row, periodLabel, avantLes, start, teacher, onClose }: {
  row: StudentRow; periodLabel: string; avantLes: string; start: string; teacher: string; onClose: () => void;
}) {
  const qc = useQueryClient();
  const draftKey = `dinislam_bilan_${row.id}`;
  const level = levelOf(row.stats);
  const girl = row.profile?.gender === 'fille';
  const savedPhone = row.profile?.parent_phone ?? '';

  const saved: Omit<DraftData, 'period'> = {
    note: row.report?.note != null ? noteText(row.report.note) : '',
    appreciation: row.report?.appreciation ?? '',
    motivation: row.report?.motivation ?? '',
    phone: savedPhone,
  };
  const [initialDraft] = useState(() => {
    const d = loadDraft<DraftData>(draftKey);
    return d && d.period === periodLabel ? d : null;
  });
  const [note, setNote] = useState(initialDraft?.note ?? saved.note);
  const [appreciation, setAppreciation] = useState(initialDraft?.appreciation ?? saved.appreciation);
  const [motivation, setMotivation] = useState(initialDraft?.motivation ?? saved.motivation);
  const [phone, setPhone] = useState(initialDraft?.phone ?? saved.phone);
  const [askSent, setAskSent] = useState(false);
  const appreciationRef = useRef<HTMLTextAreaElement>(null);
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();

  const dirty = parseNote(note) !== (row.report?.note ?? null)
    || appreciation.trim() !== saved.appreciation.trim()
    || motivation.trim() !== saved.motivation.trim()
    || cleanPhone(phone) !== cleanPhone(saved.phone);

  // Brouillon gardé sur l'appareil tant que ce n'est pas enregistré
  useEffect(() => {
    if (dirty) saveDraft<DraftData>(draftKey, { period: periodLabel, note, appreciation, motivation, phone });
    else if (loadDraft<DraftData>(draftKey)?.period === periodLabel) clearDraft(draftKey);
  }, [dirty, draftKey, periodLabel, note, appreciation, motivation, phone]);

  const parsedNote = parseNote(note);
  const smsText = buildSms({
    firstName: row.firstName, avantLes, stats: row.stats,
    note: parsedNote === 'invalide' ? null : parsedNote,
    appreciation, motivation, teacher,
  });

  const save = useMutation({
    mutationFn: async (opts: { markSent?: boolean }) => {
      if (parsedNote === 'invalide') throw new Error('La note doit être un nombre entre 0 et 20.');
      if (phone.trim() && !isValidPhone(phone)) throw new Error('Le numéro du parent doit avoir 10 chiffres (06…) ou commencer par +33.');
      const payload = {
        student_id: row.id,
        period_label: periodLabel,
        note: parsedNote,
        appreciation: appreciation.trim() || null,
        motivation: motivation.trim() || null,
        updated_at: new Date().toISOString(),
        ...(opts.markSent ? { sent_at: new Date().toISOString() } : {}),
      };
      const { error } = await supabase.from('student_reports').upsert(payload, { onConflict: 'student_id,period_label' });
      if (error) throw error;
      const newPhone = phone.trim() ? cleanPhone(phone) : '';
      if (newPhone !== cleanPhone(savedPhone)) {
        const { error: e2 } = await supabase.from('profiles').update({ parent_phone: newPhone || null }).eq('user_id', row.id);
        if (e2) throw e2;
      }
    },
    onSuccess: (_d, opts) => {
      clearDraft(draftKey);
      qc.invalidateQueries({ queryKey: ['bilans'] });
      toast.success(opts.markSent ? `✅ Bilan de ${row.firstName} noté comme envoyé` : `💾 Bilan de ${row.firstName} enregistré`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const sendSms = async () => {
    if (!phone.trim()) { toast.error('📱 Indique d’abord le numéro du parent.'); return; }
    if (!isValidPhone(phone)) { toast.error('Le numéro du parent doit avoir 10 chiffres (06…) ou commencer par +33.'); return; }
    if (parsedNote === 'invalide') { toast.error('La note doit être un nombre entre 0 et 20.'); return; }
    try {
      await save.mutateAsync({});
    } catch {
      return;
    }
    window.location.href = `sms:${cleanPhone(phone)}?&body=${encodeURIComponent(smsText)}`;
    setTimeout(() => setAskSent(true), 800);
  };

  const copy = async () => {
    const ok = await copyText(smsText);
    if (ok) toast.success('📋 Texte copié');
    else toast.error('Le texte n’a pas pu être copié');
  };

  const s = row.stats;
  const appChoices = appreciations(level, row.firstName, girl);
  const motChoices = motivations(level, girl);
  const phoneSuggestion = !phone.trim() && row.profile?.phone ? row.profile.phone : null;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) { if (dirty) toast('📝 Brouillon gardé'); onClose(); } }}>
      <DialogContent level="nested" className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-xl overflow-hidden p-0 md:w-full">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[92vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle className="[overflow-wrap:anywhere]">📈 {row.name}</DialogTitle>
            <DialogDescription>
              {periodLabel} · du {frDate(start)} au {frDate(today())} ·{' '}
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${LEVEL_INFO[level].cls}`}>{LEVEL_INFO[level].label}</span>
            </DialogDescription>
          </DialogHeader>

          {initialDraft && dirty && (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              📝 Brouillon repris : ces changements ne sont pas encore enregistrés.
            </p>
          )}

          {/* Stats détaillées */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Tile color="green" emoji="✅" value={`${s.validated}/${s.given}`} label="Devoirs validés" />
            <Tile color="blue" emoji="🙋" value={s.presencePct === null ? '—' : `${s.presencePct} %`} label="Présence"
              sub={s.present + s.late + s.absent ? `${s.present} présent · ${s.late} retard · ${s.absent} absent` : 'aucun cours noté'} />
            <Tile color="orange" emoji="🎁" value={String(s.tresors)} label={s.tresors > 1 ? 'Trésors ouverts' : 'Trésor ouvert'} sub={s.bonus ? `🌟 ${s.bonus} bonus` : undefined} />
            <Tile color="violet" emoji="📖" value={String(s.sourates)} label={s.sourates > 1 ? 'Sourates apprises' : 'Sourate apprise'} />
            <Tile color="pink" emoji="🔤" value={String(s.lessons)} label={s.lessons > 1 ? 'Leçons validées' : 'Leçon validée'} />
            <Tile color="amber" emoji="✨" value={String(s.names)} label={s.names > 1 ? "Noms d'Allah" : "Nom d'Allah"} />
          </div>

          {/* Note */}
          <label className="mt-5 block text-sm font-bold text-violet-900">⭐ Note sur 20</label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              inputMode="decimal"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); appreciationRef.current?.focus(); } }}
              placeholder="ex. 16"
              className="w-24 text-center text-lg font-bold"
            />
            <span className="font-semibold text-muted-foreground">/ 20</span>
            {parsedNote === 'invalide' && <span className="text-xs text-red-600">entre 0 et 20</span>}
          </div>

          {/* Appréciation */}
          <label className="mt-4 block text-sm font-bold text-emerald-900">📝 Appréciation</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {appChoices.map((t) => (
              <button key={t} type="button" onClick={() => setAppreciation(t)}
                className={`rounded-xl border px-2.5 py-1.5 text-left text-xs transition ${appreciation === t ? 'border-emerald-500 bg-emerald-100 font-semibold text-emerald-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}>
                {t}
              </button>
            ))}
          </div>
          <Textarea ref={appreciationRef} value={appreciation} onChange={(e) => setAppreciation(e.target.value)}
            placeholder="Ou écris ta propre appréciation…" className="mt-2 min-h-[70px]" />

          {/* Motivation */}
          <label className="mt-4 block text-sm font-bold text-orange-900">💪 Message pour {row.firstName}</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {motChoices.map((t) => (
              <button key={t} type="button" onClick={() => setMotivation(t)}
                className={`rounded-xl border px-2.5 py-1.5 text-left text-xs transition ${motivation === t ? 'border-orange-500 bg-orange-100 font-semibold text-orange-900' : 'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100'}`}>
                {t}
              </button>
            ))}
          </div>
          <Textarea value={motivation} onChange={(e) => setMotivation(e.target.value)}
            placeholder="Ou écris ton propre message…" className="mt-2 min-h-[60px]" />

          {/* Téléphone */}
          <label className="mt-4 block text-sm font-bold text-sky-900">📱 Téléphone du parent</label>
          <Input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
            placeholder="06 12 34 56 78"
            className="mt-1"
          />
          {phone.trim() && !isValidPhone(phone) && (
            <p className="mt-1 text-xs text-red-600">10 chiffres (06…) ou un numéro qui commence par +33.</p>
          )}
          {phoneSuggestion && (
            <button type="button" onClick={() => setPhone(phoneSuggestion)}
              className="mt-1.5 rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-100">
              Utiliser le numéro de l'élève : {phoneSuggestion}
            </button>
          )}

          {/* Aperçu du texto */}
          <p className="mt-5 text-sm font-bold text-violet-900">💬 Aperçu du texto</p>
          <div className="mt-1 whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-gradient-to-br from-sky-500 to-blue-600 p-3 text-sm leading-relaxed text-white shadow [overflow-wrap:anywhere]">
            {smsText}
          </div>
          {row.report?.sent_at && (
            <p className="mt-2 text-xs font-semibold text-emerald-700">✅ Envoyé le {frDateTime(row.report.sent_at)}</p>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button onClick={() => save.mutate({})} disabled={save.isPending} className="bg-violet-600 text-white hover:bg-violet-700">
              💾 Enregistrer
            </Button>
            <Button onClick={sendSms} disabled={save.isPending} className="bg-emerald-600 text-white hover:bg-emerald-700">
              📱 {row.report?.sent_at ? 'Renvoyer par texto' : 'Envoyer par texto'}
            </Button>
            <Button onClick={copy} variant="outline" className="border-sky-400 text-sky-800 hover:bg-sky-50">
              📋 Copier le texte
            </Button>
          </div>
          <div className="h-12" />
        </div>
        <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />

        <AlertDialog open={askSent} onOpenChange={setAskSent}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>📱 Le texto est parti ?</AlertDialogTitle>
              <AlertDialogDescription>
                Si tu as bien envoyé le bilan de {row.firstName} depuis ton téléphone, il sera noté « ✅ envoyé ».
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Pas encore</AlertDialogCancel>
              <AlertDialogAction onClick={() => save.mutate({ markSent: true })}>Oui, il est parti</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
