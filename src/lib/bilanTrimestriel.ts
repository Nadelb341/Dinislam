/**
 * 📊 Bilan trimestriel (2026-10-28, maquette validée par Nadia) : proposition 3 (tableau de bord) + appréciation (1)
 * + message pour l'enfant + guide de la réunion (10), boutons « Plus de détails » (frise, 4), « Voir la progression » (5)
 * et « Voir les trimestres précédents » (8). Tous les chiffres viennent de l'appli ; ils sont FIGÉS à l'envoi (snapshot).
 */
import { supabase } from '@/integrations/supabase/client';
import { matiereOf } from './devoirMatieres';
import { heureDeRendu, horairePour, coursPasses, type DevoirRotation } from './rotationDevoirs';
import type { GroupSchedule, Holiday } from './groupCourse';

export interface BilanSnapshot {
  version: 1;
  prenom: string;
  /** Pour accorder « présente / présent » */
  fille: boolean;
  groupe: string | null;
  periode: { label: string; debut: string; fin: string };
  presence: { cours: number; presents: number; retards: number; absents: number; justifiees: number; pct: number | null };
  devoirs: { donnes: number; faits: number; premierCoup: number; refaits: number; pasFaits: number; retard: number; aValider: number };
  comportement: { cours: number; attentif: number; participe: number; bavarde: number };
  serie: number;
  joursObjectif: number;
  matieres: { type: string; faits: number; donnes: number }[];
  frise: { date: string; statut: 'present' | 'retard' | 'absent' | 'justifie' | 'inconnu'; faits: number; donnes: number; acquis: string[] }[];
  progression: { sourates: number[]; nourania: number[]; nouraniaTotal: number; alphabet: number; alphabetTotal: number; noms: number };
  /** Ce trimestre et les précédents, du plus ancien au plus récent */
  precedents: { label: string; presencePct: number | null; devoirsPct: number | null; premierCoup: number; retard: number; sourates: number }[];
  diplome: string | null;
  /** Ce qui a été appris pendant la période */
  appris: { sourates: string[]; lecons: number; noms: number };
}

export interface BilanGuide { forts: string[]; travailler: string[]; maison: string[]; objectif: string[] }
export interface BilanTraduction { appreciation?: string; motivation?: string; guide?: BilanGuide }

export const prenomDe = (full: string | null | undefined) => (full || '').trim().split(/\s+/)[0] || 'Élève';
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);
const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;

/** Période du bilan : depuis la fin des dernières vacances jusqu'à la veille des prochaines */
export function periodeBilan(holidays: Holiday[], now = new Date()) {
  const k = ymd(now);
  const tri = [...holidays].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const avant = tri.filter((h) => h.end_date < k).pop();
  const prochaines = tri.find((h) => h.end_date >= k) ?? null;
  let debut = `${now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1}-09-01`;
  if (avant) { const d = new Date(`${avant.end_date}T12:00:00`); d.setDate(d.getDate() + 1); debut = ymd(d); }
  let fin = k;
  if (prochaines && prochaines.start_date > k) { const d = new Date(`${prochaines.start_date}T12:00:00`); d.setDate(d.getDate() - 1); fin = ymd(d); }
  // Même libellé que l'ancien écran « 📈 Bilans » : les anciens bilans restent rattachés à leur période
  const label = prochaines ? `Avant les ${prochaines.label}` : "Bilan de l'année";
  return { debut, fin, label, prochaines };
}

/** « Avant les Vacances de Noël » → « vacances de Noël 2026 » */
export function titrePeriode(label: string, fin: string) {
  const t = label.replace(/^Avant les /, '');
  return `${t.charAt(0).toLowerCase()}${t.slice(1)} ${fin.slice(0, 4)}`;
}

/** Plus longue série de jours d'affilée */
function plusLongueSerie(jours: string[]): number {
  const s = [...new Set(jours)].sort();
  let best = 0; let cur = 0; let prev: Date | null = null;
  for (const j of s) {
    const d = new Date(`${j}T12:00:00`);
    cur = prev && Math.round((d.getTime() - prev.getTime()) / 86400000) === 1 ? cur + 1 : 1;
    best = Math.max(best, cur); prev = d;
  }
  return best;
}

