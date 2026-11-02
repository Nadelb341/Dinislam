-- ✏️ Modifier son code parents (2026-11-02, demande de Nadia, choix A + « modifié le » + Espace gardé ouvert)
-- Pour changer le code « Maman », il faut l'ancien code de Maman : Papa ne peut pas changer le code de Maman sans le connaître.
ALTER TABLE public.parent_codes ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE OR REPLACE FUNCTION public.parent_code_change(p_child uuid, p_label text, p_old text, p_new text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE r parent_codes%ROWTYPE;
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_new IS NULL OR length(p_new) < 1 OR length(p_new) > 60 THEN RAISE EXCEPTION 'Écrivez un nouveau code (60 caractères au plus)'; END IF;
  SELECT * INTO r FROM parent_codes WHERE child_id = p_child AND label = p_label;
  IF NOT FOUND THEN RAISE EXCEPTION 'Code introuvable'; END IF;
  IF p_old IS NULL OR r.code_hash <> extensions.crypt(p_old, r.code_hash) THEN
    PERFORM pg_sleep(0.5); -- freine les essais au hasard
    RAISE EXCEPTION 'Ancien code incorrect';
  END IF;
  UPDATE parent_codes SET code_hash = extensions.crypt(p_new, extensions.gen_salt('bf')), updated_at = now() WHERE id = r.id;
  RETURN r.label;
END $function$;
REVOKE ALL ON FUNCTION public.parent_code_change(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.parent_code_change(uuid, text, text, text) TO authenticated;

-- Infos pour la fenêtre « Codes parents » : qui a un code, créé / modifié quand (jamais le code lui-même)
CREATE OR REPLACE FUNCTION public.parent_space_info(p_child uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN jsonb_build_object(
    'labels', COALESCE((SELECT jsonb_agg(label ORDER BY created_at) FROM parent_codes WHERE child_id = p_child), '[]'::jsonb),
    'codes', COALESCE((SELECT jsonb_agg(jsonb_build_object('label', label, 'created_at', created_at, 'updated_at', updated_at) ORDER BY created_at)
                       FROM parent_codes WHERE child_id = p_child), '[]'::jsonb));
END $$;

-- 🔄 En direct : la fiche élève de l'admin voit tout de suite un code créé / modifié / remis à zéro
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'parent_codes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_codes;
  END IF;
END $$;
