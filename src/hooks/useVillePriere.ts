import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getSavedMethod, type CityOption } from '@/hooks/usePrayerTimesCity';
import { enregistrerVillePriere, villePriereDeLAppareil } from '@/lib/rappelsPriere';
import { champsVille, villeDuProfil, type VilleTrouvee } from '@/lib/ville';

/**
 * 📍 La ville des horaires de prière = la ville du PROFIL (Nadia, 2026-11-15 : « ce n'est pas aux élèves de faire la manipulation »).
 * Copiée sur l'appareil (lecture sans réseau) et pour le serveur des rappels. Sans ville de profil : l'ancien choix de l'appareil.
 */
const CLE_APPAREIL = 'dinislam_prayer_city';
const villeDeLAppareil = villePriereDeLAppareil;

export function useMaVille() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ma-ville', user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from('profiles').select('city, ville_lat, ville_lon, ville_pays, ville_fuseau').eq('user_id', user!.id).maybeSingle()).data,
  });
}

export function useVillePriere(): { ville: CityOption; duProfil: boolean } {
  const { user } = useAuth();
  const { data: p } = useMaVille();
  const profil = villeDuProfil(p);
  const ville = profil ?? villeDeLAppareil();
  useEffect(() => {
    if (!profil || !user) return;
    const avant = villeDeLAppareil();
    if (avant.label === profil.label && avant.lat === profil.lat && avant.lon === profil.lon) return;
    try { localStorage.setItem(CLE_APPAREIL, JSON.stringify(profil)); } catch { /* stockage indisponible */ }
    void enregistrerVillePriere(user.id, profil, getSavedMethod().id);
  }, [profil?.label, profil?.lat, profil?.lon, user]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ville, duProfil: !!profil };
}

/** Enregistre la ville choisie dans le profil (Internet nécessaire : la recherche aussi) */
export function useEnregistrerVille() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return async (v: VilleTrouvee) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update(champsVille(v)).eq('user_id', user.id);
    if (error) throw error;
    try { localStorage.setItem(CLE_APPAREIL, JSON.stringify({ label: v.label, country: v.pays, lat: v.lat, lon: v.lon })); } catch { /* */ }
    void enregistrerVillePriere(user.id, { label: v.label, country: v.pays, lat: v.lat, lon: v.lon }, getSavedMethod().id);
    await queryClient.invalidateQueries({ queryKey: ['ma-ville'] });
  };
}