export interface DonneesBilan {
  profiles: { user_id: string; full_name: string | null; gender: string | null; bilan_arabe: string | null;
    parent_phone: string | null; parent_phone_nom: string | null; parent2_phone: string | null; parent2_phone_nom: string | null }[];
  memberships: { user_id: string; group_id: string }[];
  groups: { id: string; name: string }[];
  horaires: GroupSchedule[];
  devoirs: (DevoirRotation & { assigned_to: string | null; group_id: string | null; student_id: string | null; type: string })[];
  rendus: { devoir_id: string; student_id: string; statut: string; rendu_at: string; a_ete_refait: boolean }[];
  attendance: { user_id: string; date: string; status: string }[];
  justifs: { student_id: string; course_date: string }[];
  behavior: { student_id: string; course_date: string; kind: string }[];
  goals: { student_id: string; day: string }[];
  sourates: { user_id: string; sourate_id: string; validated_at: string | null; created_at: string | null }[];
  sourateInfo: { id: string; number: number; name_french: string }[];
  lessons: { user_id: string; lesson_id: string; completed_at: string | null; created_at: string | null }[];
  lessonInfo: { id: string; lesson_number: number }[];
  letters: { user_id: string }[];
  lettersTotal: number;
  names: { user_id: string; validated_at: string | null }[];
  reports: { id: string; student_id: string; period_label: string; note: number | null; appreciation: string | null; motivation: string | null;
    sent_at: string | null; snapshot: BilanSnapshot | null; guide: BilanGuide | null; show_note: boolean; traduction: BilanTraduction | null;
    langue_ar: string | null; share_token: string | null; updated_at: string | null }[];
  reads: { report_id: string; label: string; read_at: string }[];
  /** 📜 Envois déjà faits (idées 2 et 3 : reste à envoyer, pas lu depuis 3 jours) */
  envois: { report_id: string; destinataire: string; canal: string; sent_at: string }[];
}

/** Tout ce qu'il faut pour les bilans d'une liste d'élèves (une requête par table) */
export async function chargerDonneesBilan(ids: string[], debut: string): Promise<DonneesBilan> {
  const q = await Promise.all([
    supabase.from('profiles').select('user_id, full_name, gender, bilan_arabe, parent_phone, parent_phone_nom, parent2_phone, parent2_phone_nom').in('user_id', ids),
    supabase.from('student_group_members').select('user_id, group_id').in('user_id', ids),
    supabase.from('student_groups').select('id, name'),
    supabase.from('group_schedules').select('group_id, weekday, start_time'),
    supabase.from('devoirs').select('id, created_at, visible_a, date_limite, assigned_to, group_id, student_id, type').gte('created_at', debut),
    supabase.from('devoirs_rendus').select('devoir_id, student_id, statut, rendu_at, a_ete_refait').in('student_id', ids),
    supabase.from('attendance_records').select('user_id, date, status').in('user_id', ids).gte('date', debut),
    supabase.from('absence_justifications').select('student_id, course_date').in('student_id', ids).gte('course_date', debut),
    supabase.from('behavior_marks').select('student_id, course_date, kind').in('student_id', ids).gte('course_date', debut),
    supabase.from('daily_goals').select('student_id, day').in('student_id', ids).gte('day', debut),
    supabase.from('user_sourate_progress').select('user_id, sourate_id, validated_at, created_at').in('user_id', ids).eq('is_validated', true).eq('context', 'sourates'),
    supabase.from('sourates').select('id, number, name_french'),
    supabase.from('user_nourania_progress').select('user_id, lesson_id, completed_at, created_at').in('user_id', ids).eq('is_validated', true),
    supabase.from('nourania_lessons').select('id, lesson_number'),
    supabase.from('user_alphabet_progress').select('user_id').in('user_id', ids).eq('is_validated', true),
    supabase.from('alphabet_letters').select('id', { count: 'exact', head: true }),
    supabase.from('user_allah_name_progress').select('user_id, validated_at').in('user_id', ids).eq('is_validated', true),
    supabase.from('student_reports').select('id, student_id, period_label, note, appreciation, motivation, sent_at, snapshot, guide, show_note, traduction, langue_ar, share_token, updated_at').in('student_id', ids),
  ]);
  const err = q.find((r) => r.error)?.error;
  if (err) throw err;
  const reportIds = (q[17].data ?? []).map((r) => r.id);
  const [{ data: reads }, { data: envois }] = reportIds.length ? await Promise.all([
    supabase.from('bilan_reads').select('report_id, label, read_at').in('report_id', reportIds),
    supabase.from('bilan_envois').select('report_id, destinataire, canal, sent_at').in('report_id', reportIds),
  ]) : [{ data: [] }, { data: [] }];
  return {
    profiles: (q[0].data ?? []) as DonneesBilan['profiles'],
    memberships: q[1].data ?? [],
    groups: q[2].data ?? [],
    horaires: (q[3].data ?? []) as GroupSchedule[],
    devoirs: (q[4].data ?? []) as DonneesBilan['devoirs'],
    rendus: (q[5].data ?? []) as DonneesBilan['rendus'],
    attendance: q[6].data ?? [],
    justifs: q[7].data ?? [],
    behavior: q[8].data ?? [],
    goals: q[9].data ?? [],
    sourates: (q[10].data ?? []) as DonneesBilan['sourates'],
    sourateInfo: (q[11].data ?? []) as DonneesBilan['sourateInfo'],
    lessons: (q[12].data ?? []) as DonneesBilan['lessons'],
    lessonInfo: (q[13].data ?? []) as DonneesBilan['lessonInfo'],
    letters: q[14].data ?? [],
    lettersTotal: q[15].count ?? 28,
    names: q[16].data ?? [],
    reports: (q[17].data ?? []) as unknown as DonneesBilan['reports'],
    reads: reads ?? [],
    envois: envois ?? [],
  };
}

