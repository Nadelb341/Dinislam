import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { fetchLoginTrouble } from '@/lib/loginTrouble';

/** Bouclier : « N élèves n'arrivent pas à se connecter », avec la liste et un accès direct à la liste Élèves */
export function LoginTroubleBanner({ onOpenStudents }: { onOpenStudents: () => void }) {
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({ queryKey: ['admin-login-trouble'], queryFn: fetchLoginTrouble, staleTime: 60_000 });
  if (data.length === 0) return null;
  return (
    <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-2 px-4 py-3 text-start">
        <span className="font-semibold text-sm text-red-900 dark:text-red-100">
          🔐 {data.length} élève{data.length > 1 ? 's' : ''} n'arrive{data.length > 1 ? 'nt' : ''} pas à se connecter
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          <ul className="space-y-1 text-sm">
            {data.map((t) => (
              <li key={t.user_id} className="[overflow-wrap:anywhere]">
                <b>{t.name}</b> · {t.reason === 'email'
                  ? 'e-mail jamais confirmé'
                  : `a demandé un nouveau mot de passe le ${new Date(t.since ?? '').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}, sans réussir à se connecter depuis`}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">Dans Élèves : « Confirmer » sur sa carte, ou ⋮ › Modifier le mot de passe pour lui en donner un.</p>
          <button type="button" onClick={onOpenStudents} className="w-full rounded-xl bg-destructive text-destructive-foreground font-semibold py-2 text-sm">
            👨‍🎓 Ouvrir la liste des élèves
          </button>
        </div>
      )}
    </div>
  );
}
