-- Corbeille des élèves : vidage automatique à 2 mois + alerte 3 jours avant (demande de Nadia du 2026-09-30)
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname = 'dinislam-trash-maintenance';
-- Chaque jour à 9 h UTC (10 h ou 11 h à Paris : jamais pendant le mode calme)
SELECT cron.schedule('dinislam-trash-maintenance', '0 9 * * *', $$
  SELECT net.http_post(
    url := 'https://zgnxqhfcmdonvdxqpekl.supabase.co/functions/v1/trash-maintenance',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbnhxaGZjbWRvbnZkeHFwZWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTQ3NTgsImV4cCI6MjEwNjI5MDc1OH0.F79Qws-3I-jUxGXC_sWCd20B3h8tmdcsT-_q_uMRgxo', 'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbnhxaGZjbWRvbnZkeHFwZWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTQ3NTgsImV4cCI6MjEwNjI5MDc1OH0.F79Qws-3I-jUxGXC_sWCd20B3h8tmdcsT-_q_uMRgxo'),
    body := '{}'::jsonb
  );
$$);
