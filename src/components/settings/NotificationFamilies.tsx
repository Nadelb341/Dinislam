import { useEffect, useState } from 'react';
import { Bell, BookOpen, GraduationCap, MessageCircle, Megaphone, Moon, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Carte « Notifications » de Paramètres — piste B choisie par Nadia le 2026-09-30 :
 * une carte de couleur par famille, un interrupteur pour toute la famille, et « Détails »
 * pour allumer / éteindre chaque notification séparément. + « Mode calme » (21 h – 8 h).
 * Chaque changement est enregistré tout de suite (table notification_preferences) ;
 * le filtrage se fait côté serveur dans send-push-notification (champ `category`).
 * ⚠️ Toute NOUVELLE notification automatique doit recevoir une `category` et une ligne ici.
 */

type PrefKey =
  | 'notif_msg' | 'notif_hw_new' | 'notif_hw_rem' | 'notif_hw_res' | 'notif_rec' | 'notif_lesson'
  | 'notif_act' | 'notif_sched' | 'notif_adm_msg' | 'notif_adm_hw' | 'notif_adm_valid' | 'notif_adm_reg'
  | 'fajr_reminder' | 'dhuhr_reminder' | 'asr_reminder' | 'maghrib_reminder' | 'isha_reminder' | 'ramadan_activities';

interface Family {
  id: string;
  title: string;
  icon: typeof Bell;
  /** classes de couleur : fond clair, bordure, texte, pastille */
  soft: string; border: string; ink: string; chip: string;
  adminOnly?: boolean;
  items: { key: PrefKey; label: string; hint?: string }[];
}

const FAMILIES: Family[] = [
  {
    id: 'msg', title: 'Messages', icon: MessageCircle,
    soft: 'bg-blue-50', border: 'border-blue-200', ink: 'text-blue-900', chip: 'bg-blue-600',
    items: [{ key: 'notif_msg', label: 'Messages du professeur', hint: 'Texte ou message audio' }],
  },
  {
    id: 'hw', title: 'Devoirs', icon: BookOpen,
    soft: 'bg-orange-50', border: 'border-orange-200', ink: 'text-orange-900', chip: 'bg-orange-600',
    items: [
      { key: 'notif_hw_new', label: 'Nouveau devoir' },
      { key: 'notif_hw_rem', label: 'Rappel de devoir', hint: 'Chaque jour à 18 h, et la veille de la date limite' },
      { key: 'notif_hw_res', label: 'Devoir corrigé', hint: 'Validé ou à refaire' },
    ],
  },
  {
    id: 'prog', title: 'Progression', icon: GraduationCap,
    soft: 'bg-emerald-50', border: 'border-emerald-200', ink: 'text-emerald-900', chip: 'bg-emerald-700',
    items: [
      { key: 'notif_rec', label: 'Résultat de récitation', hint: 'Sourates, Nourania, invocations' },
      { key: 'notif_lesson', label: "Note de l'enseignante", hint: 'Et nouvelle leçon débloquée' },
    ],
  },
  {
    id: 'ann', title: 'Annonces', icon: Megaphone,
    soft: 'bg-violet-50', border: 'border-violet-200', ink: 'text-violet-900', chip: 'bg-violet-600',
    items: [
      { key: 'notif_act', label: 'Nouvelle activité', hint: 'Un nouveau module est disponible' },
      { key: 'notif_sched', label: 'Annonces programmées', hint: "Messages prévus par l'enseignante" },
    ],
  },
  {
    id: 'pri', title: 'Prière et Ramadan', icon: Moon,
    soft: 'bg-teal-50', border: 'border-teal-200', ink: 'text-teal-900', chip: 'bg-teal-700',
    items: [
      { key: 'fajr_reminder', label: 'Rappel Fajr' },
      { key: 'dhuhr_reminder', label: 'Rappel Dohr' },
      { key: 'asr_reminder', label: 'Rappel Asr' },
      { key: 'maghrib_reminder', label: 'Rappel Maghrib' },
      { key: 'isha_reminder', label: 'Rappel Icha' },
      { key: 'ramadan_activities', label: 'Activités du Ramadan', hint: 'Pendant le mois de Ramadan' },
    ],
  },
  {
    id: 'adm', title: 'Espace enseignante', icon: Shield, adminOnly: true,
    soft: 'bg-amber-50', border: 'border-amber-200', ink: 'text-amber-900', chip: 'bg-amber-600',
    items: [
      { key: 'notif_adm_msg', label: "Nouveau message d'un élève" },
      { key: 'notif_adm_hw', label: 'Devoir rendu' },
      { key: 'notif_adm_valid', label: 'Demande de validation' },
      { key: 'notif_adm_reg', label: 'Nouvelle inscription' },
    ],
  },
];

const PRAYER_KEYS: PrefKey[] = ['fajr_reminder', 'dhuhr_reminder', 'asr_reminder', 'maghrib_reminder', 'isha_reminder'];

type Prefs = Partial<Record<PrefKey | 'quiet_mode', boolean>>;

const NotificationFamilies = () => {
  const { user, isAdmin } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    (supabase as any).from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }: { data: Prefs | null }) => { if (data) setPrefs(data); });
  }, [user]);

  // Absent = activé (tout est activé par défaut), sauf le mode calme
  const isOn = (k: PrefKey) => prefs[k] !== false;

  const save = async (changes: Prefs) => {
    if (!user) return;
    const next = { ...prefs, ...changes };
    setPrefs(next);
    const row: Record<string, unknown> = { user_id: user.id, ...changes };
    // Le rappel de prière général suit les 5 prières (utilisé par usePrayerTimes)
    if (PRAYER_KEYS.some(k => k in changes)) row.prayer_reminders = PRAYER_KEYS.some(k => next[k] !== false);
    const { error } = await (supabase as any).from('notification_preferences').upsert(row, { onConflict: 'user_id' });
    if (error) {
      setPrefs(prefs);
      toast.error("Réglage non enregistré, réessaie");
    }
  };

  const families = FAMILIES.filter(f => !f.adminOnly || isAdmin);

  return (
    <div className="space-y-3">
      {families.map(f => {
        const Icon = f.icon;
        const onCount = f.items.filter(it => isOn(it.key)).length;
        const anyOn = onCount > 0;
        const expanded = !!open[f.id];
        const summary = onCount === f.items.length ? 'Tout est activé' : onCount === 0 ? 'Tout est coupé' : `${onCount} sur ${f.items.length} activées`;
        return (
          <div key={f.id} className={`rounded-2xl border-2 ${f.border} bg-background overflow-hidden`}>
            <div className={`flex items-center gap-3 p-3 ${f.soft}`}>
              <div className={`h-10 w-10 shrink-0 rounded-xl ${f.chip} flex items-center justify-center`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold [overflow-wrap:anywhere] ${f.ink}`}>{f.title}</p>
                <p className="text-sm text-muted-foreground">{summary}</p>
              </div>
              <Switch
                aria-label={`${f.title} : tout activer ou tout couper`}
                checked={anyOn}
                onCheckedChange={(v) => save(Object.fromEntries(f.items.map(it => [it.key, v])) as Prefs)}
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen(o => ({ ...o, [f.id]: !expanded }))}
              className={`w-full min-h-11 px-4 py-2 text-left text-sm font-medium ${f.ink}`}
              aria-expanded={expanded}
            >
              {expanded ? 'Masquer les détails' : `Détails (${f.items.length})`}
            </button>
            {expanded && (
              <div className="px-4 pb-2">
                {f.items.map(it => (
                  <div key={it.key} className="flex items-center gap-3 py-2.5 border-t border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium [overflow-wrap:anywhere]">{it.label}</p>
                      {it.hint && <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{it.hint}</p>}
                    </div>
                    <Switch aria-label={it.label} checked={isOn(it.key)} onCheckedChange={(v) => save({ [it.key]: v } as Prefs)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-3 flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-700 flex items-center justify-center">
          <Moon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-indigo-900">Mode calme</p>
          <p className="text-sm text-muted-foreground">Aucune notification entre 21 h et 8 h (les rappels de prière restent actifs)</p>
        </div>
        <Switch aria-label="Mode calme" checked={prefs.quiet_mode === true} onCheckedChange={(v) => save({ quiet_mode: v })} />
      </div>
    </div>
  );
};

export default NotificationFamilies;
