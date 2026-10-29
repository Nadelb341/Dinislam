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
import { LABELS_CODE, memoriserCode } from '@/lib/espaceParents';


/**
 * 🔐 Code parents d'un enfant : le saisir, ou le créer la 1re fois (6 chiffres, différent du mot de passe de l'appli).
 * Sur le compte de l'enfant, créer le 1er code demande aussi le mot de passe du compte (comme l'ancien verrou des Paramètres).
 * Idée 6 : un 2e code (ex. Papa) peut être créé par quelqu'un qui connaît déjà le 1er.
 */
export function CodeParentsDialog({ childId, childName, open, onOpenChange, onOk, raison }: {
  childId: string;
  childName: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onOk: (code: string, label: string) => void;
  /** Phrase sous le titre (ex. « pour signaler l'absence ») */
  raison?: string;
}) {
  const { user } = useAuth();
  const compteEnfant = user?.id === childId;
  const [labels, setLabels] = useState<string[] | null>(null);
  const [mode, setMode] = useState<'saisir' | 'creer'>('saisir');
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
      const l = ((data as { labels?: string[] } | null)?.labels ?? []);
      setLabels(l);
      setMode(l.length ? 'saisir' : 'creer');
      setLabel(LABELS_CODE.find((x) => !l.includes(x)) ?? 'Autre');
    });
  }, [open, childId]);

  const verifier = async () => {
    if (code.length !== 6) return;
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
    if (code.length !== 6) { setErreur('Le code doit avoir 6 chiffres'); return; }
    if (code !== code2) { setErreur('Les deux codes ne sont pas pareils'); return; }
    setBusy(true); setErreur('');
    try {
      // 1er code sur le compte de l'enfant : le mot de passe du compte prouve que ce sont bien les parents
      if (compteEnfant && !labels?.length) {
        if (!user?.email) throw new Error('Compte introuvable');
        const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: motDePasse });
        if (error) throw new Error('Mot de passe du compte incorrect');
      }
      const { data, error } = await supabase.rpc('parent_code_create', { p_child: childId, p_label: nom, p_code: code, p_current: labels?.length ? actuel : null });
      if (error) throw error;
      toast.success(`🔐 Code « ${data} » créé. Gardez-le bien, il ouvre l'Espace parents de ${childName}.`);
      memoriserCode(childId, code, data as string);
      onOk(code, data as string);
    } catch (e) { setErreur(errorMessage(e)); } finally { setBusy(false); }
  };

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
        ) : mode === 'saisir' ? (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void verifier(); }}>
            <CodeInput value={code} onChange={(v) => { setCode(v); setErreur(''); }} placeholder="Code parents (6 chiffres)" aria-label="Code parents" autoFocus className="text-center text-lg tracking-[0.3em]" />
            {erreur && <p className="text-sm text-destructive">{erreur}</p>}
            <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ouvrir</Button>
            <p className="text-xs text-muted-foreground">Codes créés : {labels.join(' et ')}. Code oublié : la professeure peut le remettre à zéro.</p>
            {labels.length < 2 && (
              <button type="button" onClick={() => { setMode('creer'); setCode(''); setErreur(''); }} className="w-full text-xs font-bold text-primary">
                ➕ Créer un 2e code (ex. {reste[0] ?? 'Papa'})
              </button>
            )}
          </form>
        ) : (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void creer(); }}>
            <p className="text-sm">{labels.length ? 'Créez votre propre code. Il faut le code déjà créé pour en ajouter un.' : 'Première fois : créez le code des parents. Il est différent du mot de passe de l\'appli.'}</p>
            <div className="flex flex-wrap gap-2">
              {[...reste, 'Autre'].map((x) => (
                <button key={x} type="button" aria-pressed={label === x} onClick={() => setLabel(x)}
                  className={`rounded-full border px-3 py-1 text-sm font-bold ${label === x ? 'bg-primary text-primary-foreground border-primary' : 'bg-card'}`}>{x}</button>
              ))}
            </div>
            {label === 'Autre' && <Input value={autre} onChange={(e) => setAutre(e.target.value)} placeholder="Qui ? (ex. Tata)" aria-label="Qui crée le code"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />}
            {labels.length > 0 && <CodeInput value={actuel} onChange={setActuel} placeholder="Code déjà créé" aria-label="Code déjà créé" />}
            <CodeInput value={code} onChange={(v) => { setCode(v); setErreur(''); }} placeholder="Nouveau code (6 chiffres de votre choix)" aria-label="Nouveau code" />
            <CodeInput value={code2} onChange={(v) => { setCode2(v); setErreur(''); }} placeholder="Le même code, encore une fois" aria-label="Confirmer le code" />
            {compteEnfant && !labels.length && (
              <PasswordInput value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder={`Mot de passe du compte de ${childName}`} aria-label="Mot de passe du compte" autoComplete="current-password" />
            )}
            {erreur && <p className="text-sm text-destructive">{erreur}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer le code</Button>
            {labels.length > 0 && <button type="button" onClick={() => { setMode('saisir'); setErreur(''); }} className="w-full text-xs font-bold text-primary">← J'ai déjà un code</button>}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
