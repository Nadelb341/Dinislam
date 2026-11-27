import { useState } from 'react';
import { ChevronDown, Info, Pencil } from 'lucide-react';
import { DegreAuthenticite } from '@/components/shared/DegreAuthenticite';
import { cn } from '@/lib/utils';
import { blocs, degreSection, numerosSections, STATUTS, type FicheAdulte as Fiche, type SectionFiche, type StatutNom } from '@/lib/ficheAdulte';
import { EditeurFicheAdulte } from './EditeurFicheAdulte';

/**
 * 🌟 Fiche ADULTE d'un nom (textes de Nadia, 27/11/2026), présentée comme ses captures : nom arabe, translittération,
 * traduction, puis sections numérotées ; encadré « ⓘ À savoir – Divergence entre les savants » repliable ;
 * badge 🟢 Établi / 🟠 Divergence / 🔴 Non établi ; pastille de degré pour chaque preuve.
 * `partie` : « entete » (au-dessus de l'enregistrement de l'élève) ou « corps » (le reste).
 */
const OR = 'hsl(38 92% 62%)';
const TEXTE = 'hsl(222 15% 82%)';
const DOUX = 'hsl(222 15% 66%)';

export function BadgeStatut({ statut, petit = false }: { statut: StatutNom; petit?: boolean }) {
  const s = STATUTS[statut];
  return (
    <span title={s.sens} className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full font-extrabold ring-1', s.classe,
      petit ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs')}>
      <span aria-hidden="true">{s.emoji}</span>{s.libelle}
    </span>
  );
}

function Blocs({ t, italique = false }: { t: string | null | undefined; italique?: boolean }) {
  return (
    <>
      {blocs(t).map((b, i) => b.type === 'p'
        ? <p key={i} className={cn('text-sm leading-relaxed [overflow-wrap:anywhere]', italique && 'italic')} style={{ color: TEXTE }}>{b.texte}</p>
        : (
          <ul key={i} className="list-disc space-y-1 ps-5 text-sm leading-relaxed" style={{ color: TEXTE }}>
            {b.puces.map((p, k) => <li key={k} className="[overflow-wrap:anywhere]">{p}</li>)}
          </ul>
        ))}
    </>
  );
}

function Arabe({ t }: { t: string }) {
  return (
    <p dir="rtl" lang="ar" className="font-arabic text-2xl leading-loose text-right" style={{ color: 'hsl(45 93% 70%)', overflowWrap: 'normal', wordBreak: 'normal' }}>{t}</p>
  );
}

function Ref({ s }: { s: SectionFiche }) {
  if (!s.ref && !s.degre) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {s.ref && <p className="text-xs font-semibold [overflow-wrap:anywhere] whitespace-pre-line" style={{ color: DOUX }}>📖 {s.ref}</p>}
      <DegreAuthenticite degre={degreSection(s.degre)} divergence={s.divergence} compact />
    </div>
  );
}

function Divergence({ s }: { s: SectionFiche }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <section className="rounded-xl" style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.45)' }}>
      <button type="button" onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert}
        className="flex w-full items-center gap-2 p-3 text-left">
        <Info className="h-5 w-5 shrink-0" style={{ color: OR }} />
        <span className="min-w-0 flex-1 text-sm font-bold [overflow-wrap:anywhere]" style={{ color: 'hsl(25 95% 72%)' }}>
          {s.titre}
          <span className="block text-xs font-semibold" style={{ color: DOUX }}>Comprendre les divergences entre savants</span>
        </span>
        <ChevronDown className={cn('h-5 w-5 shrink-0 transition-transform', ouvert && 'rotate-180')} style={{ color: OR }} />
      </button>
      {ouvert && <div className="space-y-2 px-4 pb-4"><Blocs t={s.texte} /></div>}
    </section>
  );
}

