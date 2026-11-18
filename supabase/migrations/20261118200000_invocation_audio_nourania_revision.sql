-- 2026-11-18 — Demandes de Nadia
-- (1) 🎙️ Invocations : l'élève envoie OBLIGATOIREMENT un audio de sa récitation avec sa demande de validation.
alter table public.invocation_validation_requests add column if not exists audio_url text;

-- (2) ☑️ Lignes Nourania en 2 temps :
--   cochée par l'élève (valide_le null) = ⏳ demande ;
--   « ✅ Valider » de l'enseignante = RÉVISION (valide_le rempli, definitif = false) → ligne orange clair, à revoir au cours du mercredi ;
--   « ⭐ Valider définitivement » (ou validation par l'enseignante en mode fantôme, ou leçon entière validée) = definitif → ligne éclaircie.
alter table public.nourania_lignes_faites add column if not exists definitif boolean not null default false;
-- Rétroactif : tout ce qui était déjà validé l'était « pour de vrai »
update public.nourania_lignes_faites set definitif = true where valide_le is not null and definitif is false;
create index if not exists nourania_lignes_faites_a_revoir on public.nourania_lignes_faites (created_at) where valide_le is not null and definitif is false;

-- L'enseignante peut aussi ajouter une ligne pour un élève (validation en mode fantôme, avec SA session)
drop policy if exists nlf_ajout_admin on public.nourania_lignes_faites;
create policy nlf_ajout_admin on public.nourania_lignes_faites for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Un élève ne peut jamais poser lui-même « definitif »
create or replace function public.garde_nourania_ligne_definitif() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(), 'admin'::public.app_role) then
    new.definitif := false;
  end if;
  return new;
end $$;
drop trigger if exists garde_nourania_ligne_definitif on public.nourania_lignes_faites;
create trigger garde_nourania_ligne_definitif before insert on public.nourania_lignes_faites
  for each row execute function public.garde_nourania_ligne_definitif();

-- Leçon entière validée → toutes ses lignes deviennent définitives (même celles « à revoir »)
create or replace function public.nourania_lecon_valide_lignes() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_validated is true then
    update public.nourania_lignes_faites set valide_le = coalesce(valide_le, now()), valide_par = coalesce(valide_par, auth.uid()), definitif = true
    where user_id = new.user_id and lesson_id = new.lesson_id and (valide_le is null or definitif is false);
  end if;
  return new;
end $$;
