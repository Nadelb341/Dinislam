import { useEffect, useState } from 'react';
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
import {
  DATES_SAISON, NOM_SAISON, SAISONS_DEFAUT, SAISONS_PRETES, apercuSaison, choisirApercu, saisonDuJour, useReglagesSaisons,
  type ReglagesAutomne, type ReglagesClair, type ReglagesHiver, type ReglagesSaisons, type Saison,
} from '@/lib/saisons';
import { IMAGES_AUTOMNE } from '@/components/saisons/dessinsAutomne';
import { IMAGES_HIVER } from '@/components/saisons/dessinsHiver';
import { IMAGES_CLAIR } from '@/components/saisons/dessinsPrintempsEte';
import { OBJETS_LOGO } from '@/components/saisons/objetsLogo';
import { essayerAverse, type ModeMeteo, type ReglagesJeux, ReglagesLogo, ReglagesMeteo, RythmeLogo } from '@/lib/saisons';
import { cn, errorMessage } from '@/lib/utils';

/**
 * 🍂 Bouclier › 🔧 Apparence appli › « Décorations saisons » (2026-11-03, maquette validée par Nadia).
 * « Ambiance neutre » en haut à droite = l'appli comme avant. Réglages généraux, puis un onglet par saison
 * (seul l'automne est prêt ; les autres arrivent avec leurs maquettes). Enregistré pour tout le monde (en direct chez les élèves).
 */
const ORDRE: Saison[] = ['hiver', 'printemps', 'ete', 'automne'];

const GROUPES_AUTOMNE: { titre: string; items: { k: keyof ReglagesAutomne; label: string }[] }[] = [
  { titre: "L'arbre et les feuilles", items: [
    { k: 'arbre', label: '🌳 Arbre avec ses branches' }, { k: 'oiseaux', label: "🐦 Oiseaux qui s'envolent" },
    { k: 'feuilles', label: '🍁 Feuilles qui tombent' }, { k: 'devantDerriere', label: '🔀 Devant et derrière les cartes' },
    { k: 'erable', label: '🍂 Érable' }, { k: 'chene', label: '🌿 Chêne' }, { k: 'ginkgo', label: '💛 Ginkgo' }, { k: 'simple', label: '🍃 Feuille simple' },
    { k: 'vent', label: '💨 Coups de vent' }, { k: 'eclate', label: '💥 Feuille qui éclate quand on la touche' }, { k: 'son', label: '🔊 Petit son de cristal (comme les flocons)' },
    { k: 'grandesFeuilles', label: '🍁 Grandes feuilles faciles à attraper' },
    { k: 'messageSemaine', label: '💬 Message « Attrape les feuilles ! » chaque semaine' },
    { k: 'ventDefile', label: '🌬️ Feuilles soufflées quand on fait défiler' },
    { k: 'pluieValidation', label: '🌰 Pluie de glands, pommes de pin et feuilles à chaque validation' },
    { k: 'feuilleDoree', label: '🌟 Feuille dorée rare à attraper' },
  ] },
  { titre: 'La cheminée (en bas à droite)', items: [
    { k: 'cheminee', label: '🔥 Cheminée' }, { k: 'petitFeuJour', label: '☀️ Petit feu du Fajr au Maghrib' }, { k: 'grandFeuSoir', label: '🌙 Grand feu du Maghrib au Fajr' },
    { k: 'transparente', label: '👻 Transparente quand on fait défiler' }, { k: 'bougies', label: '🕯️ Bougies' }, { k: 'feuillesPoutre', label: '🍁 Feuilles sur la poutre' },
    { k: 'courge', label: '🧺 Courge dans son panier' }, { k: 'buches', label: '🪵 Bûches et outils du feu' }, { k: 'braises', label: '✨ Petites braises' },
  ] },
  { titre: 'Le tapis de feuilles (en bas)', items: [
    { k: 'tapis', label: '🍂 Tapis de feuilles' }, { k: 'personnage', label: '🐿️ Écureuil ou 🦔 hérisson (ils alternent à chaque connexion)' },
    { k: 'plongeon', label: '💥 Il plonge dans le tas : les feuilles sautent' },
  ] },
  { titre: 'Les cartes et les couleurs', items: [
    { k: 'images', label: '🐿️ Images en haut à droite des cartes' }, { k: 'couleurs', label: '🎨 Couleurs beige et brun' },
  ] },
];

