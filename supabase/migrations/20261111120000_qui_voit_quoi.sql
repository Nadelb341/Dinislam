-- 2026-11-11 — 🗂️ « Qui voit quoi » (maquette A + 10 idées gardées par Nadia).
-- 1) Une carte peut s'ouvrir à des groupes ET à des élèves en même temps (type 'mixed') : la règle devient
--    « hors 'all' → ouverte si l'élève est dans user_ids OU dans un des groupes de group_ids ».
--    Les lignes existantes ('users' : groupes vides ; 'groups' : élèves vides) gardent exactement le même effet.
-- 2) Ouverture programmée : la carte n'est ouverte qu'entre ouverte_du et ouverte_jusquau (si remplis).
-- 3) Journal « qui a ouvert quoi, et quand » (écrit par l'appli et par la tâche planifiée).
-- 4) Tâche planifiée toutes les 15 min : annonce aux élèves les cartes dont l'ouverture programmée vient d'arriver.

alter table public.learning_modules add column if not exists ouverte_du timestamptz;
alter table public.learning_modules add column if not exists ouverte_jusquau timestamptz;
alter table public.learning_modules add column if not exists ouverture_annoncee_le timestamptz;

alter table public.module_visibility drop constraint if exists valid_visibility_type;
alter table public.module_visibility add constraint valid_visibility_type check (visibility_type in ('all', 'users', 'groups', 'mixed'));

-- LA règle côté serveur (même règle que src/lib/cartesAcces.ts › carteOuverte)
create or replace function public.carte_visible_pour(p_module uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select (m.ouverte_du is null or m.ouverte_du <= now())
       and (m.ouverte_jusquau is null or m.ouverte_jusquau > now())
       and case
         when v.visibility_type is null or v.visibility_type = 'all' then coalesce(m.is_active, false)
         else p_user = any(coalesce(v.user_ids, '{}'))
           or exists (select 1 from student_group_members g where g.user_id = p_user and g.group_id = any(coalesce(v.group_ids, '{}')))
       end
    from learning_modules m left join module_visibility v on v.module_id = m.id
    where m.id = p_module), false);
$$;

create or replace function public.module_visible_for(p_path text, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select public.carte_visible_pour(m.id, p_user) from learning_modules m where m.builtin_path = p_path limit 1), false);
$$;

-- Élèves (rôle élève, inscription validée) qui voient une carte maintenant — pour la tâche planifiée
create or replace function public.eleves_qui_voient(p_module uuid)
returns setof uuid language sql stable security definer set search_path = public as $$
  select p.user_id from profiles p
  where p.is_approved and exists (select 1 from user_roles r where r.user_id = p.user_id and r.role = 'student')
    and public.carte_visible_pour(p_module, p.user_id);
$$;
revoke execute on function public.eleves_qui_voient(uuid) from public, anon, authenticated;

create table if not exists public.cartes_journal (
  id uuid primary key default gen_random_uuid(),
  cree_le timestamptz not null default now(),
  module_id uuid references public.learning_modules(id) on delete cascade,
  carte text not null,
  quoi text not null,
  par uuid default auth.uid()
);
create index if not exists cartes_journal_cree_le on public.cartes_journal (cree_le desc);
alter table public.cartes_journal enable row level security;
drop policy if exists cartes_journal_admin on public.cartes_journal;
create policy cartes_journal_admin on public.cartes_journal for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cartes_journal') then
    alter publication supabase_realtime add table public.cartes_journal;
  end if;
end $$;

-- Tâche planifiée : on recopie l'appel de la tâche des rappels de devoirs (aucune clé écrite ici, dépôt public)
do $$
declare c text;
begin
  select command into c from cron.job where jobname = 'dinislam-homework-reminders';
  if c is null then raise exception 'tâche modèle introuvable'; end if;
  perform cron.unschedule(jobid) from cron.job where jobname = 'dinislam-cartes-programmees';
  perform cron.schedule('dinislam-cartes-programmees', '*/15 * * * *', replace(c, '/functions/v1/homework-reminders', '/functions/v1/cartes-programmees'));
end $$;
