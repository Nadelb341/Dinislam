-- 📊 Audit ZAT du 2026-11-07 — idée 14 : bilan trimestriel = bonne date de validation
-- Avant : user_sourate_progress.validated_at vide (61/61) et user_nourania_progress.completed_at vide (70/81)
-- → le bilan prenait la date de création de la ligne (jusqu'à 189 jours d'écart).

create or replace function public.date_de_validation()
returns trigger language plpgsql as $$
declare col text := tg_argv[0];
begin
  if coalesce(new.is_validated, false)
     and (tg_op = 'INSERT' or not coalesce(old.is_validated, false))
     and (to_jsonb(new) ->> col) is null then
    new := jsonb_populate_record(new, jsonb_build_object(col, now()));
  end if;
  return new;
end $$;

drop trigger if exists date_de_validation on public.user_sourate_progress;
create trigger date_de_validation before insert or update on public.user_sourate_progress
  for each row execute function public.date_de_validation('validated_at');
drop trigger if exists date_de_validation on public.user_nourania_progress;
create trigger date_de_validation before insert or update on public.user_nourania_progress
  for each row execute function public.date_de_validation('completed_at');
drop trigger if exists date_de_validation on public.user_allah_name_progress;
create trigger date_de_validation before insert or update on public.user_allah_name_progress
  for each row execute function public.date_de_validation('validated_at');

-- Rattrapage : date à laquelle l'enseignante a accepté la demande (la plus récente acceptée)
update public.user_sourate_progress p set validated_at = r.d
from (select user_id, sourate_id, max(reviewed_at) d from public.sourate_validation_requests
      where status = 'approved' and reviewed_at is not null group by 1, 2) r
where p.is_validated and p.validated_at is null and r.user_id = p.user_id and r.sourate_id = p.sourate_id;

update public.user_nourania_progress p set completed_at = r.d
from (select user_id, lesson_id, max(reviewed_at) d from public.nourania_validation_requests
      where status = 'approved' and reviewed_at is not null group by 1, 2) r
where p.is_validated and p.completed_at is null and r.user_id = p.user_id and r.lesson_id = p.lesson_id;