const GROUPES_HIVER: { titre: string; items: { k: keyof ReglagesHiver; label: string }[] }[] = [
  { titre: 'Les flocons', items: [
    { k: 'flocons', label: '❄️ Flocons qui tombent' }, { k: 'devantDerriere', label: '🔀 Devant et derrière les cartes' },
    { k: 'eclate', label: '💥 Flocon qui éclate quand on le touche' }, { k: 'son', label: '🔊 Petit son de cristal' },
    { k: 'messageSemaine', label: '💬 Message « Attrape les flocons ! » chaque semaine' }, { k: 'ventDefile', label: '🌬️ Flocons soufflés quand on fait défiler' },
    { k: 'pluieDoree', label: '✨ Pluie de flocons dorés à chaque validation' }, { k: 'floconDore', label: '🌟 Flocon doré rare à attraper' },
  ] },
  { titre: 'Le chalet et le ciel (en haut)', items: [
    { k: 'chalet', label: '🏠 Chalet en haut à gauche' }, { k: 'cielSoir', label: '🌌 Ciel du soir avec petites étoiles' },
  ] },
  { titre: 'La cheminée (en bas à droite)', items: [
    { k: 'cheminee', label: '🔥 Cheminée d\'hiver' }, { k: 'petitFeuJour', label: '☀️ Petit feu du Fajr au Maghrib' }, { k: 'grandFeuSoir', label: '🌙 Grand feu du Maghrib au Fajr' },
    { k: 'transparente', label: '👻 Transparente quand on fait défiler' }, { k: 'chocolat', label: '☕ Chocolat chaud le soir' },
  ] },
  { titre: 'La neige en bas', items: [
    { k: 'neigeBas', label: '🏔️ Neige brillante en bas' }, { k: 'lanternes', label: '🏮 Lanternes dans la neige' },
    { k: 'ours', label: '🐻‍❄️ Ours polaire qui dort' }, { k: 'motOurs', label: '📖 L\'ours montre un mot de l\'hiver chaque jour' },
    { k: 'personnage', label: '🐧 Pingouin ou ⛄ bonhomme de neige (ils alternent à chaque connexion)' }, { k: 'traces', label: '👣 Traces de pas' },
    { k: 'glissade', label: '🛷 Il glisse sur la neige' }, { k: 'plongeon', label: '💥 Il plonge dans un tas de neige' },
  ] },
  { titre: 'Les cartes, le givre et les couleurs', items: [
    { k: 'neigeCartes', label: '🌨️ Neige posée sur les cartes' }, { k: 'givre', label: '🧊 Givre sur les cartes' },
    { k: 'givreMatin', label: '🌅 Givre dans les coins le matin (Fajr → Dhohr)' }, { k: 'vitre', label: '🪟 Vitre givrée après 1 minute sans toucher' },
    { k: 'neigeTitre', label: '🏔️ Neige sur le titre' }, { k: 'images', label: '🐧 Images en haut à droite des cartes' },
    { k: 'couleurs', label: '🎨 Couleurs bleu glacier (jour) et chaudes (soir)' },
  ] },
];

const groupesClair = (ete: boolean): { titre: string; items: { k: keyof ReglagesClair; label: string }[] }[] => [
  { titre: ete ? 'Les bulles et le ciel' : 'Ce qui vole et ce qui tombe', items: [
    { k: 'volants', label: ete ? '🫧 Bulles qui montent' : '🦋 Papillons et 🐝 abeilles qui volent' }, { k: 'tombants', label: ete ? '🕊️ Mouettes au loin' : '🍃 Feuilles vertes et pétales qui tombent' },
    { k: 'devantDerriere', label: '🔀 Devant et derrière les cartes' }, { k: 'attraper', label: ete ? '💥 Bulle qui éclate quand on la touche' : '✨ Papillon qui s\'envole quand on le touche' },
    { k: 'son', label: ete ? '🔊 Petit « plop »' : '🔊 Petit tintement' }, { k: 'messageSemaine', label: ete ? '💬 Message « Éclate les bulles ! » chaque semaine' : '💬 Message « Attrape les papillons ! » chaque semaine' },
    { k: 'ventDefile', label: '🌬️ Soufflés quand on fait défiler' }, { k: 'pluieValidation', label: ete ? '⭐ Pluie d\'étoiles de mer et coquillages à chaque validation' : '🌼 Pluie de pétales et coccinelles à chaque validation' },
    { k: 'rare', label: ete ? '🌟 Bulle dorée rare' : '🌟 Papillon doré rare' },
  ] },
  { titre: 'Le soleil et les nuages (en haut)', items: [
    { k: 'soleil', label: ete ? '☀️ Grand soleil qui brille' : '🌞 Soleil qui brille et tourne' }, { k: 'nuages', label: '☁️ Nuages autour du titre' },
    { k: 'lune', label: '🌙 La lune le soir (Maghrib → Fajr)' }, { k: 'cielSoir', label: '🌌 Ciel du soir' }, { k: 'lucioles', label: '✨ Lucioles le soir' },
    ...(ete ? [] : [{ k: 'rosee' as const, label: '💧 Rosée qui brille le matin (Fajr → Dhohr)' }]),
  ] },
  { titre: ete ? 'La plage (en bas)' : 'La prairie (en bas)', items: [
    { k: 'decor', label: ete ? '🌴 Palmiers et transat en bas à droite' : '🌳 Grand arbre en bas à droite' }, { k: 'transparente', label: '👻 Transparent quand on fait défiler' },
    { k: 'bas', label: ete ? '🏖️ Mer et sable' : '🌼 Prairie de fleurs' },
    { k: 'animal', label: ete ? '🦀 Crabe ou 🐬 dauphin (à tour de rôle à chaque connexion)' : '🐰 Lapin, 🐌 escargot ou 🦌 biche (à tour de rôle)' },
    { k: 'plongeon', label: ete ? '💥 Le crabe plonge dans le sable' : '💥 Il plonge dans les fleurs' },
    { k: 'motDuJour', label: ete ? '🐢 La tortue montre un mot de l\'été chaque jour' : '🐦 L\'oiseau montre un mot du printemps chaque jour' },
  ] },
  { titre: 'Les cartes et les couleurs', items: [
    { k: 'images', label: '🖼️ Images en haut à droite des cartes' }, { k: 'couleurs', label: ete ? '🎨 Bleu clair et jaune' : '🎨 Vert clair' },
    ete ? { k: 'chateau', label: '🏰 Château de sable que le crabe construit pendant la semaine' } : { k: 'coccinelle', label: '🐞 Coccinelle qui se promène sur une carte' },
    { k: 'repos', label: ete ? '✨ Reflets de soleil après 1 minute sans toucher' : '🌸 Fleurs qui poussent dans les coins après 1 minute sans toucher' },
  ] },
];

