import { cn } from '@/lib/utils';

/**
 * 🕌 Degré d'authenticité d'un hadith (règle n°1 de Nadia, 2026-11-27 : « je veux que tu le mettes en application dans
 * TOUTE l'appli sans exception »). Une pastille lisible par les élèves, en français et en arabe.
 * - SAHIH (صحيح) · Authentique · HASAN (حسن) · Bon · DA'IF (ضعيف) · Faible · MAWDOU' (موضوع) · Inventé
 * - `divergence` : les spécialistes du hadith ne sont pas d'accord → on l'écrit au lieu de choisir arbitrairement.
 * Le Coran n'a pas de degré : utiliser `coran` (pastille « Coran »).
 */
export type Degre = 'sahih' | 'hasan' | 'daif' | 'mawdou' | 'coran';

export const DEGRES: Record<Degre, { fr: string; ar: string; nom: string; sens: string; classe: string }> = {
  sahih: { nom: 'SAHIH', ar: 'صحيح', fr: 'Authentique', sens: 'Hadith reconnu authentique.', classe: 'bg-emerald-100 text-emerald-900 ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-100 dark:ring-emerald-700' },
  hasan: { nom: 'HASAN', ar: 'حسن', fr: 'Bon', sens: 'Hadith fiable, mais dont le degré est inférieur au Sahih.', classe: 'bg-sky-100 text-sky-900 ring-sky-300 dark:bg-sky-900/40 dark:text-sky-100 dark:ring-sky-700' },
  daif: { nom: "DA'IF", ar: 'ضعيف', fr: 'Faible', sens: 'Hadith présentant une faiblesse dans sa chaîne de transmission ou sa transmission.', classe: 'bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-100 dark:ring-amber-700' },
  mawdou: { nom: "MAWDOU'", ar: 'موضوع', fr: 'Inventé', sens: 'Hadith fabriqué et faussement attribué au Prophète ﷺ.', classe: 'bg-rose-100 text-rose-900 ring-rose-300 dark:bg-rose-900/40 dark:text-rose-100 dark:ring-rose-700' },
  coran: { nom: 'CORAN', ar: 'قرآن', fr: 'Le Saint Coran', sens: 'Parole d\'Allah.', classe: 'bg-violet-100 text-violet-900 ring-violet-300 dark:bg-violet-900/40 dark:text-violet-100 dark:ring-violet-700' },
};

/** Devine le degré d'après une source écrite (« Sahih al-Boukhari 6405 », « Coran 2:255 »…) quand il n'est pas donné */
export function degreDeSource(source: string | null | undefined): Degre | null {
  const s = (source || '').toLowerCase();
  if (!s) return null;
  if (/\bcoran\b|sourate|qur'?an/.test(s)) return 'coran';
  if (/boukh|bukh|mouslim|muslim/.test(s)) return 'sahih';
  return null;
}

export function DegreAuthenticite({ degre, divergence, compact = false, className }: {
  degre: Degre | null | undefined; divergence?: string | null; compact?: boolean; className?: string;
}) {
  if (!degre) return null;
  const d = DEGRES[degre];
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1 align-middle', className)}>
      <span title={`${d.nom} · ${d.fr} — ${d.sens}`}
        className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide ring-1', d.classe)}>
        {d.nom}{!compact && <span className="font-arabic text-[11px] font-bold">{d.ar}</span>}{!compact && <span className="font-semibold">· {d.fr}</span>}
      </span>
      {divergence && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-border" title={divergence}>
          ⚖️ Avis divergents
        </span>
      )}
    </span>
  );
}