/** Calcule le bilan d'un élève sur la période (chiffres de l'appli, rien n'est inventé) */
export function calculerSnapshot(sid: string, d: DonneesBilan, holidays: Holiday[], periode: { debut: string; fin: string; label: string }, now = new Date()): BilanSnapshot {
  const profil = d.profiles.find((p) => p.user_id === sid);
  const groupes = d.memberships.filter((m) => m.user_id === sid).map((m) => m.group_id);
  const groupe = d.groups.find((g) => groupes.includes(g.id))?.name ?? null;
  const dansPeriode = (iso: string | null | undefined) => !!iso && iso.slice(0, 10) >= periode.debut && iso.slice(0, 10) <= periode.fin;

  // Devoirs de l'élève donnés pendant la période (visibles)
  const mine = d.devoirs.filter((x) => (x.student_id ? x.student_id === sid : x.group_id ? groupes.includes(x.group_id) : x.assigned_to === 'all')
    && (!x.visible_a || new Date(x.visible_a) <= now) && dansPeriode(x.visible_a || x.created_at));
  const lignes = mine.map((x) => {
    const horaire = horairePour(x.group_id, groupes, d.horaires, holidays);
    const rendu = heureDeRendu(x, horaire, holidays);
    const r = d.rendus.find((y) => y.devoir_id === x.id && y.student_id === sid);
    const fait = !!r && r.statut !== 'a_refaire';
    return { x, rendu, r, fait, echu: rendu <= now };
  });
  const devoirs = {
    donnes: lignes.length,
    faits: lignes.filter((l) => l.fait).length,
    premierCoup: lignes.filter((l) => l.r?.statut === 'corrige' && !l.r.a_ete_refait).length,
    refaits: lignes.filter((l) => l.r?.statut === 'corrige' && l.r.a_ete_refait).length,
    pasFaits: lignes.filter((l) => !l.fait && l.echu).length,
    retard: lignes.filter((l) => l.fait && l.r && new Date(l.r.rendu_at) > l.rendu).length,
    aValider: lignes.filter((l) => l.r?.statut === 'rendu').length,
  };

  // Présence (appel de Nadia + absences justifiées par les parents)
  const att = d.attendance.filter((a) => a.user_id === sid && dansPeriode(a.date));
  const just = new Set(d.justifs.filter((j) => j.student_id === sid && dansPeriode(j.course_date)).map((j) => j.course_date));
  const presents = att.filter((a) => a.status === 'present').length;
  const retards = att.filter((a) => a.status === 'late').length;
  const absents = att.filter((a) => a.status === 'absent').length;
  const justifiees = att.filter((a) => a.status === 'absent' && just.has(a.date)).length;
  const cours = presents + retards + absents;
  const presence = { cours, presents, retards, absents, justifiees, pct: pct(presents + retards, cours) };

  const beh = d.behavior.filter((b) => b.student_id === sid && dansPeriode(b.course_date));
  const comportement = {
    cours: new Set(beh.map((b) => b.course_date)).size,
    attentif: beh.filter((b) => b.kind === 'attentif').length,
    participe: beh.filter((b) => b.kind === 'participe').length,
    bavarde: beh.filter((b) => b.kind === 'bavarde').length,
  };

  const jours = d.goals.filter((g) => g.student_id === sid && dansPeriode(g.day)).map((g) => g.day);

  const types = [...new Set(lignes.map((l) => l.x.type))];
  const matieres = types.map((t) => ({ type: t, faits: lignes.filter((l) => l.x.type === t && l.fait).length, donnes: lignes.filter((l) => l.x.type === t).length }));

  // Progression (depuis le début) et ce qui a été appris pendant la période
  const sourMine = d.sourates.filter((s) => s.user_id === sid);
  const numero = (id: string) => d.sourateInfo.find((s) => s.id === id)?.number ?? 0;
  const nomSourate = (id: string) => d.sourateInfo.find((s) => s.id === id)?.name_french ?? '';
  const lecMine = d.lessons.filter((l) => l.user_id === sid);
  const numLecon = (id: string) => d.lessonInfo.find((l) => l.id === id)?.lesson_number ?? 0;
  const appris = {
    sourates: sourMine.filter((s) => dansPeriode(s.validated_at ?? s.created_at)).map((s) => nomSourate(s.sourate_id)).filter(Boolean),
    lecons: lecMine.filter((l) => dansPeriode(l.completed_at ?? l.created_at)).length,
    noms: d.names.filter((n) => n.user_id === sid && dansPeriode(n.validated_at)).length,
  };
  const progression = {
    sourates: sourMine.map((s) => numero(s.sourate_id)).filter(Boolean).sort((a, b) => b - a),
    nourania: lecMine.map((l) => numLecon(l.lesson_id)).filter(Boolean).sort((a, b) => a - b),
    nouraniaTotal: d.lessonInfo.length,
    alphabet: d.letters.filter((l) => l.user_id === sid).length,
    alphabetTotal: d.lettersTotal,
    noms: d.names.filter((n) => n.user_id === sid).length,
  };

  // Frise : un point par cours de la période
  const horaire = horairePour(null, groupes, d.horaires, holidays);
  const finFrise = new Date(Math.min(now.getTime(), new Date(`${periode.fin}T23:59:00`).getTime()));
  const datesCours = new Set([...coursPasses(horaire, holidays, new Date(`${periode.debut}T00:00:00`), finFrise).map(ymd), ...att.map((a) => a.date)]);
  const triees = [...datesCours].sort();
  const frise = triees.map((date, i) => {
    const a = att.find((x) => x.date === date);
    const statut: BilanSnapshot['frise'][number]['statut'] = a ? (a.status === 'present' ? 'present' : a.status === 'late' ? 'retard' : just.has(date) ? 'justifie' : 'absent') : just.has(date) ? 'justifie' : 'inconnu';
    const ceCours = lignes.filter((l) => ymd(l.rendu) === date);
    const avant = i > 0 ? triees[i - 1] : periode.debut;
    const acquis = sourMine.filter((s) => { const v = (s.validated_at ?? s.created_at ?? '').slice(0, 10); return v > avant && v <= date; }).map((s) => nomSourate(s.sourate_id)).filter(Boolean);
    return { date, statut, faits: ceCours.filter((l) => l.fait).length, donnes: ceCours.length, acquis };
  });

  // Trimestres précédents (bilans déjà envoyés) + celui-ci
  const anciens = d.reports.filter((r) => r.student_id === sid && r.snapshot && r.sent_at && r.period_label !== periode.label)
    .sort((a, b) => (a.sent_at || '').localeCompare(b.sent_at || ''))
    .map((r) => {
      const s = r.snapshot!;
      return { label: s.periode.label, presencePct: s.presence.pct, devoirsPct: pct(s.devoirs.faits, s.devoirs.donnes), premierCoup: s.devoirs.premierCoup, retard: s.devoirs.retard, sourates: s.appris.sourates.length };
    });
  const precedents = [...anciens, { label: periode.label, presencePct: presence.pct, devoirsPct: pct(devoirs.faits, devoirs.donnes), premierCoup: devoirs.premierCoup, retard: devoirs.retard, sourates: appris.sourates.length }];

  const serie = plusLongueSerie(jours);
  // Idée F : diplôme du trimestre (la plus belle réussite)
  const diplome = presence.cours >= 3 && presence.pct === 100 ? '100 % de présence'
    : appris.sourates.length >= 2 ? `${appris.sourates.length} sourates apprises`
    : devoirs.donnes >= 3 && devoirs.pasFaits === 0 && devoirs.faits === devoirs.donnes ? 'Tous les devoirs faits'
    : serie >= 7 ? `${serie} jours d'objectifs d'affilée`
    : appris.sourates.length === 1 ? `Sourate ${appris.sourates[0]} apprise`
    : appris.lecons >= 2 ? `${appris.lecons} leçons Nourania validées` : null;

  return {
    version: 1, prenom: prenomDe(profil?.full_name), fille: profil?.gender === 'fille', groupe,
    periode: { label: periode.label, debut: periode.debut, fin: periode.fin },
    presence, devoirs, comportement, serie, joursObjectif: new Set(jours).size, matieres, frise, progression, precedents, diplome, appris,
  };
}

