import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { POLICES, TITRE_DEFAUT, useReglagesTitre, type Police, type ReglagesTitre } from '@/lib/apparence';
import { TitreAppli } from '@/components/home/TitreAppli';
import { cn, errorMessage } from '@/lib/utils';

const entree = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } };

/**
 * 🔧 Apparence appli (bouclier, sous « Bilan trimestriel », 2026-10-29) › sous-carte « Le titre » :
 * texte, police, espacement, couleurs, traits, icône, effets (pluie d'étoiles, brillant, scintillant, ombre, reflet),
 * textes d'accueil et couleurs du Ramadan. Aperçu en direct ; enregistré pour tout le monde (en direct chez les élèves).
 */
export default function ApparenceAppli({ onBack }: { onBack: () => void }) {
  const [sousCarte, setSousCarte] = useState<'titre' | null>(null);
  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={sousCarte ? () => setSousCarte(null) : onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Button>
      <h2 className="text-xl font-extrabold">🔧 Apparence appli</h2>
      {sousCarte === 'titre' ? <ReglageTitre /> : (
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setSousCarte('titre')}
            className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-sky-50 dark:from-amber-950/30 dark:to-sky-950/30 p-4 text-left">
            <p className="text-lg font-extrabold">✨ Le titre</p>
            <p className="text-sm text-muted-foreground">Le haut de l'accueil : le croissant, le nom de l'appli, la pluie d'étoiles, « Assalamou Alaykoum », « Bienvenue » et le Bismillah.</p>
          </button>
        </div>
      )}
    </div>
  );
}

