import { useState } from 'react';
import { toast } from 'sonner';
import { useEnregistrerVille, useMaVille } from '@/hooks/useVillePriere';
import type { VilleTrouvee } from '@/lib/ville';
import { ChoixVille } from './ChoixVille';

/**
 * 📍 À chaque connexion (Nadia, 2026-11-15) : si la ville manque ou est introuvable (mal orthographiée), un message
 * sur l'accueil demande de la corriger, directement ici. Fermé avec ✕ : revient à la prochaine connexion.
 */
const CLE = 'dinislam_ville_message_ferme';
export function VilleAVerifier() {
  const { data: p, isSuccess } = useMaVille();
  const enregistrer = useEnregistrerVille();
  const [ferme, setFerme] = useState(() => { try { return sessionStorage.getItem(CLE) === '1'; } catch { return false; } });
  const [choix, setChoix] = useState<VilleTrouvee | null>(null);
  const [envoi, setEnvoi] = useState(false);
  if (!isSuccess || !p || ferme || (p.city && p.ville_lat != null)) return null;
  const introuvable = !!p.city;
  const fermer = () => { try { sessionStorage.setItem(CLE, '1'); } catch { /* */ } setFerme(true); };
  const valider = async () => {
    if (!choix) return;
    setEnvoi(true);
    try { await enregistrer(choix); toast.success(`📍 Merci ! Les horaires de prière sont ceux de ${choix.label}`); }
    catch (e) { toast.error(/fetch|network/i.test((e as Error).message) ? '📡 Nécessite Internet' : (e as Error).message); }
    finally { setEnvoi(false); }
  };
  return (
    <div role="status" className="relative rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 pe-10 space-y-2">
      <button type="button" onClick={fermer} aria-label="Fermer (le message reviendra à la prochaine connexion)" className="absolute top-2 end-2 h-7 w-7 rounded-full text-amber-900 dark:text-amber-100 hover:bg-amber-200/60">✕</button>
      <p className="text-sm font-bold text-amber-900 dark:text-amber-100 [overflow-wrap:anywhere]">
        {introuvable ? `📍 Ta ville « ${p.city} » est introuvable : corrige l'orthographe.` : '📍 Écris le nom de ta ville : les horaires de prière seront les siens.'}
      </p>
      <ChoixVille id="ville-a-verifier" choisie={choix} onChoix={setChoix} texteDepart={introuvable ? p.city ?? '' : ''} />
      <button type="button" disabled={!choix || envoi} onClick={() => void valider()} className="w-full rounded-xl bg-amber-500 text-white py-2 text-sm font-extrabold disabled:opacity-50">✅ Enregistrer ma ville</button>
    </div>
  );
}
