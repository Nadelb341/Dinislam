import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { sendPushNotification } from '@/lib/pushHelper';
import { estAdulteParentPossible, prenomDe } from '@/lib/espaceParents';
import { childAge } from '@/hooks/useParentLock';
import { cn, errorMessage } from '@/lib/utils';

const SESSION_DOB = 'dinislam_dob_vu';
const SESSION_ENFANTS = 'dinislam_enfants_vu';
const vuCetteSession = (k: string) => { try { return sessionStorage.getItem(k) === '1'; } catch { return false; } };
const marquerVu = (k: string) => { try { sessionStorage.setItem(k, '1'); } catch { /* stockage indisponible */ } };

/**
 * Messages éphémères à l'ouverture (2026-10-28, demandes de Nadia) :
 *  1. 🎂 « Ta date de naissance » : revient à chaque connexion tant qu'elle n'est pas enregistrée
 *     (Nadia peut le couper pour un élève dans sa fiche du bouclier) ;
 *  2. 👨‍👩‍👧 Élèves de plus de 20 ans : « As-tu des enfants qui suivent aussi les cours ? » — « Non » le ferme pour toujours,
 *     « Oui » : on écrit le prénom de l'enfant EN ENTIER, l'appli propose les élèves qui portent ce prénom, on les coche.
 */
export default function MessagesProfil() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [ferme, setFerme] = useState<{ dob: boolean; enfants: boolean }>({ dob: vuCetteSession(SESSION_DOB), enfants: vuCetteSession(SESSION_ENFANTS) });

  const { data: profil } = useQuery({
    queryKey: ['messages-profil', user?.id],
    enabled: !!user && !isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('full_name, date_of_birth, age, ask_birth_date, children_question, is_approved').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });
  const rafraichir = () => queryClient.invalidateQueries({ queryKey: ['messages-profil', user?.id] });

  if (!user || isAdmin || !profil?.is_approved) return null;
  const demanderDob = !profil.date_of_birth && profil.ask_birth_date && !ferme.dob;
  const demanderEnfants = !demanderDob && !profil.children_question && estAdulteParentPossible(profil) && !ferme.enfants;

  if (demanderDob) return <DateNaissance onFerme={() => { marquerVu(SESSION_DOB); setFerme((f) => ({ ...f, dob: true })); }} onOk={() => { void rafraichir(); queryClient.invalidateQueries({ queryKey: ['espace-parents'] }); }} />;
  if (demanderEnfants) return <MesEnfants nom={profil.full_name} onFerme={() => { marquerVu(SESSION_ENFANTS); setFerme((f) => ({ ...f, enfants: true })); }} onOk={() => { void rafraichir(); queryClient.invalidateQueries({ queryKey: ['espace-parents'] }); }} />;
  return null;
}

function DateNaissance({ onFerme, onOk }: { onFerme: () => void; onOk: () => void }) {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const enregistrer = async () => {
    if (!user || !date) return;
    const age = childAge({ date_of_birth: date });
    if (age === null || age < 2 || age > 110) { toast.error('Cette date ne semble pas juste, vérifie-la 🙂'); return; }
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ date_of_birth: date, age }).eq('user_id', user.id);
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success('🎂 Merci, ta fiche est à jour !');
    onOk();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onFerme(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>🎂 Ta date de naissance</DialogTitle>
          <DialogDescription>Ton professeur en a besoin pour mettre à jour ta fiche d'élève. Ce message reviendra tant qu'elle n'est pas enregistrée.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void enregistrer(); }}>
          <Input type="date" value={date} max={aujourdhui} onChange={(e) => setDate(e.target.value)} aria-label="Date de naissance" />
          <Button type="submit" className="w-full" disabled={!date || busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}✅ Enregistrer</Button>
          <button type="button" onClick={onFerme} className="w-full text-sm font-semibold text-muted-foreground">Plus tard</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MesEnfants({ nom, onFerme, onOk }: { nom: string | null; onFerme: () => void; onOk: () => void }) {
  const { user } = useAuth();
  const [etape, setEtape] = useState<'question' | 'prenoms'>('question');
  const [busy, setBusy] = useState(false);

  const non = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ children_question: 'non' }).eq('user_id', user.id);
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    onOk();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onFerme(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>👨‍👩‍👧 Vos enfants suivent-ils aussi les cours ?</DialogTitle>
          <DialogDescription>
            {etape === 'question'
              ? 'Si un ou plusieurs de vos enfants sont aussi élèves, vous recevrez leurs bilans et pourrez signaler leurs absences depuis votre compte.'
              : 'Écrivez le prénom de votre enfant en entier : l\'appli vous propose les élèves qui portent ce prénom. Cochez le vôtre, puis recommencez pour un autre enfant.'}
          </DialogDescription>
        </DialogHeader>
        {etape === 'question' ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={busy} onClick={() => void non()}>Non</Button>
            <Button disabled={busy} onClick={() => setEtape('prenoms')}>Oui</Button>
          </div>
        ) : <ChoixEnfants nomParent={nom} onOk={onOk} />}
        <button type="button" onClick={onFerme} className="w-full text-sm font-semibold text-muted-foreground">Plus tard</button>
      </DialogContent>
    </Dialog>
  );
}

