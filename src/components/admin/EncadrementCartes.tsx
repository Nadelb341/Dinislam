import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Encadre } from '@/components/home/Encadre';
import { cn, errorMessage } from '@/lib/utils';
import { useSaisonActive } from '@/lib/saisons';
import {
  CADRES, CARTES_ACCUEIL, COULEURS, ENCADREMENTS_DEFAUT, EPAISSEURS, echantillon, fusionnerEncadrements, useReglagesEncadrements,
  type CarteAccueil, type ReglageCarte, type ReglagesEncadrements,
} from '@/lib/encadrements';

const pastille = (actif: boolean) => cn('rounded-full border-2 px-3 py-1.5 text-sm font-bold transition-colors',
  actif ? 'border-[#2457a5] bg-[#2457a5] text-white' : 'border-border bg-card text-foreground');

/**
 * 🖼️ Encadrement des cartes (bouclier › 🔧 Apparence appli › Modifications générales › Page d'accueil, 2026-11-18).
 * Un cadre par grande carte de l'accueil (5 cadres choisis par Nadia + « Sans cadre »), couleur et épaisseur,
 * aperçu en direct sur un petit téléphone, enregistré pour tout le monde (la version d'avant est gardée).
 */
export default function EncadrementCartes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { saison } = useSaisonActive();
  const { data: enregistre, isLoading, isError, refetch } = useReglagesEncadrements();
  const [r, setR] = useState<ReglagesEncadrements>(ENCADREMENTS_DEFAUT);
  const [choisie, setChoisie] = useState<CarteAccueil>('devoirs');
  const [jourDevoir, setJourDevoir] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmeOrigine, setConfirmeOrigine] = useState(false);
  const [confirmePartout, setConfirmePartout] = useState(false);
  useEffect(() => { if (enregistre) setR(enregistre); }, [enregistre]);
  const { data: avant = null } = useQuery({
    queryKey: ['app-appearance', 'encadrements-avant'],
    queryFn: async () => {
      const { data } = await supabase.from('app_appearance').select('value').eq('key', 'encadrements_avant').maybeSingle();
      return data ? fusionnerEncadrements(data.value) : null;
    },
  });

  const modifie = !!enregistre && JSON.stringify(enregistre) !== JSON.stringify(r);
  const carte = r.cartes[choisie];
  const nomCarte = (v: CarteAccueil) => CARTES_ACCUEIL.find((c) => c.v === v)?.label ?? v;
  const majCarte = (patch: Partial<ReglageCarte>) => setR((x) => ({ ...x, cartes: { ...x.cartes, [choisie]: { ...x.cartes[choisie], ...patch } } }));
  const appliquerPartout = () => setR((x) => ({
    ...x,
    cartes: Object.fromEntries(CARTES_ACCUEIL.map((c) => [c.v, { ...x.cartes[choisie] }])) as ReglagesEncadrements['cartes'],
  }));

  const enregistrer = async (valeur: ReglagesEncadrements) => {
    // Réglages pas encore lus (réseau) → on n'enregistre rien, sinon ils seraient écrasés
    if (!enregistre) { toast.error('📡 Réglages pas encore lus : vérifie ta connexion puis réessaie'); return; }
    setBusy(true);
    const maintenant = new Date().toISOString();
    const { error } = await supabase.from('app_appearance').upsert([
      { key: 'encadrements_avant', value: enregistre as unknown as never, updated_at: maintenant, updated_by: user?.id ?? null },
      { key: 'encadrements', value: valeur as unknown as never, updated_at: maintenant, updated_by: user?.id ?? null },
    ]);
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    queryClient.invalidateQueries({ queryKey: ['app-appearance'] });
    toast.success('🖼️ Encadrements enregistrés : tout le monde les voit déjà');
  };

  // La carte choisie se place toute seule au milieu du petit téléphone (on voit le résultat de chaque réglage)
  const telephone = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = telephone.current?.querySelector<HTMLElement>('[aria-pressed="true"], .ring-2');
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [choisie]);

  if (isLoading) return <p className="text-center text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Un instant…</p>;
  if (isError && !enregistre) return (
    <div className="text-center text-sm space-y-2">
      <p className="text-muted-foreground">📡 Réglages illisibles pour l'instant (connexion ?).</p>
      <Button size="sm" variant="outline" onClick={() => void refetch()}>🔄 Réessayer</Button>
    </div>
  );

  // Petite carte de l'aperçu : toucher = la choisir pour la régler
  const mini = (v: CarteAccueil, contenu: ReactNode, cls = '') => (
    <Encadre carte={v} reglages={r} forcerHalo={v === 'devoirs' && jourDevoir}>
      <button type="button" onClick={() => setChoisie(v)} aria-pressed={choisie === v}
        className={cn('w-full rounded-xl border bg-card px-2 py-1.5 text-left text-[11px] font-bold leading-tight text-foreground',
          choisie === v && 'ring-2 ring-[#2457a5]', cls)}>
        {contenu}
      </button>
    </Encadre>
  );

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[300px_1fr] paysage:grid paysage:grid-cols-[240px_1fr]">
      {/* 2026-11-26 (Nadia : téléphone tourné) : en paysage peu haut, aperçu à gauche et réglages à droite (comme sur ordinateur) */}
      {/* 👀 Aperçu en direct (idée 3). Nadia, 2026-11-18 : figé en haut de l'écran (un peu plus petit) pendant que les réglages défilent dessous */}
      <div className="sticky top-0 z-20 -mx-1 space-y-1.5 min-w-0 self-start bg-background/95 px-1 pb-2 pt-1 backdrop-blur lg:top-4 lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
        <p className="text-sm font-extrabold">👀 Aperçu en direct <span className="text-xs font-normal text-muted-foreground">· touche une carte pour la régler</span></p>
        <div ref={telephone} className="mx-auto w-full max-w-[230px] rounded-[1.6rem] border-[5px] border-slate-800 bg-background p-2 shadow-lg lg:max-w-[280px] lg:rounded-[2rem] lg:border-[6px] lg:p-3">
          <div className="flex max-h-[32dvh] flex-col gap-2.5 overflow-y-auto p-1 lg:max-h-[520px] paysage:max-h-[55dvh] lg:gap-3 lg:p-1.5">
            {mini('carnet', '📒 Carnet de liaison')}
            {mini('majournee', '📋 Ma journée (toi seulement)')}
            <div className="grid grid-cols-2 gap-3">
              {mini('priere', '🕌 Prochaine prière')}
              {mini('hadith', '🕊️ Hadith du jour')}
            </div>
            {mini('sourateJour', '📖 Sourate du jour')}
            <Encadre carte="cahier" reglages={r}>
              <div className={cn('rounded-xl border bg-card p-1.5 space-y-1.5', choisie === 'cahier' && 'ring-2 ring-[#2457a5]')}>
                <button type="button" onClick={() => setChoisie('cahier')} className="w-full rounded-lg bg-red-100 dark:bg-red-950/40 py-1 text-center text-[11px] font-extrabold text-red-800 dark:text-red-200">📚 Cahier de texte</button>
                <p className="text-center text-[10px] text-muted-foreground">💎 💎 💎 (diamants)</p>
                {mini('devoirs', <span className="block text-center text-rose-700 dark:text-rose-200">📌 Devoirs à faire</span>)}
              </div>
            </Encadre>
            {mini('progres', '📈 Progrès')}
            <div className="grid grid-cols-2 gap-3">
              {['📖 Sourates', '✨ Nourania', '🤲 Invocations', '🕌 Prière'].map((t) => (
                <div key={t}>{mini('matieres', <span className="block py-3 text-center">{t}</span>)}</div>
              ))}
            </div>
          </div>
        </div>
        <label className="mx-auto flex w-full max-w-[300px] items-center justify-between gap-3 rounded-xl border-2 border-border bg-card px-3 py-1.5 lg:max-w-none">
          <span className="text-xs font-bold">Voir un jour où un devoir est à rendre</span>
          <Switch checked={jourDevoir} onCheckedChange={setJourDevoir} />
        </label>
      </div>

      <div className="space-y-4 min-w-0">
        {/* Les cartes : un appui = la régler */}
        <section className="space-y-2">
          <p className="text-sm font-extrabold">🗂️ La carte à régler</p>
          <div className="flex flex-wrap gap-1.5">
            {CARTES_ACCUEIL.map((c) => (
              <button key={c.v} type="button" aria-pressed={choisie === c.v} onClick={() => setChoisie(c.v)} className={pastille(choisie === c.v)}>
                {c.label}{c.prof ? ' (toi)' : ''}
                <span className="ms-1 text-xs font-semibold opacity-80">· {CADRES.find((x) => x.v === r.cartes[c.v].cadre)?.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border-2 border-border bg-card p-3">
          <p className="text-base font-extrabold">{nomCarte(choisie)}</p>
          <div className="space-y-1.5">
            <p className="text-sm font-bold">Le cadre</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CADRES.map((c) => (
                <button key={c.v} type="button" aria-pressed={carte.cadre === c.v} onClick={() => majCarte({ cadre: c.v })}
                  className={cn('rounded-xl border-2 px-3 py-2 text-left', carte.cadre === c.v ? 'border-[#2457a5] bg-[#2457a5]/10' : 'border-border bg-background')}>
                  <span className="block text-sm font-extrabold">{carte.cadre === c.v ? '✅ ' : ''}{c.label}</span>
                  <span className="block text-xs text-muted-foreground">{c.aide}</span>
                </button>
              ))}
            </div>
          </div>
          {carte.cadre !== 'aucun' && (
            <>
              <div className="space-y-1.5">
                <p className="text-sm font-bold">La couleur</p>
                <div className="flex flex-wrap gap-1.5">
                  {COULEURS.map((c) => (
                    <button key={c.v} type="button" aria-pressed={carte.couleur === c.v} onClick={() => majCarte({ couleur: c.v })} className={cn(pastille(carte.couleur === c.v), 'inline-flex items-center gap-1.5')}>
                      <span aria-hidden className="h-4 w-4 shrink-0 rounded-full border border-black/10" style={{ background: echantillon(c.v, saison) }} />{c.label}
                    </button>
                  ))}
                </div>
                {r.couleursSaison && <p className="text-xs text-muted-foreground">« Couleurs de la saison pour tous les cadres » est allumé : c'est la couleur de la saison qui s'affiche.</p>}
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold">L'épaisseur</p>
                <div className="flex flex-wrap gap-1.5">
                  {EPAISSEURS.map((e) => (
                    <button key={e.v} type="button" aria-pressed={carte.epaisseur === e.v} onClick={() => majCarte({ epaisseur: e.v })} className={pastille(carte.epaisseur === e.v)}>{e.label}</button>
                  ))}
                </div>
              </div>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setConfirmePartout(true)}>📋 Appliquer ce cadre à toutes les cartes</Button>
        </section>

        <section className="space-y-2">
          <p className="text-sm font-extrabold">✨ Pour toutes les cartes</p>
          <label className="flex items-start justify-between gap-3 rounded-xl border-2 border-border bg-card px-3 py-2 cursor-pointer">
            <span className="min-w-0"><span className="block text-sm font-bold">🍂 Couleurs de la saison pour tous les cadres</span>
              <span className="block text-xs text-muted-foreground">Automne cuivré, hiver bleu glacé, printemps rose, été turquoise, Ramadan doré : la couleur change toute seule.</span></span>
            <Switch checked={r.couleursSaison} onCheckedChange={(v) => setR((x) => ({ ...x, couleursSaison: v }))} />
          </label>
          <label className="flex items-start justify-between gap-3 rounded-xl border-2 border-border bg-card px-3 py-2 cursor-pointer">
            <span className="min-w-0"><span className="block text-sm font-bold">⏰ Halo le jour où un devoir est à rendre</span>
              <span className="block text-xs text-muted-foreground">Ce jour-là, « Devoirs à faire » passe au Halo, même si tu as choisi un autre cadre.</span></span>
            <Switch checked={r.haloJourDevoir} onCheckedChange={(v) => setR((x) => ({ ...x, haloJourDevoir: v }))} />
          </label>
        </section>

        <div className="sticky bottom-0 grid gap-2 bg-background/95 py-2 sm:grid-cols-2">
          <Button disabled={!modifie || busy} onClick={() => void enregistrer(r)}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}💾 Enregistrer pour tout le monde</Button>
          {modifie
            ? <Button variant="outline" onClick={() => enregistre && setR(enregistre)}>↩️ Annuler mes changements</Button>
            : <Button variant="outline" onClick={() => setConfirmeOrigine(true)}>↩️ Revenir aux cadres d'origine</Button>}
          {!modifie && avant && JSON.stringify(avant) !== JSON.stringify(enregistre) && (
            <Button variant="ghost" className="sm:col-span-2" onClick={() => setR(avant)}>↩️ Reprendre la version d'avant (puis « Enregistrer »)</Button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmePartout} onOpenChange={setConfirmePartout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Même cadre sur toutes les cartes ?</AlertDialogTitle>
            <AlertDialogDescription>Toutes les cartes prendront le cadre, la couleur et l'épaisseur de « {nomCarte(choisie)} ». Rien n'est enregistré tant que tu n'appuies pas sur « Enregistrer ».</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={appliquerPartout}>Appliquer partout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmeOrigine} onOpenChange={setConfirmeOrigine}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revenir aux cadres d'origine ?</AlertDialogTitle>
            <AlertDialogDescription>« Devoirs à faire » reprendra le Cadre doré et les autres cartes n'auront plus de cadre. Tes réglages actuels restent gardés : tu pourras les reprendre avec « ↩️ Reprendre la version d'avant ».</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setR(ENCADREMENTS_DEFAUT); void enregistrer(ENCADREMENTS_DEFAUT); }}>Revenir à l'origine</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
