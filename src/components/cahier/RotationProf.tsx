import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { matiereOf } from '@/lib/devoirMatieres';
import { cleCours, compteARebours, jourCourt, type Decision, type Rangement } from '@/lib/rotationDevoirs';

/** Un devoir vu pour UN élève, déjà rangé par la rotation */
export interface LigneProf {
  eleveId: string;
  devoirId: string;
  titre: string;
  type: string;
  statut: string | null;
  renduAt: string | null;
  fait: boolean;
  rang: Rangement;
  heureRendu: Date;
  rattraper: boolean;
  retard: boolean;
  decision?: Decision;
  /** Préparé à l'avance, pas encore visible par l'élève (idée 2) */
  visibleLe?: Date | null;
}

type Onglet = 'semaine' | 'passee' | 'historique';
const jourLong = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

function pastille(l: LigneProf, passe: boolean) {
  const retard = l.retard ? ' · ⏰ en retard' : '';
  if (l.statut === 'corrige') return { t: `✅ Validé${retard}`, c: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' };
  if (l.statut === 'rendu') return { t: `🟠 Envoyé${retard} · à valider`, c: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200' };
  if (l.statut === 'a_refaire') return { t: '🔄 À refaire', c: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200' };
  return passe ? { t: '✗ Pas fait', c: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200' } : { t: '⏳ Pas encore envoyé', c: 'bg-muted text-muted-foreground' };
}

/**
 * 📚 Devoirs du groupe côté professeur, avec la rotation à l'heure du cours (2026-10-27, mêmes choix que l'élève) :
 * bandeau à l'heure du cours, boîte « 🔁 À rattraper dans le groupe », onglets Cette semaine · Semaine passée (bilan, idée 1)
 * · Historique (bande de semaines + par matière), « 🔁 Redonner » un devoir pas fait (idée 3).
 */
export function RotationProf({ eleves, lignes, prochainCours, coursHistorique, onDecision, onDelete, onDonner }: {
  eleves: { user_id: string; full_name: string | null }[];
  lignes: LigneProf[];
  prochainCours: Date | null;
  coursHistorique: Date[];
  onDecision: (items: { devoirId: string; studentId: string }[], decision: Decision) => void;
  onDelete: (devoirId: string, titre: string) => void;
  onDonner: () => void;
}) {
  const [onglet, setOnglet] = useState<Onglet>('semaine');
  const [ouverts, setOuverts] = useState<Record<string, boolean>>({});
  const [semaineChoisie, setSemaineChoisie] = useState<string | null>(null);
  const [matiere, setMatiere] = useState<string | null>(null);
  const bande = useRef<HTMLDivElement>(null);
  const nom = (id: string) => eleves.find((e) => e.user_id === id)?.full_name || 'Élève';

  const rattraper = lignes.filter((l) => l.rattraper);
  const semaine = lignes.filter((l) => l.rang === 'semaine');
  const passee = lignes.filter((l) => l.rang === 'passee');
  const historique = lignes.filter((l) => l.rang === 'historique');
  const pasFaitsPassee = passee.filter((l) => !l.fait).length;

  const semaines = useMemo(() => {
    const m = new Map<string, Date>();
    coursHistorique.forEach((c) => m.set(cleCours(c), c));
    historique.forEach((l) => m.set(cleCours(l.heureRendu), l.heureRendu));
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [coursHistorique, historique]);
  const semaineActive = semaineChoisie ?? semaines[semaines.length - 1]?.[0] ?? null;
  useEffect(() => {
    if (onglet === 'historique' && bande.current) bande.current.scrollLeft = bande.current.scrollWidth;
  }, [onglet, semaines.length]);

  // 🕑 À l'heure du cours : la semaine passée est rangée, il reste à donner les nouveaux devoirs
  const heureDuCours = semaine.length === 0 && passee.length > 0;

  const ligne = (l: LigneProf, passe: boolean) => {
    const m = matiereOf(l.type);
    const p = pastille(l, passe);
    return (
      <div key={`${l.devoirId}-${l.eleveId}`} className={cn('bg-background rounded-xl p-2.5 flex items-center gap-2 shadow-sm', passe && 'opacity-80')}>
        <span className="text-lg shrink-0">{m.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="cahier-main text-lg leading-6 [overflow-wrap:anywhere]">{l.titre}</p>
          <span className={cn('mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold', p.c)}>{p.t}</span>
          {l.rattraper && <span className="mt-0.5 ml-1 inline-block rounded-full bg-red-100 dark:bg-red-950/40 px-2 py-0.5 text-[11px] font-bold text-red-800 dark:text-red-200">🔁 à rattraper</span>}
          {l.visibleLe && <span className="mt-0.5 ml-1 inline-block rounded-full bg-sky-100 dark:bg-sky-950/40 px-2 py-0.5 text-[11px] font-bold text-sky-800 dark:text-sky-200">🕑 visible {jourCourt(l.visibleLe)} à {l.visibleLe.getHours()} h{l.visibleLe.getMinutes() ? String(l.visibleLe.getMinutes()).padStart(2, '0') : ''}</span>}
          {l.decision === 'historique' && !l.fait && <span className="mt-0.5 ml-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">📚 rangé</span>}
        </div>
        {/* Idée 3 : redonner un devoir pas fait (il remonte dans « À rattraper » chez l'élève) */}
        {passe && !l.fait && !l.rattraper && (
          <button type="button" onClick={() => onDecision([{ devoirId: l.devoirId, studentId: l.eleveId }], 'rattraper')}
            className="shrink-0 rounded-full border border-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 text-[11px] font-extrabold text-sky-800 dark:text-sky-200">🔁 Redonner</button>
        )}
        <button type="button" onClick={() => onDelete(l.devoirId, l.titre)} aria-label="Supprimer ce devoir"
          className="shrink-0 h-8 w-8 grid place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
      </div>
    );
  };

  /** Une carte par élève (tous les élèves, même sans devoir dans l'onglet) */
  const parEleve = (liste: LigneProf[], passe: boolean) => eleves.map((e) => {
    const siens = liste.filter((l) => l.eleveId === e.user_id);
    const pasFaits = siens.filter((l) => !l.fait).length;
    const aValider = siens.filter((l) => l.statut === 'rendu').length;
    const couleur = aValider ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20'
      : siens.length && !pasFaits ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
      : passe && pasFaits ? 'border-red-300 bg-red-50/60 dark:bg-red-950/20' : 'border-border bg-muted/30';
    const cle = `${onglet}-${e.user_id}`;
    return (
      <div key={e.user_id} className={cn('mb-2 rounded-xl overflow-hidden border-2', couleur)}>
        <button type="button" onClick={() => setOuverts((o) => ({ ...o, [cle]: !o[cle] }))} className="w-full flex items-center gap-2 p-3 text-left">
          <span className="flex-1 min-w-0 font-semibold text-sm [overflow-wrap:anywhere]">👤 {e.full_name} ({siens.length} devoir{siens.length > 1 ? 's' : ''})</span>
          {passe && pasFaits > 0 && <span className="shrink-0 rounded-full bg-destructive px-1.5 min-w-[20px] h-5 grid place-items-center text-[11px] font-bold text-destructive-foreground">{pasFaits}</span>}
          {ouverts[cle] ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        {ouverts[cle] && (
          <div className="px-3 pb-3 space-y-2">
            {siens.length ? siens.map((l) => ligne(l, passe)) : <p className="text-xs text-muted-foreground text-center py-2">Aucun devoir ici</p>}
          </div>
        )}
      </div>
    );
  });

  // Idée 1 : bilan automatique de la semaine passée
  const bilan = (() => {
    const avec = eleves.filter((e) => passee.some((l) => l.eleveId === e.user_id));
    const toutFait = avec.filter((e) => passee.filter((l) => l.eleveId === e.user_id).every((l) => l.fait));
    const aValider = passee.filter((l) => l.statut === 'rendu').length;
    const pasFait = avec.filter((e) => !toutFait.includes(e));
    // Un devoir pas fait par plusieurs élèves : « Redonner à tous » d'un coup
    const parDevoir = new Map<string, LigneProf[]>();
    passee.filter((l) => !l.fait && !l.rattraper).forEach((l) => parDevoir.set(l.devoirId, [...(parDevoir.get(l.devoirId) || []), l]));
    return { avec, toutFait, aValider, pasFait, parDevoir };
  })();

  const onglets: { k: Onglet; t: string; n?: number }[] = [
    { k: 'semaine', t: 'Cette semaine' }, { k: 'passee', t: 'Semaine passée', n: pasFaitsPassee }, { k: 'historique', t: 'Historique' },
  ];
  const matieresHisto = [...new Set(historique.map((l) => l.type))];
  const histoVu = matiere ? historique.filter((l) => l.type === matiere) : historique.filter((l) => cleCours(l.heureRendu) === semaineActive);
  const reste = prochainCours ? compteARebours(prochainCours) : null;

  return (
    <div className="space-y-3">
      {heureDuCours && (
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-sky-50 dark:from-amber-950/30 dark:to-sky-950/20 dark:border-amber-800 p-3 space-y-2">
          <p className="text-sm font-extrabold text-amber-900 dark:text-amber-100">🕑 C'est l'heure du cours : la semaine passée est rangée en grisé. Donne les devoirs de la semaine.</p>
          <button type="button" onClick={onDonner} className="w-full rounded-xl bg-[#2457a5] text-white py-2 text-sm font-extrabold">📚 Donner les devoirs</button>
        </div>
      )}

      {rattraper.length > 0 && (
        <div className="rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/20 dark:border-red-800 p-3 space-y-1.5">
          <p className="text-sm font-extrabold text-red-800 dark:text-red-200">🔁 À rattraper dans le groupe ({rattraper.length})</p>
          {rattraper.sort((a, b) => a.heureRendu.getTime() - b.heureRendu.getTime()).map((l) => (
            <div key={`${l.devoirId}-${l.eleveId}`} className="flex items-center gap-2 rounded-xl bg-card/90 px-2.5 py-1.5">
              <span className="flex-1 min-w-0 text-sm [overflow-wrap:anywhere]"><b>{nom(l.eleveId)}</b> · {matiereOf(l.type).emoji} <span className="cahier-main text-base">{l.titre}</span>
                <span className="block text-[11px] text-muted-foreground">Cours du {jourCourt(l.heureRendu)}{l.statut === 'a_refaire' ? ' · 🔄 à refaire' : ''}</span></span>
              <button type="button" onClick={() => onDecision([{ devoirId: l.devoirId, studentId: l.eleveId }], 'historique')}
                className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold text-muted-foreground bg-card">📚 Ranger</button>
            </div>
          ))}
        </div>
      )}

      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {onglets.map((o) => (
          <button key={o.k} type="button" role="tab" aria-selected={onglet === o.k} onClick={() => setOnglet(o.k)}
            className={cn('rounded-lg px-1.5 py-2 text-[13px] sm:text-sm font-extrabold leading-tight', onglet === o.k ? 'bg-card shadow-sm text-[#2457a5] dark:text-sky-300' : 'text-muted-foreground')}>
            {o.t}
            {!!o.n && <span className="ml-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground align-middle">{o.n}</span>}
          </button>
        ))}
      </div>

      {onglet === 'semaine' && (
        <div className="space-y-2">
          {prochainCours && (
            <div className="flex flex-wrap items-center gap-2">
              <p className="cahier-main text-lg flex-1 min-w-[10rem]">Pour {jourLong(prochainCours)} :</p>
              {reste && <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold', reste.veille ? 'bg-orange-100 text-orange-800' : 'bg-sky-100 text-sky-800')}>{reste.texte}</span>}
            </div>
          )}
          {parEleve(semaine, false)}
        </div>
      )}

      {onglet === 'passee' && (
        <div className="space-y-2">
          {bilan.avec.length > 0 && (
            <div className="rounded-xl border-2 border-sky-200 bg-sky-50/70 dark:bg-sky-950/20 dark:border-sky-900 p-2.5 space-y-1.5">
              <div className="flex flex-wrap gap-1.5 text-[12px] font-extrabold">
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5">✅ {bilan.toutFait.length} / {bilan.avec.length} ont tout fait</span>
                {bilan.aValider > 0 && <span className="rounded-full bg-orange-100 text-orange-800 px-2.5 py-0.5">🟠 {bilan.aValider} à valider</span>}
              </div>
              {bilan.pasFait.length > 0 && <p className="text-xs font-semibold text-red-800 dark:text-red-200 [overflow-wrap:anywhere]">❌ Pas tout fait : {bilan.pasFait.map((e) => e.full_name).join(', ')}</p>}
              {[...bilan.parDevoir.values()].filter((ls) => ls.length > 1).map((ls) => (
                <button key={ls[0].devoirId} type="button" onClick={() => onDecision(ls.map((l) => ({ devoirId: l.devoirId, studentId: l.eleveId })), 'rattraper')}
                  className="w-full rounded-lg border border-sky-300 bg-card px-2.5 py-1.5 text-left text-xs font-bold text-sky-800 dark:text-sky-200 [overflow-wrap:anywhere]">
                  🔁 Redonner « {ls[0].titre} » aux {ls.length} élèves qui ne l'ont pas fait
                </button>
              ))}
            </div>
          )}
          {parEleve(passee, true)}
        </div>
      )}

      {onglet === 'historique' && (
        <div className="space-y-2">
          {semaines.length > 0 ? (
            <div ref={bande} className="flex gap-1.5 overflow-x-auto pb-1 snap-x [scrollbar-width:thin]">
              {semaines.map(([k, c]) => {
                const ls = historique.filter((l) => cleCours(l.heureRendu) === k);
                const actif = !matiere && k === semaineActive;
                return (
                  <button key={k} type="button" aria-pressed={actif} onClick={() => { setMatiere(null); setSemaineChoisie(k); }}
                    className={cn('snap-end shrink-0 rounded-xl border-2 px-2.5 py-1.5 text-center leading-tight', actif ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40' : 'border-border bg-card', !ls.length && 'opacity-50')}>
                    <span className="block text-[11px] font-extrabold">{c.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    <span className="block text-[10px]">{!ls.length ? '—' : ls.some((l) => !l.fait) ? `✗ ${ls.filter((l) => !l.fait).length}` : '✓'}</span>
                  </button>
                );
              })}
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-2">Pas encore d'historique</p>}
          {matieresHisto.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setMatiere(null)} aria-pressed={!matiere}
                className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', !matiere ? 'bg-sky-600 text-white border-sky-600' : 'bg-card')}>📅 Par semaine</button>
              {matieresHisto.map((t) => (
                <button key={t} type="button" onClick={() => setMatiere(t)} aria-pressed={matiere === t}
                  className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', matiere === t ? 'bg-sky-600 text-white border-sky-600' : 'bg-card')}>{matiereOf(t).emoji} {matiereOf(t).label}</button>
              ))}
            </div>
          )}
          {!matiere && semaineActive && <p className="cahier-main text-lg text-muted-foreground">Cours du {jourLong(new Date(semaineActive + 'T12:00:00'))}</p>}
          {parEleve(histoVu, true)}
        </div>
      )}
    </div>
  );
}
