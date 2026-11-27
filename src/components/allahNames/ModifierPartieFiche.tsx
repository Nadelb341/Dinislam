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
import {
  DEGRES_PERMIS, champsVides, nettoyerValeurs, requisManquant, valeursPartie, type FicheNom, type PartieFiche,
} from '@/lib/ficheNomAllah';

/**
 * ✏️ Modifier UNE partie de la fiche d'un nom (règle du crayon, Nadia 21/11 ; demande du 27/11 : « Nadia peut modifier chaque partie »).
 * Écriture hors ligne possible (envoyée au retour du réseau). Vider une partie qui avait un contenu = l'ancienne version
 * part d'abord dans la corbeille de Paramètres (type `allah_name_partie`, restaurable) : il faut alors Internet.
 */
export function ModifierPartieFiche({ fiche, partie, onClose }: { fiche: FicheNom; partie: PartieFiche; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const avant = valeursPartie(partie, fiche);
  const [valeurs, setValeurs] = useState<Record<string, string | boolean | null>>(avant);
  const [envoi, setEnvoi] = useState(false);
  const changer = (col: string, v: string | boolean | null) => setValeurs((x) => ({ ...x, [col]: v }));

  const enregistrer = async () => {
    const propres = nettoyerValeurs(partie, valeurs);
    const manque = requisManquant(partie, propres);
    if (manque) { toast.error(`« ${manque.libelle} » ne peut pas être vide.`); return; }
    const changements = Object.keys(propres).filter((k) => (propres[k] ?? null) !== (nettoyerValeurs(partie, avant)[k] ?? null));
    if (!changements.length) { onClose(); return; }
    setEnvoi(true);
    try {
      const vides = champsVides(avant, propres);
      if (vides.length) {
        // Rien ne disparaît sans passer par la corbeille : on garde l'ancienne version complète de la partie
        if (!user) throw new Error('Connexion nécessaire');
        const ok = await moveToTrash(user.id, 'allah_name_partie', String(fiche.id),
          `${fiche.transliteration || fiche.name_french} · ${partie.numero}. ${partie.titre}`,
          { name_id: fiche.id, partie: partie.cle, valeurs: avant });
        if (!ok) throw new Error('📡 Nécessite Internet pour vider une partie (l\'ancienne version va dans la corbeille)');
      }
      const maj = Object.fromEntries(changements.map((k) => [k, propres[k]]));
      const r = await ecrireOuGarder({ table: 'allah_names', op: 'update', id: String(fiche.id), values: maj });
      queryClient.setQueryData<FicheNom[]>(['allah-names'], (l) => l?.map((n) => (n.id === fiche.id ? { ...n, ...maj } : n)));
      toast.success(r === 'ok' ? '✅ Partie enregistrée' : '✅ Enregistré sur l\'appareil : envoi au retour du réseau');
      onClose();
    } catch (e) {
      toast.error((e as Error).message || 'Erreur');
    } finally { setEnvoi(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="[overflow-wrap:anywhere]">✏️ {partie.numero}. {partie.titre}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">{fiche.transliteration} · {fiche.name_french}</p>
        <div className="space-y-4">
          {partie.champs.map((c) => {
            const col = c.col as string;
            const v = valeurs[col];
            const id = `champ-${col}`;
            return (
              <div key={col} className="space-y-1">
                <label htmlFor={id} className="text-sm font-semibold">{c.libelle}{c.requis ? ' *' : ''}</label>
                {c.type === 'oui_non' ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input id={id} type="checkbox" checked={!!v} onChange={(e) => changer(col, e.target.checked)} className="h-5 w-5" />
                    Oui, c'est une invocation personnelle (le badge le dira aux élèves)
                  </label>
                ) : c.type === 'degre' ? (
                  <select id={id} value={typeof v === 'string' ? v : ''} onChange={(e) => changer(col, e.target.value || null)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="">— Aucun —</option>
                    {DEGRES_PERMIS.map((d) => <option key={d} value={d}>{DEGRES[d].nom} · {DEGRES[d].fr}</option>)}
                  </select>
                ) : c.type === 'preuve_type' ? (
                  <select id={id} value={typeof v === 'string' ? v : ''} onChange={(e) => changer(col, e.target.value || null)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="">— Non précisé —</option>
                    <option value="coran">📗 Verset du Coran</option>
                    <option value="hadith">📘 Hadith</option>
                  </select>
                ) : c.type === 'texte' ? (
                  <Input id={id} value={typeof v === 'string' ? v : ''} onChange={(e) => changer(col, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
                ) : (
                  <TextareaDictee id={id} value={typeof v === 'string' ? v : ''} onChange={(e) => changer(col, e.target.value)}
                    rows={c.type === 'arabe' ? 3 : 5} dir={c.type === 'arabe' ? 'rtl' : undefined}
                    className={c.type === 'arabe' ? 'font-arabic text-xl leading-loose' : ''} />
                )}
              </div>
            );
          })}
          {partie.cle === 'explication' && !fiche.fiche_explication && fiche.explanation && (
            <p className="text-xs text-muted-foreground">Ancienne explication courte : « {fiche.explanation} »</p>
          )}
          <p className="text-xs text-muted-foreground">
            🕌 Règle n°1 : un verset ou un hadith se recopie d'une source fiable, avec sa référence et son degré. Une partie vidée part dans la corbeille de Paramètres.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={envoi}>Annuler</Button>
            <Button onClick={enregistrer} disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