/** Guide de la réunion pré-rempli (Nadia peut tout changer) */
export function guideAuto(s: BilanSnapshot, girl: boolean, prochaineSourate: string | null): BilanGuide {
  const g = (m: string, f: string) => (girl ? f : m);
  const forts: string[] = []; const travailler: string[] = []; const maison: string[] = []; const objectif: string[] = [];
  if (s.presence.pct !== null && s.presence.pct >= 85) forts.push(`Vient à presque tous les cours (${s.presence.presents + s.presence.retards}/${s.presence.cours})`);
  if (s.devoirs.premierCoup >= 2) forts.push(`${s.devoirs.premierCoup} devoirs validés du premier coup`);
  if (s.serie >= 5) forts.push(`Série de ${s.serie} jours d'objectifs`);
  if (s.appris.sourates.length) forts.push(`${pluriel(s.appris.sourates.length, 'sourate apprise', 'sourates apprises')} : ${s.appris.sourates.join(', ')}`);
  if (s.comportement.cours && s.comportement.participe >= s.comportement.cours / 2) forts.push('Participe bien en cours');
  for (const m of s.matieres) if (m.donnes >= 2 && m.faits / m.donnes < 0.6) travailler.push(`${matiereOf(m.type).label} (${m.faits} devoir${m.faits > 1 ? 's' : ''} sur ${m.donnes})`);
  if (s.devoirs.retard >= 2) travailler.push(`Rendre à l'heure (${s.devoirs.retard} retards)`);
  if (s.presence.pct !== null && s.presence.pct < 75) travailler.push(`La présence en cours (${s.presence.pct} %)`);
  if (s.comportement.bavarde >= 2) travailler.push(`Rester ${g('concentré', 'concentrée')} en cours`);
  if (travailler.some((t) => t.startsWith("99 noms"))) maison.push('10 minutes de révision des noms le soir');
  maison.push('Vérifier le cahier de texte la veille du cours');
  if (s.devoirs.pasFaits) maison.push('Faire les devoirs « à rattraper » en premier');
  if (prochaineSourate) objectif.push(`Apprendre la sourate ${prochaineSourate}`);
  objectif.push(s.devoirs.donnes ? 'Faire tous les devoirs, à l\'heure' : 'Venir à chaque cours');
  if (!forts.length) forts.push('Des efforts à encourager');
  return { forts, travailler, maison, objectif };
}