function Contenu({ s, statut }: { s: SectionFiche; statut: StatutNom }) {
  switch (s.type) {
    case 'preuve': return (
      <div className="space-y-2">
        {s.arabe && <Arabe t={s.arabe} />}
        <Blocs t={s.traduction} />
        <Ref s={s} />
        <Blocs t={s.texte} />
      </div>
    );
    case 'invocation': return (
      <div className="space-y-2">
        <Blocs t={s.texte} italique />
        {s.note && <p className="text-xs leading-relaxed [overflow-wrap:anywhere]" style={{ color: DOUX }}>✍️ {s.note}</p>}
      </div>
    );
    case 'prophetique': return (
      <div className="space-y-2">
        <p className="inline-block rounded-full px-3 py-1 text-xs font-bold ring-1"
          style={{ background: 'rgba(16,185,129,0.15)', color: 'hsl(152 70% 70%)', borderColor: 'rgba(16,185,129,0.45)' }}>
          📿 Texte rapporté (à distinguer de l'invocation personnelle)
        </p>
        <Blocs t={s.texte} />
        {s.arabe && <Arabe t={s.arabe} />}
        {s.phonetique && <p className="text-sm italic [overflow-wrap:anywhere]" style={{ color: OR }}>{s.phonetique}</p>}
        <Blocs t={s.traduction} />
        <Ref s={s} />
        {s.note && <p className="text-xs leading-relaxed [overflow-wrap:anywhere]" style={{ color: DOUX }}>ⓘ {s.note}</p>}
      </div>
    );
    case 'authenticite': return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <BadgeStatut statut={statut} />
          {s.badge && <span className="rounded-full px-2.5 py-1 text-xs font-bold ring-1" style={{ color: OR, borderColor: 'rgba(217,119,6,0.5)', background: 'rgba(217,119,6,0.12)' }}>{s.badge}</span>}
        </div>
        <Blocs t={s.texte} />
      </div>
    );
    default: return <div className="space-y-2"><Blocs t={s.texte} /></div>;
  }
}

export function FicheAdulte({ fiche, numero, nameId, isAdmin, partie }: {
  fiche: Fiche; numero: number | null; nameId: number; isAdmin: boolean; partie: 'entete' | 'corps';
}) {
  const [edition, setEdition] = useState<number | 'entete' | null>(null);
  const crayon = (cible: number | 'entete', libelle: string) => isAdmin && (
    <button type="button" onClick={() => setEdition(cible)} aria-label={`Modifier : ${libelle}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-amber-500 text-white shadow-md hover:bg-amber-600">
      <Pencil className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
  const editeur = edition !== null && (
    <EditeurFicheAdulte fiche={fiche} nameId={nameId} cible={edition} onClose={() => setEdition(null)} />
  );

  if (partie === 'entete') {
    return (
      <section aria-label="Le nom" className="space-y-2 rounded-2xl p-4 text-center" style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.3)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: 'hsl(152 70% 70%)' }}>Fiche n° {numero}</span>
          <div className="flex items-center gap-2"><BadgeStatut statut={fiche.statut} />{crayon('entete', 'le nom et son statut')}</div>
        </div>
        <p dir="rtl" lang="ar" className="font-arabic text-5xl font-bold leading-tight text-white" style={{ overflowWrap: 'normal', wordBreak: 'normal' }}>{fiche.nom_arabe}</p>
        <p className="text-2xl font-bold [overflow-wrap:anywhere]" style={{ color: OR }}>{fiche.translit}</p>
        <p className="text-base font-bold text-white [overflow-wrap:anywhere]">{fiche.traduction}</p>
        {fiche.provenance && <p className="text-xs [overflow-wrap:anywhere]" style={{ color: DOUX }}>Provenance : {fiche.provenance}</p>}
        {editeur}
      </section>
    );
  }

  const numeros = numerosSections(fiche.sections);
  return (
    <div className="space-y-3">
      {fiche.sections.map((s, i) => s.type === 'divergence'
        ? <div key={i} className="flex items-start gap-2"><div className="min-w-0 flex-1"><Divergence s={s} /></div>{crayon(i, s.titre)}</div>
        : (
          <section key={i} aria-label={s.titre} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(217,119,6,0.22)' }}>
            <div className="mb-2 flex items-start gap-2">
              <h3 className="min-w-0 flex-1 text-sm font-extrabold leading-snug [overflow-wrap:anywhere]" style={{ color: OR }}>{numeros[i]}. {s.titre}</h3>
              {crayon(i, s.titre)}
            </div>
            <Contenu s={s} statut={fiche.statut} />
          </section>
        ))}
      {editeur}
    </div>
  );
}
