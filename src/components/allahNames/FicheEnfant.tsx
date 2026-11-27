import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { DegreAuthenticite } from '@/components/shared/DegreAuthenticite';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { degreSection } from '@/lib/ficheAdulte';
import { PARTIES_ENFANT, type FicheEnfant as Fiche, type PartieEnfant } from '@/lib/ficheEnfant';
import { dire, direAvecSaVoix } from '@/lib/voixFabriquees';
import { cn } from '@/lib/utils';
import { BadgeStatut } from './FicheAdulte';

/**
 * 🧒 Fiche ENFANT d'un nom (proposition a-f validée par Nadia le 27/11) : a. le nom en grand + 🔊 ; b. « Ça veut dire… » ;
 * c. « Comme quand… » ; d. « Ce que je peux faire » ; e. « Je dis » (invocation personnelle, ou texte du Coran avec sa source).
 * `petit` (3-6 ans) = seulement a, b, e, avec de gros boutons 🔊. Nom discuté : la phrase de prudence reste visible
 * (Nadia : « je ne veux cacher aucune divergence aux élèves »).
 * Enseignante : bandeau « 📝 À relire » + « ✅ J'ai relu », ✏️ par partie (hors ligne : envoyé au retour du réseau).
 * La voix lit le FRANÇAIS ; le nom arabe = l'audio de Nadia s'il existe, sinon la voix fabriquée / du téléphone.
 */
const COULEURS: Record<PartieEnfant, string> = {
  sens: 'rgba(56,189,248,0.14)', comme: 'rgba(250,204,21,0.14)', faire: 'rgba(52,211,153,0.14)', dire: 'rgba(244,114,182,0.14)',
};
const BORDS: Record<PartieEnfant, string> = {
  sens: 'rgba(56,189,248,0.55)', comme: 'rgba(250,204,21,0.55)', faire: 'rgba(52,211,153,0.55)', dire: 'rgba(244,114,182,0.55)',
};

async function enregistrer(nameId: number, nouvelle: Fiche, queryClient: ReturnType<typeof useQueryClient>) {
  const maj = { fiche_enfant: nouvelle };
  const r = await ecrireOuGarder({ table: 'allah_names', op: 'update', id: String(nameId), values: maj });
  queryClient.setQueryData<{ id: number }[]>(['allah-names'], (l) => l?.map((n) => (n.id === nameId ? { ...n, ...maj } : n)));
  return r;
}

function BoutonVoix({ onClick, libelle, grand = false }: { onClick: () => void; libelle: string; grand?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={libelle}
      className={cn('flex shrink-0 items-center justify-center rounded-full border-2 border-white/80 bg-sky-500 text-white shadow-md hover:bg-sky-600',
        grand ? 'h-14 w-14' : 'h-10 w-10')}>
      <Volume2 className={grand ? 'h-7 w-7' : 'h-5 w-5'} strokeWidth={2.5} />
    </button>
  );
}

