import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { STUDENT_TRASH_DAYS } from '@/lib/trash';

/**
 * Bandeau d'alerte (élèves de plus de 12 ans) : un élément de leur corbeille sera vidé automatiquement
 * dans 3 jours ou moins (demande de Nadia du 2026-09-30). Complète la notification envoyée par trash-maintenance.
 */
const DAY = 86400000;

const TrashPurgeWarning = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (loading || !user || isAdmin) return;
    const today = new Date().toISOString().slice(0, 10);
    try { if (localStorage.getItem('trash_warning_hidden') === today) { setHidden(true); return; } } catch { /* stockage indisponible */ }
    (async () => {
      const { data: profile } = await (supabase as any).from('profiles').select('date_of_birth, age').eq('user_id', user.id).maybeSingle();
      let age: number | null = profile?.age ?? null;
      if (profile?.date_of_birth) {
        const b = new Date(profile.date_of_birth); const n = new Date();
        age = n.getFullYear() - b.getFullYear() - (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate()) ? 1 : 0);
      }
      if (age !== null && age <= 12) return;
      const { data: items } = await (supabase as any).from('trash_items').select('deleted_at').eq('user_id', user.id).order('deleted_at', { ascending: true }).limit(1);
      if (!items?.length) return;
      const purgeAt = new Date(items[0].deleted_at).getTime() + STUDENT_TRASH_DAYS * DAY;
      const left = Math.ceil((purgeAt - Date.now()) / DAY);
      if (left >= 1 && left <= 3) setDays(left);
    })();
  }, [user, isAdmin, loading]);

  if (days === null || hidden) return null;

  const hide = () => {
    setHidden(true);
    try { localStorage.setItem('trash_warning_hidden', new Date().toISOString().slice(0, 10)); } catch { /* stockage indisponible */ }
  };

  return (
    <div className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 flex items-center gap-3">
      <Trash2 className="h-5 w-5 text-amber-700 shrink-0" />
      <p className="flex-1 min-w-0 text-sm font-medium text-amber-900 [overflow-wrap:anywhere]">
        Attention : Ta corbeille dans « Paramètres » va être vidée automatiquement dans {days} jour{days > 1 ? 's' : ''}
      </p>
      <button
        type="button"
        onClick={() => navigate('/settings#corbeille')}
        className="shrink-0 min-h-11 rounded-xl bg-amber-600 px-3 text-sm font-bold text-white"
      >
        Voir
      </button>
      <button
        type="button"
        onClick={hide}
        aria-label="Fermer l'alerte"
        className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#EF4444] text-white shadow-md hover:bg-[#DC2626]"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default TrashPurgeWarning;
