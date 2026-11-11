-- 2026-11-11 — 📨 Convocations (choix de Nadia : organisation A « tableau des groupes », envoi A = gratuit, 9 idées gardées).
-- Gratuit : la convocation part toute seule DANS L'APPLI (notification + carte « Je viens / Absent ») ;
-- WhatsApp et SMS = 1 appui de Nadia (message déjà écrit). Numéros : profiles.phone / parent_phone / parent2_phone (admin + l'élève seulement).

-- Modèles de messages (ajouter / modifier / supprimer → corbeille)
create table if not exists public.convocation_modeles (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  texte text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.convocation_modeles enable row level security;
drop policy if exists convocation_modeles_admin on public.convocation_modeles;
create policy convocation_modeles_admin on public.convocation_modeles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

insert into public.convocation_modeles (titre, texte, position)
select * from (values
  ('📨 Convocation', E'Salam {prénom},\nTu as cours {jour} à {heure} ({groupe}).\nÀ très vite in shaa Allah 🤲', 0),
  ('❌ Cours annulé', E'Salam {prénom},\nLe cours de {jour} à {heure} ({groupe}) est annulé.\nOn se retrouve la semaine suivante in shaa Allah.', 1),
  ('🔁 Rattrapage', E'Salam {prénom},\nUn cours de rattrapage est prévu {jour} à {heure}.\nMerci de prévenir si tu ne peux pas venir.', 2),
  ('🎒 Matériel', E'Salam {prénom},\nN''oublie pas ton cahier et ta trousse pour le cours de {jour} à {heure} 📚', 3)
) v(titre, texte, position)
where not exists (select 1 from public.convocation_modeles);

-- Programmations : chaque semaine, tel jour à telle heure, pour tout le monde / des groupes / des élèves
create table if not exists public.convocation_programmations (
  id uuid primary key default gen_random_uuid(),
  actif boolean not null default true,
  jour smallint not null check (jour between 1 and 7),          -- comme group_schedules : 1 = lundi … 3 = mercredi … 7 = dimanche
  heure time not null,
  cible text not null default 'groupes' check (cible in ('tous', 'groupes', 'eleves')),
  group_ids uuid[] not null default '{}',
  student_ids uuid[] not null default '{}',
  texte text not null,
  sauter_vacances boolean not null default true,
  rappel_veille boolean not null default false,
  dernier_envoi date,
  dernier_rappel date,
  created_at timestamptz not null default now()
);
alter table public.convocation_programmations enable row level security;
drop policy if exists convocation_programmations_admin on public.convocation_programmations;
create policy convocation_programmations_admin on public.convocation_programmations for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Historique + réponses (« Je viens » / « Absent »)
create table if not exists public.convocations (
  id uuid primary key default gen_random_uuid(),
  envoi_id uuid not null,
  student_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid references public.student_groups(id) on delete set null,
  cours_le timestamptz,
  texte text not null,
  canal text not null check (canal in ('appli', 'whatsapp', 'sms', 'copie', 'rappel')),
  destinataire text,
  programmation_id uuid references public.convocation_programmations(id) on delete set null,
  envoye_le timestamptz not null default now(),
  reponse text check (reponse in ('je_viens', 'absent')),
  repondu_le timestamptz
);
create index if not exists convocations_student on public.convocations (student_id, envoye_le desc);
create index if not exists convocations_envoye on public.convocations (envoye_le desc);
alter table public.convocations enable row level security;
drop policy if exists convocations_admin on public.convocations;
create policy convocations_admin on public.convocations for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
-- L'élève (et ses parents reliés) lit SES convocations ; il ne les modifie que par la fonction ci-dessous
drop policy if exists convocations_eleve_lecture on public.convocations;
create policy convocations_eleve_lecture on public.convocations for select to authenticated
  using (student_id = auth.uid() or exists (select 1 from public.parent_links l where l.child_id = convocations.student_id and l.parent_id = auth.uid()));

-- Réponse de l'élève : « Absent » arrive directement dans « Absences signalées par les parents »
create or replace function public.repondre_convocation(p_id uuid, p_reponse text)
returns void language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if p_reponse not in ('je_viens', 'absent') then raise exception 'réponse inconnue'; end if;
  select * into c from convocations where id = p_id
    and (student_id = auth.uid() or exists (select 1 from parent_links l where l.child_id = convocations.student_id and l.parent_id = auth.uid()));
  if not found then raise exception 'convocation introuvable'; end if;
  update convocations set reponse = p_reponse, repondu_le = now() where id = p_id;
  if p_reponse = 'absent' and c.cours_le is not null then
    insert into absence_justifications (student_id, course_date, reason, declared_by, declared_label)
    select c.student_id, (c.cours_le at time zone 'Europe/Paris')::date, 'Absent (réponse à la convocation)', auth.uid(),
           case when auth.uid() = c.student_id then 'Élève' else 'Parent' end
    where not exists (select 1 from absence_justifications a where a.student_id = c.student_id and a.course_date = (c.cours_le at time zone 'Europe/Paris')::date);
  end if;
end $$;
revoke execute on function public.repondre_convocation(uuid, text) from public, anon;
grant execute on function public.repondre_convocation(uuid, text) to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'convocations') then
    alter publication supabase_realtime add table public.convocations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'convocation_modeles') then
    alter publication supabase_realtime add table public.convocation_modeles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'convocation_programmations') then
    alter publication supabase_realtime add table public.convocation_programmations;
  end if;
end $$;

-- Tâche planifiée : toutes les 15 minutes (appel recopié de la tâche des devoirs, aucune clé ici)
do $$
declare c text;
begin
  select command into c from cron.job where jobname = 'dinislam-homework-reminders';
  if c is null then raise exception 'tâche modèle introuvable'; end if;
  perform cron.unschedule(jobid) from cron.job where jobname = 'dinislam-convocations';
  perform cron.schedule('dinislam-convocations', '*/15 * * * *', replace(c, '/functions/v1/homework-reminders', '/functions/v1/convocations-programmees'));
end $$;
