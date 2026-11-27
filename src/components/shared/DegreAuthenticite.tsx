import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DEGRES, LISTE_DEGRES, degreAffiche, type Degre } from '@/lib/degreAuthenticite';

/**
 * 🕌 Pastille « degré d'authenticité » (règle n°1 de Nadia, 2026-11-27 : « dans TOUTE l'appli sans exception »).
 * SAHIH (صحيح) · Authentique · HASAN (حسن) · Bon · DA'IF (ضعيف) · Faible · MAWDOU' (موضوع) · Inventé · CORAN.
 * Toucher la pastille = petite bulle qui explique le niveau (et la divergence s'il y en a une) : marche au doigt
 * (pas seulement au survol de la souris). Couleurs pleines + liseré : visible de jour comme de nuit.
 * La logique (degreDeSource…) est dans `src/lib/degreAuthenticite.ts`.
 */
export { DEGRES, LISTE_DEGRES, degreDeSource, type Degre } from '@/lib/degreAuthenticite';

function Pilule({ d, compact }: { d: Degre; compact: boolean }) {
  const info = DEGRES[d];
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-extrabold leading-tight tracking-wide ring-1 shadow-sm', info.classe)}>
      {info.nom}
      {!compact && <span className="font-arabic text-[12px] font-bold" dir="rtl">{info.ar}</span>}
      {!compact && <span className="font-semibold">· {info.fr}</span>}
    </span>
  );
}

export function DegreAuthenticite({ degre, divergence, compact = false, interactif = true, className }: {
  degre: Degre | null | undefined;
  divergence?: string | null;
  compact?: boolean;
  /** false quand la pastille est DANS un bouton (pas de bouton dans un bouton) : simple étiquette */
  interactif?: boolean;
  className?: string;
}) {
  if (!degre) return null;
  const info = DEGRES[degre];
  const contenu = (
    <>
      <Pilule d={degre} compact={compact} />
      {divergence && (
        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold leading-tight text-slate-800 ring-1 ring-slate-400 shadow-sm dark:bg-slate-700 dark:text-slate-50 dark:ring-slate-400">
          ⚖️ Avis divergents
        </span>
      )}
    </>
  );
  if (!interactif) {
    return (
      <span className={cn('inline-flex flex-wrap items-center gap-1 align-middle', className)}
        title={`${info.nom} · ${info.fr} — ${info.sens}${divergence ? ` ⚖️ ${divergence}` : ''}`}>
        {contenu}
      </span>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`Degré : ${info.nom}, ${info.fr}${divergence ? ', avis divergents' : ''}. Toucher pour l'explication.`}
          onClick={(e) => e.stopPropagation()}
          className={cn('inline-flex flex-wrap items-center gap-1 align-middle rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary', className)}>
          {contenu}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-[calc(100vw-2rem)] p-3 text-sm space-y-1.5" onClick={(e) => e.stopPropagation()}>
        <p className="font-extrabold">
          {info.emoji} {info.nom} <span className="font-arabic" dir="rtl">{info.ar}</span> · {info.fr}
        </p>
        <p className="[overflow-wrap:anywhere]">{info.sens}</p>
        {divergence && (
          <p className="rounded-lg bg-muted p-2 [overflow-wrap:anywhere]">⚖️ <b>Avis divergents :</b> {divergence}</p>
        )}
        <Link to="/module/hadiths?onglet=niveaux" className="inline-block text-xs font-bold text-primary underline">📊 Les niveaux d'authenticité ›</Link>
      </PopoverContent>
    </Popover>
  );
}

/**
 * La pastille d'une CITATION : degré donné en base (`degre`), sinon deviné d'après la source écrite.
 * Verset + hadith dans la même source → 2 pastilles (CORAN + degré du hadith).
 * Rien de connu (ex. « Abou Dâwoud 5082 » sans degré) → rien (on n'invente pas) ; `aVerifier` le montre à l'enseignante.
 */
export function PastilleSource({ source, degre, divergence, compact, interactif, aVerifier = false, className }: {
  source?: string | null; degre?: string | null; divergence?: string | null;
  compact?: boolean; interactif?: boolean; aVerifier?: boolean; className?: string;
}) {
  const a = degreAffiche(source, degre);
  if (!a.degre) {
    if (aVerifier && (source || '').trim()) {
      return (
        <span className={cn('inline-flex items-center whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[11px] font-bold leading-tight text-slate-700 border border-dashed border-slate-400 dark:bg-slate-800 dark:text-slate-100', className)}>
          🔎 Degré à vérifier
        </span>
      );
    }
    return null;
  }
  const div = divergence || (a.divergenceSource ? 'Les spécialistes du hadith ne lui donnent pas tous le même degré (voir la source).' : null);
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1 align-middle', className)}>
      {a.coranAussi && <DegreAuthenticite degre="coran" compact interactif={interactif} />}
      <DegreAuthenticite degre={a.degre} divergence={div} compact={compact} interactif={interactif} />
    </span>
  );
}
