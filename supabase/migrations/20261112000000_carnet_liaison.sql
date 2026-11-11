-- 2026-11-12 — 📒 Carnet de liaison (choix de Nadia du 11/11 : liste A + écriture manuscrite de B + bandeau C qui se déplie,
-- et les 10 idées gardées). Gratuit : tout passe DANS L'APPLI (notification + carte) ; WhatsApp / SMS = 1 appui de Nadia.
--  · carnet_messages : un message (tout le monde / des groupes / des élèves), pièce jointe, épinglé, signature parent,
--    relance automatique, programmé (envoyer_le dans le futur = invisible pour les élèves jusque-là).
--  · carnet_lectures : « J'ai lu » (élève), « Vu par un parent » (signature), réponse courte (OK / question).
--  · carnet_modeles : modèles à ajouter / modifier / supprimer (→ corbeille).

create table if not exists public.carnet_messages (
  id uuid primary key default gen_random_uuid(),
  emoji text not null default '📒',
  titre text not null,
  texte text not null default '',
  cible text not null default 'tous' check (cible in ('tous', 'groupes', 'eleves')),
  group_ids uuid[] not null default '{}',
  student_ids uuid[] not null default '{}',
  piece_url text,
  piece_nom text,
  piece_type text,
  epingle boolean not null default false,
  signature boolean not null default false,
  relance boolean not null default true,
  envoyer_le timestamptz not null default now(),
  notifie_le timestamptz,
  relance_le timestamptz,
  auteur uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists carnet_messages_envoyer on public.carnet_messages (envoyer_le desc);

-- Ce message concerne-t-il cet élève ?
create or replace function public.carnet_vise(p_cible text, p_groupes uuid[], p_eleves uuid[], p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case p_cible
    when 'tous' then true
    when 'groupes' then exists (select 1 from student_group_members m where m.user_id = p_uid and m.group_id = any(p_groupes))
    else p_uid = any(p_eleves) end
$$;
revoke execute on function public.carnet_vise(text, uuid[], uuid[], uuid) from public, anon;
grant execute on function public.carnet_vise(text, uuid[], uuid[], uuid) to authenticated;

alter table public.carnet_messages enable row level security;
drop policy if exists carnet_messages_admin on public.carnet_messages;
create policy carnet_messages_admin on public.carnet_messages for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
-- L'élève (ou son parent relié) lit les messages qui le concernent, une fois l'heure d'envoi passée
drop policy if exists carnet_messages_lecture on public.carnet_messages;
create policy carnet_messages_lecture on public.carnet_messages for select to authenticated
  using (envoyer_le <= now() and (
    public.carnet_vise(cible, group_ids, student_ids, auth.uid())
    or exists (select 1 from public.parent_links l where l.parent_id = auth.uid() and public.carnet_vise(cible, group_ids, student_ids, l.child_id))));

create table if not exists public.carnet_lectures (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.carnet_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'eleve' check (role in ('eleve', 'parent')),
  lu_le timestamptz not null default now(),
  reponse text check (reponse in ('ok', 'question')),
  reponse_le timestamptz,
  unique (message_id, user_id, role)
);
create index if not exists carnet_lectures_message on public.carnet_lectures (message_id);
alter table public.carnet_lectures enable row level security;
drop policy if exists carnet_lectures_admin on public.carnet_lectures;
create policy carnet_lectures_admin on public.carnet_lectures for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
-- Chacun note SA lecture / SA signature, seulement sur un message qu'il peut lire
drop policy if exists carnet_lectures_moi on public.carnet_lectures;
create policy carnet_lectures_moi on public.carnet_lectures for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.carnet_messages m where m.id = message_id));

create table if not exists public.carnet_modeles (
  id uuid primary key default gen_random_uuid(),
  emoji text not null default '📒',
  titre text not null,
  texte text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.carnet_modeles enable row level security;
drop policy if exists carnet_modeles_admin on public.carnet_modeles;
create policy carnet_modeles_admin on public.carnet_modeles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

insert into public.carnet_modeles (emoji, titre, texte, position)
select * from (values
  ('🕌', 'Sortie', E'Salam,\nUne sortie est prévue le … Rendez-vous à … devant l''école.\nPensez à l''autorisation signée.', 0),
  ('🙏', 'Absence du professeur', E'Salam,\nJe serai absente le … : il n''y aura pas cours.\nOn se retrouve la semaine suivante in shaa Allah.', 1),
  ('🏖️', 'Vacances', E'Salam,\nBonnes vacances à tous ! Reprise des cours le … in shaa Allah.\nContinuez à réviser vos sourates 🤲', 2),
  ('🎒', 'Matériel', E'Salam,\nPensez à apporter votre cahier, votre trousse et votre livre Nourania 📚', 3),
  ('🌙', 'Ramadan', E'Salam,\nRamadan Moubarak à tous ! Pendant le mois, les cours ont lieu …', 4)
) v(emoji, titre, texte, position)
where not exists (select 1 from public.carnet_modeles);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'carnet_messages') then
    alter publication supabase_realtime add table public.carnet_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'carnet_lectures') then
    alter publication supabase_realtime add table public.carnet_lectures;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'carnet_modeles') then
    alter publication supabase_realtime add table public.carnet_modeles;
  end if;
end $$;
