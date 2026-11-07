-- 🧹 Audit ZAT du 2026-11-07 — idées 17 et 20
-- 17 : le journal interne des tâches automatiques (cron.job_run_details, 41 Mo sur 65) ne garde que 7 jours.
--      (journal technique de la base, affiché nulle part dans l'appli)
-- 20 : historiques des connexions et des notifications gardés 13 mois (les courbes montrent 12 mois) ;
--      au-delà, ils partent dans la corbeille de l'enseignante (jamais vidée toute seule), restaurables.

create policy "Admins can restore connexion logs" on public.connexion_logs
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'::app_role));

create or replace function public.nettoyage_historiques()
returns text language plpgsql security definer set search_path = public, cron as $$
declare v_admin uuid; v_limite timestamptz := now() - interval '13 months'; n_cron int; n_cx int; n_nh int; v_rows jsonb;
begin
  delete from cron.job_run_details where end_time < now() - interval '7 days';
  get diagnostics n_cron = row_count;

  select user_id into v_admin from user_roles where role = 'admin' order by user_id limit 1;
  if v_admin is null then return 'pas d''admin'; end if;

  select jsonb_agg(to_jsonb(c)), count(*) into v_rows, n_cx from connexion_logs c where created_at < v_limite;
  if n_cx > 0 then
    insert into trash_items (user_id, item_type, item_data, original_id, label)
    values (v_admin, 'connexion_logs', v_rows, 'avant-' || to_char(v_limite, 'YYYY-MM-DD'),
            'Historique des connexions de plus de 13 mois (' || n_cx || ')');
    delete from connexion_logs where created_at < v_limite;
  end if;

  select jsonb_agg(to_jsonb(h)), count(*) into v_rows, n_nh from notification_history h where created_at < v_limite;
  if n_nh > 0 then
    insert into trash_items (user_id, item_type, item_data, original_id, label)
    values (v_admin, 'notification_history', v_rows, 'avant-' || to_char(v_limite, 'YYYY-MM-DD'),
            'Historique des notifications de plus de 13 mois (' || n_nh || ')');
    delete from notification_history where created_at < v_limite;
  end if;

  return format('journal cron : %s, connexions : %s, notifications : %s', n_cron, n_cx, n_nh);
end $$;
revoke all on function public.nettoyage_historiques() from public, anon, authenticated;

select cron.unschedule('dinislam-nettoyage-historiques') where exists (select 1 from cron.job where jobname = 'dinislam-nettoyage-historiques');
select cron.schedule('dinislam-nettoyage-historiques', '30 2 * * *', 'select public.nettoyage_historiques()');
