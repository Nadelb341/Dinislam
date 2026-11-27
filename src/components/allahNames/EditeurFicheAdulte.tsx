import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { DEGRES } from '@/components/shared/DegreAuthenticite';
import { useAuth } from '@/contexts/AuthContext';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { moveToTrash } from '@/lib/trash';
import { STATUTS, type ClassementNom, type FicheAdulte, type SectionFiche, type StatutNom } from '@/lib/ficheAdulte';

/**
 * ✏️ Modifier la fiche adulte d'un nom (règle du crayon) : l'en-tête (nom, traduction, provenance, statut, classement)
 * ou UNE section. Écriture hors ligne possible (envoyée au retour du réseau). Vider un champ rempli = l'ancienne fiche
 * complète part d'abord dans la corbeille de Paramètres (type `allah_name_partie`, restaurable) : il faut alors Internet.
 */
type Champ = { cle: string; libelle: string; type: 'ligne' | 'texte' | 'arabe' | 'degre' };
const CHAMPS_SECTION: Record<SectionFiche['type'], Champ[]> = {
  texte: [{ cle: 'titre', libelle: 'Titre', type: 'ligne' }, { cle: 'texte', libelle: 'Texte (une ligne qui commence par « - » = une puce)', type: 'texte' }],
  divergence: [{ cle: 'titre', libelle: 'Titre', type: 'ligne' }, { cle: 'texte', libelle: 'Texte', type: 'texte' }],
  preuve: [
    { cle: 'titre', libelle: 'Titre', type: 'ligne' }, { cle: 'arabe', libelle: 'Texte arabe', type: 'arabe' },
    { cle: 'traduction', libelle: 'Traduction du sens', type: 'texte' }, { cle: 'ref', libelle: 'Référence', type: 'texte' },
    { cle: 'degre', libelle: 'Degré', type: 'degre' }, { cle: 'texte', libelle: 'Précisions', type: 'texte' },
  ],
  invocation: [{ cle: 'titre', libelle: 'Titre', type: 'ligne' }, { cle: 'texte', libelle: 'Invocation', type: 'texte' }, { cle: 'note', libelle: 'Remarque', type: 'texte' }],
  prophetique: [
    { cle: 'titre', libelle: 'Titre', type: 'ligne' }, { cle: 'texte', libelle: 'Présentation', type: 'texte' }, { cle: 'arabe', libelle: 'Texte arabe', type: 'arabe' },
    { cle: 'phonetique', libelle: 'Phonétique', type: 'ligne' }, { cle: 'traduction', libelle: 'Traduction', type: 'texte' },
    { cle: 'ref', libelle: 'Référence', type: 'texte' }, { cle: 'degre', libelle: 'Degré', type: 'degre' }, { cle: 'note', libelle: 'Remarque', type: 'texte' },
  ],
  authenticite: [{ cle: 'titre', libelle: 'Titre', type: 'ligne' }, { cle: 'badge', libelle: 'Badge', type: 'ligne' }, { cle: 'texte', libelle: 'Texte', type: 'texte' }],
};
const CHAMPS_ENTETE: Champ[] = [
  { cle: 'nom_arabe', libelle: 'Nom en arabe', type: 'arabe' }, { cle: 'translit', libelle: 'Translittération', type: 'ligne' },
  { cle: 'traduction', libelle: 'Traduction', type: 'ligne' }, { cle: 'provenance', libelle: 'Provenance', type: 'texte' },
];
const CLASSEMENTS: Record<ClassementNom, string> = {
  coran: '📗 Coran', coran_sunna: '📗📘 Coran et Sunna', sunna: '📘 Sunna authentique', discute: '⚖️ Statut discuté',
};

