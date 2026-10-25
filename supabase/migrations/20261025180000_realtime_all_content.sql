-- « Tout changement visible EN DIRECT » (règle de Nadia, 2026-10-25) : les 57 tables lues par l'appli
-- qui n'étaient pas encore dans la publication supabase_realtime. Écoutées par un seul composant
-- (src/components/RealtimeSync.tsx, liste dans src/lib/realtimeSync.ts).
-- Lecture déjà protégée par la RLS de chaque table (chacun ne reçoit que ce qu'il a le droit de lire).
-- Volontairement absentes : app_logs, crash_alert_settings, push_subscriptions, student_passwords (sensible),
-- user_roles, encouragement_logs, dropout_state, notification_confirmations, notification_invitations,
-- admin_conversations (historique privé de l'assistant 🌙, réécrit à chaque message).
-- Idempotent : une table déjà présente est ignorée.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admin_card_order', 'admin_task_templates', 'admin_tasks', 'alphabet_admin_unlocks',
    'alphabet_content', 'alphabet_game_scores', 'alphabet_letters', 'alphabet_line_models',
    'alphabet_trace_stars', 'app_versions', 'attendance_sessions', 'dashboard_card_visibility',
    'dashboard_cards', 'devoirs', 'homework_submissions', 'invocation_content',
    'invocations', 'module_card_content', 'module_cards', 'module_content',
    'module_flashcards', 'module_visibility', 'notification_preferences', 'nourania_lesson_content',
    'nourania_lessons', 'parent_lock_settings', 'point_settings', 'prayer_card_content',
    'prayer_cards', 'prayer_categories', 'quiz_responses', 'ramadan_day_activities',
    'ramadan_day_exceptions', 'ramadan_day_videos', 'ramadan_days', 'ramadan_quizzes',
    'ramadan_settings', 'scheduled_notifications', 'school_holidays', 'sourate_admin_unlocks',
    'sourate_versets_audio', 'sourates', 'student_group_members', 'student_groups',
    'trash_items', 'user_allah_name_progress', 'user_alphabet_progress', 'user_daily_prayers',
    'user_flashcard_learned', 'user_nourania_progress', 'user_prayer_progress', 'user_ramadan_fasting',
    'user_ramadan_progress', 'user_ramadan_video_watched', 'user_sourate_verse_progress', 'weekly_program_settings',
    'weekly_programs'
  ] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
