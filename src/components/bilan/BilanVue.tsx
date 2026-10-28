import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { matiereOf } from '@/lib/devoirMatieres';
import { AR, titrePeriode, type BilanGuide, type BilanSnapshot, type BilanTraduction } from '@/lib/bilanTrimestriel';

export interface BilanContenu {
  snapshot: BilanSnapshot;
  appreciation: string | null;
  motivation: string | null;
  note: number | null;
  guide: BilanGuide | null;
  traduction: BilanTraduction | null;
  langueAr: string | null;
}

const jourCourt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const pctTexte = (n: number | null) => (n === null ? '—' : `${n} %`);

/** Textes français de la fiche ; l'arabe vient du dictionnaire AR */
const FR = {
  bilan: 'Bilan du trimestre', presence: 'présence', justifiee: 'absence justifiée', justifiees: 'absences justifiées',
  devoirsFaits: 'devoirs faits', premierCoup: 'validés du 1er coup', refaits: 'refaits puis validés', pasFaits: 'pas faits',
  retard: 'rendus en retard', attentif: 'attention en cours', participe: 'participation', serie: "jours d'affilée", objectif: 'objectif du jour',
  parMatiere: 'Par matière', appreciation: 'Appréciation', motivation: 'Un mot pour', guide: 'Guide de la réunion',
  forts: '🌟 Points forts', travailler: '🎯 À travailler', maison: '🏠 À la maison', objectifProchain: '🚀 Objectif du prochain trimestre',
  note: 'Note', details: '📅 Plus de détails', progression: '🧭 Voir la progression', precedents: '📈 Voir les trimestres précédents',
  diplome: 'Diplôme du trimestre', sourates: '📖 Sourates', nourania: '✨ Nourania', alphabet: '🔤 Alphabet', noms: '🌟 99 noms',
  ceTrimestre: 'Ce trimestre', avant: 'Avant', cours: 'cours', aValider: 'à valider',
};

const STATUT = {
  present: { c: 'bg-emerald-500', fr: 'Présent', ar: AR.present },
  retard: { c: 'bg-amber-400', fr: 'En retard', ar: AR.present },
  absent: { c: 'bg-red-500', fr: 'Absent', ar: AR.absent },
  justifie: { c: 'bg-sky-500', fr: 'Absence justifiée', ar: AR.justifiee },
  inconnu: { c: 'bg-slate-300', fr: 'Appel non fait', ar: '—' },
} as const;

/**
 * 📊 Le bilan tel que les parents le voient (maquette validée le 2026-10-28) : tuiles, matières, appréciation, mot pour l'enfant,
 * guide de la réunion, puis 3 boutons dépliables. `exportMode` = tout déplié, sans boutons (image et PDF envoyés par message).
 */
