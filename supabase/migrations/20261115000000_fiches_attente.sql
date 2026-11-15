-- 2026-11-15 — 🗂️ Fiches en attente d'inscription (demande de Nadia) : des élèves ou parents de ses cours qui n'ont pas
-- encore de compte. À chaque nouvelle inscription, l'appli PROPOSE à Nadia de relier le compte à une fiche (prénom proche) :
-- ✅ relier (numéros, groupe, lien parent copiés dans le compte) ou ✖️ refuser (c'est un nouvel élève, la fiche reste).
-- Données visibles et modifiables par l'admin SEULEMENT (numéros de téléphone d'enfants et de parents).
create table if not exists public.fiches_attente (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text,
  role text not null default 'eleve' check (role in ('eleve', 'parent', 'eleve_parent')),
  telephone text,
  group_ids uuid[] not null default '{}',
  -- Parent déjà inscrit (compte) et/ou parent sans compte (prénom + numéro)
  parent_user_id uuid references auth.users(id) on delete set null,
  parent_nom text,
  parent_telephone text,
  parent2_nom text,
  parent2_telephone text,
  enfants text,
  notes text,
  statut text not null default 'attente' check (statut in ('attente', 'reliee')),
  relie_a uuid references auth.users(id) on delete set null,
  relie_le timestamptz,
  -- Inscriptions pour lesquelles Nadia a répondu « non, ce n'est pas cette fiche »
  refus uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.fiches_attente enable row level security;
drop policy if exists fiches_attente_admin on public.fiches_attente;
create policy fiches_attente_admin on public.fiches_attente for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'fiches_attente') then
    alter publication supabase_realtime add table public.fiches_attente;
  end if;
end $$;

-- Les 10 fiches données par Nadia le 15/11 (Rayan, Yous, Maïssa, Chafia, Kamila, Khalissa, Saida, Latifa, Ines, Lilia) ont été
-- saisies DIRECTEMENT en base : les numéros de téléphone d'enfants et de parents ne doivent jamais être écrits dans le code.
