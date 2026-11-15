-- 2026-11-15 — Demande de Nadia : chaque ligne Nourania cochée par un élève = une DEMANDE DE VALIDATION
-- (bouclier › ✅ Corrections › Nourania). Pas de correction, pas de « À refaire » : juste « Valider ».
-- Validée → la ligne est « éclaircie » chez l'élève (voile blanc + pastille plus claire). Rien n'est verrouillé : il peut la revoir.
-- Leçon validée (par n'importe quel chemin : demande, « Accès complet »…) → toutes ses lignes cochées sont validées d'office,
-- et l'appli éclaircit TOUTES les lignes d'une leçon validée (même celles jamais cochées).
alter table public.nourania_lignes_faites add column if not exists valide_le timestamptz;
alter table public.nourania_lignes_faites add column if not exists valide_par uuid references auth.users(id) on delete set null;
create index if not exists nourania_lignes_faites_a_valider on public.nourania_lignes_faites (created_at) where valide_le is null;

-- L'élève coche (jamais déjà validée) ; il ne peut décocher qu'une ligne PAS encore validée ; seule l'enseignante valide.
drop policy if exists nlf_ajout on public.nourania_lignes_faites;
create policy nlf_ajout on public.nourania_lignes_faites for insert to authenticated
  with check (user_id = auth.uid() and valide_le is null and valide_par is null);
drop policy if exists nlf_retrait on public.nourania_lignes_faites;
create policy nlf_retrait on public.nourania_lignes_faites for delete to authenticated
  using ((user_id = auth.uid() and valide_le is null) or public.has_role(auth.uid(), 'admin'::public.app_role));
drop policy if exists nlf_validation on public.nourania_lignes_faites;
create policy nlf_validation on public.nourania_lignes_faites for update to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Leçon validée → ses lignes en attente sont validées
create or replace function public.nourania_lecon_valide_lignes() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_validated is true then
    update public.nourania_lignes_faites set valide_le = now(), valide_par = coalesce(valide_par, auth.uid())
    where user_id = new.user_id and lesson_id = new.lesson_id and valide_le is null;
  end if;
  return new;
end $$;
drop trigger if exists nourania_lecon_valide_lignes on public.user_nourania_progress;
create trigger nourania_lecon_valide_lignes after insert or update of is_validated on public.user_nourania_progress
  for each row execute function public.nourania_lecon_valide_lignes();

-- Rétroactif : lignes déjà cochées dans une leçon déjà validée
update public.nourania_lignes_faites l set valide_le = now()
from public.user_nourania_progress p
where p.user_id = l.user_id and p.lesson_id = l.lesson_id and p.is_validated is true and l.valide_le is null;

-- Correction au passage (trouvée au test du 15/11) : `garde_validation` comparait lesson_id (uuid) à un entier → erreur
-- « operator does not exist: uuid = integer » au lieu de vérifier la leçon débloquée. Même fonction, avec ::uuid.
create or replace function public.garde_validation()
returns trigger language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then return new; end if;
  if not coalesce(new.is_validated, false) then return new; end if;
  if tg_op = 'UPDATE' and coalesce(old.is_validated, false) then return new; end if;
  ok := public.est_adulte(auth.uid());
  if not ok and tg_table_name = 'user_nourania_progress' then
    ok := exists (select 1 from nourania_admin_unlocks u
                  where u.student_id = auth.uid() and u.lesson_id = (to_jsonb(new) ->> 'lesson_id')::uuid);
  end if;
  if not ok then
    raise exception 'Validation réservée à l''enseignante';
  end if;
  return new;
end $$;
