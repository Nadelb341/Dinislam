import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useCartesAcces } from '@/hooks/useCartesAcces';
import { optionsFor } from '@/components/admin/CibleSelect';
import { chargerProchainesEtapes, etapeVisible, type Suggestion } from '@/hooks/useProchainesEtapes';
import { donnerDevoirs, type ItemDevoir } from '@/lib/devoirsEleve';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

/**
 * ✨ Donner les devoirs au groupe en 1 appui (Nadia, 2026-11-11, idée 1 modifiée) :
 * « certains élèves du même groupe n'ont pas le même rythme […] je sélectionne juste les matières pour un groupe et les devoirs
 * partent à chacun avec les endroits qu'ils doivent reprendre ». Ex. Réda en est à Ayat al-Kursi → « réviser Ayat al-Kursi + audio » ;
 * Nourania leçon 6 → la ligne sous la dernière cochée. Mêmes règles que le pré-remplissage (useProchainesEtapes).
 * Un élève qui a déjà des devoirs cette semaine est décoché d'office (pas de doublon) ; Nadia peut le recocher.
 */
const MATIERES_GROUPE: { type: string; emoji: string; label: string; audio: boolean }[] = [
  { type: 'nourania', emoji: '✨', label: 'Nourania', audio: false },
  { type: 'sourate', emoji: '📖', label: 'Sourate', audio: true },
  { type: 'invocations', emoji: '🤲', label: 'Invocation', audio: true },
  { type: 'alphabet', emoji: '🔤', label: 'Alphabet', audio: false },
  { type: 'allah_names', emoji: '🌟', label: "99 noms d'Allah", audio: false },
];
const CLE = 'dinislam_donner_groupe_matieres';
const lire = () => { try { return JSON.parse(localStorage.getItem(CLE) || 'null') as Record<string, { on: boolean; audio: boolean }> | null; } catch { return null; } };
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * 📍 22/11 (Nadia : « lorsqu'il y a plusieurs choses dans une carte, je dois pouvoir choisir la partie à travailler ») :
 * une partie précise choisie pour TOUT le groupe (ex. Alphabet › Lettres particulières › La chadda) remplace l'étape automatique.
 */
function itemChoisi(m: { type: string }, c: { v: string; l: string }, audio: boolean): ItemDevoir {
  const lecon = c.v.startsWith('p:') ? c.l.replace(/^✨ Lettres particulières · /, '') : null;
  const texte = lecon ? `Regarder la leçon « ${lecon} » (Lettres particulières) et faire le « Teste-toi »` : `Travailler : ${c.l}`;
  return {
    titre: audio ? `${texte} et m'envoyer un audio 🎙️` : texte, type: m.type, cible: c.v, audio, pj: [], consigne: null,
    label: null, emoji: null, description: null, lien_lecon: null, etapes: [],
  };
}

/** 📍 Le choix d'une partie de la carte, pour tout le groupe */
function ChoixPartie({ type, valeur, onChange }: { type: string; valeur: { v: string; l: string } | null; onChange: (c: { v: string; l: string } | null) => void }) {
  const { data: options = [] } = useQuery({ queryKey: ['devoir-cibles', type], queryFn: () => optionsFor(type), staleTime: 10 * 60 * 1000 });
  if (!options.length) return null;
  return (
    <select value={valeur?.v ?? ''} aria-label="Partie de la carte pour tout le groupe"
      onChange={(e) => { const o = options.find((x) => x.value === e.target.value); onChange(o ? { v: o.value, l: o.label } : null); }}
      className="max-w-[13rem] rounded-full border border-violet-300 bg-white text-violet-900 px-2 py-0.5 text-[11px] font-bold dark:bg-violet-950 dark:text-violet-100">
      <option value="">📍 Où il en est (auto)</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/** Le devoir d'un élève pour une matière, d'après sa prochaine étape */
function itemDepuisEtape(s: Suggestion, audio: boolean): ItemDevoir {
  const texte = s.type === 'sourate' && /en cours de validation/.test(s.texte)
    ? `Réviser la sourate ${s.cible.l.split(' · ').slice(1).join(' · ') || s.cible.l}`
    : majuscule(s.texte);
  return {
    titre: audio ? `${texte} et m'envoyer un audio 🎙️` : texte, type: s.type, cible: s.cible.v, audio, pj: [], consigne: null,
    label: null, emoji: null, description: null, lien_lecon: null, etapes: [],
  };
}

export function DonnerAuGroupe({ eleves, nomGroupe, dateLimite, visibleA, dejaCetteSemaine, maxSemaine, ouvrirAuDemarrage, toujoursOuvert, formulaire, dejaDonnes, persoInitial }: {
  eleves: { user_id: string; full_name: string | null }[];
  nomGroupe: string | null;
  dateLimite: string;
  visibleA: string | null;
  dejaCetteSemaine: (id: string) => number;
  maxSemaine: number | null;
  ouvrirAuDemarrage?: boolean;
  /** 22/11 (Nadia, nouvel écran « Distribuer les devoirs ») : sans son propre bouton ▼, dans « Devoirs de la semaine prochaine » */
  toujoursOuvert?: boolean;
  /** Toucher la case d'un élève = « Personnaliser » ses devoirs (le formulaire, juste dessous) */
  formulaire?: (eleve: { user_id: string; full_name: string | null }) => ReactNode;
  /** Les devoirs déjà donnés à l'élève cette semaine (pastille ✏️ perso) */
  dejaDonnes?: (id: string) => { titre: string; emoji?: string | null }[];
  /** Élève dont « Personnaliser » est ouvert en arrivant (lien depuis le cahier de texte) */
  persoInitial?: string | null;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(() => {
    let flag = false;
    try { flag = sessionStorage.getItem('dinislam_ouvrir_donner_groupe') === '1'; sessionStorage.removeItem('dinislam_ouvrir_donner_groupe'); } catch { /* stockage indisponible */ }
    return !!ouvrirAuDemarrage || !!toujoursOuvert || flag;
  });
  const [perso, setPerso] = useState<string | null>(persoInitial ?? null);
  useEffect(() => { if (persoInitial) setPerso(persoInitial); }, [persoInitial]);
  const [matieres, setMatieres] = useState<Record<string, { on: boolean; audio: boolean }>>(() => lire()
    ?? Object.fromEntries(MATIERES_GROUPE.map((m) => [m.type, { on: ['nourania', 'sourate', 'invocations'].includes(m.type), audio: m.audio }])));
  const [exclus, setExclus] = useState<Set<string>>(() => new Set(eleves.filter((e) => dejaCetteSemaine(e.user_id) > 0).map((e) => e.user_id)));
  const [retires, setRetires] = useState<Set<string>>(new Set()); // « élève|matière » retirés à la main
  // ✏️ Texte modifié à la main pour un élève et une matière (Nadia, 2026-11-12) ; clé « élève|matière »
  const [textes, setTextes] = useState<Record<string, string>>({});
  // 📍 Partie choisie pour tout le groupe, par matière (sinon : là où en est chaque élève)
  const [parties, setParties] = useState<Record<string, { v: string; l: string } | null>>({});
  const [enEdition, setEnEdition] = useState<string | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { try { localStorage.setItem(CLE, JSON.stringify(matieres)); } catch { /* stockage indisponible */ } }, [matieres]);
  const ouvertAuDepart = useRef(ouvert);
  useEffect(() => { if (ouvertAuDepart.current) setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300); }, []);

  const ids = useMemo(() => eleves.map((e) => e.user_id), [eleves]);
  const acces = useCartesAcces(ouvert);
  const { data: etapes, isLoading, isError } = useQuery({
    queryKey: ['devoir-prochaines-etapes', 'groupe', ids.join(',')],
    enabled: ouvert && ids.length > 0,
    staleTime: 60_000,
    queryFn: () => chargerProchainesEtapes(ids),
  });

  const plan = eleves.map((e) => {
    const toutes = MATIERES_GROUPE.filter((m) => matieres[m.type]?.on).flatMap((m) => {
      const s = (etapes?.[e.user_id] || []).find((x) => x.type === m.type);
      const partie = parties[m.type] ?? null;
      if ((!s && !partie) || !etapeVisible(acces, e.user_id, m.type)) return [];
      const item = partie ? itemChoisi(m, partie, !!matieres[m.type]?.audio) : itemDepuisEtape(s!, !!matieres[m.type]?.audio);
      const perso = textes[`${e.user_id}|${m.type}`];
      // ✕ (Nadia, 2026-11-18) : une ligne retirée reste visible, barrée, avec « ↩️ Remettre » (avant, elle disparaissait
      // et l'élève affichait « Rien à donner… », comme s'il avait tout validé)
      return [{ m, item: perso?.trim() ? { ...item, titre: perso.trim() } : item, choisi: !!partie, retiree: retires.has(`${e.user_id}|${m.type}`) }];
    });
    const items = toutes.filter((x) => !x.retiree);
    return { e, toutes, items, actif: !exclus.has(e.user_id) && items.length > 0 };
  });
  const aDonner = plan.filter((p) => p.actif);
  const total = aDonner.reduce((n, p) => n + p.items.length, 0);

  const donner = async () => {
    if (!user) return;
    if (!dateLimite) { toast.error('Choisis d\'abord la date à rendre (en haut)'); return; }
    setEnvoi(true);
    let ok = 0, attente = 0;
    try {
      // Une distribution par élève : chacun reçoit SES devoirs (et sa notification)
      for (const p of aDonner) {
        const r = await donnerDevoirs({ eleveIds: [p.e.user_id], items: p.items.map((x) => x.item), date_limite: dateLimite, visible_a: visibleA, created_by: user.id });
        if (r === 'ok') ok++; else attente++;
      }
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs'] });
      if (attente) toast.info(`📡 Hors connexion : ${attente} élève${attente > 1 ? 's' : ''} gardé${attente > 1 ? 's' : ''} sur l'appareil, envoyé${attente > 1 ? 's' : ''} au retour du réseau`);
      if (ok) toast.success(`✅ Devoirs donnés à ${ok} élève${ok > 1 ? 's' : ''}, chacun selon où il en est`);
      setOuvert(false);
    } catch (e) { toast.error(`Pas donné : ${(e as Error).message}`); }
    finally { setEnvoi(false); }
  };

  if (!eleves.length) return null;
  return (
    <div ref={ref} className="rounded-2xl border-2 border-violet-300 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-950/20 p-3 space-y-2">
      {toujoursOuvert ? (
        <p className="font-extrabold text-violet-900 dark:text-violet-100">✨ Devoir commun : les matières</p>
      ) : (
        <button type="button" aria-expanded={ouvert} onClick={() => setOuvert(!ouvert)} className="w-full flex items-center gap-2 text-start">
          <span className="flex-1 font-extrabold text-violet-900 dark:text-violet-100">✨ Donner au groupe en 1 appui{nomGroupe ? ` (${nomGroupe})` : ''}</span>
          <span className="text-xs font-bold text-violet-800 dark:text-violet-200">{ouvert ? '▲' : '▼'}</span>
        </button>
      )}
      {ouvert && (<>
        <p className="text-xs text-violet-900 dark:text-violet-100">Chaque élève reçoit son devoir là où il en est (sa ligne, sa sourate, son invocation…).{formulaire ? ' Le carré choisit l\'élève ; touche sa case pour personnaliser ses devoirs.' : ''}</p>
        <div className="flex flex-wrap gap-1.5">
          {MATIERES_GROUPE.map((m) => {
            const v = matieres[m.type] ?? { on: false, audio: m.audio };
            return (
              <span key={m.type} className={cn('flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold', v.on ? 'bg-violet-600 text-white border-violet-600' : 'bg-card')}>
                <button type="button" aria-pressed={v.on} onClick={() => setMatieres((x) => ({ ...x, [m.type]: { ...v, on: !v.on } }))}>{v.on ? '✓ ' : ''}{m.emoji} {m.label}</button>
                {v.on && <button type="button" aria-pressed={v.audio} aria-label={`Audio demandé pour ${m.label}`} title="Audio demandé"
                  onClick={() => setMatieres((x) => ({ ...x, [m.type]: { ...v, audio: !v.audio } }))} className={cn('rounded-full px-1', v.audio ? 'bg-white/30' : 'opacity-50 line-through')}>🎙️</button>}
                {v.on && <ChoixPartie type={m.type} valeur={parties[m.type] ?? null} onChange={(c) => setParties((x) => ({ ...x, [m.type]: c }))} />}
              </span>
            );
          })}
        </div>
        {isError && <p className="text-xs text-destructive">📡 Nécessite Internet pour savoir où en est chaque élève.</p>}
        {isLoading ? <p className="text-xs text-muted-foreground">⏳ Je regarde où en est chaque élève…</p> : (
          <div className="rounded-xl border bg-card divide-y">
            {plan.map((p) => {
              const deja = dejaCetteSemaine(p.e.user_id);
              const trop = maxSemaine !== null && deja + p.items.length > maxSemaine;
              return (
                <div key={p.e.user_id} className={cn('px-2.5 py-2 space-y-1', formulaire && 'cursor-pointer', perso === p.e.user_id && 'bg-amber-50/60 dark:bg-amber-950/20')}
                  onClick={formulaire ? (ev) => { if ((ev.target as HTMLElement).closest('button,input,textarea,select,a,label,[data-perso]')) return; setPerso(perso === p.e.user_id ? null : p.e.user_id); } : undefined}>
                  <div className={cn('flex items-center gap-2 text-sm font-bold', !p.actif && 'opacity-60')}>
                    <input type="checkbox" className="h-5 w-5 accent-violet-600 cursor-pointer" checked={!exclus.has(p.e.user_id)} disabled={!p.items.length}
                      aria-label={`Choisir ${p.e.full_name || 'cet élève'}`}
                      onChange={(ev) => setExclus((x) => { const n = new Set(x); if (ev.target.checked) n.delete(p.e.user_id); else n.add(p.e.user_id); return n; })} />
                    <span className="flex-1 min-w-0 [overflow-wrap:anywhere]">{p.e.full_name || 'Élève'}</span>
                    {deja > 0 && <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">déjà {deja} cette semaine</span>}
                    {formulaire && <span className="text-xs text-muted-foreground" aria-hidden>{perso === p.e.user_id ? '▲' : '✏️'}</span>}
                  </div>
                  {(dejaDonnes?.(p.e.user_id) ?? []).map((d, i) => (
                    <div key={`d${i}`} className="flex items-start gap-1.5 ps-7 text-xs">
                      <span className="cahier-main text-sm flex-1 min-w-0 [overflow-wrap:anywhere]">{d.emoji ?? '✏️'} {d.titre}</span>
                      <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-200">✏️ perso · donné</span>
                    </div>
                  ))}
                  {p.toutes.map(({ m, item, retiree, choisi }) => {
                    const k = `${p.e.user_id}|${m.type}`;
                    if (retiree) return (
                      <div key={m.type} className="flex items-start gap-1.5 ps-6 text-xs">
                        <span className="cahier-main text-sm flex-1 min-w-0 [overflow-wrap:anywhere] line-through text-muted-foreground">{m.emoji} {item.titre}</span>
                        <button type="button" aria-label={`Remettre le devoir ${m.label} pour ${p.e.full_name}`}
                          onClick={() => setRetires((x) => { const n = new Set(x); n.delete(k); return n; })}
                          className="shrink-0 rounded-full border border-violet-300 dark:border-violet-700 px-2 py-0.5 text-[11px] font-bold text-violet-800 dark:text-violet-200">↩️ Remettre</button>
                      </div>
                    );
                    return (
                    <div key={m.type} className="flex items-start gap-1.5 ps-6 text-xs">
                      {enEdition === k ? (
                        <Textarea autoFocus value={textes[k] ?? item.titre} rows={2} aria-label={`Devoir ${m.label} de ${p.e.full_name}`}
                          onChange={(ev) => setTextes((x) => ({ ...x, [k]: ev.target.value }))}
                          onBlur={() => setEnEdition(null)}
                          onKeyDown={(ev) => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); setEnEdition(null); } }}
                          className="cahier-main text-sm flex-1 min-w-0 min-h-0 py-1" />
                      ) : (
                        <span className={cn('cahier-main text-sm flex-1 min-w-0 [overflow-wrap:anywhere]', !p.actif && 'opacity-60')}>{m.emoji} {item.titre}</span>
                      )}
                      <span className={cn('shrink-0 rounded-full px-1.5 text-[10px] font-extrabold', textes[k]?.trim() ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200' : choisi ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200' : 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200')}>
                        {textes[k]?.trim() ? '✏️ perso' : choisi ? '📍 choisi' : '🤖 auto'}
                      </span>
                      <button type="button" aria-label={enEdition === k ? 'Terminer la modification' : `Modifier le devoir ${m.label} de ${p.e.full_name}`}
                        onMouseDown={(ev) => ev.preventDefault()} onClick={() => setEnEdition(enEdition === k ? null : k)} className="shrink-0 text-sm">{enEdition === k ? '✅' : '✏️'}</button>
                      <button type="button" aria-label={`Retirer ${m.label} pour ${p.e.full_name}`} onClick={() => setRetires((x) => new Set(x).add(`${p.e.user_id}|${m.type}`))} className="text-destructive font-bold">✕</button>
                    </div>
                    );
                  })}
                  {!p.toutes.length && <p className="ps-6 text-[11px] text-muted-foreground">Rien à donner dans ces matières (tout validé, ou carte fermée pour lui).</p>}
                  {p.toutes.length > 0 && !p.items.length && <p className="ps-6 text-[11px] text-muted-foreground">Tout est retiré pour cet élève : touche « ↩️ Remettre » pour lui redonner une ligne.</p>}
                  {trop && p.actif && <p className="ps-6 text-[11px] font-semibold text-amber-700 dark:text-amber-300">⚠️ Plus que le maximum de la semaine ({maxSemaine}).</p>}
                  {formulaire && perso === p.e.user_id && <div data-perso className="cursor-auto">{formulaire(p.e)}</div>}
                </div>
              );
            })}
          </div>
        )}
        <button type="button" disabled={envoi || !total} onClick={() => setConfirmer(true)}
          className={cn('w-full rounded-xl disabled:opacity-50 text-white font-extrabold', toujoursOuvert ? 'bg-emerald-600 hover:bg-emerald-700 py-3.5 text-base' : 'bg-violet-600 hover:bg-violet-700 py-2.5 text-sm')}>
          {envoi ? '⏳ …' : toujoursOuvert ? `✅ Donner les devoirs à ${aDonner.length} élève${aDonner.length > 1 ? 's' : ''} (${total} devoir${total > 1 ? 's' : ''})` : `✨ Donner à ${aDonner.length} élève${aDonner.length > 1 ? 's' : ''} (${total} devoir${total > 1 ? 's' : ''})`}
        </button>
      </>)}
      <AlertDialog open={confirmer} onOpenChange={setConfirmer}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Donner ces devoirs ?</AlertDialogTitle>
            <AlertDialogDescription>{aDonner.length} élève{aDonner.length > 1 ? 's' : ''} recevr{aDonner.length > 1 ? 'ont' : 'a'} chacun ses devoirs ({total} en tout), à rendre {dateLimite ? new Date(dateLimite).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—'}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => void donner()}>Donner</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
