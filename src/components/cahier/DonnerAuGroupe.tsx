import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useCartesAcces } from '@/hooks/useCartesAcces';
import { chargerProchainesEtapes, etapeVisible, type Suggestion } from '@/hooks/useProchainesEtapes';
import { donnerDevoirs, type ItemDevoir } from '@/lib/devoirsEleve';
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

export function DonnerAuGroupe({ eleves, nomGroupe, dateLimite, visibleA, dejaCetteSemaine, maxSemaine, ouvrirAuDemarrage }: {
  eleves: { user_id: string; full_name: string | null }[];
  nomGroupe: string | null;
  dateLimite: string;
  visibleA: string | null;
  dejaCetteSemaine: (id: string) => number;
  maxSemaine: number | null;
  ouvrirAuDemarrage?: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(() => {
    let flag = false;
    try { flag = sessionStorage.getItem('dinislam_ouvrir_donner_groupe') === '1'; sessionStorage.removeItem('dinislam_ouvrir_donner_groupe'); } catch { /* stockage indisponible */ }
    return !!ouvrirAuDemarrage || flag;
  });
  const [matieres, setMatieres] = useState<Record<string, { on: boolean; audio: boolean }>>(() => lire()
    ?? Object.fromEntries(MATIERES_GROUPE.map((m) => [m.type, { on: ['nourania', 'sourate', 'invocations'].includes(m.type), audio: m.audio }])));
  const [exclus, setExclus] = useState<Set<string>>(() => new Set(eleves.filter((e) => dejaCetteSemaine(e.user_id) > 0).map((e) => e.user_id)));
  const [retires, setRetires] = useState<Set<string>>(new Set()); // « élève|matière » retirés à la main
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
    const items = MATIERES_GROUPE.filter((m) => matieres[m.type]?.on).flatMap((m) => {
      const s = (etapes?.[e.user_id] || []).find((x) => x.type === m.type);
      if (!s || !etapeVisible(acces, e.user_id, m.type) || retires.has(`${e.user_id}|${m.type}`)) return [];
      return [{ m, item: itemDepuisEtape(s, !!matieres[m.type]?.audio) }];
    });
    return { e, items, actif: !exclus.has(e.user_id) && items.length > 0 };
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
      <button type="button" aria-expanded={ouvert} onClick={() => setOuvert(!ouvert)} className="w-full flex items-center gap-2 text-start">
        <span className="flex-1 font-extrabold text-violet-900 dark:text-violet-100">✨ Donner au groupe en 1 appui{nomGroupe ? ` (${nomGroupe})` : ''}</span>
        <span className="text-xs font-bold text-violet-800 dark:text-violet-200">{ouvert ? '▲' : '▼'}</span>
      </button>
      {ouvert && (<>
        <p className="text-xs text-violet-900 dark:text-violet-100">Choisis les matières : chaque élève reçoit son devoir là où il en est (sa ligne, sa sourate, son invocation…).</p>
        <div className="flex flex-wrap gap-1.5">
          {MATIERES_GROUPE.map((m) => {
            const v = matieres[m.type] ?? { on: false, audio: m.audio };
            return (
              <span key={m.type} className={cn('flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold', v.on ? 'bg-violet-600 text-white border-violet-600' : 'bg-card')}>
                <button type="button" aria-pressed={v.on} onClick={() => setMatieres((x) => ({ ...x, [m.type]: { ...v, on: !v.on } }))}>{v.on ? '✓ ' : ''}{m.emoji} {m.label}</button>
                {v.on && <button type="button" aria-pressed={v.audio} aria-label={`Audio demandé pour ${m.label}`} title="Audio demandé"
                  onClick={() => setMatieres((x) => ({ ...x, [m.type]: { ...v, audio: !v.audio } }))} className={cn('rounded-full px-1', v.audio ? 'bg-white/30' : 'opacity-50 line-through')}>🎙️</button>}
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
                <div key={p.e.user_id} className={cn('px-2.5 py-2 space-y-1', !p.actif && 'opacity-60')}>
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input type="checkbox" className="h-4 w-4 accent-violet-600" checked={!exclus.has(p.e.user_id)} disabled={!p.items.length}
                      onChange={(ev) => setExclus((x) => { const n = new Set(x); if (ev.target.checked) n.delete(p.e.user_id); else n.add(p.e.user_id); return n; })} />
                    <span className="flex-1 min-w-0 [overflow-wrap:anywhere]">{p.e.full_name || 'Élève'}</span>
                    {deja > 0 && <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">déjà {deja} cette semaine</span>}
                  </label>
                  {p.items.map(({ m, item }) => (
                    <p key={m.type} className="flex items-start gap-1.5 ps-6 text-xs">
                      <span className="cahier-main text-sm flex-1 min-w-0 [overflow-wrap:anywhere]">{m.emoji} {item.titre}</span>
                      <button type="button" aria-label={`Retirer ${m.label} pour ${p.e.full_name}`} onClick={() => setRetires((x) => new Set(x).add(`${p.e.user_id}|${m.type}`))} className="text-destructive font-bold">✕</button>
                    </p>
                  ))}
                  {!p.items.length && <p className="ps-6 text-[11px] text-muted-foreground">Rien à donner dans ces matières (tout validé, ou carte fermée pour lui).</p>}
                  {trop && p.actif && <p className="ps-6 text-[11px] font-semibold text-amber-700 dark:text-amber-300">⚠️ Plus que le maximum de la semaine ({maxSemaine}).</p>}
                </div>
              );
            })}
          </div>
        )}
        <button type="button" disabled={envoi || !total} onClick={() => setConfirmer(true)}
          className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 text-sm font-extrabold">
          {envoi ? '⏳ …' : `✨ Donner à ${aDonner.length} élève${aDonner.length > 1 ? 's' : ''} (${total} devoir${total > 1 ? 's' : ''})`}
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
