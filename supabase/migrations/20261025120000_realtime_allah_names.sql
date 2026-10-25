-- « Partagé = mis à jour instantanément » (2026-10-25) : quand l'enseignante change l'audio, l'image ou le texte
-- d'un nom d'Allah, les élèves connectés le voient tout de suite. Lecture déjà ouverte à tous les connectés (RLS).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['allah_name_media', 'allah_names'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
