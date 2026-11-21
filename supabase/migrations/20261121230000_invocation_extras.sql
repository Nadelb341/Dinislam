-- ✏️ Invocations (2026-11-21, proposition 12 du crayon) : « Vertu », « À savoir » et la vidéo écrits dans le code
-- deviennent modifiables. Vide (null) = texte de départ ; texte vide '' = caché ; masquer_video = la vidéo de départ n'est plus montrée.
create table if not exists public.invocation_extras (
  invocation_id integer primary key references public.invocations(id) on delete cascade,
  vertu text,
  a_savoir text,
  masquer_video boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.invocation_extras enable row level security;
drop policy if exists "invocation_extras_lecture" on public.invocation_extras;
create policy "invocation_extras_lecture" on public.invocation_extras for select to authenticated using (true);
drop policy if exists "invocation_extras_admin" on public.invocation_extras;
create policy "invocation_extras_admin" on public.invocation_extras for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'invocation_extras') then
    alter publication supabase_realtime add table public.invocation_extras;
  end if;
end $$;