const IDEES_A_VENIR: Record<Exclude<Saison, 'automne' | 'hiver'>, string> = {
  printemps: 'Pétales de cerisier, papillons, arbre en fleurs, pâquerettes… Maquette avant le 1er mars.',
  ete: 'Soleil, palmier et dattes, lucioles le soir, étoiles filantes… Maquette avant le 1er juin.',
};

export default function DecorationsSaisons() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: enregistre, isLoading, isError, refetch } = useReglagesSaisons();
  const [r, setR] = useState<ReglagesSaisons>(SAISONS_DEFAUT);
  const [onglet, setOnglet] = useState<Saison>(saisonDuJour());
  const [apercu, setApercu] = useState<Saison | null>(apercuSaison());
  const [busy, setBusy] = useState(false);
  const [confirmeOrigine, setConfirmeOrigine] = useState(false);
  useEffect(() => { if (enregistre) setR(enregistre); }, [enregistre]);
  const modifie = !!enregistre && JSON.stringify(enregistre) !== JSON.stringify(r);

  const enregistrer = async (valeur: ReglagesSaisons, message = '🍂 Décorations enregistrées : tout le monde les voit déjà') => {
    // ⚠️ 2026-11-07 : réglages pas encore lus (réseau) → on n'enregistre rien, sinon ils seraient écrasés par ceux d'origine
    if (!enregistre) { toast.error('📡 Réglages pas encore lus : vérifie ta connexion puis réessaie'); return; }
    setBusy(true);
    const maintenant = new Date().toISOString();
    const { error } = await supabase.from('app_appearance').upsert([
      ...(enregistre ? [{ key: 'saisons_avant', value: enregistre as unknown as never, updated_at: maintenant, updated_by: user?.id ?? null }] : []),
      { key: 'saisons', value: valeur as unknown as never, updated_at: maintenant, updated_by: user?.id ?? null },
    ]);
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    queryClient.invalidateQueries({ queryKey: ['app-appearance'] });
    toast.success(message);
  };

  // « Ambiance neutre » s'applique tout de suite (c'est un gros bouton visible, pas un réglage fin)
  const basculerNeutre = () => {
    const v = { ...r, neutre: !r.neutre };
    setR(v);
    void enregistrer(v, v.neutre ? '⚪ Ambiance neutre : l\'appli est comme avant pour tout le monde' : '🍂 Décorations remises pour tout le monde');
  };

  if (isLoading) return <p className="text-center text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Un instant…</p>;
  if (isError && !enregistre) return (
    <div className="text-center text-sm space-y-2">
      <p className="text-muted-foreground">📡 Réglages illisibles pour l'instant (connexion ?).</p>
      <Button size="sm" variant="outline" onClick={() => void refetch()}>🔄 Réessayer</Button>
    </div>
  );

  const maj = <K extends keyof ReglagesSaisons>(k: K, v: ReglagesSaisons[K]) => setR((x) => ({ ...x, [k]: v }));
  const majA = (k: keyof ReglagesAutomne, v: boolean) => setR((x) => ({ ...x, automne: { ...x.automne, [k]: v } }));
  const majH = (k: keyof ReglagesHiver, v: boolean) => setR((x) => ({ ...x, hiver: { ...x.hiver, [k]: v } }));
  const majC = (s: 'printemps' | 'ete', k: keyof ReglagesClair, v: boolean) => setR((x) => ({ ...x, [s]: { ...x[s], [k]: v } }));
  const ligne = (k: 'auto' | 'annonce' | 'elevesPeuventCouper' | 'ramadanDabord' | 'themeSombre' | 'pluieEtoiles' | 'decorPages' | 'animerToujours', label: string, aide?: string) => (
    <label className="flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-card px-3 py-2 cursor-pointer">
      <span className="min-w-0"><span className="block text-sm font-bold">{label}</span>{aide && <span className="block text-xs text-muted-foreground">{aide}</span>}</span>
      <Switch checked={r[k]} onCheckedChange={(v) => maj(k, v)} />
    </label>
  );
  const enCours = saisonDuJour();
  const reduitAnimations = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="space-y-4">
      <div className={cn('rounded-3xl border-2 p-4 space-y-4', r.neutre ? 'border-border bg-card' : 'border-[#e2c08f] bg-gradient-to-br from-[#fff8ee] to-[#fbe7c8] dark:from-amber-950/30 dark:to-orange-950/20')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-extrabold">🍂 Décorations saisons</p>
            <p className="text-xs text-muted-foreground">Saison en cours : {NOM_SAISON[enCours]} ({DATES_SAISON[enCours]})</p>
          </div>
          <Button size="sm" variant={r.neutre ? 'default' : 'outline'} disabled={busy} onClick={basculerNeutre} aria-pressed={r.neutre} className="shrink-0">
            {r.neutre ? '✓ Ambiance neutre' : 'Ambiance neutre'}
          </Button>
        </div>
        {r.neutre && <p className="rounded-xl bg-muted px-3 py-2 text-sm">⚪ Aucune décoration : l'appli est exactement comme avant. Tes réglages de chaque saison sont gardés : touche « ✓ Ambiance neutre » pour les remettre.</p>}

        <section className="space-y-2">
          <p className="text-sm font-extrabold">⚙️ Pour toutes les saisons</p>
          {ligne('auto', 'Changer de saison tout seul', 'Le 1er décembre, 1er mars, 1er juin et 1er septembre')}
          {!r.auto && (
            <div className="flex flex-wrap gap-1.5">
              {ORDRE.map((s) => (
                <button key={s} type="button" aria-pressed={r.saisonChoisie === s} onClick={() => maj('saisonChoisie', s)}
                  className={cn('rounded-full border px-3 py-1 text-sm', r.saisonChoisie === s ? 'bg-[#b5562b] text-white border-[#b5562b]' : 'bg-card')}>{NOM_SAISON[s]}</button>
              ))}
            </div>
          )}
          {ligne('elevesPeuventCouper', 'Les élèves peuvent couper les décorations pour eux', 'Dans leurs ⚙️ Paramètres')}
          {ligne('ramadanDabord', 'Pendant le Ramadan, pas de décor de saison', 'Les couleurs du Ramadan passent avant')}
          {ligne('themeSombre', 'Décorer aussi le thème sombre', 'Décoché au départ')}
          {ligne('animerToujours', '📱 Animer même si le téléphone demande « Réduire les animations »', reduitAnimations ? "⚠️ CE téléphone a « Réduire les animations » activé (Réglages › Accessibilité › Mouvement) : décoché, tout serait figé ici" : "Ce téléphone ne demande pas moins d'animations")}
          {ligne('decorPages', '🍂 Petit décor dans les pages', "Quelques feuilles (ou flocons, pétales) qui tombent doucement dans les autres pages que l'accueil")}
          {ligne('pluieEtoiles', "Garder la pluie d'étoiles du titre", "Décoché : pendant une saison, il y a déjà les feuilles ou les flocons qui tombent")}
          <label className="block text-sm font-semibold">Quantité de feuilles : <b>{r.quantite <= 12 ? 'Très discret' : r.quantite <= 24 ? 'Normal' : 'Festif'}</b> ({r.quantite})
            <input type="range" min={5} max={40} value={r.quantite} onChange={(e) => maj('quantite', Number(e.target.value))} className="w-full accent-[#b5562b]" />
          </label>
          <label className="block text-sm font-semibold">Vitesse de chute : <b>{['', 'Très lente', 'Lente', 'Normale', 'Rapide', 'Très rapide'][r.vitesse]}</b>
            <input type="range" min={1} max={5} value={r.vitesse} onChange={(e) => maj('vitesse', Number(e.target.value))} className="w-full accent-[#b5562b]" />
          </label>
          <label className="block text-sm font-semibold">Taille de l'arbre : <b>{['', 'Petit', 'Moyen', 'Grand'][r.tailleArbre]}</b>
            <input type="range" min={1} max={3} value={r.tailleArbre} onChange={(e) => maj('tailleArbre', Number(e.target.value))} className="w-full accent-[#b5562b]" />
          </label>
        </section>

        <div className="grid grid-cols-4 gap-1.5" role="tablist">
          {ORDRE.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={onglet === s} onClick={() => setOnglet(s)}
              className={cn('rounded-xl border-2 px-1 py-1.5 text-xs', onglet === s ? 'border-[#b5562b] bg-[#b5562b]/10 font-bold' : 'border-transparent bg-muted/60')}>
              <span className="block text-base">{NOM_SAISON[s].split(' ')[0]}</span>{NOM_SAISON[s].split(' ').slice(1).join(' ')}
              <span className="block text-[10px] text-muted-foreground">{DATES_SAISON[s]}</span>
            </button>
          ))}
        </div>

        {onglet === 'automne' ? (
          <div className="space-y-3">
            {GROUPES_AUTOMNE.map((g) => (
              <section key={g.titre} className="space-y-1.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{g.titre}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((it) => (
                    <button key={it.k} type="button" aria-pressed={r.automne[it.k]} onClick={() => majA(it.k, !r.automne[it.k])}
                      className={cn('rounded-full border px-3 py-1 text-sm text-start', r.automne[it.k] ? 'bg-[#b5562b] text-white border-[#b5562b]' : 'bg-card')}>{it.label}</button>
                  ))}
                </div>
              </section>
            ))}
            <div className="flex flex-wrap items-end gap-2 rounded-xl bg-card/70 p-2">
              {Object.entries(IMAGES_AUTOMNE).map(([k, im]) => (
                <figure key={k} className="m-0 flex w-14 flex-col items-center text-[10px] text-muted-foreground">
                  <svg viewBox="0 0 48 48" aria-hidden className="h-10 w-10" dangerouslySetInnerHTML={{ __html: im.svg }} />{im.nom}
                </figure>
              ))}
            </div>
          </div>
        ) : onglet === 'hiver' ? (
          <div className="space-y-3">
            {GROUPES_HIVER.map((g) => (
              <section key={g.titre} className="space-y-1.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{g.titre}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((it) => (
                    <button key={it.k} type="button" aria-pressed={r.hiver[it.k]} onClick={() => majH(it.k, !r.hiver[it.k])}
                      className={cn('rounded-full border px-3 py-1 text-sm text-start', r.hiver[it.k] ? 'bg-[#3f6fb5] text-white border-[#3f6fb5]' : 'bg-card')}>{it.label}</button>
                  ))}
                </div>
              </section>
            ))}
            <div className="flex flex-wrap items-end gap-2 rounded-xl bg-card/70 p-2">
              {Object.entries(IMAGES_HIVER).map(([k, [nom, svg]]) => (
                <figure key={k} className="m-0 flex w-14 flex-col items-center text-center text-[10px] text-muted-foreground">
                  <svg viewBox="0 0 48 48" aria-hidden className="h-10 w-10" dangerouslySetInnerHTML={{ __html: svg }} />{nom}
                </figure>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">❄️ L'hiver s'affiche tout seul du 1er décembre à fin février. Pour le voir avant : « 👀 Voir une saison sur mon téléphone seulement » ci-dessous.</p>
          </div>
        ) : onglet === 'printemps' || onglet === 'ete' ? (
          <div className="space-y-3">
            {groupesClair(onglet === 'ete').map((g) => (
              <section key={g.titre} className="space-y-1.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{g.titre}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((it) => (
                    <button key={it.k} type="button" aria-pressed={r[onglet][it.k]} onClick={() => majC(onglet, it.k, !r[onglet][it.k])}
                      className={cn('rounded-full border px-3 py-1 text-sm text-start', r[onglet][it.k] ? (onglet === 'ete' ? 'bg-[#2e8fd0] text-white border-[#2e8fd0]' : 'bg-[#5a9e2f] text-white border-[#5a9e2f]') : 'bg-card')}>{it.label}</button>
                  ))}
                </div>
              </section>
            ))}
            <div className="flex flex-wrap items-end gap-2 rounded-xl bg-card/70 p-2">
              {Object.entries(IMAGES_CLAIR[onglet]).map(([k, [nom, svg]]) => (
                <figure key={k} className="m-0 flex w-14 flex-col items-center text-center text-[10px] text-muted-foreground">
                  <svg viewBox="0 0 48 48" aria-hidden className="h-10 w-10" dangerouslySetInnerHTML={{ __html: svg }} />{nom}
                </figure>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{onglet === 'ete' ? '☀️ L\'été s\'affiche tout seul du 1er juin à fin août.' : '🌸 Le printemps s\'affiche tout seul du 1er mars à fin mai.'} Pour le voir avant : « 👀 Voir une saison sur mon téléphone seulement » ci-dessous.</p>
          </div>
        ) : (
          <p className="rounded-xl bg-muted px-3 py-2 text-sm">{NOM_SAISON[onglet]} : {IDEES_A_VENIR[onglet]} En attendant, cette saison reste en ambiance neutre.</p>
        )}

        {/* 🎠 Petits jeux des décors (2026-11-11) : rien à gagner, juste des animations — mêmes jeux à chaque saison */}
        <JeuxReglages jeux={r.jeux} setJeux={(v) => setR((x) => ({ ...x, jeux: { ...x.jeux, ...v } }))} />

        <MeteoEtLogo saison={onglet} meteo={r.meteo[onglet]} logo={r.logo[onglet]}
          setMeteo={(v) => setR((x) => ({ ...x, meteo: { ...x.meteo, [onglet]: { ...x.meteo[onglet], ...v } } }))}
          setLogo={(v) => setR((x) => ({ ...x, logo: { ...x.logo, [onglet]: { ...x.logo[onglet], ...v } } }))} />

        <label className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-border bg-card px-3 py-2">
          <span className="min-w-0"><span className="block text-sm font-bold">👀 Voir une saison sur mon téléphone seulement</span><span className="block text-xs text-muted-foreground">Les élèves ne voient pas la différence</span></span>
          <select value={apercu ?? ''} onChange={(e) => { const v = (e.target.value || null) as Saison | null; setApercu(v); choisirApercu(v); }}
            className="rounded-lg border bg-background px-2 py-1 text-sm" aria-label="Aperçu d'une saison">
            <option value="">Comme les élèves</option>
            {SAISONS_PRETES.map((s) => <option key={s} value={s}>{NOM_SAISON[s]}</option>)}
          </select>
        </label>
      </div>

      <div className="sticky bottom-0 grid gap-2 bg-background/95 py-2 sm:grid-cols-2">
        <Button disabled={!modifie || busy} onClick={() => void enregistrer(r)}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}💾 Enregistrer pour tout le monde</Button>
        {modifie
          ? <Button variant="outline" onClick={() => enregistre && setR(enregistre)}>↩️ Annuler mes changements</Button>
          : <Button variant="outline" onClick={() => setConfirmeOrigine(true)}>♻️ Revenir aux réglages d'origine</Button>}
      </div>

      <AlertDialog open={confirmeOrigine} onOpenChange={setConfirmeOrigine}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revenir aux réglages d'origine ?</AlertDialogTitle>
            <AlertDialogDescription>Toutes les décorations (les 4 saisons) seront remises comme dans les maquettes validées (quantité « Normal »). Tes réglages actuels sont gardés en « version d'avant ».</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setR(SAISONS_DEFAUT); void enregistrer(SAISONS_DEFAUT); }}>Revenir à l'origine</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const COULEUR: Record<Saison, string> = { hiver: '#3f6fb5', printemps: '#5a9e2f', ete: '#2e8fd0', automne: '#b5562b' };
const MODES: { v: ModeMeteo; label: string; aide: string }[] = [
  { v: 'parfois', label: '🌦️ De temps en temps', aide: 'Une averse de temps en temps, puis l’arc-en-ciel' },
  { v: 'periode', label: '📅 Pendant une période', aide: 'Il pleut tout le temps entre deux dates' },
  { v: 'meteo', label: '🛰️ Selon la vraie météo', aide: 'Quand il pleut vraiment dans la ville des horaires de prière' },
];
const RYTHMES: { v: RythmeLogo; label: string }[] = [
  { v: 'connexion', label: 'à chaque connexion' }, { v: 'jour', label: 'chaque jour' }, { v: 'semaine', label: 'chaque semaine' }, { v: 'mois', label: 'chaque mois' },
];

/** 🌧️🌈 Pluie + arc-en-ciel et 🌼 objets du logo, pour la saison de l'onglet (2026-11-04) */
function MeteoEtLogo({ saison, meteo: m, logo, setMeteo, setLogo }: {
  saison: Saison; meteo: ReglagesMeteo; logo: ReglagesLogo; setMeteo: (v: Partial<ReglagesMeteo>) => void; setLogo: (v: Partial<ReglagesLogo>) => void;
}) {
  const coul = COULEUR[saison];
  const puce = (actif: boolean, label: string, onClick: () => void, key?: string) => (
    <button key={key ?? label} type="button" aria-pressed={actif} onClick={onClick}
      className={cn('rounded-full border px-3 py-1 text-sm text-start', actif ? 'text-white' : 'bg-card')}
      style={actif ? { background: coul, borderColor: coul } : undefined}>{label}</button>
  );
  const cat = OBJETS_LOGO[saison];
  const basculerObjet = (k: string) => setLogo({ objets: logo.objets.includes(k) ? logo.objets.filter((x) => x !== k) : [...logo.objets, k] });
  return (
    <div className="space-y-3">
      <section className="space-y-2 rounded-2xl border-2 border-sky-200 bg-sky-50/70 p-3 dark:border-sky-900 dark:bg-sky-950/20">
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">La pluie et l'arc-en-ciel</p>
        <div className="flex flex-wrap gap-1.5">
          {puce(m.averse, saison === 'hiver' && m.neige ? '🌨️ Tempête de flocons' : '🌧️ Averse', () => setMeteo({ averse: !m.averse }))}
          {puce(m.arcEnCiel, '🌈 Arc-en-ciel après la pluie (de jour)', () => setMeteo({ arcEnCiel: !m.arcEnCiel }))}
          {puce(m.ciel, '☁️ Ciel un peu gris pendant l\'averse', () => setMeteo({ ciel: !m.ciel }))}
          {saison === 'hiver' && puce(m.neige, '❄️ L\'hiver : des flocons au lieu de la pluie', () => setMeteo({ neige: !m.neige }))}
        </div>
        <div className="grid gap-1.5 sm:grid-cols-3">
          {MODES.map((o) => (
            <button key={o.v} type="button" aria-pressed={m.mode === o.v} onClick={() => setMeteo({ mode: o.v })}
              className={cn('rounded-xl border-2 px-2 py-1.5 text-start', m.mode === o.v ? 'bg-card font-bold' : 'border-transparent bg-card/50')}
              style={m.mode === o.v ? { borderColor: coul } : undefined}>
              <span className="block text-sm">{o.label}</span><span className="block text-[11px] text-muted-foreground">{o.aide}</span>
            </button>
          ))}
        </div>
        {m.mode === 'parfois' && (
          <>
            <label className="block text-sm font-semibold">Combien de fois : <b>{['', 'Rarement (≈ toutes les 30 min)', 'De temps en temps (≈ 15 min)', 'Souvent (≈ 6 min)'][m.frequence]}</b>
              <input type="range" min={1} max={3} value={m.frequence} onChange={(e) => setMeteo({ frequence: Number(e.target.value) })} className="w-full" style={{ accentColor: coul }} />
            </label>
            <label className="block text-sm font-semibold">Durée d'une averse : <b>{m.duree} secondes</b>
              <input type="range" min={15} max={90} step={5} value={m.duree} onChange={(e) => setMeteo({ duree: Number(e.target.value) })} className="w-full" style={{ accentColor: coul }} />
            </label>
          </>
        )}
        {m.mode === 'periode' && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-1">Du <input type="date" value={m.du} onChange={(e) => setMeteo({ du: e.target.value })} className="rounded-lg border bg-background px-2 py-1" /></label>
            <label className="flex items-center gap-1">au <input type="date" value={m.au} min={m.du || undefined} onChange={(e) => setMeteo({ au: e.target.value })} className="rounded-lg border bg-background px-2 py-1" /></label>
            {(!m.du || !m.au) && <span className="text-xs font-semibold text-amber-700">⚠️ Choisis les deux dates</span>}
            {m.du && m.au && <span className="text-xs text-muted-foreground">🌈 L'arc-en-ciel apparaît le lendemain.</span>}
          </div>
        )}
        {m.mode === 'meteo' && <p className="text-xs text-muted-foreground">🛰️ Chaque élève voit la météo de SA ville (celle de ses horaires de prière), vérifiée toutes les 15 minutes. Sans Internet : pas de pluie.</p>}
        {m.mode !== 'meteo' && (
          <label className="block text-sm font-semibold">Intensité : <b>{['', 'Petite bruine', 'Averse', 'Grosse pluie'][m.intensite]}</b>
            <input type="range" min={1} max={3} value={m.intensite} onChange={(e) => setMeteo({ intensite: Number(e.target.value) })} className="w-full" style={{ accentColor: coul }} />
          </label>
        )}
        <label className="block text-sm font-semibold">💧 Nombre de gouttes : <b>{['', 'Très peu', 'Peu', 'Normal', 'Beaucoup', 'Énormément'][m.gouttes]}</b>
          <input type="range" min={1} max={5} value={m.gouttes} onChange={(e) => setMeteo({ gouttes: Number(e.target.value) })} className="w-full" style={{ accentColor: coul }} />
        </label>
        <label className="block text-sm font-semibold">💨 Vitesse de chute : <b>{['', 'Très lente', 'Lente', 'Normale', 'Rapide', 'Très rapide'][m.vitesseGouttes]}</b>
          <input type="range" min={1} max={5} value={m.vitesseGouttes} onChange={(e) => setMeteo({ vitesseGouttes: Number(e.target.value) })} className="w-full" style={{ accentColor: coul }} />
        </label>
        <label className="block text-sm font-semibold">L'arc-en-ciel reste : <b>{m.dureeArc} secondes</b>
          <input type="range" min={10} max={60} step={5} value={m.dureeArc} onChange={(e) => setMeteo({ dureeArc: Number(e.target.value) })} className="w-full" style={{ accentColor: coul }} />
        </label>
        <Button type="button" size="sm" variant="outline" onClick={() => { essayerAverse(); toast('🌧️ Retourne sur l\'accueil : l\'averse arrive (sur ce téléphone seulement), puis l\'arc-en-ciel'); }}>
          ▶️ Essayer maintenant sur mon téléphone
        </Button>
      </section>

      <section className="space-y-2 rounded-2xl border-2 border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900 dark:bg-amber-950/20">
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Sur le logo (en haut à droite)</p>
        <p className="text-xs text-muted-foreground">Coche un ou plusieurs objets. Plusieurs = ils alternent. Aucun = rien sur le logo.</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(cat).map(([k, o]) => {
            const actif = logo.objets.includes(k);
            return (
              <button key={k} type="button" aria-pressed={actif} onClick={() => basculerObjet(k)}
                className={cn('flex w-[4.6rem] flex-col items-center gap-1 rounded-xl border-2 bg-card p-1.5 text-center text-[11px] leading-tight', !actif && 'border-transparent opacity-70')}
                style={actif ? { borderColor: coul } : undefined}>
                <span className="relative inline-block h-11 w-11">
                  <img src="/icon-192.png" alt="" className="h-11 w-11 rounded-xl" />
                  <svg viewBox="0 0 24 24" aria-hidden className="absolute overflow-visible" style={{ width: o.t * 0.8, height: o.t * 0.8, right: -o.t * 0.3, top: -o.t * 0.3, transform: `rotate(${o.rot}deg)` }} dangerouslySetInnerHTML={{ __html: o.svg }} />
                </span>
                {actif && <b style={{ color: coul }}>✓</b>}{o.nom}
              </button>
            );
          })}
        </div>
        {logo.objets.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-semibold">🔁 Changer d'objet :</span>
            {RYTHMES.map((o) => puce(logo.rythme === o.v, o.label, () => setLogo({ rythme: o.v }), o.v))}
          </div>
        )}
      </section>
    </div>
  );
}

