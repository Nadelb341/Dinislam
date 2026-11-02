import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { CodeInput } from './CodeInput';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { errorMessage } from '@/lib/utils';
import { LABELS_CODE, codeOuvert, memoriserCode } from '@/lib/espaceParents';

type InfoCode = { label: string; created_at: string; updated_at: string | null };
const dateFr = (d: string) => new Date(d).toLocaleDateString('fr-FR');


/**
 * 🔐 Code parents d'un enfant : le saisir, ou le créer la 1re fois (code libre : lettres et/ou chiffres, différent du mot de passe de l'appli).
 * Sur le compte de l'enfant, créer le 1er code demande aussi le mot de passe du compte (comme l'ancien verrou des Paramètres).
 * Idée 6 : un 2e code (ex. Papa) peut être créé par quelqu'un qui connaît déjà le 1er.
 * ✏️ `gerer` (2026-11-02, choix A de Nadia) : ouvert depuis l'Espace parents DÉJÀ ouvert → plus de code redemandé ;
 * liste des codes (créé / modifié le) + « ✏️ Modifier » (ancien code de CETTE personne + nouveau 2 fois) + 2e code.
 * Modifier le code avec lequel l'Espace est ouvert le garde ouvert avec le nouveau code.
 */
export function CodeParentsDialog({ childId, childName, open, onOpenChange, onOk, raison, gerer }: {
  childId: string;
  childName: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onOk: (code: string, label: string) => void;
  /** Phrase sous le titre (ex. « pour signaler l'absence ») */
  raison?: string;
  /** Ouvert depuis l'Espace parents déjà ouvert : gestion des codes (modifier / ajouter) */
  gerer?: boolean;
}) {
  const { user } = useAuth();
  const compteEnfant = user?.id === childId;
  const [labels, setLabels] = useState<string[] | null>(null);
  const [mode, setMode] = useState<'saisir' | 'creer' | 'liste' | 'modifier'>('saisir');
  const [codes, setCodes] = useState<InfoCode[]>([]);
  const [cible, setCible] = useState('');
  const [version, setVersion] = useState(0);
  const ouvert = gerer ? codeOuvert(childId) : null;
  const [code, setCode] = useState('');
  const [code2, setCode2] = useState('');
  const [actuel, setActuel] = useState('');
  const [label, setLabel] = useState('Maman');
  const [autre, setAutre] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (!open) return;
    setCode(''); setCode2(''); setActuel(''); setMotDePasse(''); setErreur(''); setLabels(null);
    supabase.rpc('parent_space_info', { p_child: childId }).then(({ data, error }) => {
      if (error) { setErreur(errorMessage(error)); setLabels([]); return; }
      const info = data as { labels?: string[]; codes?: InfoCode[] } | null;
      const l = info?.labels ?? [];
      setLabels(l);
      setCodes(info?.codes ?? []);
      setMode(l.length ? (gerer && codeOuvert(childId) ? 'liste' : 'saisir') : 'creer');
      setLabel(LABELS_CODE.find((x) => !l.includes(x)) ?? 'Autre');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` relit la liste après un changement
  }, [open, childId, version]);

  const verifier = async () => {
    if (!code) return;
    setBusy(true); setErreur('');
    const { data, error } = await supabase.rpc('parent_code_check', { p_child: childId, p_code: code });
    setBusy(false);
    if (error || !data) { setErreur('Code incorrect'); return; }
    memoriserCode(childId, code, data);
    onOk(code, data);
  };

  const creer = async () => {
    const nom = label === 'Autre' ? autre.trim() : label;
    if (!nom) { setErreur('Indiquez qui crée ce code (ex. Maman, Papa, Tata…)'); return; }
    if (!code) { setErreur('Écrivez votre code'); return; }
    if (code !== code2) { setErreur('Les deux codes ne sont pas pareils'); return; }
    setBusy(true); setErreur('');
    try {
      // 1er code sur le compte de l'enfant : le mot de passe du compte prouve que ce sont bien les parents
      if (compteEnfant && !labels?.length) {
        if (!user?.email) throw new Error('Compte introuvable');
        const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: motDePasse });
        if (error) throw new Error('Mot de passe du compte incorrect');
      }
      const actuelCode = ouvert?.code ?? actuel;
      const { data, error } = await supabase.rpc('parent_code_create', { p_child: childId, p_label: nom, p_code: code, p_current: labels?.length ? actuelCode : null });
      if (error) throw error;
      toast.success(`🔐 Code « ${data} » créé. Gardez-le bien, il ouvre l'Espace parents de ${childName}.`);
      // En gestion : l'Espace reste ouvert avec le code d'origine, on revient à la liste
      if (ouvert) { setVersion((v) => v + 1); return; }
      memoriserCode(childId, code, data as string);
      onOk(code, data as string);
    } catch (e) { setErreur(errorMessage(e)); } finally { setBusy(false); }
  };

  const modifier = async () => {
    if (!actuel) { setErreur(`Écrivez l'ancien code « ${cible} »`); return; }
    if (!code) { setErreur('Écrivez le nouveau code'); return; }
    if (code !== code2) { setErreur('Les deux nouveaux codes ne sont pas pareils'); return; }
    setBusy(true); setErreur('');
    try {
      const { error } = await supabase.rpc('parent_code_change', { p_child: childId, p_label: cible, p_old: actuel, p_new: code });
      if (error) throw error;
      // Idée « garder l'Espace ouvert » : si c'est le code utilisé pour ouvrir, on garde l'Espace ouvert avec le nouveau
      if (ouvert?.label === cible) memoriserCode(childId, code, cible);
      toast.success(`✏️ Code « ${cible} » modifié. Le nouveau code ouvre maintenant l'Espace parents de ${childName}.`);
      setVersion((v) => v + 1);
    } catch (e) { setErreur(errorMessage(e)); } finally { setBusy(false); }
  };

  const ouvrirModif = (label: string) => { setCible(label); setActuel(''); setCode(''); setCode2(''); setErreur(''); setMode('modifier'); };

  const reste = LABELS_CODE.filter((x) => !(labels ?? []).includes(x));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level="nested" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>🔐 Espace parents de {childName}</DialogTitle>
          <DialogDescription>{raison ?? 'Réservé aux parents.'}</DialogDescription>
        </DialogHeader>
        {labels === null ? (
          <p className="py-4 text-center text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Un instant…</p>
        ) : mode === 'liste' ? (
          <div className="space-y-2">
            {codes.map((c) => (
              <div key={c.label} className="flex items-center gap-2 rounded-xl border-2 border-violet-200 bg-violet-50 px-3 py-2 dark:border-violet-800 dark:bg-violet-950/40">
                <span className="flex-1 min-w-0 [overflow-wrap:anywhere]">
                  <span className="block font-bold">{c.label === 'Papa' ? '👨' : c.label === 'Maman' ? '👩' : '🧑'} {c.label}</span>
                  <span className="block text-xs text-muted-foreground">créé le {dateFr(c.created_at)}{c.updated_at ? ` · modifié le ${dateFr(c.updated_at)}` : ''}</span>
                </span>
                <Button type="button" size="sm" variant="outline" className="shrink-0 border-violet-300" onClick={() => ouvrirModif(c.label)}>✏️ Modifier</Button>
              </div>
            ))}
            {erreur && <p className="text-sm text-destructive">{erreur}</p>}
            {labels.length < 2 && (
              <button type="button" onClick={() => { setMode('creer'); setCode(''); setCode2(''); setErreur(''); }} className="w-full pt-1 text-sm font-bold text-primary">
                ➕ Créer un 2e code (ex. {reste[0] ?? 'Papa'})
              </button>
            )}
            <p className="text-xs text-muted-foreground">Pour modifier un code, il faut connaître l'ancien. Code oublié : la professeure peut le remettre à zéro.</p>
          </div>
        ) : mode === 'modifier' ? (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void modifier(); }}>
            <p className="font-bold">✏️ Modifier le code « {cible} »</p>
            <p className="text-xs text-muted-foreground">Lettres et/ou chiffres, comme vous voulez. Attention aux majuscules : « Soleil » et « soleil » ne sont pas le même code.</p>
            <CodeInput value={actuel} onChange={(v) => { setActuel(v); setErreur(''); }} placeholder={`Ancien code « ${cible} »`} aria-label="Ancien code" autoFocus />
            <CodeInput value={code} onChange={(v) => { setCode(v); setErreur(''); }} placeholder="Nouveau code" aria-label="Nouveau code" />
            <CodeInput value={code2} onChange={(v) => { setCode2(v); setErreur(''); }} placeholder="Le nouveau code, encore une fois" aria-label="Confirmer le nouveau code" />
            {erreur && <p className="text-sm text-destructive">{erreur}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer le nouveau code</Button>
            <button type="button" onClick={() => { setMode('liste'); setErreur(''); }} className="w-full text-xs font-bold text-primary">← Retour</button>
          </form>
        ) : mode === 'saisir' ? (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void verifier(); }}>
            <CodeInput value={code} onChange={(v) => { setCode(v); setErreur(''); }} placeholder="Votre code" aria-label="Code parents" autoFocus />
            {erreur && <p className="text-sm text-destructive">{erreur}</p>}
            <Button type="submit" className="w-full" disabled={busy || !code}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ouvrir</Button>
            <p className="text-xs text-muted-foreground">Codes créés : {labels.join(' et ')}. Code oublié : la professeure peut le remettre à zéro.</p>
            {labels.length < 2 && (
              <button type="button" onClick={() => { setMode('creer'); setCode(''); setErreur(''); }} className="w-full text-xs font-bold text-primary">
                ➕ Créer un 2e code (ex. {reste[0] ?? 'Papa'})
              </button>
            )}
          </form>
        ) : (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void creer(); }}>
            <p className="text-sm">{labels.length ? (ouvert ? 'Créez votre propre code.' : 'Créez votre propre code. Il faut le code déjà créé pour en ajouter un.') : 'Première fois : créez le code des parents. Il est différent du mot de passe de l\'appli.'}</p>
            <p className="text-xs text-muted-foreground">Lettres et/ou chiffres, comme vous voulez. Attention aux majuscules : « Soleil » et « soleil » ne sont pas le même code.</p>
            <div className="flex flex-wrap gap-2">
              {[...reste, 'Autre'].map((x) => (
                <button key={x} type="button" aria-pressed={label === x} onClick={() => setLabel(x)}
                  className={`rounded-full border px-3 py-1 text-sm font-bold ${label === x ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'}`}>{x}</button>
              ))}
            </div>
            {label === 'Autre' && <Input value={autre} onChange={(e) => setAutre(e.target.value)} placeholder="Qui ? (ex. Tata)" aria-label="Qui crée le code"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />}
            {labels.length > 0 && !ouvert && <CodeInput value={actuel} onChange={setActuel} placeholder="Code déjà créé" aria-label="Code déjà créé" />}
            <CodeInput value={code} onChange={(v) => { setCode(v); setErreur(''); }} placeholder="Votre code (lettres et/ou chiffres, au choix)" aria-label="Nouveau code" />
            <CodeInput value={code2} onChange={(v) => { setCode2(v); setErreur(''); }} placeholder="Le même code, encore une fois" aria-label="Confirmer le code" />
            {compteEnfant && !labels.length && (
              <PasswordInput value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder={`Mot de passe du compte de ${childName}`} aria-label="Mot de passe du compte" autoComplete="current-password" />
            )}
            {erreur && <p className="text-sm text-destructive">{erreur}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer le code</Button>
            {labels.length > 0 && <button type="button" onClick={() => { setMode(ouvert ? 'liste' : 'saisir'); setErreur(''); }} className="w-full text-xs font-bold text-primary">{ouvert ? '← Retour' : '← J\'ai déjà un code'}</button>}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
