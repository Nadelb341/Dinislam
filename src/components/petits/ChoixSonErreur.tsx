import { useQueryClient } from '@tanstack/react-query';
import { useSonErreurChoisi } from '@/hooks/useSonErreur';
import { toast } from 'sonner';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { errorMessage } from '@/lib/utils';
import { SONS_ERREUR, retenirSonErreur, sonErreur, sonErreurChoisi } from '@/lib/sonsErreur';

/**
 * 🔈 Choisir le son doux qu'entendent les enfants quand ils se trompent (Nadia, 22/11) : un toucher = on l'écoute ET il devient
 * le son de TOUS les jeux des tout-petits. Placé dans l'onglet « 🧸 Tout-petits » de l'accueil et dans l'Alphabet › tout-petits.
 */
export function ChoixSonErreur() {
  const queryClient = useQueryClient();
  const { data: sonChoisi = sonErreurChoisi() } = useSonErreurChoisi();
  const choisir = async (n: number) => {
    sonErreur(n); retenirSonErreur(n);
    queryClient.setQueryData(['reglages-appli', 'son_erreur_petits'], n);
    try {
      const r = await ecrireOuGarder({ table: 'reglages_appli', op: 'upsert', rows: [{ cle: 'son_erreur_petits', valeur: n, updated_at: new Date().toISOString() }] });
      if (r === 'en_attente') toast('📡 Gardé, envoyé au retour du réseau');
    } catch (e) { toast.error(errorMessage(e)); }
  };
  return (
    <div className="space-y-1.5">
      <p className="text-xs">Touche un son pour l'écouter : il devient le son de TOUS les jeux (bulles, écoute, paires, 🎈, remets dans l'ordre, quiz des histoires).</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {SONS_ERREUR.map((x) => (
          <button key={x.n} type="button" onClick={() => void choisir(x.n)} aria-pressed={sonChoisi === x.n}
            className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-start font-semibold ${sonChoisi === x.n ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'border-border bg-card'}`}>
            <span className="text-xl">{x.emoji}</span>
            <span className="flex-1 min-w-0">{x.n}. {x.nom}</span>
            <span className="text-lg">{sonChoisi === x.n ? '✅' : '▶️'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