/** 🎠 Réglages des petits jeux des décors (idée 9 du 2026-11-11) : chaque jeu allumé/éteint, tout le monde ou certains groupes */
function JeuxReglages({ jeux, setJeux }: { jeux: ReglagesJeux; setJeux: (v: Partial<ReglagesJeux>) => void }) {
  const { data: groupes = [] } = useQuery({
    queryKey: ['admin-student-groups'],
    queryFn: async () => ((await supabase.from('student_groups').select('id, name').order('position', { ascending: true, nullsFirst: false }).order('name')).data || []),
  });
  const ligne = (k: Exclude<keyof ReglagesJeux, 'groupes'>, label: string, aide: string) => (
    <label className="flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-card px-3 py-2 cursor-pointer">
      <span className="min-w-0"><span className="block text-sm font-bold">{label}</span><span className="block text-xs text-muted-foreground">{aide}</span></span>
      <Switch checked={jeux[k]} onCheckedChange={(v) => setJeux({ [k]: v })} />
    </label>
  );
  return (
    <section className="space-y-2">
      <p className="text-sm font-extrabold">🎠 Petits jeux (toutes les saisons, rien à gagner)</p>
      {ligne('compagnon', '🦔 Le compagnon grandit', 'Le personnage qui se promène en bas grandit un peu à la 1ʳᵉ connexion du jour (une fois par 24 h)')}
      {ligne('parle', '💬 Le compagnon parle', 'On touche le personnage qui se promène : il s\'arrête 10 secondes et dit un message (devoirs, encouragements), puis repart')}
      {ligne('arbreSemaine', '🌳 L\'arbre de la semaine', 'Un fruit par devoir, lettre, leçon ou sourate validé depuis lundi')}
      {ligne('secoue', '🎁 Secoue l\'arbre', 'Toucher l\'arbre (le chalet, le soleil) : un nom d\'Allah à découvrir, une fois par jour')}
      {ligne('questionFeu', '❓ La question du coin du feu', 'Le petit « ? » sur la cheminée : une question par jour')}
      {ligne('feuSemaine', '🔥 La flamme suit la semaine', 'Automne et hiver : au maximum le mercredi dès 18 h, un cran de moins par jour sans connexion, braises au 7ᵉ jour ; venir la ravive')}
      {ligne('feuDevoirs', '🪵 Une bûche par devoir validé', 'Chaque devoir validé de la semaine ajoute une bûche ; tous les devoirs faits = grand feu')}
      {ligne('feuDecor', '🐈 Le chat et la théière', 'Grand feu : la théière fume et le chat dort devant ; feu éteint : le chat attend en regardant l\'élève')}
      {ligne('feuEtincelles', '✨ Les étincelles du bonjour', 'À la 1ʳᵉ visite du jour, quelques étincelles montent de la cheminée')}
      {ligne('cacheCache', '🙈 Cache-cache', 'L\'animal se cache chaque jour derrière une carte : le trouver = un mot gentil, le mot arabe du jour, une danse, son habit du jour et l\'album des cachettes')}
      <div className="space-y-1.5">
        <p className="text-xs font-bold">Pour qui ?</p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={!jeux.groupes.length} onClick={() => setJeux({ groupes: [] })}
            className={cn('rounded-full border px-3 py-1 text-xs font-bold', !jeux.groupes.length ? 'bg-[#b5562b] text-white border-[#b5562b]' : 'bg-card')}>🌍 Tout le monde</button>
          {groupes.map((g) => { const on = jeux.groupes.includes(g.id); return (
            <button key={g.id} type="button" aria-pressed={on} onClick={() => setJeux({ groupes: on ? jeux.groupes.filter((x) => x !== g.id) : [...jeux.groupes, g.id] })}
              className={cn('rounded-full border px-3 py-1 text-xs font-medium', on ? 'bg-[#b5562b] text-white border-[#b5562b]' : 'bg-card')}>{on ? '✓ ' : ''}{g.name}</button>
          ); })}
        </div>
      </div>
    </section>
  );
}
