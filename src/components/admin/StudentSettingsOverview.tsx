import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
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

/** Bascule vers Vercel : les connexions à partir de cette date sont sur la nouvelle appli */
const NEW_APP_SINCE = '2026-09-30T00:00:00';

function deviceOf(ua: string | null): string {
  if (!ua) return '';
  if (/iPhone/.test(ua)) return '📱 iPhone';
  if (/iPad/.test(ua)) return '📱 iPad';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? '📱 Android' : '📱 Tablette Android';
  if (/Macintosh/.test(ua)) return '💻 Mac';
  if (/Windows/.test(ua)) return '💻 PC';
  return '💻 Ordinateur';
}

const StudentSettingsOverview = ({ userId }: { userId: string }) => {
  const [devices, setDevices] = useState<number | null>(null);
  const [prefs, setPrefs] = useState<Partial<Tables<'notification_preferences'>> | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('auto');
  const [logins, setLogins] = useState<{ login_at: string; user_agent: string | null }[] | null>(null);

  useEffect(() => {
    const db = supabase;
    db.from('push_subscriptions').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      .then(({ count }) => setDevices(count ?? 0));
    db.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data }) => setPrefs(data ?? {}));
    db.from('profiles').select('date_of_birth, age').eq('user_id', userId).maybeSingle()
      .then(({ data }) => setAge(childAge(data)));
    db.from('parent_lock_settings').select('mode').eq('user_id', userId).maybeSingle()
      .then(({ data }) => setMode((data?.mode as Mode | undefined) ?? 'auto'));
    db.from('connexion_logs').select('login_at, user_agent').eq('user_id', userId).order('login_at', { ascending: false }).limit(8)
      .then(({ data }) => setLogins(data ?? []));
  }, [userId]);

  const changeMode = async (m: Mode) => {
    const previous = mode;
    setMode(m);
    const { error } = await supabase.from('parent_lock_settings').upsert({ user_id: userId, mode: m, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) { setMode(previous); toast.error('Réglage non enregistré'); } else toast.success('Espace parents mis à jour');
  };

  const off = prefs ? Object.keys(LABELS).filter(k => (prefs as Record<string, unknown>)[k] === false).map(k => LABELS[k]) : [];
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

      {/* Historique des connexions (idée validée le 2026-09-30) : a-t-il rejoint la nouvelle appli ? */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">🕘 Dernières connexions</p>
        {logins === null ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : logins.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune connexion enregistrée</p>
        ) : (
          <>
            <p className={`text-sm font-medium ${logins.some(l => l.login_at >= NEW_APP_SINCE) ? 'text-emerald-700' : 'text-destructive'}`}>
              {logins.some(l => l.login_at >= NEW_APP_SINCE) ? '✅ Connecté(e) sur la nouvelle appli' : "⚠️ Pas encore connecté(e) sur la nouvelle appli"}
            </p>
            <ul className="space-y-1 text-sm">
              {logins.map(l => (
                <li key={l.login_at} className="flex flex-wrap gap-x-2">
                  <span>{new Date(l.login_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-muted-foreground">{deviceOf(l.user_agent)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

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
