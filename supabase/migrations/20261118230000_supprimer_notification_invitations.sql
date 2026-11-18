-- 2026-11-18 — Accord de Nadia : la table des invitations « 🔔 Relancer » ne sert plus (bandeau rouge permanent
-- BandeauActivation + bouton WhatsApp dans bouclier › Notifications). Aucun code, fonction, vue ni déclencheur ne la lit.
-- Ses 25 lignes sont gardées en JSON dans _archives/notification_invitations_2026-11-18.json (non versionné).
do $$ begin
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notification_invitations') then
    alter publication supabase_realtime drop table public.notification_invitations;
  end if;
end $$;
drop table if exists public.notification_invitations;
