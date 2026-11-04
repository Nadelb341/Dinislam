-- 📓 Cahier de texte par groupe (2026-11-04, choix de Nadia : proposition A + audio d'abord pour tous + réglages + idées 2, 3, 5, 6, 7, 8)
-- Tout est additif : aucune donnée existante n'est modifiée ni supprimée.

-- 1. Pièces jointes d'un devoir (documents, photos) + ligne personnalisée (« 🖍️ Coloriage »…)
alter table public.devoirs add column if not exists pieces_jointes jsonb not null default '[]'::jsonb;
alter table public.devoirs add column if not exists matiere_label text;
alter table public.devoirs add column if not exists matiere_emoji text;

-- 2. Idée 2 : l'élève répond aussi en photo
alter table public.devoirs_rendus add column if not exists photos jsonb not null default '[]'::jsonb;

-- 3. Stockage des documents et photos des devoirs (lecture pour tous, comme les audios des devoirs)
insert into storage.buckets (id, name, public, file_size_limit)
values ('devoirs-fichiers', 'devoirs-fichiers', true, 52428800)
on conflict (id) do nothing;
drop policy if exists "devoirs_fichiers_lecture" on storage.objects;
create policy "devoirs_fichiers_lecture" on storage.objects for select using (bucket_id = 'devoirs-fichiers');
drop policy if exists "devoirs_fichiers_admin" on storage.objects;
create policy "devoirs_fichiers_admin" on storage.objects for all to authenticated
  using (bucket_id = 'devoirs-fichiers' and public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (bucket_id = 'devoirs-fichiers' and public.has_role(auth.uid(), 'admin'::public.app_role));
-- Un élève ne dépose que dans SON dossier (photos de son travail)
drop policy if exists "devoirs_fichiers_eleve_depot" on storage.objects;
create policy "devoirs_fichiers_eleve_depot" on storage.objects for insert to authenticated
  with check (bucket_id = 'devoirs-fichiers' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Réglages d'un groupe : lignes du formulaire « Par matière » et nombre maximum de devoirs par semaine
create table if not exists public.group_devoir_settings (
  group_id uuid primary key references public.student_groups(id) on delete cascade,
  -- null = sans limite
  max_devoirs integer check (max_devoirs is null or max_devoirs between 1 and 30),
  -- [{key, type, emoji, label, actif}] ; [] = les matières habituelles
  lignes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.group_devoir_settings enable row level security;
drop policy if exists "admin_group_devoir_settings" on public.group_devoir_settings;
create policy "admin_group_devoir_settings" on public.group_devoir_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
-- Groupe 0 : Petits = 1 devoir par semaine par défaut (demande de Nadia)
insert into public.group_devoir_settings (group_id, max_devoirs)
select id, 1 from public.student_groups where name ilike 'groupe 0%' or name ilike '%petits%'
on conflict (group_id) do nothing;

-- 5. Idée 3 : qui a écouté la consigne / ouvert un document
create table if not exists public.devoir_vues (
  devoir_id uuid not null references public.devoirs(id) on delete cascade,
  student_id uuid not null,
  kind text not null check (kind in ('audio', 'document')),
  first_at timestamptz not null default now(),
  primary key (devoir_id, student_id, kind)
);
alter table public.devoir_vues enable row level security;
drop policy if exists "eleve_devoir_vues" on public.devoir_vues;
create policy "eleve_devoir_vues" on public.devoir_vues for insert to authenticated with check (student_id = auth.uid());
drop policy if exists "eleve_lit_devoir_vues" on public.devoir_vues;
create policy "eleve_lit_devoir_vues" on public.devoir_vues for select to authenticated
  using (student_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
drop policy if exists "admin_devoir_vues" on public.devoir_vues;
create policy "admin_devoir_vues" on public.devoir_vues for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6. Idée 6 : modèles de devoirs (avec leurs documents et leur consigne audio)
create table if not exists public.devoir_modeles (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  type text not null,
  matiere_label text,
  matiere_emoji text,
  ligne_key text,
  pieces_jointes jsonb not null default '[]'::jsonb,
  consigne_audio_url text,
  cible_id text,
  audio_requis boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now()
);
alter table public.devoir_modeles enable row level security;
drop policy if exists "admin_devoir_modeles" on public.devoir_modeles;
create policy "admin_devoir_modeles" on public.devoir_modeles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 7. En direct
do $$
declare t text;
begin
  foreach t in array array['group_devoir_settings', 'devoir_vues', 'devoir_modeles'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
