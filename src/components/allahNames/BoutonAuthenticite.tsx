import { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { LISTES_AUTHENTICITE, lireFicheAdulte, nomsDeLaListe, STATUTS } from '@/lib/ficheAdulte';
import { BadgeStatut } from './FicheAdulte';

/**
 * 📚 Bouton « Authenticité » de la carte des 99 noms (demande de Nadia, 27/11/2026) : un espace documentaire en 3 listes
 * (noms tirés du Coran / de la Sunna authentique / statut discuté). Ce sont les MÊMES fiches que la liste principale
 * (aucun doublon) et leur ordre reste celui de l'appli. Classement = classification savante, pas une liste unanime.
 */
type Nom = { id: number; display_order: number | null; name_arabic: string; transliteration: string | null; fiche_adulte?: unknown };

export function BoutonAuthenticite({ noms, onOuvrirNom }: { noms: Nom[]; onOuvrirNom: (id: number) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [onglet, setOnglet] = useState<string>('coran');
  const avecFiche = useMemo(() => noms.filter((n) => lireFicheAdulte(n.fiche_adulte)).length, [noms]);
  const liste = LISTES_AUTHENTICITE.find((l) => l.cle === onglet) ?? LISTES_AUTHENTICITE[0];
  const lignes = useMemo(() => nomsDeLaListe(noms, liste.classements), [noms, liste]);
  if (!avecFiche) return null;

  return (
    <>
      <div className="flex justify-center">
        <button type="button" onClick={() => setOuvert(true)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-sm ring-1 transition-transform active:scale-95"
          style={{ background: 'rgba(16,185,129,0.12)', color: 'hsl(152 70% 70%)', borderColor: 'rgba(16,185,129,0.45)' }}>
          <ShieldCheck className="h-4 w-4" /> Authenticité
        </button>
      </div>
      {ouvert && (
        <Dialog open onOpenChange={(o) => { if (!o) setOuvert(false); }}>
          <DialogContent className="max-w-md md:max-w-xl max-h-[90vh] overflow-y-auto"
            style={{ background: 'linear-gradient(180deg, hsl(222 65% 9%) 0%, hsl(222 75% 6%) 100%)', border: '1px solid rgba(217,119,6,0.25)', color: 'white' }}>
            <DialogHeader><DialogTitle className="text-white">📚 Authenticité des noms</DialogTitle></DialogHeader>
            <p className="text-xs leading-relaxed" style={{ color: 'hsl(222 15% 72%)' }}>
              Ce classement est une classification savante adoptée pour l'application, et non une liste dont l'unanimité serait acquise :
              le hadith « Allah a 99 noms » est authentique, mais la liste détaillée et son ordre ne sont pas une énumération prophétique établie.
              Il porte sur les {avecFiche} fiches déjà rédigées{avecFiche < noms.length ? ` (${noms.length - avecFiche} noms attendent encore leur fiche)` : ''}.
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px]" style={{ color: 'hsl(222 15% 72%)' }}>
              {Object.values(STATUTS).map((s) => <span key={s.libelle}>{s.emoji} {s.libelle} : {s.sens}.</span>)}
            </div>
            <div role="tablist" className="grid grid-cols-3 gap-1.5">
              {LISTES_AUTHENTICITE.map((l) => (
                <button key={l.cle} type="button" role="tab" aria-selected={onglet === l.cle} onClick={() => setOnglet(l.cle)}
                  className={cn('rounded-xl px-2 py-2 text-xs font-bold leading-tight ring-1 [overflow-wrap:anywhere]',
                    onglet === l.cle ? 'bg-amber-500 text-white ring-amber-300' : 'bg-white/5 text-amber-200 ring-white/15')}>
                  {l.emoji} {l.titre} ({nomsDeLaListe(noms, l.classements).length})
                </button>
              ))}
            </div>
            <ul className="space-y-1.5">
              {lignes.map((n) => {
                const f = lireFicheAdulte(n.fiche_adulte)!;
                return (
                  <li key={n.id}>
                    <button type="button" onClick={() => { setOuvert(false); onOuvrirNom(n.id); }}
                      className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left ring-1 ring-white/10 hover:bg-white/5">
                      <span className="w-8 shrink-0 text-center text-sm font-bold" style={{ color: 'hsl(38 92% 62%)' }}>{n.display_order}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold [overflow-wrap:anywhere]">{f.translit}</span>
                        <span className="block text-xs [overflow-wrap:anywhere]" style={{ color: 'hsl(222 15% 70%)' }}>{f.traduction}</span>
                      </span>
                      <span dir="rtl" lang="ar" className="font-arabic text-xl shrink-0">{f.nom_arabe || n.name_arabic}</span>
                      <BadgeStatut statut={f.statut} petit />
                    </button>
                  </li>
                );
              })}
              {!lignes.length && <li className="text-sm" style={{ color: 'hsl(222 15% 70%)' }}>Aucun nom dans cette liste pour l'instant.</li>}
            </ul>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
