import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Même connexion que `supabase`, sans le typage détaillé des tables. Réservé aux rares requêtes dont le
 * NOM DE TABLE est une variable (ex. « Rétrograder » qui vise 3 tables de progression) : le typage complet
 * de Supabase n'arrive pas à calculer ces cas. Partout ailleurs, utiliser `supabase` (colonnes vérifiées).
 */
export const untypedDb = supabase as unknown as SupabaseClient;
