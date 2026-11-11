-- 2026-11-11 — 🔤 Alphabet lettre par lettre (maquette B de Nadia, bas « comme C » ; idées 2-7, 9, 10).
-- Une lettre peut être ouverte à un GROUPE entier : elle vaut aussi pour les élèves qui rejoindront ce groupe plus tard
-- (idée 2). Les déblocages élève par élève restent dans alphabet_admin_unlocks.
-- Comme ces déblocages : une lettre ouverte à la main reste ouverte mais n'ouvre PAS les suivantes.

create table if not exists public.alphabet_group_unlocks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.student_groups(id) on delete cascade,
  letter_id integer not null references public.alphabet_letters(id) on delete cascade,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (group_id, letter_id)
);
alter table public.alphabet_group_unlocks enable row level security;

drop policy if exists admin_all_alphabet_group_unlocks on public.alphabet_group_unlocks;
create policy admin_all_alphabet_group_unlocks on public.alphabet_group_unlocks for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- L'élève lit seulement les lettres ouvertes à SES groupes
drop policy if exists student_read_own_group_alphabet_unlocks on public.alphabet_group_unlocks;
create policy student_read_own_group_alphabet_unlocks on public.alphabet_group_unlocks for select to authenticated
  using (exists (select 1 from public.student_group_members m where m.group_id = alphabet_group_unlocks.group_id and m.user_id = auth.uid()));

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alphabet_group_unlocks') then
    alter publication supabase_realtime add table public.alphabet_group_unlocks;
  end if;
end $$;