function ReglageTitre() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: enregistre, isLoading } = useReglagesTitre();
  const [r, setR] = useState<ReglagesTitre>(TITRE_DEFAUT);
  const [rejouer, setRejouer] = useState(0);
  const [voirRamadan, setVoirRamadan] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmeOrigine, setConfirmeOrigine] = useState(false);
  useEffect(() => { if (enregistre) setR(enregistre); }, [enregistre]);
  const { data: avant = null } = useQuery({
    queryKey: ['app-appearance', 'titre-avant'],
    queryFn: async () => {
      const { data } = await supabase.from('app_appearance').select('value').eq('key', 'titre_avant').maybeSingle();
      return data ? ({ ...TITRE_DEFAUT, ...(data.value as Partial<ReglagesTitre>) }) : null;
    },
  });

  const maj = <K extends keyof ReglagesTitre>(k: K, v: ReglagesTitre[K]) => { setR((x) => ({ ...x, [k]: v })); if (k === 'pluie' || k === 'brillant') setRejouer((n) => n + 1); };
  const modifie = !!enregistre && JSON.stringify(enregistre) !== JSON.stringify(r);

  // La version d'avant est toujours gardée : « ↩️ Remettre la version d'avant » (rien n'est perdu)
  const enregistrer = async (valeur: ReglagesTitre) => {
    setBusy(true);
    const maintenant = new Date().toISOString();
    const { error } = await supabase.from('app_appearance').upsert([
      ...(enregistre ? [{ key: 'titre_avant', value: enregistre as unknown as never, updated_at: maintenant, updated_by: user?.id ?? null }] : []),
      { key: 'titre', value: valeur as unknown as never, updated_at: maintenant, updated_by: user?.id ?? null },
    ]);
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    queryClient.invalidateQueries({ queryKey: ['app-appearance'] });
    toast.success('✨ Titre enregistré : tout le monde le voit déjà');
  };

  if (isLoading) return <p className="text-center text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Un instant…</p>;

  const couleur = ({ k, label }: { k: 'couleurTexte' | 'couleurTraits' | 'ramadanTexte' | 'ramadanTraits' | 'couleurBismillah' | 'couleurBienvenue'; label: string }) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="color" value={r[k] || '#b7791f'} onChange={(e) => maj(k, e.target.value)} className="h-9 w-12 rounded-lg border cursor-pointer" aria-label={label} />
      <span className="font-semibold">{label}</span>
    </label>
  );
  const effet = ({ k, label, aide }: { k: 'pluie' | 'brillant' | 'scintillant' | 'ombre' | 'reflet' | 'traits' | 'icone' | 'majuscules' | 'bismillah' | 'ramadan'; label: string; aide?: string }) => (
    <label className="flex items-start justify-between gap-3 rounded-xl border-2 border-border bg-card px-3 py-2 cursor-pointer">
      <span className="min-w-0"><span className="block text-sm font-bold">{label}</span>{aide && <span className="block text-xs text-muted-foreground">{aide}</span>}</span>
      <Switch checked={r[k]} onCheckedChange={(v) => maj(k, v)} />
    </label>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-2 lg:order-2 min-w-0">
        <p className="text-sm font-extrabold">👀 Aperçu en direct</p>
        <div className="rounded-3xl border-2 border-border bg-background overflow-hidden lg:sticky lg:top-4">
          <TitreAppli r={r} nom="Wiam ELB" apercu rejouer={rejouer} forcerRamadan={voirRamadan} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setRejouer((n) => n + 1)}>🌠 Relancer la pluie d'étoiles</Button>
          <Button variant="outline" size="sm" aria-pressed={voirRamadan} onClick={() => setVoirRamadan((v) => !v)}>{voirRamadan ? '☀️ Voir comme d\'habitude' : '🌙 Voir pendant le Ramadan'}</Button>
        </div>
      </div>

      <div className="space-y-4 min-w-0 lg:order-1">
        <section className="space-y-2">
          <p className="text-sm font-extrabold">✍️ Le nom</p>
          <Input value={r.texte} onChange={(e) => maj('texte', e.target.value)} onKeyDown={entree} aria-label="Texte du titre" maxLength={30} />
          {effet({ k: "majuscules", label: "EN MAJUSCULES" })}
          <div className="flex flex-wrap gap-1.5">
            {POLICES.map((p) => (
              <button key={p.v} type="button" aria-pressed={r.police === p.v} onClick={() => maj('police', p.v as Police)}
                className={cn('rounded-full border px-3 py-1 text-sm', r.police === p.v ? 'bg-[#2457a5] text-white border-[#2457a5]' : 'bg-card')} style={{ fontFamily: p.css }}>{p.label}</button>
            ))}
          </div>
          <label className="block text-sm font-semibold">Espace entre les lettres
            <input type="range" min={0} max={4} step={0.5} value={r.espacement} onChange={(e) => maj('espacement', Number(e.target.value))} className="w-full" />
          </label>
          <div className="flex flex-wrap gap-4">
            {couleur({ k: "couleurTexte", label: "Couleur du nom" })}
            {couleur({ k: "couleurTraits", label: "Couleur des traits et des étoiles" })}
          </div>
          {effet({ k: "traits", label: "Traits avant et après le nom" })}
          {effet({ k: "icone", label: "Croissant de l'icône au-dessus du nom" })}
        </section>

        <section className="space-y-2">
          <p className="text-sm font-extrabold">✨ Les effets</p>
          {effet({ k: "pluie", label: "🌠 Pluie d'étoiles", aide: "Des étoiles dorées tombent doucement, en continu, jusque sous le Bismillah" })}
          {effet({ k: "brillant", label: "🌙 Croissant brillant", aide: "Le croissant brille doucement, sans s'arrêter" })}
          {effet({ k: "scintillant", label: "✦ Scintillant", aide: "Petites étoiles qui scintillent autour du nom" })}
          {effet({ k: "reflet", label: "💫 Reflet doré", aide: "Un reflet passe sur les lettres du nom" })}
          {effet({ k: "ombre", label: "🌫️ Ombre", aide: "Une ombre douce sous le nom" })}
        </section>

        <section className="space-y-2">
          <p className="text-sm font-extrabold">👋 En dessous</p>
          <Input value={r.salutation} onChange={(e) => maj('salutation', e.target.value)} onKeyDown={entree} aria-label="Salutation" placeholder="Assalamou Alaykoum" />
          <Input value={r.bienvenue} onChange={(e) => maj('bienvenue', e.target.value)} onKeyDown={entree} aria-label="Phrase de bienvenue" placeholder="Bienvenue, {nom} !" />
          <p className="text-xs text-muted-foreground">{'{nom}'} est remplacé par le nom de l'élève.</p>
          {couleur({ k: "couleurBienvenue", label: "Couleur de « Bienvenue »" })}
          {effet({ k: "bismillah", label: "Bismillah en arabe" })}
          {r.bismillah && (
            <div className="flex flex-wrap items-center gap-3">
              {couleur({ k: "couleurBismillah", label: "Couleur du Bismillah" })}
              {r.couleurBismillah && <button type="button" onClick={() => maj('couleurBismillah', '')} className="text-xs font-bold text-primary">Remettre l'or habituel</button>}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <p className="text-sm font-extrabold">🌙 Pendant le Ramadan</p>
          {effet({ k: "ramadan", label: "Couleurs du Ramadan", aide: "Tout seul pendant le mois de Ramadan (calendrier de l'Hégire), puis retour aux couleurs habituelles" })}
          {r.ramadan && (
            <div className="flex flex-wrap gap-4">
              {couleur({ k: "ramadanTexte", label: "Nom" })}
              {couleur({ k: "ramadanTraits", label: "Traits et étoiles" })}
            </div>
          )}
        </section>

        <div className="sticky bottom-0 grid gap-2 bg-background/95 py-2 sm:grid-cols-2">
          <Button disabled={!modifie || busy} onClick={() => void enregistrer(r)}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}💾 Enregistrer pour tout le monde</Button>
          {modifie
            ? <Button variant="outline" onClick={() => enregistre && setR(enregistre)}>↩️ Annuler mes changements</Button>
            : <Button variant="outline" onClick={() => setConfirmeOrigine(true)}>♻️ Revenir aux réglages d'origine</Button>}
          {!modifie && avant && JSON.stringify(avant) !== JSON.stringify(enregistre) && (
            <Button variant="ghost" className="sm:col-span-2" onClick={() => setR(avant)}>↩️ Reprendre la version d'avant (puis « Enregistrer »)</Button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmeOrigine} onOpenChange={setConfirmeOrigine}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revenir aux réglages d'origine ?</AlertDialogTitle>
            <AlertDialogDescription>Le titre redeviendra « DINISLAM » entre deux traits dorés, avec le croissant brillant et la pluie d'étoiles. Tes réglages actuels restent gardés : tu pourras les reprendre avec « ↩️ Reprendre la version d'avant ».</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setR(TITRE_DEFAUT); void enregistrer(TITRE_DEFAUT); }}>Revenir à l'origine</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
