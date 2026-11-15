import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEnregistrerVille, useMaVille } from '@/hooks/useVillePriere';
import type { VilleTrouvee } from '@/lib/ville';
import { ChoixVille } from './ChoixVille';

/** 📍 Paramètres du profil › Ma ville (2026-11-15) : changer sa ville = horaires de prière de cette ville, partout dans l'appli */
export function MaVilleProfil() {
  const { data: p } = useMaVille();
  const enregistrer = useEnregistrerVille();
  const [choix, setChoix] = useState<VilleTrouvee | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const introuvable = !!p?.city && p.ville_lat == null;
  const valider = async () => {
    if (!choix) return;
    setEnvoi(true);
    try { await enregistrer(choix); toast.success(`📍 Ville enregistrée : ${choix.label}`); setChoix(null); }
    catch (e) { toast.error(/fetch|network/i.test((e as Error).message) ? '📡 Nécessite Internet' : (e as Error).message); }
    finally { setEnvoi(false); }
  };
  return (
    <div className="space-y-2">
      <Label htmlFor="ma-ville" className="font-semibold">📍 Ma ville</Label>
      {p?.city && !introuvable && <p className="text-sm [overflow-wrap:anywhere]">Aujourd'hui : <b>{p.city}</b> (horaires de prière de cette ville)</p>}
      {introuvable && <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 [overflow-wrap:anywhere]">❓ « {p?.city} » est introuvable : corrige l'orthographe.</p>}
      <ChoixVille id="ma-ville" choisie={choix} onChoix={setChoix} texteDepart={introuvable ? p?.city ?? '' : ''} />
      <Button onClick={() => void valider()} disabled={!choix || envoi} className="w-full" size="sm">Enregistrer la ville</Button>
    </div>
  );
}
