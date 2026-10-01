-- Les espaces de contenu (lettres, invocations, modules, Nourania, sourates, versets, cartes Prière)
-- ne sont modifiables que par l'admin. Avant : tout élève connecté pouvait ajouter ou effacer des fichiers.
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['alphabet-content','invocation-content','module-cards','module-content','nourania-content','sourate-content','sourates-versets'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'auth_write_' || replace(b,'-','_'));
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'auth_delete_' || replace(b,'-','_'));
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'admin_manage_' || replace(b,'-','_'));
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR ALL TO authenticated USING (bucket_id = %L AND public.has_role(auth.uid(), ''admin''::public.app_role)) WITH CHECK (bucket_id = %L AND public.has_role(auth.uid(), ''admin''::public.app_role))', 'admin_manage_' || replace(b,'-','_'), b, b);
  END LOOP;
END $$;

-- Audios de messages : un élève n'envoie que dans son propre dossier, seul l'admin peut effacer
DROP POLICY IF EXISTS auth_write_messages_audio ON storage.objects;
DROP POLICY IF EXISTS auth_delete_messages_audio ON storage.objects;
DROP POLICY IF EXISTS own_write_messages_audio ON storage.objects;
DROP POLICY IF EXISTS admin_manage_messages_audio ON storage.objects;
CREATE POLICY own_write_messages_audio ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'messages-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY admin_manage_messages_audio ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'messages-audio' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'messages-audio' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Devoirs audio : déjà limité au dossier de l'élève par "Users can upload own audio" ; la règle ouverte est retirée
DROP POLICY IF EXISTS auth_upload_devoirs_audio ON storage.objects;

-- Cartes Prière : l'espace n'avait jamais été créé (l'envoi d'un fichier échouait)
INSERT INTO storage.buckets (id, name, public) VALUES ('prayer-cards', 'prayer-cards', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS admin_manage_prayer_cards ON storage.objects;
CREATE POLICY admin_manage_prayer_cards ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'prayer-cards' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'prayer-cards' AND public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS public_read_prayer_cards ON storage.objects;
CREATE POLICY public_read_prayer_cards ON storage.objects FOR SELECT USING (bucket_id = 'prayer-cards');
