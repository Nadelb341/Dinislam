-- 🌟 Audit ZAT du 2026-11-07 — idée 19 : 50 questions par jour et par élève à la mascotte, comptées EN BASE
-- (avant : seulement 10 par minute, gardé dans la mémoire de la fonction, qui repart de zéro à chaque redémarrage)
create table if not exists public.mascotte_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  jour date not null,
  questions int not null default 0,
  primary key (user_id, jour)
);
alter table public.mascotte_usage enable row level security;
create policy "Admin lit l'usage de la mascotte" on public.mascotte_usage for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));

-- Compte une question et rend le total du jour (heure de Paris). Appelée seulement par la fonction serveur.
create or replace function public.mascotte_compter(p_user uuid)
returns int language sql security definer set search_path = public as $$
  insert into mascotte_usage (user_id, jour, questions)
  values (p_user, (now() at time zone 'Europe/Paris')::date, 1)
  on conflict (user_id, jour) do update set questions = mascotte_usage.questions + 1
  returning questions;
$$;
revoke all on function public.mascotte_compter(uuid) from public, anon, authenticated;
grant execute on function public.mascotte_compter(uuid) to service_role;
