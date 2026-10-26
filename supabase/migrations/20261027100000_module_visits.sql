-- 👁️ « Vu par N élèves cette semaine » dans le menu ⋮ des cartes de l'accueil (idée B de Nadia, 2026-10-27)
-- Une ligne par élève, par carte et par jour (pas de doublon), écrite quand l'élève ouvre la carte.
create table if not exists public.module_visits (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.learning_modules(id) on delete cascade,
  day date not null default ((now() at time zone 'Europe/Paris')::date),
  created_at timestamptz not null default now(),
  primary key (user_id, module_id, day)
);
alter table public.module_visits enable row level security;
create policy "own_insert_module_visits" on public.module_visits
  for insert to authenticated with check (user_id = auth.uid());
create policy "own_read_module_visits" on public.module_visits
  for select to authenticated using (user_id = auth.uid());
create policy "admin_read_module_visits" on public.module_visits
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));
create index if not exists module_visits_day_idx on public.module_visits (day);
alter publication supabase_realtime add table public.module_visits;