/** Prénom écrit en entier → élèves proposés → cochés → reliés (aussi utilisé dans l'Espace parents « ➕ Ajouter un enfant ») */
export function ChoixEnfants({ nomParent, onOk }: { nomParent: string | null; onOk: () => void }) {
  const [prenom, setPrenom] = useState('');
  const [trouves, setTrouves] = useState<{ user_id: string; display: string }[]>([]);
  const [choisis, setChoisis] = useState<{ user_id: string; display: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (minuteur.current) clearTimeout(minuteur.current);
    const q = prenom.trim();
    if (q.length < 2) { setTrouves([]); return; }
    minuteur.current = setTimeout(() => {
      supabase.rpc('find_students_by_first_name', { p_first: q }).then(({ data }) => setTrouves(data || []));
    }, 350);
    return () => { if (minuteur.current) clearTimeout(minuteur.current); };
  }, [prenom]);

  const valider = async () => {
    if (!choisis.length) return;
    setBusy(true);
    const { error } = await supabase.rpc('link_children', { p_children: choisis.map((c) => c.user_id) });
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    sendPushNotification({ type: 'admin', category: 'adm_par', title: '👨‍👩‍👧 Un parent s\'est relié à ses enfants',
      body: `${prenomDe(nomParent)} : ${choisis.map((c) => c.display).join(', ')}`, data: { url: '/admin?section=students' } });
    toast.success(`✅ ${choisis.map((c) => prenomDe(c.display)).join(' et ')} ${choisis.length > 1 ? 'sont reliés' : 'est relié(e)'} à votre compte`);
    onOk();
  };

  return (
    <div className="space-y-2">
      <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom en entier (ex. Dalil)" aria-label="Prénom de l'enfant" autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
      {prenom.trim().length >= 2 && !trouves.length && <p className="text-xs text-muted-foreground">Aucun élève avec ce prénom pour l'instant. Vérifiez qu'il est écrit en entier.</p>}
      {trouves.map((t) => {
        const on = choisis.some((c) => c.user_id === t.user_id);
        return (
          <button key={t.user_id} type="button" aria-pressed={on} onClick={() => setChoisis((c) => on ? c.filter((x) => x.user_id !== t.user_id) : [...c, t])}
            className={cn('w-full flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left font-bold', on ? 'border-primary bg-primary/10' : 'border-border')}>
            <span className={cn('h-5 w-5 rounded-md border-2 grid place-items-center text-xs', on ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground')}>{on ? '✓' : ''}</span>
            <span className="flex-1 min-w-0 [overflow-wrap:anywhere]">{t.display}</span>
          </button>
        );
      })}
      {choisis.length > 0 && <p className="text-xs font-bold text-primary">Choisis : {choisis.map((c) => c.display).join(', ')}</p>}
      <Button className="w-full" disabled={!choisis.length || busy} onClick={() => void valider()}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}✅ Valider</Button>
    </div>
  );
}
