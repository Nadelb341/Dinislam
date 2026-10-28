import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { BilanVue, type BilanContenu } from '@/components/bilan/BilanVue';
import type { BilanSnapshot } from '@/lib/bilanTrimestriel';

/**
 * 🔗 Lien du bilan envoyé par message (2026-10-28, choix C de Nadia, au cas où l'image ou le PDF ne s'ouvre pas) :
 * s'ouvre sans compte ; le code parents est demandé. L'ouverture compte comme « lu » (accusé de lecture).
 */
export default function BilanPublic() {
  const { token = '' } = useParams();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');
  const [bilan, setBilan] = useState<BilanContenu | null>(null);

  const ouvrir = async () => {
    setBusy(true); setErreur('');
    const { data, error } = await supabase.rpc('bilan_public', { p_token: token, p_code: code });
    setBusy(false);
    if (error || !data) { setErreur(error?.message?.includes('Lien') ? 'Ce lien n\'existe pas ou plus.' : 'Code parents incorrect.'); return; }
    const d = data as Record<string, unknown>;
    setBilan({
      snapshot: d.snapshot as BilanSnapshot, appreciation: (d.appreciation as string) ?? null, motivation: (d.motivation as string) ?? null,
      note: (d.note as number) ?? null, guide: (d.guide as BilanContenu['guide']) ?? null, traduction: (d.traduction as BilanContenu['traduction']) ?? null,
      langueAr: (d.langue_ar as string) ?? null,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-violet-50 dark:from-slate-950 dark:to-slate-900 px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <p className="text-center text-lg font-extrabold text-[#2457a5] dark:text-sky-300">📊 Bilan · Dinislam</p>
        {bilan ? <BilanVue {...bilan} /> : (
          <form className="rounded-2xl bg-card p-4 shadow space-y-3" onSubmit={(e) => { e.preventDefault(); void ouvrir(); }}>
            <p className="font-bold">🔐 Entrez votre code parents</p>
            <p className="text-sm text-muted-foreground">Le code à 6 chiffres créé dans l'Espace parents de l'appli (pas le mot de passe de l'appli).</p>
            <PasswordInput value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErreur(''); }} inputMode="numeric" autoComplete="off"
              placeholder="Code parents" aria-label="Code parents" autoFocus className="text-center text-lg tracking-[0.4em]" />
            {erreur && <p className="text-sm text-destructive">{erreur}</p>}
            <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Voir le bilan</Button>
            <p className="text-xs text-muted-foreground">Pas encore de code ? Ouvrez l'appli sur le compte de votre enfant : Paramètres › 👨‍👩‍👧 Espace parents.</p>
          </form>
        )}
      </div>
    </div>
  );
}
