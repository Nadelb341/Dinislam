-- 🔤 Alphabet en 3 onglets (Nadia, 2026-11-21) : « Alphabet arabe » · « Particularités » · « Pour les tout-petits ».
-- Tout est additif (nouvelles tables), rien n'est modifié ni supprimé.

-- 1) Qui voit chaque onglet (même logique que « Qui voit » des cartes : tous / certains / personne)
create table if not exists public.alphabet_onglets (
  cle text primary key check (cle in ('arabe', 'particularites', 'petits')),
  mode text not null default 'tous' check (mode in ('tous', 'certains', 'personne')),
  group_ids uuid[] not null default '{}',
  user_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.alphabet_onglets enable row level security;
drop policy if exists "alphabet_onglets_lecture" on public.alphabet_onglets;
create policy "alphabet_onglets_lecture" on public.alphabet_onglets for select to authenticated using (true);
drop policy if exists "alphabet_onglets_admin" on public.alphabet_onglets;
create policy "alphabet_onglets_admin" on public.alphabet_onglets for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Réglages de départ demandés par Nadia :
--  • tout-petits : seulement le Groupe 0 ;
--  • alphabet arabe : tous les autres groupes (+ les élèves sans groupe, pour que personne ne perde l'accès) ;
--  • particularités : personne (Nadia l'ouvre à ceux qui ont terminé l'alphabet).
insert into public.alphabet_onglets (cle, mode, group_ids, user_ids)
select 'petits', 'certains', coalesce(array_agg(id), '{}'), '{}' from public.student_groups where name ilike 'Groupe 0%'
on conflict (cle) do nothing;
insert into public.alphabet_onglets (cle, mode, group_ids, user_ids)
select 'arabe', 'certains',
  coalesce((select array_agg(id) from public.student_groups where name not ilike 'Groupe 0%'), '{}'),
  coalesce((select array_agg(r.user_id) from public.user_roles r where r.role = 'student'
            and not exists (select 1 from public.student_group_members m where m.user_id = r.user_id)), '{}')
on conflict (cle) do nothing;
insert into public.alphabet_onglets (cle, mode) values ('particularites', 'personne') on conflict (cle) do nothing;

-- 2) Particularités : des tuiles (titre, titre arabe, emoji, couleur, vidéo du haut) + des zones de contenu modifiables
create table if not exists public.alphabet_particularites (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  titre_arabe text,
  emoji text,
  couleur text,
  video_url text,
  video_type text check (video_type in ('video', 'youtube')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.alphabet_particularite_blocs (
  id uuid primary key default gen_random_uuid(),
  particularite_id uuid not null references public.alphabet_particularites(id) on delete cascade,
  kind text not null check (kind in ('texte', 'image', 'video', 'youtube', 'pdf', 'audio')),
  texte text,
  url text,
  nom text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists alphabet_particularite_blocs_parent on public.alphabet_particularite_blocs (particularite_id, position);

-- 3) Tout-petits : les vidéos (« le monde des houroufs ») de chaque lettre
create table if not exists public.alphabet_petits_videos (
  id uuid primary key default gen_random_uuid(),
  letter_id integer not null references public.alphabet_letters(id) on delete cascade,
  url text not null,
  type text not null default 'video' check (type in ('video', 'youtube')),
  nom text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists alphabet_petits_videos_lettre on public.alphabet_petits_videos (letter_id, position);

do $$
declare t text;
begin
  foreach t in array array['alphabet_particularites', 'alphabet_particularite_blocs', 'alphabet_petits_videos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_lecture', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_lecture', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.has_role(auth.uid(), ''admin''::public.app_role)) with check (public.has_role(auth.uid(), ''admin''::public.app_role))', t || '_admin', t);
  end loop;
end $$;

-- En direct (realtimeSync.ts)
do $$
declare t text;
begin
  foreach t in array array['alphabet_onglets', 'alphabet_particularites', 'alphabet_particularite_blocs', 'alphabet_petits_videos'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- 4) La base des particularités (Nadia peut tout modifier, ajouter, supprimer depuis l'appli)
do $$
declare p uuid;
begin
  if exists (select 1 from public.alphabet_particularites) then return; end if;

  insert into public.alphabet_particularites (titre, titre_arabe, emoji, couleur, position) values ('Les voyelles courtes', 'الحَرَكَات', '🔤', 'sky', 10) returning id into p;
  insert into public.alphabet_particularite_blocs (particularite_id, kind, texte, position) values (p, 'texte',
    'Trois petits signes posés sur ou sous la lettre donnent son son : la fatha « a » (بَ ba), la kasra « i » (بِ bi) et la damma « ou » (بُ bou).', 0);

  insert into public.alphabet_particularites (titre, titre_arabe, emoji, couleur, position) values ('Le soukoune', 'السُّكُون', '⭕', 'rose', 20) returning id into p;
  insert into public.alphabet_particularite_blocs (particularite_id, kind, texte, position) values (p, 'texte',
    'Le petit rond posé sur une lettre : elle n''a pas de voyelle, on la prononce sans son après. Exemple : مِنْ (min).', 0);

  insert into public.alphabet_particularites (titre, titre_arabe, emoji, couleur, position) values ('La chadda', 'الشَّدَّة', '✌️', 'indigo', 30) returning id into p;
  insert into public.alphabet_particularite_blocs (particularite_id, kind, texte, position) values (p, 'texte',
    'Le petit « w » posé sur une lettre : la lettre est doublée, on appuie dessus deux fois. Exemple : رَبّ (rabb).', 0);

  insert into public.alphabet_particularites (titre, titre_arabe, emoji, couleur, position) values ('Le tanouine', 'التَّنْوِين', '🎵', 'amber', 40) returning id into p;
  insert into public.alphabet_particularite_blocs (particularite_id, kind, texte, position) values (p, 'texte',
    'La voyelle doublée à la fin d''un mot : on ajoute le son « n ». ـً = an, ـٍ = in, ـٌ = oun. Exemple : كِتَابٌ (kitâboun).', 0);

  insert into public.alphabet_particularites (titre, titre_arabe, emoji, couleur, position) values ('Les voyelles longues (madd)', 'المَدّ', '〰️', 'emerald', 50) returning id into p;
  insert into public.alphabet_particularite_blocs (particularite_id, kind, texte, position) values (p, 'texte',
    'On étire le son pendant 2 temps : ا après une fatha (بَا bâ), ي après une kasra (بِي bî), و après une damma (بُو boû).', 0);

  insert into public.alphabet_particularites (titre, titre_arabe, emoji, couleur, position) values ('La hamza', 'الهَمْزَة', '✋', 'violet', 60) returning id into p;
  insert into public.alphabet_particularite_blocs (particularite_id, kind, texte, position) values (p, 'texte',
    'Le petit ء : un arrêt bref dans la voix. Elle se pose sur un alif (أ إ), un waw (ؤ), un ya sans points (ئ), ou toute seule (ء).', 0);

  insert into public.alphabet_particularites (titre, titre_arabe, emoji, couleur, position) values ('Le tâ marbouta', 'التَّاء المَرْبُوطَة', '🎀', 'pink', 70) returning id into p;
  insert into public.alphabet_particularite_blocs (particularite_id, kind, texte, position) values (p, 'texte',
    'Le ة à la fin d''un mot : on le lit « t » quand on continue, et « h » quand on s''arrête. Exemple : مَدْرَسَة (madrasa).', 0);

  insert into public.alphabet_particularites (titre, titre_arabe, emoji, couleur, position) values ('L''alif maqsoura', 'الأَلِف المَقْصُورَة', '🌙', 'teal', 80) returning id into p;
  insert into public.alphabet_particularite_blocs (particularite_id, kind, texte, position) values (p, 'texte',
    'Le ى à la fin d''un mot ressemble à un ya sans points : il se lit « â » long. Exemple : مُوسَى (Moûsâ).', 0);

  insert into public.alphabet_particularites (titre, titre_arabe, emoji, couleur, position) values ('Le lam-alif', 'لا', '🤝', 'orange', 90) returning id into p;
  insert into public.alphabet_particularite_blocs (particularite_id, kind, texte, position) values (p, 'texte',
    'Quand le lam est suivi d''un alif, les deux lettres s''attachent d''une façon spéciale : لا (lâ).', 0);

  insert into public.alphabet_particularites (titre, titre_arabe, emoji, couleur, position) values ('Les lettres solaires', 'الحُرُوف الشَّمْسِيَّة', '☀️', 'yellow', 100) returning id into p;
  insert into public.alphabet_particularite_blocs (particularite_id, kind, texte, position) values (p, 'texte',
    'Après « ال », le lam ne se prononce pas : la lettre suivante prend une chadda. Exemple : الشَّمْس (ach-chams).', 0);

  insert into public.alphabet_particularites (titre, titre_arabe, emoji, couleur, position) values ('Les lettres lunaires', 'الحُرُوف القَمَرِيَّة', '🌕', 'slate', 110) returning id into p;
  insert into public.alphabet_particularite_blocs (particularite_id, kind, texte, position) values (p, 'texte',
    'Après « ال », le lam se prononce bien. Exemple : القَمَر (al-qamar).', 0);
end $$;
