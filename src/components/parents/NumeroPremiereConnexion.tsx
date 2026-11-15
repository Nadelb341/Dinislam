import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { estEnModeFantome } from '@/lib/modeFantome';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

/**
 * 📱 Numéro demandé à l'entrée dans l'appli (Nadia, 2026-11-15) : une fois l'inscription validée, si le numéro manque —
 * moins de 20 ans : le prénom ET le numéro d'un parent ; 20 ans et plus : son propre numéro.
 * Revient à chaque ouverture tant que ce n'est pas rempli. Hors connexion : gardé sur l'appareil, envoyé au retour du réseau.
 * Jamais pour l'enseignante, ni en mode fantôme.
 * 📅 2026-11-15 (anniversaire, idée 9) : la date de naissance manquante est demandée dans la MÊME fenêtre (1 seule fois :
 * ensuite seul le professeur la change). Sans elle, l'élève n'aurait jamais son « un an de plus ».
 */
const ageDe = (dob: string | null, age: number | null) => {
  if (dob) {
    const b = new Date(dob), n = new Date();
    return n.getFullYear() - b.getFullYear() - (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate()) ? 1 : 0);
  }
  return age;
};
const numeroValide = (t: string) => t.replace(/\D/g, '').length >= 9;

export function NumeroPremiereConnexion() {
  const { user, isAdmin, isApproved } = useAuth();
  const queryClient = useQueryClient();
  const actif = !!user && !isAdmin && isApproved === true && !estEnModeFantome();
  const { data: p } = useQuery({
    queryKey: ['mon-numero', user?.id],
    enabled: actif,
    queryFn: async () => (await supabase.from('profiles').select('full_name, date_of_birth, age, phone, parent_phone, parent_phone_nom').eq('user_id', user!.id).maybeSingle()).data,
  });
  const [choixAge, setChoixAge] = useState<'moins' | 'plus' | null>(null);
  const [prenomParent, setPrenomParent] = useState('');
  const [tel, setTel] = useState('');
  const [naissance, setNaissance] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [fait, setFait] = useState(false);
  if (!actif || !p || fait) return null;
  const manqueNaissance = !p.date_of_birth;
  const naissanceOk = /^\d{4}-\d{2}-\d{2}$/.test(naissance) && (ageDe(naissance, null) ?? -1) >= 3 && (ageDe(naissance, null) ?? 200) <= 100;
  const age = ageDe(p.date_of_birth || (naissanceOk ? naissance : null), p.age);
  const mineur = age !== null ? age < 20 : choixAge === 'moins';
  const majeur = age !== null ? age >= 20 : choixAge === 'plus';
  // Numéro manquant : jugé avec l'âge connu enregistré (pas celui qu'on est en train de taper)
  const ageBase = ageDe(p.date_of_birth, p.age);
  const manqueTel = ageBase === null ? !p.phone && !p.parent_phone : ageBase < 20 ? !(p.parent_phone && p.parent_phone_nom) : !p.phone;
  if (!manqueTel && !manqueNaissance) return null;

  const enregistrer = async () => {
    if (manqueNaissance && !naissanceOk) { toast.error('Choisis ta date de naissance'); return; }
    if (manqueTel && mineur && !prenomParent.trim()) { toast.error('Écris le prénom de ton parent'); return; }
    if (manqueTel && !numeroValide(tel)) { toast.error('Écris un numéro de téléphone complet'); return; }
    setEnvoi(true);
    try {
      const values = {
        ...(manqueNaissance ? { date_of_birth: naissance } : {}),
        ...(!manqueTel ? {} : mineur ? { parent_phone: tel.trim(), parent_phone_nom: prenomParent.trim() } : { phone: tel.trim() }),
      };
      const r = await ecrireOuGarder({ table: 'profiles', op: 'update', id: user!.id, col: 'user_id', values });
      queryClient.invalidateQueries({ queryKey: ['mon-numero'] });
      toast.success(r === 'en_attente' ? '📡 Gardé sur ton appareil : envoyé dès le retour du réseau' : '✅ Merci ! Ton professeur pourra te prévenir en cas de besoin.');
      setFait(true);
    } catch (e) { toast.error((e as Error).message); }
    finally { setEnvoi(false); }
  };

  const prenom = (p.full_name || '').trim().split(/\s+/)[0];
  return (
    <Dialog open onOpenChange={() => { /* obligatoire : se ferme seulement une fois rempli */ }}>
      <DialogContent className="max-w-sm rounded-2xl [&>button:last-child]:hidden" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogTitle>{manqueTel ? `📱 ${prenom ? `${prenom}, un` : 'Un'} numéro pour te prévenir` : `📅 ${prenom ? `${prenom}, ta` : 'Ta'} date de naissance`}</DialogTitle>
        <DialogDescription>
          {!manqueTel ? 'Ton professeur a besoin de ta date de naissance (une seule fois).' : mineur ? 'Ton professeur a besoin du prénom et du numéro de téléphone d\'un de tes parents (sortie, absence, cours annulé…).'
            : majeur ? 'Ton professeur a besoin de ton numéro de téléphone (sortie, absence, cours annulé…).'
            : 'Pour que ton professeur puisse te prévenir (sortie, absence, cours annulé…).'}
        </DialogDescription>
        {manqueNaissance && (
          <label className="block text-sm font-semibold">📅 Ta date de naissance
            <Input type="date" value={naissance} onChange={(e) => setNaissance(e.target.value)} max={new Date().toISOString().slice(0, 10)} className="mt-1" />
          </label>
        )}
        {!manqueTel ? (
          <div className="space-y-2">
            <button type="button" disabled={envoi} onClick={() => void enregistrer()} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-extrabold disabled:opacity-60">
              {envoi ? '⏳ …' : '✅ Enregistrer'}
            </button>
            <p className="text-[11px] text-muted-foreground">🔒 Seul ton professeur la voit.</p>
          </div>
        ) : age === null && !choixAge ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setChoixAge('moins')} className="rounded-xl border-2 border-sky-300 bg-sky-50 dark:bg-sky-950/30 py-3 text-sm font-bold">J'ai moins de 20 ans</button>
            <button type="button" onClick={() => setChoixAge('plus')} className="rounded-xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 py-3 text-sm font-bold">J'ai 20 ans ou plus</button>
          </div>
        ) : (
          <div className="space-y-2">
            {mineur && (
              <label className="block text-sm font-semibold">Prénom de ton parent
                <Input value={prenomParent} onChange={(e) => setPrenomParent(e.target.value)} placeholder="ex. Mounia" className="mt-1"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('numero-premiere')?.focus(); } }} />
              </label>
            )}
            <label className="block text-sm font-semibold">{mineur ? 'Numéro de téléphone de ton parent' : 'Ton numéro de téléphone'}
              <Input id="numero-premiere" type="tel" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="06 12 34 56 78" className="mt-1"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void enregistrer(); } }} />
            </label>
            <button type="button" disabled={envoi} onClick={() => void enregistrer()} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-extrabold disabled:opacity-60">
              {envoi ? '⏳ …' : '✅ Enregistrer'}
            </button>
            <p className="text-[11px] text-muted-foreground">🔒 Seul ton professeur voit ce numéro.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
