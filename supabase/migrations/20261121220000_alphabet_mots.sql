-- ✏️ Mots exemples de l'Alphabet modifiables par Nadia (2026-11-21, proposition 9 du crayon).
-- Une ligne = le mot choisi pour une lettre ; sans ligne, l'appli garde le mot de départ (src/data/alphabetWords.ts).
create table if not exists public.alphabet_mots (
  lettre text primary key,
  word text not null,
  tr text,
  fr text,
  emoji text,
  updated_at timestamptz not null default now()
);
alter table public.alphabet_mots enable row level security;
drop policy if exists "alphabet_mots_lecture" on public.alphabet_mots;
create policy "alphabet_mots_lecture" on public.alphabet_mots for select to authenticated using (true);
drop policy if exists "alphabet_mots_admin" on public.alphabet_mots;
create policy "alphabet_mots_admin" on public.alphabet_mots for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alphabet_mots') then
    alter publication supabase_realtime add table public.alphabet_mots;
  end if;
end $$;
