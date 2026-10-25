import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sendPushNotification } from '@/lib/pushHelper';
import { personalize } from '@/lib/encouragements';
import { errorMessage } from '@/lib/utils';
import { JUZ, pageOfIndex } from '@/data/coranMeta';
import { PLAN_LABELS, dayNumber, percentRead, type Programme } from '@/lib/coranPlan';
import { describeIndex } from '@/lib/coranPages';

type Row = { user_id: string; kind: string; key: string; data: unknown; updated_at: string };
type Student = { user_id: string; full_name: string | null; gender: string | null };

const MESSAGES = [
  'Bravo {prenom} pour ta lecture du Coran ! Continue comme ça, je suis fière de toi 📖✨',
  "Ma shā' Allah {prenom}, quelle belle régularité dans ta lecture ! Qu'Allah te facilite 🤲",
  '{prenom}, chaque page lue est une lumière. Allez, on continue ensemble 🌟',
];

/** 👀 Enseignante (2026-10-25) : où en est chaque élève dans la carte Coran, et un mot d'encouragement. */
export function CoranStudentsTab() {
  const [to, setTo] = useState<Student | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const { data } = useQuery({
    queryKey: ['coran-admin-progress'],
    queryFn: async () => {
      const [{ data: roles }, { data: profiles }, { data: rows, error }] = await Promise.all([
        supabase.from('user_roles').select('user_id').eq('role', 'admin'),
        supabase.from('profiles').select('user_id, full_name, gender').eq('is_approved', true),
        supabase.from('coran_progress').select('user_id, kind, key, data, updated_at'),
      ]);
      if (error) throw error;
      const admins = new Set((roles || []).map((r) => r.user_id));
      return { students: ((profiles || []) as Student[]).filter((p) => !admins.has(p.user_id)), rows: (rows || []) as Row[] };
    },
  });

  const lines = useMemo(() => {
    if (!data) return [];
    return data.students.map((s) => {
      const mine = data.rows.filter((r) => r.user_id === s.user_id);
      const lecture = mine.find((r) => r.kind === 'lecture')?.data as { index?: number } | undefined;
      const juzFull = mine.filter((r) => r.kind === 'juz').filter((r) => {
        const j = JUZ[Number(r.key) - 1];
        const done = ((r.data as { done?: number[] }).done) || [];
        return j && j.sourates.every((x) => done.includes(x.n));
      }).length;
      const juzStarted = mine.filter((r) => r.kind === 'juz' && (((r.data as { done?: number[] }).done) || []).length).length;
      const prog = mine.find((r) => r.kind === 'programme')?.data as Programme | undefined;
      const last = mine.map((r) => r.updated_at).sort().pop();
      return { s, lecture, juzFull, juzStarted, prog, last };
    }).sort((a, b) => (b.last || '').localeCompare(a.last || '') || (a.s.full_name || '').localeCompare(b.s.full_name || '', 'fr'));
  }, [data]);

  const openFor = (s: Student) => { setTo(s); setText(personalize(MESSAGES[Math.floor(Math.random() * MESSAGES.length)], s.full_name, s.gender)); };
  const send = async () => {
    if (!to || !text.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('user_messages').insert({ user_id: to.user_id, message: text.trim(), sender_type: 'admin', message_type: 'text' });
      if (error) throw error;
      sendPushNotification({ title: '✉️ {prenom}, nouveau message de ton prof', category: 'msg', body: text.trim().substring(0, 100), userId: to.user_id, data: { url: '/?open=messages' } });
      toast.success(`Message envoyé à ${(to.full_name || "l'élève").trim().split(/\s+/)[0]} ✉️`);
      setTo(null);
    } catch (e) { toast.error(errorMessage(e)); } finally { setSending(false); }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Visible par toi seule. Les élèves qui ont lu le plus récemment sont en haut.</p>
      {lines.map(({ s, lecture, juzFull, juzStarted, prog, last }) => {
        const page = lecture?.index ? pageOfIndex(lecture.index) : null;
        return (
          <div key={s.user_id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e6d9cc] dark:border-[#3a2523] bg-white dark:bg-[#221413] px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold [overflow-wrap:anywhere]">{s.full_name || 'Élève'}</p>
              <p className="text-[11px] text-muted-foreground">
                📖 {lecture?.index ? (page ? `page ${page}` : describeIndex(lecture.index).title) : 'pas encore lu'}
                {' · '}📚 {juzFull} Juz' terminé{juzFull > 1 ? 's' : ''}{juzStarted > juzFull ? ` (${juzStarted - juzFull} en cours)` : ''}
                {' · '}🗓️ {prog ? `${PLAN_LABELS[prog.plan].title} jour ${Math.min(Math.max(dayNumber(prog.start), 1), prog.totalDays)}/${prog.totalDays} · ${percentRead(prog)} %` : 'pas de programme'}
              </p>
              {last && <p className="text-[10px] text-muted-foreground/80">Dernière lecture le {new Date(last).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>}
            </div>
            <Button size="sm" variant="outline" onClick={() => openFor(s)} className="shrink-0">💌 Encourager</Button>
          </div>
        );
      })}
      {data && !lines.length && <p className="text-sm text-muted-foreground text-center py-6">Aucun élève pour l'instant.</p>}
      <Dialog open={!!to} onOpenChange={(o) => { if (!o) setTo(null); }}>
        <DialogContent className="max-w-md" level="nested">
          <DialogTitle className="pe-8 [overflow-wrap:anywhere]">💌 Encourager {to?.full_name?.trim().split(/\s+/)[0]}</DialogTitle>
          <p className="text-xs text-muted-foreground">Le message arrive dans sa messagerie, avec une notification. Tu peux le modifier.</p>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} aria-label="Message d'encouragement" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setTo(null)}>Annuler</Button>
            <Button onClick={() => void send()} disabled={sending || !text.trim()} className="bg-[#7a1d22] hover:bg-[#561216] text-white">Envoyer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