/** Idée B : phrases proposées d'après les chiffres */
export function phrasesProposees(s: BilanSnapshot, girl: boolean): string[] {
  const g = (m: string, f: string) => (girl ? f : m);
  const p = s.prenom;
  const out: string[] = [];
  if (s.presence.pct !== null && s.presence.pct >= 90) out.push(`${g('Très régulier', 'Très régulière')} en cours.`);
  if (s.devoirs.donnes && s.devoirs.premierCoup >= s.devoirs.donnes * 0.6) out.push('Rend presque tout du premier coup.');
  if (s.devoirs.retard >= 2) out.push('Doit rendre ses devoirs à l\'heure.');
  if (s.serie >= 5) out.push('Belle série d\'objectifs du jour 🔥');
  if (s.appris.sourates.length) out.push(`Belle progression en sourates (${s.appris.sourates.join(', ')}).`);
  if (s.devoirs.pasFaits >= 2) out.push(`${p} doit faire ses devoirs chaque semaine.`);
  if (s.presence.pct !== null && s.presence.pct < 75) out.push('Plus de présence aidera à progresser.');
  out.push(`${p} est ${g('sérieux', 'sérieuse')} et ${g('motivé', 'motivée')}, bravo.`);
  out.push('Il faut continuer à travailler un peu chaque jour.');
  return out;
}

