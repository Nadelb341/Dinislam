import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { DegreAuthenticite } from '@/components/shared/DegreAuthenticite';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import {
  degreValide, explicationDe, paragraphes, partiesAffichees, partieRemplie, type FicheNom as Fiche, type PartieFiche,
} from '@/lib/ficheNomAllah';
import { ModifierPartieFiche } from './ModifierPartieFiche';

const OR = 'hsl(38 92% 62%)';
const TEXTE = 'hsl(222 15% 80%)';

/** Couleur propre à chaque partie (règle « couleurs par carte »), lisible sur le fond nuit de la carte */
const TEINTE: Record<string, string> = {
  arabe: '38 92% 50%', translit: '45 93% 50%', signification: '199 89% 55%', explication: '160 70% 45%', preuve: '262 83% 68%',
  moment: '24 95% 58%', invocation: '330 81% 65%', reference: '187 85% 50%', divergences: '0 84% 65%',
};

function TitrePartie({ p, isAdmin, onModifier }: { p: PartieFiche; isAdmin: boolean; onModifier: () => void }) {
  return (
    <div className="mb-2 flex items-start gap-2">
      <h3 className="min-w-0 flex-1 text-sm font-extrabold leading-snug [overflow-wrap:anywhere]" style={{ color: `hsl(${TEINTE[p.cle]})` }}>
        <span aria-hidden="true">{p.emoji}</span> {p.numero}. {p.titre}
      </h3>
      {isAdmin && (
        <button type="button" onClick={onModifier} aria-label={`Modifier : ${p.titre}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-amber-500 text-white shadow-md hover:bg-amber-600">
          <Pencil className="h-4 w-4" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

function Arabe({ texte, grand }: { texte: string; grand?: boolean }) {
  return (
    <p dir="rtl" lang="ar" className={`font-arabic leading-loose text-white ${grand ? 'text-5xl text-center font-bold leading-tight' : 'text-2xl text-right'}`}
      style={{ overflowWrap: 'normal', wordBreak: 'normal' }}>
      {texte}
    </p>
  );
}

function Texte({ t }: { t: string | null | undefined }) {
  return (
    <>
      {paragraphes(t).map((x, i) => (
        <p key={i} className="text-sm leading-relaxed [overflow-wrap:anywhere]" style={{ color: TEXTE }}>{x}</p>
      ))}
    </>
  );
}

function Reference({ titre, reference, degre, note }: { titre: string; reference?: string | null; degre?: string | null; note?: string | null }) {
  if (!reference && !degre) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold" style={{ color: OR }}>{titre}</p>
      {reference && <p className="text-sm leading-relaxed [overflow-wrap:anywhere]" style={{ color: TEXTE }}>{reference}</p>}
      <DegreAuthenticite degre={degreValide(degre)} divergence={note} />
      {note && <p className="text-xs leading-relaxed [overflow-wrap:anywhere]" style={{ color: 'hsl(222 15% 70%)' }}>⚖️ {note}</p>}
    </div>
  );
}

function ContenuPartie({ p, f }: { p: PartieFiche; f: Fiche }) {
  switch (p.cle) {
    case 'arabe': return <Arabe texte={f.name_arabic} grand />;
    case 'translit': return <p className="text-center text-2xl font-bold [overflow-wrap:anywhere]" style={{ color: OR }}>{f.transliteration}</p>;
    case 'signification': return (
      <div className="space-y-1">
        <p className="text-base font-bold text-white [overflow-wrap:anywhere]">{f.name_french}</p>
        <Texte t={f.fiche_signification} />
      </div>
    );
    case 'explication': return <div className="space-y-2"><Texte t={explicationDe(f)} /></div>;
    case 'preuve': return (
      <div className="space-y-2">
        {f.fiche_preuve_type && (
          <p className="text-xs font-bold" style={{ color: OR }}>{f.fiche_preuve_type === 'coran' ? '📗 Verset du Coran' : '📘 Hadith'}</p>
        )}
        {f.fiche_preuve_arabe && <Arabe texte={f.fiche_preuve_arabe} />}
        <Texte t={f.fiche_preuve_francais} />
      </div>
    );
    case 'moment': return <div className="space-y-2"><Texte t={f.fiche_moment} /></div>;
    case 'invocation': return (
      <div className="space-y-2">
        {f.fiche_invocation_personnelle && (
          <p className="inline-block rounded-full px-3 py-1 text-xs font-bold ring-1"
            style={{ background: 'rgba(236,72,153,0.15)', color: 'hsl(330 81% 78%)', borderColor: 'rgba(236,72,153,0.45)' }}>
            ✍️ Invocation personnelle (pas un texte de la Sunna)
          </p>
        )}
        {f.fiche_invocation_arabe && <Arabe texte={f.fiche_invocation_arabe} />}
        {f.fiche_invocation_phonetique && <p className="text-sm italic [overflow-wrap:anywhere]" style={{ color: OR }}>{f.fiche_invocation_phonetique}</p>}
        <Texte t={f.fiche_invocation_francais} />
      </div>
    );
    case 'reference': return (
      <div className="space-y-3">
        <Reference titre="Preuve (partie 5)" reference={f.fiche_preuve_reference} degre={f.fiche_preuve_degre} note={f.fiche_preuve_degre_note} />
        {!f.fiche_invocation_personnelle && (
          <Reference titre="Invocation (partie 7)" reference={f.fiche_invocation_reference} degre={f.fiche_invocation_degre} note={f.fiche_invocation_degre_note} />
        )}
        {f.fiche_autres_references && (
          <div className="space-y-1">
            <p className="text-xs font-bold" style={{ color: OR }}>Autres références</p>
            <Texte t={f.fiche_autres_references} />
          </div>
        )}
      </div>
    );
    case 'divergences': return <div className="space-y-2"><Texte t={f.fiche_divergences} /></div>;
  }
}

/**
 * Les 9 parties de la fiche d'un nom, dans l'ordre voulu par Nadia, chacune avec son titre.
 * Enseignante : ✏️ sur chaque partie, pastille « 📝 À relire » + bouton « ✅ J'ai relu cette fiche ».
 * `debut` / `fin` : n'afficher qu'un morceau (la page met l'enregistrement de l'élève juste sous le nom, parties 1 à 3).
 */
export function FicheNom({ fiche, isAdmin, debut = 1, fin = 9 }: { fiche: Fiche; isAdmin: boolean; debut?: number; fin?: number }) {
  const queryClient = useQueryClient();
  const [edition, setEdition] = useState<PartieFiche | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const marquerRelue = async () => {
    setEnvoi(true);
    const valeurs = { fiche_a_relire: false, fiche_relue_le: new Date().toISOString() };
    try {
      const r = await ecrireOuGarder({ table: 'allah_names', op: 'update', id: String(fiche.id), values: valeurs });
      queryClient.setQueryData<Fiche[]>(['allah-names'], (l) => l?.map((n) => (n.id === fiche.id ? { ...n, ...valeurs } : n)));
      toast.success(r === 'ok' ? '✅ Fiche marquée comme relue' : '✅ Fiche relue (envoi au retour du réseau)');
    } catch (e) {
      toast.error((e as Error).message || 'Erreur');
    } finally { setEnvoi(false); }
  };

  return (
    <div className="space-y-3">
      {isAdmin && debut === 1 && fiche.fiche_a_relire && (
        <div className="space-y-2 rounded-xl p-3" style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.5)' }}>
          <p className="text-sm font-bold" style={{ color: 'hsl(45 93% 65%)' }}>📝 À relire par Nadia (visible seulement de l'enseignante)</p>
          {fiche.fiche_note_relecture && (
            <p className="text-xs leading-relaxed [overflow-wrap:anywhere]" style={{ color: TEXTE }}>❓ {fiche.fiche_note_relecture}</p>
          )}
          <button type="button" onClick={marquerRelue} disabled={envoi}
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-60">
            ✅ J'ai relu cette fiche
          </button>
        </div>
      )}
      {partiesAffichees(fiche, isAdmin).filter((p) => p.numero >= debut && p.numero <= fin).map((p) => (
        <section key={p.cle} aria-label={p.titre} className="rounded-xl p-4"
          style={{ background: `hsla(${TEINTE[p.cle]} / 0.08)`, border: `1px solid hsla(${TEINTE[p.cle]} / 0.35)` }}>
          <TitrePartie p={p} isAdmin={isAdmin} onModifier={() => setEdition(p)} />
          {partieRemplie(p, fiche)
            ? <ContenuPartie p={p} f={fiche} />
            : <p className="text-sm italic" style={{ color: 'hsl(222 15% 62%)' }}>À compléter (seule l'enseignante voit cette partie vide).</p>}
        </section>
      ))}
      {edition && <ModifierPartieFiche fiche={fiche} partie={edition} onClose={() => setEdition(null)} />}
    </div>
  );
}
