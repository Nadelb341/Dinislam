import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { childAge } from '@/hooks/useParentLock';

/**
 * Fiche élève (bouclier) — demande de Nadia du 2026-09-30 : voir d'un coup d'œil les réglages de notifications
 * d'un élève (utile quand un parent dit « il ne reçoit rien ») et choisir son « Espace parents ».
 */
const LABELS: Record<string, string> = {
  notif_msg: 'Messages du professeur', notif_hw_new: 'Nouveau devoir', notif_hw_rem: 'Rappel de devoir',
  notif_hw_res: 'Devoir corrigé', notif_rec: 'Résultat de récitation', notif_lesson: "Note de l'enseignante",
  notif_act: 'Nouvelle activité', notif_sched: 'Annonces programmées',
  fajr_reminder: 'Rappel Fajr', dhuhr_reminder: 'Rappel Dohr', asr_reminder: 'Rappel Asr',
  maghrib_reminder: 'Rappel Maghrib', isha_reminder: 'Rappel Icha', ramadan_activities: 'Activités du Ramadan',
};

type Mode = 'auto' | 'on' | 'off';

const StudentSettingsOverview = ({ userId }: { userId: string }) => {
  const [devices, setDevices] = useState<number | null>(null);
  const [prefs, setPrefs] = useState<Record<string, any> | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('auto');

  useEffect(() => {
    const db = supabase as any;
    db.from('push_subscriptions').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      .then(({ count }: { count: number | null }) => setDevices(count ?? 0));
    db.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data }: { data: Record<string, any> | null }) => setPrefs(data ?? {}));
    db.from('profiles').select('date_of_birth, age').eq('user_id', userId).maybeSingle()
      .then(({ data }: { data: any }) => setAge(childAge(data)));
    db.from('parent_lock_settings').select('mode').eq('user_id', userId).maybeSingle()
      .then(({ data }: { data: { mode: Mode } | null }) => setMode(data?.mode ?? 'auto'));
  }, [userId]);

  const changeMode = async (m: Mode) => {
    const previous = mode;
    setMode(m);
    const { error } = await (supabase as any).from('parent_lock_settings').upsert({ user_id: userId, mode: m, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) { setMode(previous); toast.error('Réglage non enregistré'); } else toast.success('Espace parents mis à jour');
  };

  const off = prefs ? Object.keys(LABELS).filter(k => prefs[k] === false).map(k => LABELS[k]) : [];
  const autoLocked = age !== null && age < 12;

  return (
    <div className="border-t pt-4 space-y-3">
      <h4 className="font-semibold text-foreground">🔔 Réglages de l'élève</h4>
      <ul className="space-y-1.5 text-sm">
        <li>📱 Appareils qui reçoivent les notifications : <strong>{devices ?? '…'}</strong>{devices === 0 && <span className="text-destructive"> (aucun : l'élève ne reçoit rien)</span>}</li>
        <li>🌙 Mode calme : <strong>{prefs?.quiet_mode ? `de ${prefs.quiet_start ?? 21} h à ${prefs.quiet_end ?? 8} h` : 'désactivé'}</strong></li>
        <li>🔈 Son : <strong>{prefs?.notif_silent ? 'silencieux (vibration)' : 'avec son'}</strong></li>
        <li className="[overflow-wrap:anywhere]">🚫 Notifications coupées : <strong>{prefs === null ? '…' : off.length ? off.join(', ') : 'aucune, tout est activé'}</strong></li>
      </ul>

      <div className="space-y-1.5">
        <p className="text-sm font-medium">🔒 Espace parents (mot de passe pour ouvrir les paramètres)</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Espace parents">
          {([
            ['auto', `Selon l'âge${age !== null ? ` (${age} ans : ${autoLocked ? 'verrouillé' : 'libre'})` : ''}`],
            ['on', 'Toujours verrouillé'],
            ['off', 'Jamais verrouillé'],
          ] as [Mode, string][]).map(([m, label]) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => changeMode(m)}
              className={`min-h-11 rounded-xl border-2 px-2 py-2 text-xs font-medium [overflow-wrap:anywhere] ${mode === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentSettingsOverview;
