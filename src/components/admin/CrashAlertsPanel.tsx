import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { CRASH_ACTION } from '@/lib/crashLog';

type CrashDetails = { error?: string; page?: string; user_agent?: string };

const INTERVALS = [1, 2, 3, 4];

/** Petit nom de l'appareil à partir du navigateur (pour comprendre d'où vient le plantage) */
function deviceOf(ua = ''): string {
  if (/iPad/i.test(ua)) return 'iPad';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? 'téléphone Android' : 'tablette Android';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'PC Windows';
  return 'appareil inconnu';
}

const notifyCount = () => window.dispatchEvent(new Event('dinislam:crashes-changed'));

/**
 * Monitoring : « 😿 Plantages à régler » (2026-10-19, demande de Nadia).
 * En rouge tant qu'un plantage n'est pas « résolu » ; réglage de la notification qui revient.
 */
export function CrashAlertsPanel() {
  const queryClient = useQueryClient();
  const { askValidation, validationDialog } = useConfirmValidation();

  const { data: crashes = [] } = useQuery({
    queryKey: ['admin-crashes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_logs').select('id, user_id, created_at, details')
        .eq('action', CRASH_ACTION).is('resolved_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const ids = [...new Set((data || []).map((c) => c.user_id))];
      const { data: profs } = ids.length
        ? await supabase.from('profiles').select('user_id, full_name').in('user_id', ids)
        : { data: [] as { user_id: string; full_name: string | null }[] };
      return (data || []).map((c) => ({
        ...c,
        name: profs?.find((p) => p.user_id === c.user_id)?.full_name || 'Élève',
        d: (c.details || {}) as CrashDetails,
      }));
    },
    refetchInterval: 60_000,
  });

  const { data: cfg } = useQuery({
    queryKey: ['crash-alert-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('crash_alert_settings').select('*').eq('id', 1).maybeSingle();
      return data;
    },
  });

  const [untilLocal, setUntilLocal] = useState<string | null>(null);
  const untilValue = untilLocal ?? (cfg?.until_at ? format(new Date(cfg.until_at), "yyyy-MM-dd'T'HH:mm") : '');
  const untilMode = cfg?.until_at || untilLocal ? 'date' : 'resolved';

  const saveCfg = async (patch: { interval_hours?: number; until_at?: string | null }) => {
    const { error } = await supabase.from('crash_alert_settings')
      .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) { toast.error('Réglage non enregistré'); return; }
    queryClient.invalidateQueries({ queryKey: ['crash-alert-settings'] });
    toast.success('Réglage enregistré');
  };

  const resolve = async (ids: string[]) => {
    const { error } = await supabase.from('app_logs')
      .update({ resolved_at: new Date().toISOString(), is_read: true }).in('id', ids);
    if (error) { toast.error('Erreur : le plantage reste à régler'); return; }
    queryClient.invalidateQueries({ queryKey: ['admin-crashes'] });
    notifyCount();
    toast.success(ids.length > 1 ? 'Plantages marqués résolus ✅' : 'Plantage marqué résolu ✅');
  };

  return (
    <div className={`rounded-2xl border-2 p-4 space-y-3 ${crashes.length ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40' : 'border-border bg-card'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={`font-bold text-base ${crashes.length ? 'text-red-800 dark:text-red-200' : 'text-foreground'}`}>
          😿 Plantages à régler {crashes.length > 0 && <span className="ml-1 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">{crashes.length}</span>}
        </h3>
        {crashes.length > 1 && (
          <Button size="sm" variant="outline" onClick={() => askValidation('Tout marquer résolu ?', 'Les notifications de plantage s\'arrêteront.', () => resolve(crashes.map((c) => c.id)))}>
            ✅ Tout marquer résolu
          </Button>
        )}
      </div>

      {crashes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun élève n'est tombé sur l'écran du chat qui pleure 🎉</p>
      ) : (
        <ul className="space-y-2">
          {crashes.map((c) => (
            <li key={c.id} className="rounded-xl border border-red-200 bg-background p-3 text-sm space-y-1 dark:border-red-800">
              <p className="font-semibold [overflow-wrap:anywhere]">👤 {c.name} · {format(new Date(c.created_at), "dd/MM 'à' HH:mm")}</p>
              <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">📍 Page : {c.d.page || '?'} · 📱 {deviceOf(c.d.user_agent)}</p>
              {c.d.error && <p className="text-xs text-red-700 dark:text-red-300 [overflow-wrap:anywhere]">⚠️ {c.d.error}</p>}
              <Button size="sm" className="mt-1 bg-green-600 hover:bg-green-700" onClick={() => askValidation('Problème résolu ?', `Le plantage de ${c.name} sera rangé et ses notifications s'arrêteront.`, () => resolve([c.id]))}>
                ✅ Problème résolu
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Réglage de la notification qui revient */}
      <div className="rounded-xl border border-border bg-background p-3 space-y-2 text-sm">
        <p className="font-semibold">🔔 Notification de plantage</p>
        <div className="flex flex-wrap items-center gap-2">
          <span>Revient</span>
          {INTERVALS.map((h) => (
            <button key={h} type="button" onClick={() => saveCfg({ interval_hours: h })}
              className={`rounded-full px-3 py-1 text-xs font-semibold border ${cfg?.interval_hours === h ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
              toutes les {h === 1 ? 'heures' : `${h} h`}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2">
            <input type="radio" name="crash-until" checked={untilMode === 'resolved'} onChange={() => { setUntilLocal(null); saveCfg({ until_at: null }); }} />
            Jusqu'à ce que le problème soit résolu
          </label>
          <label className="flex flex-wrap items-center gap-2">
            <input type="radio" name="crash-until" checked={untilMode === 'date'} onChange={() => setUntilLocal(untilValue || format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'HH:mm"))} />
            Jusqu'au
            <Input type="datetime-local" className="h-8 w-auto" value={untilValue} disabled={untilMode !== 'date'}
              onChange={(e) => setUntilLocal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && untilValue) saveCfg({ until_at: new Date(untilValue).toISOString() }); }} />
            {untilMode === 'date' && untilValue && (
              <Button size="sm" variant="outline" className="h-8" onClick={() => saveCfg({ until_at: new Date(untilValue).toISOString() })}>Enregistrer</Button>
            )}
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Tu peux aussi couper ces notifications dans Paramètres › Notifications.</p>
      </div>
      {validationDialog}
    </div>
  );
}
