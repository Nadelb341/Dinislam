import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { matiereOf } from '@/lib/devoirMatieres';
import { cleCours, compteARebours, estFaitRange, jourCourt, type Rangement } from '@/lib/rotationDevoirs';

/** Un devoir déjà rangé par la rotation (voir src/lib/rotationDevoirs.ts) */
export interface DevoirRange {
  id: string;
  titre: string;
  type: string;
  date_limite?: string;
  statut_rendu: string | null;
  rendu: boolean;
  etapes: string[];
  etapesFaites: number[];
  rang: Rangement;
  /** Heure du cours où ce devoir est attendu */
  heureRendu: Date;
  rattraper: boolean;
  retard: boolean;
}

export type Onglet = 'semaine' | 'passee' | 'historique';

const jourLong = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/** Pastille d'état d'un devoir */
function etat(d: DevoirRange, passe: boolean) {
  const fait = estFaitRange(d);
  if (d.statut_rendu === 'a_refaire') return { t: '🔄 à refaire', c: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200' };
  if (!fait) return passe ? { t: '✗ pas fait', c: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200' } : { t: 'à faire', c: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200' };
  const retard = d.retard ? ' · ⏰ en retard' : '';
  if (d.statut_rendu === 'corrige') return { t: `💎 validé${retard}`, c: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200' };
  return { t: `🟠 envoyé${retard}`, c: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200' };
}

/**
 * 📓 Cahier de texte en 3 onglets (proposition B, 2026-10-27) : « Cette semaine » (ouvert par défaut) · « Semaine passée » (grisé)
 * · « Historique » (bande de semaines à faire glisser, proposition C, + filtre par matière, idée 6).
 * Les devoirs sont écrits à la main (proposition D). Les devoirs pas faits montent dans « 🔁 À rattraper » (proposition E).
 * Le même composant sert au professeur (`renderLigne` / `entete` adaptés).
 */
export function CahierRotation({ devoirs, renderDetail, prochainCours, pageKey, coursHistorique, vide }: {
  devoirs: DevoirRange[];
  renderDetail: (d: DevoirRange) => React.ReactNode;
  /** Prochain cours (compte à rebours quand aucun devoir n'est encore donné) */
  prochainCours: Date | null;
  /** Clé localStorage de l'animation « page qui tourne » (idée 9) ; absente = pas d'animation */
  pageKey?: string;
  /** Cours passés à montrer dans la bande (même sans devoir), du plus ancien au plus récent */
  coursHistorique: Date[];
  vide?: string;
}) {
  const [onglet, setOnglet] = useState<Onglet>('semaine');
  const [ouvertId, setOuvertId] = useState<string | null>(null);
  const [semaineChoisie, setSemaineChoisie] = useState<string | null>(null);
  const [matiere, setMatiere] = useState<string | null>(null);
  const [tourne, setTourne] = useState(false);
  const bande = useRef<HTMLDivElement>(null);
  const now = new Date();

  const rattraper = devoirs.filter((d) => d.rattraper);
  const semaine = devoirs.filter((d) => d.rang === 'semaine');
  const passee = devoirs.filter((d) => d.rang === 'passee' && !d.rattraper);
  const historique = devoirs.filter((d) => d.rang === 'historique' && !d.rattraper);
  const pasFaitsPassee = passee.filter((d) => !estFaitRange(d)).length;
  const montesEnHaut = devoirs.filter((d) => d.rang === 'passee' && d.rattraper).length;

  // 📅 Bande de semaines : tous les cours passés (même sans devoir) + ceux des devoirs rangés
  const semaines = useMemo(() => {
    const cles = new Map<string, Date>();
    coursHistorique.forEach((c) => cles.set(cleCours(c), c));
    historique.forEach((d) => cles.set(cleCours(d.heureRendu), d.heureRendu));
    return [...cles.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [coursHistorique, historique]);
  const semaineActive = semaineChoisie ?? semaines[semaines.length - 1]?.[0] ?? null;

  // L'historique s'ouvre sur la semaine la plus récente (au bout de la bande)
  useEffect(() => {
    if (onglet === 'historique' && bande.current) bande.current.scrollLeft = bande.current.scrollWidth;
  }, [onglet, semaines.length]);

  // 📖 Idée 9 : à l'heure du cours, la page se tourne une seule fois
  const pageActuelle = semaine[0] ? cleCours(semaine[0].heureRendu) : prochainCours ? cleCours(prochainCours) : '';
  useEffect(() => {
    if (!pageKey || !pageActuelle) return;
    try {
      const avant = localStorage.getItem(pageKey);
      if (avant && avant !== pageActuelle) setTourne(true);
      localStorage.setItem(pageKey, pageActuelle);
    } catch { /* stockage indisponible : pas d'animation */ }
  }, [pageKey, pageActuelle]);

  const ligne = (d: DevoirRange, passe: boolean) => {
    const m = matiereOf(d.type);
    const fait = estFaitRange(d);
    const chip = etat(d, passe);
    const sous = d.etapes.length > 0 && !fait ? `💎 ${d.etapesFaites.length}/${d.etapes.length} étape${d.etapes.length > 1 ? 's' : ''}` : m.label;
    const ouvert = ouvertId === d.id;
    return (
      <div key={d.id} id={`devoir-${d.id}`} className="scroll-mt-24">
        <button type="button" onClick={() => setOuvertId(ouvert ? null : d.id)} aria-expanded={ouvert}
          className={cn('w-full flex items-center gap-2.5 rounded-xl border bg-card/95 px-3 py-2 text-left shadow-sm transition-colors',
            ouvert ? 'border-sky-400' : 'border-border hover:border-sky-300', passe && !ouvert && 'opacity-70')}>
          <span className="text-xl shrink-0">{m.emoji}</span>
          <span className="flex-1 min-w-0">
            <span className={cn('block cahier-main text-lg leading-6 [overflow-wrap:anywhere]', fait && passe && 'text-muted-foreground')}>{d.titre}</span>
            <span className="block text-[11px] text-muted-foreground">{sous}</span>
          </span>
          <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold', chip.c)}>{chip.t}</span>
        </button>
        {ouvert && <div className="mt-1.5">{renderDetail(d)}</div>}
      </div>
    );
  };

  const parCours = (liste: DevoirRange[], titre: (c: Date) => string, passe: boolean) => {
    const groupes = new Map<string, DevoirRange[]>();
    liste.forEach((d) => { const k = cleCours(d.heureRendu); groupes.set(k, [...(groupes.get(k) || []), d]); });
    return [...groupes.entries()].sort(([a], [b]) => (passe ? b.localeCompare(a) : a.localeCompare(b))).map(([k, l]) => {
      const c = l[0].heureRendu;
      const reste = !passe ? compteARebours(c, now) : null;
      return (
        <div key={k} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('cahier-main text-lg leading-8 flex-1 min-w-[10rem]', passe && 'text-muted-foreground')}>{titre(c)}</p>
            {reste && (
              <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold',
                reste.veille ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200' : 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200')}>{reste.texte}</span>
            )}
          </div>
          {l.map((d) => ligne(d, passe))}
        </div>
      );
    });
  };

  const onglets: { k: Onglet; t: string; n?: number }[] = [
    { k: 'semaine', t: 'Cette semaine' },
    { k: 'passee', t: 'Semaine passée', n: pasFaitsPassee },
    { k: 'historique', t: 'Historique' },
  ];

  // Historique : la semaine choisie, ou toutes les semaines d'une matière (idée 6)
  const matieresHisto = [...new Set(historique.map((d) => d.type))];
  const histoVu = matiere ? historique.filter((d) => d.type === matiere) : historique.filter((d) => cleCours(d.heureRendu) === semaineActive);

  return (
    <div className="space-y-3">
      {/* 🔁 À rattraper (proposition E) : reste en haut jusqu'à ce que ce soit fait */}
      {rattraper.length > 0 && (
        <div className="rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/20 dark:border-red-800 p-3 space-y-2">
          <p className="text-sm font-extrabold text-red-800 dark:text-red-200">🔁 À rattraper ({rattraper.length})</p>
          <p className="text-[11px] font-semibold text-red-700/80 dark:text-red-300/80">Ces devoirs restent ici jusqu'à ce qu'ils soient faits 💪</p>
          {rattraper.sort((a, b) => a.heureRendu.getTime() - b.heureRendu.getTime()).map((d) => (
            <div key={d.id} className="space-y-0.5">
              <p className="text-[11px] font-bold text-red-700 dark:text-red-300">📅 Du cours du {jourCourt(d.heureRendu)}</p>
              {ligne(d, false)}
            </div>
          ))}
        </div>
      )}

      {/* Les 3 onglets (proposition B) */}
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {onglets.map((o) => (
          <button key={o.k} type="button" role="tab" aria-selected={onglet === o.k} onClick={() => { setOnglet(o.k); setOuvertId(null); }}
            className={cn('relative rounded-lg px-1.5 py-2 text-[13px] sm:text-sm font-extrabold leading-tight transition-colors',
              onglet === o.k ? 'bg-card shadow-sm text-sky-700 dark:text-sky-300' : 'text-muted-foreground')}>
            {o.t}
            {!!o.n && <span className="ml-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground align-middle">{o.n}</span>}
          </button>
        ))}
      </div>

      <div key={onglet} className={cn('cahier-papier rounded-r-2xl px-3 pt-2 pb-3 space-y-2', tourne && onglet === 'semaine' && 'page-tourne')}
        onAnimationEnd={() => setTourne(false)}>
        {onglet === 'semaine' && (
          semaine.length ? parCours(semaine, (c) => `Pour ${jourLong(c)} :`, false) : (
            <div className="space-y-1 py-1">
              <p className="cahier-main text-lg leading-8 text-muted-foreground">{vide ?? 'Ton professeur va bientôt donner les devoirs de la semaine 📚'}</p>
              {prochainCours && <p className="text-[11px] font-semibold text-muted-foreground">Prochain cours : {jourLong(prochainCours)}</p>}
            </div>
          )
        )}

        {onglet === 'passee' && (
          <>
            {montesEnHaut > 0 && (
              <p className="rounded-lg bg-red-50 dark:bg-red-950/30 px-2.5 py-1.5 text-[11px] font-bold text-red-800 dark:text-red-200">
                🔁 {montesEnHaut} devoir{montesEnHaut > 1 ? 's' : ''} pas fait{montesEnHaut > 1 ? 's sont' : ' est'} en haut, dans « À rattraper »
              </p>
            )}
            {passee.length ? parCours(passee, (c) => `Cours du ${jourLong(c)}`, true)
              : !montesEnHaut && <p className="cahier-main text-lg leading-8 text-muted-foreground">Rien pour la semaine passée</p>}
          </>
        )}

        {onglet === 'historique' && (
          <>
            {/* 📅 Bande de semaines (proposition C) : on glisse vers la gauche pour remonter le temps */}
            {semaines.length > 0 ? (
              <div ref={bande} className="flex gap-1.5 overflow-x-auto pb-1 snap-x [scrollbar-width:thin]">
                {semaines.map(([k, c]) => {
                  const ds = historique.filter((d) => cleCours(d.heureRendu) === k);
                  const pasFait = ds.some((d) => !estFaitRange(d));
                  const actif = !matiere && k === semaineActive;
                  return (
                    <button key={k} type="button" onClick={() => { setMatiere(null); setSemaineChoisie(k); setOuvertId(null); }} aria-pressed={actif}
                      className={cn('snap-end shrink-0 rounded-xl border-2 px-2.5 py-1.5 text-center leading-tight',
                        actif ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40' : 'border-border bg-card', !ds.length && 'opacity-50')}>
                      <span className="block text-[11px] font-extrabold">{c.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      <span className="block text-[10px]">{!ds.length ? '—' : pasFait ? '✗' : '✓'}</span>
                    </button>
                  );
                })}
              </div>
            ) : <p className="cahier-main text-lg leading-8 text-muted-foreground">Pas encore d'historique</p>}

            {/* Idée 6 : par matière, sur toutes les semaines */}
            {matieresHisto.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setMatiere(null)} aria-pressed={!matiere}
                  className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', !matiere ? 'bg-sky-600 text-white border-sky-600' : 'bg-card')}>📅 Par semaine</button>
                {matieresHisto.map((t) => (
                  <button key={t} type="button" onClick={() => { setMatiere(t); setOuvertId(null); }} aria-pressed={matiere === t}
                    className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', matiere === t ? 'bg-sky-600 text-white border-sky-600' : 'bg-card')}>
                    {matiereOf(t).emoji} {matiereOf(t).label}
                  </button>
                ))}
              </div>
            )}

            {histoVu.length ? parCours(histoVu, (c) => `Cours du ${jourLong(c)}`, true)
              : semaines.length > 0 && <p className="cahier-main text-lg leading-8 text-muted-foreground">Pas de devoir cette semaine-là</p>}
          </>
        )}
      </div>
    </div>
  );
}
