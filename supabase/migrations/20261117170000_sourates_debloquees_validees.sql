-- 📖 Sourate validée par l'enseignante dans « Gérer le contenu » = VRAIE validation chez l'élève (Nadia, 2026-11-17 :
--    « je voulais lui valider les sourates jusqu'à la 101 via mon compte… ce n'est pas normal que ce ne soit pas synchro !! »).
-- Avant : le bouton n'écrivait que dans sourate_admin_unlocks → l'élève voyait ces sourates ouvertes (dorées) et pas validées (vertes).
-- Maintenant : chaque ligne de sourate_admin_unlocks écrit la validation dans user_sourate_progress (contexte « sourates »),
-- marquée par_deblocage ; l'enlever (corbeille) retire SEULEMENT cette validation-là (jamais une validation faite par l'élève).

ALTER TABLE public.user_sourate_progress ADD COLUMN IF NOT EXISTS par_deblocage boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.sync_sourate_deblocage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (SELECT 1 FROM user_sourate_progress WHERE user_id = NEW.user_id AND sourate_id = NEW.sourate_id AND context = 'sourates') THEN
      UPDATE user_sourate_progress
         SET is_validated = true, is_memorized = true, progress_percentage = 100, validated_at = COALESCE(validated_at, now()), par_deblocage = true
       WHERE user_id = NEW.user_id AND sourate_id = NEW.sourate_id AND context = 'sourates' AND NOT is_validated;
    ELSE
      INSERT INTO user_sourate_progress (user_id, sourate_id, is_validated, is_memorized, progress_percentage, validated_at, context, par_deblocage)
      VALUES (NEW.user_id, NEW.sourate_id, true, true, 100, now(), 'sourates', true);
    END IF;
    RETURN NEW;
  END IF;
  -- DELETE : on retire seulement la validation venue du déblocage
  UPDATE user_sourate_progress SET is_validated = false, is_memorized = false, par_deblocage = false, validated_at = NULL
   WHERE user_id = OLD.user_id AND sourate_id = OLD.sourate_id AND context = 'sourates' AND par_deblocage;
  RETURN OLD;
END $function$;

DROP TRIGGER IF EXISTS sync_sourate_deblocage ON public.sourate_admin_unlocks;
CREATE TRIGGER sync_sourate_deblocage AFTER INSERT OR DELETE ON public.sourate_admin_unlocks
  FOR EACH ROW EXECUTE FUNCTION public.sync_sourate_deblocage();

-- Rattrapage : les sourates déjà débloquées deviennent validées chez l'élève
UPDATE public.user_sourate_progress p
   SET is_validated = true, is_memorized = true, progress_percentage = 100, validated_at = COALESCE(p.validated_at, u.created_at), par_deblocage = true
  FROM public.sourate_admin_unlocks u
 WHERE p.user_id = u.user_id AND p.sourate_id = u.sourate_id AND p.context = 'sourates' AND NOT p.is_validated;
INSERT INTO public.user_sourate_progress (user_id, sourate_id, is_validated, is_memorized, progress_percentage, validated_at, context, par_deblocage)
SELECT u.user_id, u.sourate_id, true, true, 100, u.created_at, 'sourates', true
  FROM public.sourate_admin_unlocks u
 WHERE NOT EXISTS (SELECT 1 FROM public.user_sourate_progress p WHERE p.user_id = u.user_id AND p.sourate_id = u.sourate_id AND p.context = 'sourates');
