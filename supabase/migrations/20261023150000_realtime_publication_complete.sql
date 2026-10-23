-- Mises à jour en direct (2026-10-23) : depuis le passage à Supabase indépendant, la publication
-- supabase_realtime ne contenait que 9 tables. On y remet toutes les tables que le code écoute
-- (supabase.channel / postgres_changes). Sans elles, les écrans ne se mettaient pas à jour tout seuls.
do $$
declare t text;
begin
  foreach t in array array[
    'alphabet_submissions','attendance_records','connexion_logs','devoirs_rendus','homework_assignments',
    'invocation_validation_requests','learning_modules','notification_history','nourania_admin_unlocks',
    'nourania_commentaires_eleves','nourania_validation_requests','profiles','sourate_content',
    'sourate_recitations','sourate_validation_requests','student_ranking','user_invocation_progress',
    'user_messages','user_sourate_progress'
  ] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