export function FicheEnfant({ fiche, nameId, isAdmin, petit = false, audioUrl }: {
  fiche: Fiche; nameId: number; isAdmin: boolean; petit?: boolean; audioUrl?: string | null;
}) {
  const queryClient = useQueryClient();
  const [edition, setEdition] = useState<PartieEnfant | null>(null);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const parties = PARTIES_ENFANT.filter((p) => !petit || p.cle === 'sens' || p.cle === 'dire');
  const ecouterNom = () => direAvecSaVoix(audioUrl, fiche.nom_arabe, 'ar', 'jamal');
  const ecouter = (cle: PartieEnfant) => {
    const t = cle === 'dire' && fiche.dire_type === 'texte' ? (fiche.dire_traduction || '') : fiche[cle];
    dire(t, 'fr', 'jamal');
  };

  const marquerRelu = async () => {
    try {
      const r = await enregistrer(nameId, { ...fiche, a_relire: false }, queryClient);
      toast.success(r === 'ok' ? '✅ Fiche enfant relue' : '✅ Enregistré sur l\'appareil : envoi au retour du réseau');
    } catch (e) { toast.error((e as Error).message || 'Erreur'); }
  };

  const sauver = async () => {
    if (!edition) return;
    const propre = texte.trim();
    if (!propre) { toast.error('Ce texte ne peut pas être vide.'); return; }
    if (propre === fiche[edition]) { setEdition(null); return; }
    setEnvoi(true);
    try {
      const r = await enregistrer(nameId, { ...fiche, [edition]: propre }, queryClient);
      toast.success(r === 'ok' ? '✅ Enregistré' : '✅ Enregistré sur l\'appareil : envoi au retour du réseau');
      setEdition(null);
    } catch (e) { toast.error((e as Error).message || 'Erreur'); } finally { setEnvoi(false); }
  };

  return (
    <div className="space-y-3">
      {isAdmin && fiche.a_relire && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl p-3 text-sm font-semibold"
          style={{ background: 'rgba(250,204,21,0.12)', border: '1px dashed rgba(250,204,21,0.6)', color: 'hsl(45 93% 72%)' }}>
          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">📝 À relire : version enfant écrite d'après ta fiche adulte (visible de toi seule).</span>
          <Button size="sm" onClick={() => void marquerRelu()} className="bg-emerald-600 font-bold text-white hover:bg-emerald-700">✅ J'ai relu</Button>
        </div>
      )}

      {/* a. Le nom en grand, avec 🔊 */}
      <section aria-label="Le nom" className="rounded-2xl p-4 text-center" style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.35)' }}>
        <div className="flex items-center justify-center gap-3">
          <p dir="rtl" lang="ar" className={cn('font-arabic font-bold leading-tight text-white', petit ? 'text-6xl' : 'text-5xl')}
            style={{ overflowWrap: 'normal', wordBreak: 'normal' }}>{fiche.nom_arabe}</p>
          <BoutonVoix onClick={ecouterNom} libelle={`Écouter le nom ${fiche.translit}`} grand={petit} />
        </div>
        <p className="mt-2 text-2xl font-bold [overflow-wrap:anywhere]" style={{ color: 'hsl(38 92% 62%)' }}>{fiche.translit}</p>
        {fiche.prudence && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <BadgeStatut statut={fiche.statut} petit />
            <p className="text-sm font-semibold [overflow-wrap:anywhere]" style={{ color: 'hsl(25 95% 75%)' }}>{fiche.prudence}</p>
          </div>
        )}
      </section>

      {/* b. c. d. e. */}
      {parties.map((p) => (
        <section key={p.cle} aria-label={p.titre} className="rounded-2xl p-4" style={{ background: COULEURS[p.cle], border: `1px solid ${BORDS[p.cle]}` }}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className={cn('min-w-0 flex-1 font-extrabold leading-snug text-white [overflow-wrap:anywhere]', petit ? 'text-lg' : 'text-base')}>
              <span aria-hidden="true">{p.emoji}</span> {p.titre}
            </h3>
            <BoutonVoix onClick={() => ecouter(p.cle)} libelle={`Écouter : ${p.titre}`} grand={petit} />
            {isAdmin && (
              <button type="button" onClick={() => { setTexte(fiche[p.cle]); setEdition(p.cle); }} aria-label={`Modifier : ${p.titre}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-amber-500 text-white shadow-md hover:bg-amber-600">
                <Pencil className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
          {p.cle === 'dire' && fiche.dire_type === 'texte' && fiche.dire_arabe && (
            <p dir="rtl" lang="ar" className="font-arabic text-2xl leading-loose text-right" style={{ color: 'hsl(45 93% 70%)', overflowWrap: 'normal', wordBreak: 'normal' }}>
              {fiche.dire_arabe}
            </p>
          )}
          <p className={cn('leading-relaxed text-white [overflow-wrap:anywhere]', petit ? 'text-lg' : 'text-base', p.cle === 'dire' && 'font-bold italic')}>
            {p.cle === 'dire' && fiche.dire_type !== 'texte' ? `« ${fiche.dire} »` : fiche[p.cle]}
          </p>
          {p.cle === 'dire' && fiche.dire_type === 'texte' && (
            <div className="mt-2 space-y-1">
              {fiche.dire_traduction && <p className="text-sm text-white/90 [overflow-wrap:anywhere]">{fiche.dire_traduction}</p>}
              <div className="flex flex-wrap items-center gap-2">
                {fiche.dire_ref && <p className="text-xs font-semibold text-white/80 [overflow-wrap:anywhere]">📖 {fiche.dire_ref}</p>}
                <DegreAuthenticite degre={degreSection(fiche.dire_degre)} compact />
              </div>
            </div>
          )}
          {p.cle === 'dire' && fiche.dire_type !== 'texte' && (
            <p className="mt-1 text-xs text-white/75 [overflow-wrap:anywhere]">✍️ Invocation personnelle : ce n'est pas une parole du Prophète ﷺ.</p>
          )}
        </section>
      ))}

      <Dialog open={edition !== null} onOpenChange={(o) => { if (!o) setEdition(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>✏️ {PARTIES_ENFANT.find((p) => p.cle === edition)?.titre} · {fiche.translit} (version enfant)</DialogTitle>
          </DialogHeader>
          <TextareaDictee value={texte} onChange={(e) => setTexte(e.target.value)} rows={4} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEdition(null)}>Annuler</Button>
            <Button onClick={() => void sauver()} disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
