import { useAuth } from '@/contexts/AuthContext';
import { useBilansNonLus } from '@/hooks/useBilansNonLus';
import { ouvrirEspaceParents } from '@/lib/espaceParents';

/**
 * 📊 Message de l'accueil « Nouveau bilan trimestriel » (demande de Nadia, 2026-11-02) : entre le message de bienvenue
 * et la carte de la date, en jaune bordé de rouge. Visible sur le compte de l'enfant (ses parents l'utilisent) et sur
 * celui d'un parent élève relié à ses enfants, tant qu'aucun parent n'a ouvert le bilan dans l'Espace parents.
 * Toucher le message ouvre la fenêtre ⚙️ directement sur l'Espace parents (code parents demandé comme d'habitude).
 */
export function AnnonceBilan() {
  const { isAdmin } = useAuth();
  const { bilans } = useBilansNonLus();
  if (isAdmin || !bilans.length) return null;
  return (
    <div className="space-y-2 animate-fade-in">
      {bilans.map((b) => (
        <button key={b.child_id} type="button" onClick={ouvrirEspaceParents}
          className="w-full rounded-2xl border-[3px] border-red-500 bg-yellow-200 px-4 py-3 text-left shadow-md transition hover:bg-yellow-100 dark:bg-yellow-300">
          <span className="flex items-start gap-3">
            <span className="text-3xl leading-none shrink-0" aria-hidden>📊</span>
            <span className="flex-1 min-w-0">
              <span className="block font-extrabold text-red-700 [overflow-wrap:anywhere]">
                {b.n > 1 ? `${b.n} nouveaux bilans trimestriels` : 'Nouveau bilan trimestriel'} de {b.prenom} !
              </span>
              <span className="block text-sm font-medium text-yellow-950 [overflow-wrap:anywhere]">
                Parents : ouvrez-le dans ⚙️ › Espace parents, avec votre code parents.
              </span>
              <span className="mt-2 inline-block rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">📖 Voir le bilan</span>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