export function EditeurFicheAdulte({ fiche, nameId, cible, onClose }: { fiche: FicheAdulte; nameId: number; cible: number | 'entete'; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const depart: Record<string, string> = cible === 'entete'
    ? { nom_arabe: fiche.nom_arabe, translit: fiche.translit, traduction: fiche.traduction, provenance: fiche.provenance, statut: fiche.statut, classement: fiche.classement }
    : Object.fromEntries(Object.entries(fiche.sections[cible]).map(([k, v]) => [k, typeof v === 'string' ? v : '']));
  const [v, setV] = useState<Record<string, string>>(depart);
  const [envoi, setEnvoi] = useState(false);
  const champs = cible === 'entete' ? CHAMPS_ENTETE : CHAMPS_SECTION[fiche.sections[cible].type] ?? CHAMPS_SECTION.texte;
  const titre = cible === 'entete' ? 'Le nom et son statut' : fiche.sections[cible].titre;

  const enregistrer = async () => {
    const propre = (x: string | undefined) => (x ?? '').trim();
    if (!propre(v.titre) && cible !== 'entete') { toast.error('Le titre ne peut pas être vide.'); return; }
    if (cible === 'entete' && !propre(v.translit)) { toast.error('La translittération ne peut pas être vide.'); return; }
    const nouvelle: FicheAdulte = cible === 'entete'
      ? { ...fiche, nom_arabe: propre(v.nom_arabe), translit: propre(v.translit), traduction: propre(v.traduction), provenance: propre(v.provenance),
          statut: v.statut as StatutNom, classement: v.classement as ClassementNom }
      : { ...fiche, sections: fiche.sections.map((s, i) => (i !== cible ? s : {
          ...s, ...Object.fromEntries(champs.map((c) => [c.cle, propre(v[c.cle]) || null])), titre: propre(v.titre),
        })) };
    const vides = champs.filter((c) => propre(depart[c.cle]) && !propre(v[c.cle]));
    if (JSON.stringify(nouvelle) === JSON.stringify(fiche)) { onClose(); return; }
    setEnvoi(true);
    try {
      if (vides.length) {
        if (!user) throw new Error('Connexion nécessaire');
        const ok = await moveToTrash(user.id, 'allah_name_partie', String(nameId), `${fiche.translit} · fiche adulte (avant : ${titre})`,
          { name_id: nameId, partie: 'fiche_adulte', valeurs: { fiche_adulte: fiche } });
        if (!ok) throw new Error('📡 Nécessite Internet pour vider un champ (l\'ancienne fiche va dans la corbeille)');
      }
      const maj = { fiche_adulte: nouvelle };
      const r = await ecrireOuGarder({ table: 'allah_names', op: 'update', id: String(nameId), values: maj });
      queryClient.setQueryData<{ id: number }[]>(['allah-names'], (l) => l?.map((n) => (n.id === nameId ? { ...n, ...maj } : n)));
      toast.success(r === 'ok' ? '✅ Fiche enregistrée' : '✅ Enregistré sur l\'appareil : envoi au retour du réseau');
      onClose();
    } catch (e) {
      toast.error((e as Error).message || 'Erreur');
    } finally { setEnvoi(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="[overflow-wrap:anywhere]">✏️ {titre}</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">{fiche.translit} · fiche adulte</p>
        <div className="space-y-4">
          {cible === 'entete' && (
            <>
              <div className="space-y-1">
                <label htmlFor="fa-statut" className="text-sm font-semibold">Statut (badge)</label>
                <select id="fa-statut" value={v.statut} onChange={(e) => setV({ ...v, statut: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {(Object.keys(STATUTS) as StatutNom[]).map((s) => <option key={s} value={s}>{STATUTS[s].emoji} {STATUTS[s].libelle} — {STATUTS[s].sens}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="fa-classement" className="text-sm font-semibold">Liste du bouton « Authenticité »</label>
                <select id="fa-classement" value={v.classement} onChange={(e) => setV({ ...v, classement: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {(Object.keys(CLASSEMENTS) as ClassementNom[]).map((c) => <option key={c} value={c}>{CLASSEMENTS[c]}</option>)}
                </select>
              </div>
            </>
          )}
          {champs.map((c) => {
            const id = `fa-${c.cle}`;
            return (
              <div key={c.cle} className="space-y-1">
                <label htmlFor={id} className="text-sm font-semibold">{c.libelle}</label>
                {c.type === 'degre' ? (
                  <select id={id} value={v[c.cle] ?? ''} onChange={(e) => setV({ ...v, [c.cle]: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="">— Aucun —</option>
                    {(['coran', 'sahih', 'hasan', 'daif', 'mawdou'] as const).map((d) => <option key={d} value={d}>{DEGRES[d].nom} · {DEGRES[d].fr}</option>)}
                  </select>
                ) : c.type === 'ligne' ? (
                  <Input id={id} value={v[c.cle] ?? ''} onChange={(e) => setV({ ...v, [c.cle]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
                ) : (
                  <TextareaDictee id={id} value={v[c.cle] ?? ''} onChange={(e) => setV({ ...v, [c.cle]: e.target.value })}
                    rows={c.type === 'arabe' ? 3 : 6} dir={c.type === 'arabe' ? 'rtl' : undefined}
                    className={c.type === 'arabe' ? 'font-arabic text-xl leading-loose' : ''} />
                )}
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">🕌 Règle n°1 : un verset ou un hadith se recopie d'une source fiable, avec sa référence et son degré. Un champ vidé : l'ancienne fiche part dans la corbeille de Paramètres.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={envoi}>Annuler</Button>
            <Button onClick={enregistrer} disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