/** Prochaine sourate à apprendre (Juz' Amma, en descendant) */
export function prochaineSourate(s: BilanSnapshot, info: { number: number; name_french: string }[]): string | null {
  const faites = new Set(s.progression.sourates);
  for (let n = 114; n >= 78; n--) if (!faites.has(n)) return info.find((x) => x.number === n)?.name_french ?? null;
  return null;
}

/** 🌍 Titres du bilan en arabe (écrits une fois pour toutes, à relire par Nadia) */
export const AR: Record<string, string> = {
  bilan: 'تقرير الفصل', presence: 'الحضور', cours: 'حصص', justifiee: 'غياب مبرَّر', justifiees: 'غيابات مبرَّرة',
  devoirsFaits: 'واجبات منجزة', premierCoup: 'مقبولة من المرة الأولى', refaits: 'أعيدت ثم قُبلت', pasFaits: 'غير منجزة',
  retard: 'سُلّمت متأخرة', attentif: 'الانتباه في الحصة', participe: 'المشاركة', serie: 'أيام متتالية', objectif: 'هدف اليوم',
  parMatiere: 'حسب المادة', appreciation: 'ملاحظة الأستاذة', motivation: 'كلمة إلى', guide: 'دليل اللقاء',
  forts: 'نقاط القوة', travailler: 'للتحسين', maison: 'في البيت', objectifProchain: 'هدف الفصل القادم', note: 'النقطة',
  details: 'تفاصيل أكثر', progression: 'مسار التقدّم', precedents: 'الفصول السابقة', diplome: 'شهادة الفصل',
  sourates: 'السور', nourania: 'النورانية', alphabet: 'الحروف', noms: 'الأسماء الحسنى', present: 'حاضر', absent: 'غائب',
  ceTrimestre: 'هذا الفصل', avant: 'الفصل السابق', aValider: 'في انتظار التصحيح',
};

/** 💌 Messages proposés pour l'enfant (repris de l'ancien écran « 📈 Bilans ») */
export function messagesEnfant(s: BilanSnapshot): string[] {
  const g = (m: string, f: string) => (s.fille ? f : m);
  const bon = (s.presence.pct ?? 100) >= 80 && (!s.devoirs.donnes || s.devoirs.faits / s.devoirs.donnes >= 0.8);
  return bon ? [
    'Bravo, continue comme ça, tu es sur un très beau chemin ! 🌟',
    "Qu'Allah te récompense pour tes efforts, continue ainsi ! 💎",
    `Tu peux être ${g('fier', 'fière')} de toi, bonnes vacances ! 🎉`,
  ] : [
    "Un peu chaque jour, et tu vas faire de grands progrès, inch'Allah ! 💪",
    "Ne te décourage pas, chaque petit pas compte, inch'Allah ! 🌱",
    'Je crois en toi : après les vacances, on vise encore plus haut ! 🚀',
  ];
}

/** Élève qui décroche ou qui progresse (bilan du groupe, idée K) */
export function tendance(s: BilanSnapshot): 'decroche' | 'progresse' | null {
  const dev = s.devoirs.donnes ? s.devoirs.faits / s.devoirs.donnes : null;
  if ((dev !== null && dev < 0.5) || (s.presence.pct !== null && s.presence.pct < 60)) return 'decroche';
  const [a, b] = s.precedents.slice(-2);
  if (a && b && b !== a && ((b.devoirsPct ?? 0) - (a.devoirsPct ?? 0) >= 10 || (b.presencePct ?? 0) - (a.presencePct ?? 0) >= 10)) return 'progresse';
  return null;
}

/** Numéro français → format international pour WhatsApp (06… → 336…) */
export function numeroWhatsApp(tel: string): string {
  const d = tel.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d.slice(1);
  if (d.startsWith('00')) return d.slice(2);
  if (d.startsWith('0')) return `33${d.slice(1)}`;
  return d;
}


/** Ce que l'appli SAIT de l'envoi (elle ne voit pas si le message est vraiment parti) */
export const libelleEnvoi = (canal: string, qui: string) =>
  canal === 'whatsapp' ? `💬 WhatsApp ouvert vers ${qui}` : canal === 'sms' ? `📱 SMS ouvert vers ${qui}` : canal === 'partage' ? `📤 Image + PDF : partage ouvert pour ${qui}`
  : canal === 'copie' ? `📋 Message copié (pour ${qui})` : canal === 'relance' ? '🔔 Parents relancés (notification)' : `📥 Image et PDF téléchargés (pour ${qui})`;
