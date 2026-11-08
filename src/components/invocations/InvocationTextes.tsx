import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, Loader2, BookOpen, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { moveToTrash } from '@/lib/trash';
import { useEditDraft } from '@/hooks/useCreationDraft';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import type { InvocationEnrichment } from '@/data/invocationsData';
import type { Tables } from '@/integrations/supabase/types';

/**
 * 🤲 Textes d'une invocation (2026-11-08, choix de Nadia) :
 *  - « principal » = ce que dit la vidéo ; champ vide en base → texte par défaut de l'appli (invocationsData.ts)
 *  - « autre » = une autre invocation pour le même moment (facultative)
 * L'enseignante peut modifier ✏️ ou supprimer 🗑️ chaque texte ; une suppression passe par la corbeille (restaurable).
 */
type Bloc = 'principal' | 'autre';
interface Valeurs { arabe: string; prononciation: string; traduction: string; source: string }
const VIDE: Valeurs = { arabe: '', prononciation: '', traduction: '', source: '' };

interface Props {
  invocation: Tables<'invocations'>;
  enrichment: InvocationEnrichment | null;
}

const InvocationTextes = ({ invocation, enrichment }: Props) => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [edition, setEdition] = useState<Bloc | null>(null);
  const [form, setForm] = useState<Valeurs>(VIDE);
  const [aSupprimer, setASupprimer] = useState<Bloc | null>(null);
  const [enCours, setEnCours] = useState(false);
  // Copie locale : l'écran change tout de suite après un enregistrement (le direct met ensuite tout le monde à jour)
  const [inv, setInv] = useState(invocation);
  useEffect(() => { setInv(invocation); }, [invocation]);
  const prononRef = useRef<HTMLInputElement>(null);
  const sourceRef = useRef<HTMLInputElement>(null);

  const parDefaut: Valeurs = {
    arabe: enrichment?.arabic ?? '', prononciation: enrichment?.transliteration ?? '',
    traduction: enrichment?.translation ?? '', source: enrichment?.source ?? '',
  };
  const principal: Valeurs = {
    arabe: inv.content_arabic || parDefaut.arabe,
    prononciation: inv.content_prononciation || parDefaut.prononciation,
    traduction: inv.content_french || parDefaut.traduction,
    source: inv.content_source || parDefaut.source,
  };
  const autre: Valeurs = {
    arabe: inv.autre_arabe || '', prononciation: inv.autre_prononciation || '',
    traduction: inv.autre_traduction || '', source: inv.autre_source || '',
  };
  const aDuTexte = (v: Valeurs) => !!(v.arabe || v.prononciation || v.traduction);
  const principalVisible = !inv.texte_principal_masque && aDuTexte(principal);
  const autreVisible = aDuTexte(autre);
  const original = edition === 'principal' ? (inv.texte_principal_masque ? parDefaut : principal) : edition === 'autre' ? autre : null;

  // Modification pas enregistrée (fenêtre fermée, appli quittée) : gardée en brouillon, comme les autres formulaires
  const brouillon = useEditDraft('dinislam_invocation_texte', edition ? `${inv.id}-${edition}` : null, {
    active: edition !== null, value: form, original, restore: (v) => setForm(v),
  });

  const ouvrir = (bloc: Bloc) => {
    setForm(bloc === 'principal' ? (inv.texte_principal_masque ? parDefaut : principal) : autre);
    setEdition(bloc);
  };
  // Fermer sans enregistrer garde le brouillon (règle de l'appli) ; un enregistrement réussi l'efface
  const fermer = () => setEdition(null);

  const appliquer = async (maj: Partial<Tables<'invocations'>>) => {
    const { error } = await supabase.from('invocations').update(maj).eq('id', inv.id);
    if (error) throw error;
    setInv((old) => ({ ...old, ...maj }));
    queryClient.invalidateQueries({ queryKey: ['invocations-list'] });
  };

  const enregistrer = async () => {
    if (!edition) return;
    const t = (s: string) => s.trim();
    // Texte principal identique au texte par défaut → on ne l'écrit pas (il suit l'appli)
    const garder = (v: string, def: string) => (t(v) && t(v) !== t(def) ? t(v) : null);
    setEnCours(true);
    try {
      if (edition === 'principal') {
        if (!aDuTexte({ ...form, arabe: t(form.arabe), prononciation: t(form.prononciation), traduction: t(form.traduction) })) {
          toast.error('Écris au moins le texte arabe, la prononciation ou la traduction.'); return;
        }
        await appliquer({
          content_arabic: garder(form.arabe, parDefaut.arabe), content_prononciation: garder(form.prononciation, parDefaut.prononciation),
          content_french: garder(form.traduction, parDefaut.traduction), content_source: garder(form.source, parDefaut.source),
          texte_principal_masque: false,
        });
      } else {
        await appliquer({
          autre_arabe: t(form.arabe) || null, autre_prononciation: t(form.prononciation) || null,
          autre_traduction: t(form.traduction) || null, autre_source: t(form.source) || null,
        });
      }
      toast.success('Texte enregistré ✅');
      brouillon.done();
      fermer();
    } catch {
      toast.error("L'enregistrement n'a pas marché. Vérifie ta connexion et réessaie.");
    } finally {
      setEnCours(false);
    }
  };

  const supprimer = async (bloc: Bloc) => {
    if (!user) return;
    setEnCours(true);
    try {
      // Copie exacte de ce qui est en base (null = texte par défaut) → la restauration remet la carte à l'identique
      const valeurs = bloc === 'principal'
        ? { arabe: inv.content_arabic, prononciation: inv.content_prononciation, traduction: inv.content_french, source: inv.content_source }
        : { arabe: inv.autre_arabe, prononciation: inv.autre_prononciation, traduction: inv.autre_traduction, source: inv.autre_source };
      const ok = await moveToTrash(user.id, 'invocation_texte', String(inv.id),
        `« ${inv.title_french} » — ${bloc === 'principal' ? 'texte principal' : 'autre invocation'}`,
        { invocation_id: inv.id, bloc, valeurs });
      if (!ok) { toast.error("La mise à la corbeille n'a pas marché : rien n'a été supprimé."); return; }
      await appliquer(bloc === 'principal'
        ? { content_arabic: null, content_prononciation: null, content_french: null, content_source: null, texte_principal_masque: true }
        : { autre_arabe: null, autre_prononciation: null, autre_traduction: null, autre_source: null });
      toast.success('Texte mis à la corbeille (Paramètres › Corbeille pour le remettre)');
    } catch {
      toast.error("La suppression n'a pas marché. Vérifie ta connexion et réessaie.");
    } finally {
      setEnCours(false);
      setASupprimer(null);
    }
  };

  const BoutonsAdmin = ({ bloc, clair }: { bloc: Bloc; clair?: boolean }) => (
    <>
      <button type="button" onClick={() => ouvrir(bloc)} aria-label="Modifier ce texte"
        className={`flex-shrink-0 rounded-full p-1.5 transition-colors ${clair ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-teal-700 hover:bg-teal-50 border border-teal-200'}`}>
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => setASupprimer(bloc)} aria-label="Supprimer ce texte"
        className={`flex-shrink-0 rounded-full p-1.5 transition-colors ${clair ? 'bg-white/20 text-white hover:bg-red-500/80' : 'bg-white text-red-600 hover:bg-red-50 border border-red-200'}`}>
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </>
  );

  return (
    <>
      {/* Texte principal (celui de la vidéo) */}
      {principalVisible && (
        <div className="space-y-4">
          {principal.arabe ? (
            <div className="rounded-2xl p-4 flex items-start gap-2" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
              <p className="flex-1 min-w-0 font-arabic leading-loose text-white text-right [overflow-wrap:anywhere]" style={{ fontSize: '22px', lineHeight: '2.2' }}>
                {principal.arabe}
              </p>
              {isAdmin && <div className="flex flex-col gap-1.5"><BoutonsAdmin bloc="principal" clair /></div>}
            </div>
          ) : isAdmin ? (
            <div className="flex justify-end gap-1.5"><BoutonsAdmin bloc="principal" /></div>
          ) : null}
          {principal.prononciation && (
            <div className="px-1">
              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">Prononciation</p>
              <p className="text-sm italic text-teal-700 dark:text-teal-300 leading-relaxed [overflow-wrap:anywhere]">{principal.prononciation}</p>
            </div>
          )}
          {principal.traduction && (
            <div className="rounded-xl p-4 border" style={{ backgroundColor: '#fef9ec', borderColor: '#fde68a' }}>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Traduction</p>
              <p className="text-sm text-gray-700 leading-relaxed italic [overflow-wrap:anywhere]">« {principal.traduction} »</p>
            </div>
          )}
          {principal.source && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
              <BookOpen className="h-3 w-3 flex-shrink-0" />
              <span className="[overflow-wrap:anywhere]">{principal.source}</span>
            </p>
          )}
        </div>
      )}

      {/* Autre invocation pour le même moment */}
      {autreVisible && (
        <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }}>
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-violet-600 flex-shrink-0" />
            <p className="flex-1 min-w-0 text-xs font-semibold text-violet-700 uppercase tracking-wider">Autre invocation</p>
            {isAdmin && <BoutonsAdmin bloc="autre" />}
          </div>
          {autre.arabe && (
            <p className="font-arabic text-right text-violet-900 leading-loose [overflow-wrap:anywhere]" style={{ fontSize: '20px', lineHeight: '2.1' }}>{autre.arabe}</p>
          )}
          {autre.prononciation && <p className="text-sm italic text-violet-700 leading-relaxed [overflow-wrap:anywhere]">{autre.prononciation}</p>}
          {autre.traduction && <p className="text-sm text-gray-700 leading-relaxed italic [overflow-wrap:anywhere]">« {autre.traduction} »</p>}
          {autre.source && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 flex-shrink-0" />
              <span className="[overflow-wrap:anywhere]">{autre.source}</span>
            </p>
          )}
        </div>
      )}

      {/* Raccourcis de l'enseignante quand un texte manque */}
      {isAdmin && (!principalVisible || !autreVisible) && (
        <div className="flex flex-wrap gap-2">
          {!principalVisible && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => ouvrir('principal')}>
              <Plus className="h-3.5 w-3.5" /> Écrire le texte principal
            </Button>
          )}
          {!autreVisible && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-violet-700 border-violet-200" onClick={() => ouvrir('autre')}>
              <Plus className="h-3.5 w-3.5" /> Ajouter une autre invocation
            </Button>
          )}
        </div>
      )}

      {/* Fenêtre de modification */}
      <Dialog open={edition !== null} onOpenChange={(o) => { if (!o) setEdition(null); }}>
        <DialogContent level="nested" className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edition === 'autre' ? 'Autre invocation' : 'Texte principal'} — {inv.title_french}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Texte arabe</label>
              <Textarea value={form.arabe} onChange={(e) => setForm({ ...form, arabe: e.target.value })} dir="rtl" rows={3} className="font-arabic text-right text-lg" />
            </div>
            <div>
              <label className="text-sm font-medium">Prononciation</label>
              <Input ref={prononRef} value={form.prononciation} onChange={(e) => setForm({ ...form, prononciation: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
            </div>
            <div>
              <label className="text-sm font-medium">Traduction</label>
              <Textarea value={form.traduction} onChange={(e) => setForm({ ...form, traduction: e.target.value })} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Source (facultatif)</label>
              <Input ref={sourceRef} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Ex. : Rapporté par Muslim (n°…)"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void enregistrer(); } }} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={fermer} disabled={enCours}>Annuler</Button>
              <Button type="button" onClick={() => void enregistrer()} disabled={enCours} className="gap-1.5">
                {enCours && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={aSupprimer !== null}
        onOpenChange={(o) => { if (!o) setASupprimer(null); }}
        onConfirm={() => { if (aSupprimer) void supprimer(aSupprimer); }}
        title={aSupprimer === 'autre' ? 'Supprimer l’autre invocation ?' : 'Supprimer le texte principal ?'}
        description="Le texte part dans la corbeille (Paramètres › Corbeille) : tu pourras le remettre à tout moment."
      />
    </>
  );
};

export default InvocationTextes;
