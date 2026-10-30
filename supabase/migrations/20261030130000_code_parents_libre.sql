-- 🔐 Code parents libre (2026-10-30) : plus de « 6 chiffres » obligatoires
CREATE OR REPLACE FUNCTION public.parent_code_create(p_child uuid, p_label text, p_code text, p_current text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE n int;
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  -- Code libre (2026-10-30, demande de Nadia) : lettres et/ou chiffres, minuscules et/ou majuscules, sans longueur imposée
  IF p_code IS NULL OR length(p_code) < 1 OR length(p_code) > 60 THEN RAISE EXCEPTION 'Écrivez un code (60 caractères au plus)'; END IF;
  IF COALESCE(btrim(p_label), '') = '' THEN RAISE EXCEPTION 'Indiquez qui crée le code (ex. Maman)'; END IF;
  SELECT count(*) INTO n FROM parent_codes WHERE child_id = p_child;
  IF n >= 2 THEN RAISE EXCEPTION 'Il y a déjà 2 codes pour cet enfant'; END IF;
  -- Un 2e code ne peut être créé que par quelqu'un qui connaît déjà le 1er
  IF n > 0 AND (p_current IS NULL OR public.parent_code_label(p_child, p_current) IS NULL) THEN RAISE EXCEPTION 'Code actuel incorrect'; END IF;
  INSERT INTO parent_codes (child_id, label, code_hash, created_by) VALUES (p_child, btrim(p_label), extensions.crypt(p_code, extensions.gen_salt('bf')), auth.uid());
  RETURN btrim(p_label);
END $function$
;
