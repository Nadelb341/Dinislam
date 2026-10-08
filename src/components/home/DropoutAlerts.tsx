import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sendPushNotification } from '@/lib/pushHelper';
import { personalize } from '@/lib/encouragements';
import { errorMessage } from '@/lib/utils';
import { encouragementLabel, useEngagement, useRecentEncouragements } from '@/hooks/useEngagement';
import { dropoutLevel, dropoutReason, NUDGES, type Engagement } from '@/lib/engagement';

/** ✉️ Encourager un élève : message déjà écrit à son prénom, modifiable, envoyé dans sa messagerie + notification */
export function EncourageDialog({ student, onClose }: { student: Engagement | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [openedFor, setOpenedFor] = useState<string | null>(null);

  if (student && openedFor !== student.student_id) {
    const i = Math.floor(Math.random() * NUDGES.length);
    setOpenedFor(student.student_id); setIndex(i); setText(personalize(NUDGES[i], student.full_name, student.gender));
  }
  const other = () => {
    if (!student) return;
    const i = (index + 1) % NUDGES.length;
    setIndex(i); setText(personalize(NUDGES[i], student.full_name, student.gender));
  };
  const send = async () => {
    if (!student || !text.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('user_messages').insert({ user_id: student.student_id, message: text.trim(), sender_type: 'admin', message_type: 'text' });
      if (error) throw error;
      await supabase.from('encouragement_logs').insert({ student_id: student.student_id, message: text.trim(), automatic: false });
      sendPushNotification({ title: '✉️ {prenom}, nouveau message de ton prof', category: 'msg', body: text.trim().substring(0, 100), userId: student.student_id, data: { url: '/?open=messages' } });
      toast.success(`Message envoyé à ${(student.full_name || 'l\'élève').trim().split(/\s+/)[0]} ✉️`);
      queryClient.invalidateQueries({ queryKey: ['student-engagement'] });
      queryClient.invalidateQueries({ queryKey: ['recent-encouragements'] });
      queryClient.invalidateQueries({ queryKey: ['student-followup', student.student_id] });
      setOpenedFor(null);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={!!student} onOpenChange={(o) => { if (!o) { setOpenedFor(null); onClose(); } }}>
      <DialogContent className="max-w-md" level="nested">
        <DialogTitle className="pe-8 [overflow-wrap:anywhere]">✉️ Encourager {student?.full_name?.trim().split(/\s+/)[0]}</DialogTitle>
        <p className="text-xs text-muted-foreground">Le message arrive dans sa messagerie, avec une notification. Tu peux le modifier avant.</p>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} aria-label="Message d'encouragement" />
        <button type="button" onClick={other} className="text-xs font-semibold text-primary text-start">🔀 Un autre message</button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => { setOpenedFor(null); onClose(); }}>Annuler</Button>
          <Button onClick={send} disabled={sending || !text.trim()}>✉️ Envoyer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Carte À FAIRE : « ⚠️ Élèves qui décrochent » (rouge d'abord, puis orange) */
export function DropoutAlerts() {
  const { data = [] } = useEngagement();
  const { data: recent } = useRecentEncouragements();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Engagement | null>(null);
  const list = data
    .map((e) => ({ e, level: dropoutLevel(e) }))
    .filter((x) => x.level)
    .sort((a, b) => (a.level === b.level ? 0 : a.level === 'red' ? -1 : 1));
  if (!list.length) return null;
  const reds = list.filter((x) => x.level === 'red').length;

  return (
    <div className="mx-3 mb-3 rounded-xl border border-red-200 dark:border-red-900 bg-card">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-3 py-2 text-start">
        <span className="text-sm font-bold flex-1">⚠️ Élèves qui décrochent</span>
        {reds > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center bg-red-600 text-white">{reds}</span>}
        {list.length - reds > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center bg-orange-500 text-white">{list.length - reds}</span>}
        <span className="text-xs text-muted-foreground">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {list.map(({ e, level }) => (
            <div key={e.student_id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${level === 'red' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-orange-50 dark:bg-orange-950/30'}`}>
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${level === 'red' ? 'bg-red-600' : 'bg-orange-500'}`} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold [overflow-wrap:anywhere]">{e.full_name || 'Élève'}</span>
                <span className="block text-[11px] text-muted-foreground">{dropoutReason(e)}{recent?.get(e.student_id) ? ` · ${encouragementLabel(recent.get(e.student_id))}` : ''}</span>
              </span>
              <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={() => setTarget(e)}>✉️ Encourager</Button>
            </div>
          ))}
        </div>
      )}
      <EncourageDialog student={target} onClose={() => setTarget(null)} />
    </div>
  );
}