export const BilanVue = forwardRef<HTMLDivElement, BilanContenu & { exportMode?: boolean; langueForcee?: 'fr' | 'ar' }>(
  function BilanVue({ snapshot: s, appreciation, motivation, note, guide, traduction, langueAr, exportMode, langueForcee }, ref) {
    const [langue, setLangue] = useState<'fr' | 'ar'>('fr');
    const [ouvert, setOuvert] = useState({ details: false, progression: false, precedents: false });
    const ar = (langueForcee ?? langue) === 'ar';
    const T = ar ? { ...FR, ...AR, forts: `🌟 ${AR.forts}`, travailler: `🎯 ${AR.travailler}`, maison: `🏠 ${AR.maison}`, objectifProchain: `🚀 ${AR.objectifProchain}`,
      details: `📅 ${AR.details}`, progression: `🧭 ${AR.progression}`, precedents: `📈 ${AR.precedents}`, sourates: `📖 ${AR.sourates}`, nourania: `✨ ${AR.nourania}`,
      alphabet: `🔤 ${AR.alphabet}`, noms: `🌟 ${AR.noms}`, parMatiere: AR.parMatiere } : FR;
    const g = ar && traduction?.guide ? traduction.guide : guide;
    const appr = ar ? traduction?.appreciation ?? appreciation : appreciation;
    const motiv = ar ? traduction?.motivation ?? motivation : motivation;
    const p = s.presence; const d = s.devoirs; const c = s.comportement;
    const montrer = (k: keyof typeof ouvert) => exportMode || ouvert[k];

    const tuiles: { v: string; l: string; s?: string; cls: string }[] = [
      { v: pctTexte(p.pct), l: T.presence, s: `${p.presents + p.retards}/${p.cours} ${T.cours}${p.justifiees ? ` · ${p.justifiees} ${p.justifiees > 1 ? T.justifiees : T.justifiee}` : ''}`, cls: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
      { v: `${d.faits}/${d.donnes}`, l: T.devoirsFaits, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
      { v: String(d.premierCoup), l: T.premierCoup, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
      { v: String(d.refaits), l: T.refaits, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
      { v: String(d.pasFaits), l: T.pasFaits, cls: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
      { v: String(d.retard), l: T.retard, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
      ...(c.cours ? [
        { v: `🙂 ${c.attentif}`, l: T.attentif, s: `/ ${c.cours} ${T.cours}`, cls: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
        { v: `✋ ${c.participe}`, l: T.participe, s: `/ ${c.cours} ${T.cours}`, cls: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
      ] : []),
      ...(s.serie ? [{ v: `🔥 ${s.serie}`, l: T.serie, s: T.objectif, cls: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' }] : []),
      ...(note !== null ? [{ v: `${String(note).replace('.', ',')}/20`, l: T.note, cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' }] : []),
    ];

    const Depliable = ({ k, titre, children }: { k: keyof typeof ouvert; titre: string; children: React.ReactNode }) => (
      <div className="rounded-xl border-2 border-border overflow-hidden">
        {exportMode ? <p className="bg-muted px-3 py-2 text-sm font-extrabold">{titre}</p> : (
          <button type="button" aria-expanded={ouvert[k]} onClick={() => setOuvert((o) => ({ ...o, [k]: !o[k] }))}
            className="w-full flex items-center justify-between gap-2 bg-muted px-3 py-2.5 text-start text-sm font-extrabold">
            <span>{titre}</span><span>{ouvert[k] ? '▲' : '▼'}</span>
          </button>
        )}
        {montrer(k) && <div className="p-3 space-y-2">{children}</div>}
      </div>
    );

    return (
      <div ref={ref} dir={ar ? 'rtl' : 'ltr'} className={cn('bg-card text-foreground rounded-2xl p-3 sm:p-4 space-y-3', ar && 'font-arabic')}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-lg font-extrabold [overflow-wrap:anywhere]">{s.prenom}{s.groupe ? ` · ${s.groupe}` : ''}</p>
            <p className="text-xs font-bold text-muted-foreground">{T.bilan} · {ar ? s.periode.label.replace(/^Avant les /, '') : titrePeriode(s.periode.label, s.periode.fin)}</p>
          </div>
          {!exportMode && !langueForcee && traduction && langueAr && (
            <div className="flex rounded-full bg-muted p-0.5" role="group" aria-label="Langue">
              <button type="button" aria-pressed={!ar} onClick={() => setLangue('fr')} className={cn('rounded-full px-3 py-1 text-xs font-extrabold', !ar ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground')}>Français</button>
              <button type="button" aria-pressed={ar} onClick={() => setLangue('ar')} className={cn('rounded-full px-3 py-1 text-xs font-extrabold font-arabic', ar ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground')}>العربية</button>
            </div>
          )}
        </div>

        {s.diplome && (
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-amber-100 to-violet-100 dark:from-amber-950/40 dark:to-violet-950/40 px-3 py-2.5">
            <span className="text-3xl">🏅</span>
            <span className="text-sm font-extrabold [overflow-wrap:anywhere]">{T.diplome} : {s.diplome}</span>
          </div>
        )}

        <div className="grid grid-cols-2 min-[400px]:grid-cols-3 gap-2">
          {tuiles.map((t, i) => (
            <div key={i} className={cn('rounded-xl p-2.5 min-w-0', t.cls)}>
              <p className="text-xl font-extrabold tabular-nums">{t.v}</p>
              <p className="text-[11.5px] font-bold leading-tight text-muted-foreground">{t.l}</p>
              {t.s && <p className="text-[10.5px] text-muted-foreground">{t.s}</p>}
            </div>
          ))}
        </div>

        {s.matieres.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-sm font-extrabold">{T.parMatiere}</p>
            {s.matieres.map((m) => {
              const r = m.donnes ? m.faits / m.donnes : 0;
              return (
                <div key={m.type} className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_auto] items-center gap-2 text-sm">
                  <span className="[overflow-wrap:anywhere]">{matiereOf(m.type).emoji} {matiereOf(m.type).label}</span>
                  <span className="h-2.5 rounded-full bg-muted overflow-hidden"><i className={cn('block h-full rounded-full', r >= 0.8 ? 'bg-emerald-500' : r >= 0.5 ? 'bg-amber-400' : 'bg-red-500')} style={{ width: `${Math.round(r * 100)}%` }} /></span>
                  <span className="rounded-full bg-sky-100 dark:bg-sky-950/50 px-2 py-0.5 text-[11px] font-extrabold text-sky-800 dark:text-sky-200 tabular-nums">{m.faits}/{m.donnes}</span>
                </div>
              );
            })}
          </div>
        )}

        {appr && (
          <div className="space-y-1">
            <p className="text-sm font-extrabold">💬 {T.appreciation}</p>
            <p className={cn('rounded-xl bg-amber-50/70 dark:bg-slate-800 border-s-4 border-red-300 dark:border-red-800 px-3 py-2 text-lg leading-snug [overflow-wrap:anywhere]', ar ? 'font-arabic' : 'cahier-main')}>{appr}</p>
          </div>
        )}
        {motiv && (
          <div className="space-y-1">
            <p className="text-sm font-extrabold">💌 {`${ar ? AR.motivation : T.motivation} ${s.prenom}`}</p>
            <p className="rounded-xl bg-violet-50 dark:bg-violet-950/30 px-3 py-2 text-sm font-semibold [overflow-wrap:anywhere]">{motiv}</p>
          </div>
        )}

        {g && (g.forts.length + g.travailler.length + g.maison.length + g.objectif.length > 0) && (
          <div className="space-y-2">
            <p className="text-sm font-extrabold">🧭 {T.guide}</p>
            {([['forts', 'bg-emerald-50 dark:bg-emerald-950/30'], ['travailler', 'bg-amber-50 dark:bg-amber-950/30'], ['maison', 'bg-sky-50 dark:bg-sky-950/30'], ['objectif', 'bg-red-50 dark:bg-red-950/30']] as const)
              .filter(([k]) => g[k].length).map(([k, cls]) => (
                <div key={k} className={cn('rounded-xl px-3 py-2', cls)}>
                  <p className="text-sm font-extrabold mb-0.5">{k === 'objectif' ? T.objectifProchain : T[k]}</p>
                  <ul className="list-disc ps-5 text-sm space-y-0.5">{g[k].map((x, i) => <li key={i} className="[overflow-wrap:anywhere]">{x}</li>)}</ul>
                </div>
              ))}
          </div>
        )}

        <Depliable k="details" titre={T.details}>
          {s.frise.length ? s.frise.map((f) => (
            <div key={f.date} className="grid grid-cols-[4.5rem_14px_minmax(0,1fr)] items-start gap-2 text-sm">
              <b className="tabular-nums">{jourCourt(f.date)}</b>
              <span className={cn('mt-1 h-3.5 w-3.5 rounded-full', STATUT[f.statut].c)} />
              <span className="[overflow-wrap:anywhere]">{ar ? `${STATUT[f.statut].ar}${s.fille && (f.statut === 'present' || f.statut === 'absent') ? 'ة' : ''}` : `${STATUT[f.statut].fr}${s.fille && (f.statut === 'present' || f.statut === 'absent') ? 'e' : ''}`}{f.donnes ? ` · ${f.faits}/${f.donnes}` : ''}{f.acquis.length ? ` · ${f.acquis.join(', ')} ✓` : ''}</span>
            </div>
          )) : <p className="text-sm text-muted-foreground">—</p>}
        </Depliable>

        <Depliable k="progression" titre={T.progression}>
          <div>
            <p className="text-sm font-bold">{T.sourates}</p>
            <div className="mt-1 flex flex-wrap gap-1" dir="ltr">
              {Array.from({ length: Math.max(10, 115 - Math.min(110, ...(s.progression.sourates.length ? s.progression.sourates : [110])) + 2) }, (_, i) => 114 - i).filter((n) => n >= 78).map((n, i, arr) => {
                const on = s.progression.sourates.includes(n);
                const cur = !on && (i === 0 || s.progression.sourates.includes(arr[i - 1]));
                return <span key={n} className={cn('h-7 w-8 rounded-lg grid place-items-center text-[11px] font-extrabold', on ? 'bg-emerald-500 text-white' : cur ? 'bg-amber-400 text-amber-950' : 'bg-muted text-muted-foreground')}>{n}</span>;
              })}
            </div>
          </div>
          {s.progression.nouraniaTotal > 0 && (
            <div>
              <p className="text-sm font-bold">{T.nourania}</p>
              <div className="mt-1 flex flex-wrap gap-1" dir="ltr">
                {Array.from({ length: s.progression.nouraniaTotal }, (_, i) => i + 1).map((n) => {
                  const on = s.progression.nourania.includes(n);
                  const cur = !on && (n === 1 || s.progression.nourania.includes(n - 1));
                  return <span key={n} className={cn('h-7 w-7 rounded-lg grid place-items-center text-[11px] font-extrabold', on ? 'bg-emerald-500 text-white' : cur ? 'bg-amber-400 text-amber-950' : 'bg-muted text-muted-foreground')}>{n}</span>;
                })}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-200">{T.alphabet} : {s.progression.alphabet} / {s.progression.alphabetTotal}</span>
            <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 px-2.5 py-0.5 text-xs font-extrabold text-amber-800 dark:text-amber-200">{T.noms} : {s.progression.noms} / 99</span>
          </div>
        </Depliable>

        <Depliable k="precedents" titre={T.precedents}>
          {s.precedents.length < 2 ? (
            <p className="text-sm text-muted-foreground">{ar ? 'هذا أول تقرير.' : 'C\'est le premier bilan : la comparaison apparaîtra au prochain trimestre.'}</p>
          ) : (() => {
            const a = s.precedents[s.precedents.length - 2]; const b = s.precedents[s.precedents.length - 1];
            const ligne = (label: string, x: number | null, y: number | null, suffixe = '', inverse = false) => {
              const diff = x === null || y === null ? null : y - x;
              const bien = diff === null ? null : inverse ? diff <= 0 : diff >= 0;
              return (
                <tr key={label}><td className="py-1.5 pe-2">{label}</td><td className="tabular-nums">{x === null ? '—' : `${x}${suffixe}`}</td><td className="tabular-nums">{y === null ? '—' : `${y}${suffixe}`}</td>
                  <td className={cn('font-extrabold tabular-nums', bien === null ? '' : bien ? 'text-emerald-600' : 'text-red-600')}>{diff === null || diff === 0 ? '=' : `${diff > 0 ? '▲ +' : '▼ '}${diff}`}</td></tr>
              );
            };
            return (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="text-[11px] uppercase text-muted-foreground"><th className="text-start"></th><th className="text-start">{T.avant}</th><th className="text-start">{T.ceTrimestre}</th><th></th></tr></thead>
                <tbody>
                  {ligne(`🙋 ${ar ? AR.presence : 'Présence'}`, a.presencePct, b.presencePct, ' %')}
                  {ligne(`📚 ${ar ? AR.devoirsFaits : 'Devoirs faits'}`, a.devoirsPct, b.devoirsPct, ' %')}
                  {ligne(`✅ ${ar ? AR.premierCoup : 'Du 1er coup'}`, a.premierCoup, b.premierCoup)}
                  {ligne(`⏰ ${ar ? AR.retard : 'En retard'}`, a.retard, b.retard, '', true)}
                  {ligne(`📖 ${ar ? AR.sourates : 'Sourates apprises'}`, a.sourates, b.sourates)}
                </tbody>
              </table></div>
            );
          })()}
        </Depliable>
      </div>
    );
  },
);
