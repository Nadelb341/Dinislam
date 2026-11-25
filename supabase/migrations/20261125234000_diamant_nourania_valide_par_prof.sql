-- 💎 Choix 1 de Nadia (25/11) : diamant d'un devoir Nourania à lignes = DORÉ quand l'enseignante valide les lignes
-- (« ✅ Valider », révision ou définitif), ORANGE « en attente » tant que l'élève les a seulement cochées.
-- Avant : doré dès que l'élève cochait toutes les lignes. Seule la branche Nourania à lignes change.
create or replace function public.devoir_travail(p_user uuid, p_item text, out etat text, out fait_le timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare d record; lid uuid; sid uuid; lignes int[]; n int; nb int; t timestamptz;
begin
  select * into d from devoirs where id::text = p_item;
  if not found or d.cible_module is null or d.cible_id is null then return; end if;
  if d.titre ~* '^\s*(r[ée]viser|revoir)' then return; end if;

  if d.cible_module = 'nourania' then
    if d.cible_id !~* '^[0-9a-f-]{36}$' then return; end if;
    lid := d.cible_id::uuid;
    lignes := nourania_lignes_du_titre(d.titre);
    if cardinality(lignes) > 0 then
      -- Doré seulement quand l'ENSEIGNANTE a validé chaque ligne (« ✅ Valider » = révision suffit) ; cochée par l'élève = orange
      select count(distinct f.ligne) filter (where f.valide_le is not null), max(f.valide_le), count(*) into n, t, nb from nourania_lignes_faites f
      where f.user_id = p_user and f.lesson_id = lid and f.ligne = any(lignes) and f.created_at >= d.created_at;
      if n >= cardinality(lignes) then etat := 'fait'; fait_le := t;
      elsif nb > 0 then etat := 'attente'; end if;
    else
      select coalesce(u.completed_at, u.created_at) into t from user_nourania_progress u
      where u.user_id = p_user and u.lesson_id = lid and u.is_validated;
      if t is not null and t >= d.created_at then etat := 'fait'; fait_le := t;
      elsif exists (select 1 from nourania_validation_requests r where r.user_id = p_user and r.lesson_id = lid and r.status = 'pending') then etat := 'attente'; end if;
    end if;

  elsif d.cible_module in ('sourate', 'sourates') then
    if d.cible_id !~ '^[0-9]+$' then return; end if;
    select s.id into sid from sourates s where s.number = d.cible_id::int;
    if sid is null then return; end if;
    select u.validated_at into t from user_sourate_progress u
    where u.user_id = p_user and u.sourate_id = sid and u.is_validated and u.context = 'sourates';
    if t is not null and t >= d.created_at then etat := 'fait'; fait_le := t;
    elsif exists (select 1 from sourate_recitations r where r.student_id = p_user and r.sourate_id = sid and r.status = 'pending')
       or exists (select 1 from sourate_validation_requests r where r.user_id = p_user and r.sourate_id = sid and r.status = 'pending') then etat := 'attente'; end if;

  elsif d.cible_module in ('invocations', 'invocation') then
    if d.cible_id !~ '^[0-9]+$' then return; end if;
    select coalesce(u.completed_at, u.updated_at, u.created_at) into t from user_invocation_progress u
    where u.user_id = p_user and u.invocation_id = d.cible_id::int and u.is_validated;
    if t is not null and t >= d.created_at then etat := 'fait'; fait_le := t;
    elsif exists (select 1 from invocation_validation_requests r where r.user_id = p_user and r.invocation_id = d.cible_id::int and r.status = 'pending') then etat := 'attente'; end if;
  end if;
end $$;
