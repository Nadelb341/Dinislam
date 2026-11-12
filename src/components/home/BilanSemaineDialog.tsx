import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { sendPushNotification } from '@/lib/pushHelper';
import { useConvocations } from '@/components/convocations/useConvocations';
import { NOM_DESTINATAIRE, lienSms, lienWhatsApp, numeroPour, type Destinataire } from '@/lib/convocations';
import { CLE_BILAN_ENVOYE, cleSemaine, texteBilanSemaine, type ChiffresSemaine } from '@/lib/bilanSemaine';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { depuisJour } from '@/lib/depuisJour';


/**
 * 📊 Bilan de la semaine (Nadia, 2026-11-11, idée 6) : proposé le MARDI à 16 h, c'est Nadia qui décide.
 * Relire chaque élève, décocher, puis « Envoyer dans l'appli » (message à l'élève + notification à lui et ses parents reliés)
 * et/ou WhatsApp / SMS en 1 appui par parent.
 */
export function BilanSemaineDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: classe } = useConvocations(open);
  const [exclus, setExclus] = useState<Set<string>>(new Set());
  const [dest, setDest] = useState<Destinataire>('parent1');
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const ids = useMemo(() => (classe?.eleves ?? []).map((e) => e.id), [classe?.eleves]);
  const { data: chiffres, isLoading, isError } = useQuery({
    queryKey: ['bilan-semaine', ids.join(',')],
    enabled: open && ids.length > 0,
    queryFn: async () => {
      const depuis = depuisJour(7);
      const [donnes, checks, rendus, lignes, lecons, sour, inv, nomsL, nomsS, nomsI] = await Promise.all([
        supabase.from('devoirs').select('id, student_id').in('student_id', ids).gte('created_at', depuis),
        supabase.from('devoir_checks').select('devoir_id, student_id').in('student_id', ids).gte('checked_at', depuis),
        supabase.from('devoirs_rendus').select('devoir_id, student_id').in('student_id', ids).gte('rendu_at', depuis),
        supabase.from('nourania_lignes_faites').select('user_id').in('user_id', ids).gte('created_at', depuis),
        supabase.from('user_nourania_progress').select('user_id, lesson_id').in('user_id', ids).eq('is_validated', true).gte('completed_at', depuis),
        supabase.from('user_sourate_progress').select('user_id, sourate_id').in('user_id', ids).eq('is_validated', true).eq('context', 'sourates').gte('validated_at', depuis),
        supabase.from('user_invocation_progress').select('user_id, invocation_id').in('user_id', ids).eq('is_validated', true).gte('updated_at', depuis),
        supabase.from('nourania_lessons').select('id, lesson_number'),
        supabase.from('sourates').select('id, name_french'),
        supabase.from('invocations').select('id, title_french'),
      ]);
      const err = [donnes, checks, rendus, lignes, lecons, sour, inv].find((r) => r.error)?.error;
      if (err) throw err;
      const res: Record<string, ChiffresSemaine> = {};
      for (const id of ids) {
        const siens = new Set((donnes.data || []).filter((d) => d.student_id === id).map((d) => d.id));
        const faits = new Set([...(checks.data || []), ...(rendus.data || [])].filter((x) => x.student_id === id && x.devoir_id && siens.has(x.devoir_id)).map((x) => x.devoir_id));
        res[id] = {
          devoirsDonnes: siens.size, devoirsFaits: faits.size,
          lignes: (lignes.data || []).filter((x) => x.user_id === id).length,
          lecons: (lecons.data || []).filter((x) => x.user_id === id).map((x) => `leçon ${(nomsL.data || []).find((l) => l.id === x.lesson_id)?.lesson_number ?? '?'}`),
          sourates: (sour.data || []).filter((x) => x.user_id === id).map((x) => ((nomsS.data || []).find((s) => s.id === x.sourate_id)?.name_french || 'sourate').split(' (')[0]),
          invocations: (inv.data || []).filter((x) => x.user_id === id).map((x) => (nomsI.data || []).find((i) => i.id === x.invocation_id)?.title_french || 'invocation'),
        };
      }
      return res;
    },
  });

  const eleves = classe?.eleves ?? [];
  const textes = new Map(eleves.map((e) => [e.id, chiffres?.[e.id] ? texteBilanSemaine(e.nom, chiffres[e.id]) : '']));
  const choisis = eleves.filter((e) => !exclus.has(e.id) && textes.get(e.id));

  const envoyer = async () => {
    setEnvoi(true);
    try {
      const rows = choisis.map((e) => ({ user_id: e.id, sender_type: 'admin', message_type: 'text', message: textes.get(e.id)! }));
      const { error } = await supabase.from('user_messages').insert(rows);
      if (error) throw error;
      for (const e of choisis) sendPushNotification({ userIds: [e.id, ...e.parents], title: '📊 Le bilan de la semaine', body: textes.get(e.id)!.split('\n').slice(1, 3).join(' · '), data: { url: '/?open=messages' } });
      try { localStorage.setItem(CLE_BILAN_ENVOYE, cleSemaine()); } catch { /* stockage indisponible */ }
      toast.success(`📊 Bilan envoyé à ${choisis.length} élève${choisis.length > 1 ? 's' : ''} (et leurs parents reliés)`);
      onOpenChange(false);
    } catch (e) {
      toast.error(/fetch|network/i.test((e as Error).message) ? '📡 Nécessite Internet pour envoyer le bilan' : (e as Error).message);
    } finally { setEnvoi(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[94dvh] overflow-y-auto rounded-2xl">
        <DialogTitle>📊 Bilan de la semaine</DialogTitle>
        <DialogDescription>Les 7 derniers jours de chaque élève. Relis, décoche ceux que tu ne veux pas, puis envoie (ou pas : c'est toi qui décides).</DialogDescription>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold">WhatsApp / SMS à :</span>
          {(['parent1', 'parent2', 'eleve'] as Destinataire[]).map((d) => (
            <button key={d} type="button" aria-pressed={dest === d} onClick={() => setDest(d)}
              className={cn('rounded-full border px-2 py-0.5 font-semibold', dest === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>{NOM_DESTINATAIRE[d]}</button>
          ))}
        </div>
        {isError && <p className="text-sm text-destructive">📡 Nécessite Internet pour préparer le bilan.</p>}
        {isLoading || !classe ? <p className="py-6 text-center text-sm text-muted-foreground">⏳ Je prépare le bilan de chaque élève…</p> : (
          <div className="space-y-2">
            {eleves.map((e) => {
              const t = textes.get(e.id) || '';
              const tel = numeroPour(e, dest);
              return (
                <div key={e.id} className={cn('rounded-xl border p-2.5 space-y-1.5', exclus.has(e.id) && 'opacity-50')}>
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input type="checkbox" className="h-4 w-4" checked={!exclus.has(e.id)} onChange={(ev) => setExclus((x) => { const n = new Set(x); if (ev.target.checked) n.delete(e.id); else n.add(e.id); return n; })} />
                    <span className="flex-1 min-w-0 [overflow-wrap:anywhere]">{e.nom}</span>
                  </label>
                  <p className="cahier-main text-[15px] leading-6 whitespace-pre-line [overflow-wrap:anywhere] rounded-lg bg-amber-50/70 dark:bg-amber-950/20 px-2 py-1">{t}</p>
                  {tel ? (
                    <div className="flex gap-1.5 text-xs">
                      <a href={lienWhatsApp(tel, t)} target="_blank" rel="noopener noreferrer" className="rounded-lg border px-2 py-1 font-bold bg-card">📲 WhatsApp</a>
                      <a href={lienSms(tel, t)} className="rounded-lg border px-2 py-1 font-bold bg-card">💬 SMS</a>
                    </div>
                  ) : <p className="text-[11px] text-muted-foreground">Pas de numéro ({NOM_DESTINATAIRE[dest].toLowerCase()}) · Convocations › 📇 Numéros</p>}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl border py-2 text-sm font-bold">Pas cette semaine</button>
          <button type="button" disabled={envoi || !choisis.length} onClick={() => setConfirmer(true)} className="flex-1 rounded-xl bg-[#0f766e] disabled:opacity-50 text-white py-2 text-sm font-extrabold">
            {envoi ? '⏳ …' : `📨 Envoyer dans l'appli (${choisis.length})`}
          </button>
        </div>
        <AlertDialog open={confirmer} onOpenChange={setConfirmer}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Envoyer le bilan de la semaine ?</AlertDialogTitle>
              <AlertDialogDescription>{choisis.length} élève{choisis.length > 1 ? 's' : ''} le recevr{choisis.length > 1 ? 'ont' : 'a'} dans sa messagerie ✉️, avec une notification à lui et à ses parents reliés.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => void envoyer()}>Envoyer</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
