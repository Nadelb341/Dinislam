-- 2026-11-15 — 🎉 Anniversaire de l'élève (choix de Nadia, page https://claude.ai/artifact/8423oTGgpm8VcaW5r67wvh) :
-- +20 points une fois par an, message « Aujourd'hui, tu as un an de plus » à la 1re connexion depuis la date
-- (JAMAIS « joyeux anniversaire » : demande de Nadia), fête de 24 h sur son accueil, camarades et enseignante prévenus.
create table if not exists public.anniversaires_fetes (
  user_id uuid not null references auth.users(id) on delete cascade,
  annee int not null,
  created_at timestamptz not null default now(),
  primary key (user_id, annee)
);
alter table public.anniversaires_fetes enable row level security;
drop policy if exists anniv_lecture on public.anniversaires_fetes;
create policy anniv_lecture on public.anniversaires_fetes for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
-- Pas d'écriture directe : seulement par la fonction anniversaire_du_jour() (les points ne se donnent pas à la main)

insert into public.point_settings (action_key, label, points, is_active, points_per_validation)
select 'anniversaire', '🎉 Un an de plus (anniversaire, 1 fois par an)', 20, true, 1
where not exists (select 1 from public.point_settings where action_key = 'anniversaire');

-- Date d'anniversaire d'une année donnée (29 février → 28 février les années non bissextiles)
create or replace function public.date_anniversaire(p_naissance date, p_annee int) returns date
language sql immutable as $$
  select case when extract(month from p_naissance) = 2 and extract(day from p_naissance) = 29
              and not ((p_annee % 4 = 0 and p_annee % 100 <> 0) or p_annee % 400 = 0)
         then make_date(p_annee, 2, 28)
         else make_date(p_annee, extract(month from p_naissance)::int, extract(day from p_naissance)::int) end
$$;

-- Appelée à l'ouverture de l'appli : fête l'anniversaire (au plus 30 jours après la date), une seule fois par an
create or replace function public.anniversaire_du_jour() returns json
language plpgsql security definer set search_path = public as $$
declare
  naissance date; auj date := (now() at time zone 'Europe/Paris')::date; a date; ins int;
begin
  if auth.uid() is null then return null; end if;
  select date_of_birth into naissance from profiles where user_id = auth.uid();
  if naissance is null then return null; end if;
  a := date_anniversaire(naissance, extract(year from auj)::int);
  if a > auj then a := date_anniversaire(naissance, extract(year from auj)::int - 1); end if;
  if auj - a > 30 or extract(year from a) <= extract(year from naissance) then return null; end if;
  insert into anniversaires_fetes (user_id, annee) values (auth.uid(), extract(year from a)::int) on conflict do nothing;
  get diagnostics ins = row_count;
  return json_build_object('date', a, 'annee', extract(year from a)::int, 'age', extract(year from a)::int - extract(year from naissance)::int,
                           'nouveau', ins > 0, 'aujourdhui', a = auj);
end $$;
grant execute on function public.anniversaire_du_jour() to authenticated;

-- Qui a un an de plus AUJOURD'HUI (prénom + groupes ; l'âge seulement pour l'enseignante) : camarades, classement, Ma journée
create or replace function public.anniversaires_aujourdhui()
returns table (user_id uuid, prenom text, age int, group_ids uuid[])
language sql stable security definer set search_path = public as $$
  select p.user_id, split_part(trim(coalesce(p.full_name, '')), ' ', 1),
         case when public.has_role(auth.uid(), 'admin'::public.app_role)
              then extract(year from now() at time zone 'Europe/Paris')::int - extract(year from p.date_of_birth)::int end,
         coalesce((select array_agg(m.group_id) from student_group_members m where m.user_id = p.user_id), '{}')
  from profiles p
  where auth.uid() is not null and p.is_approved and p.date_of_birth is not null
    and date_anniversaire(p.date_of_birth, extract(year from now() at time zone 'Europe/Paris')::int) = (now() at time zone 'Europe/Paris')::date
    and not exists (select 1 from user_roles r where r.user_id = p.user_id and r.role = 'admin')
$$;
grant execute on function public.anniversaires_aujourdhui() to authenticated;

drop trigger if exists recalculate_points on public.anniversaires_fetes;
create trigger recalculate_points after insert or delete or update on public.anniversaires_fetes
  for each row execute function public.trg_recalculate_points();

-- Barème : ligne « anniversaire » ajoutée (le reste de la fonction est inchangé)
CREATE OR REPLACE FUNCTION public.recalculate_student_points(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total INTEGER := 0;
  n INTEGER;
  pts INTEGER;
  r RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN RETURN; END IF; -- compte en cours de suppression
  -- Pour chaque ligne du barème : nombre d'actions de l'élève × points (0 si la ligne est désactivée)
  FOR r IN SELECT action_key, CASE WHEN is_active THEN points ELSE 0 END AS p FROM point_settings LOOP
    n := 0;
    CASE r.action_key
      WHEN 'sourate_validee' THEN SELECT COUNT(*) INTO n FROM user_sourate_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'nourania_lecon_validee' THEN SELECT COUNT(*) INTO n FROM user_nourania_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'invocation_vue' THEN SELECT COUNT(*) INTO n FROM user_invocation_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'alphabet_lettre_apprise' THEN SELECT COUNT(*) INTO n FROM user_alphabet_progress WHERE user_id = p_user_id AND is_validated;
      -- Jeux de l'Alphabet : seule la meilleure partie de chaque jeu et de chaque jour compte
      WHEN 'alphabet_bonne_reponse' THEN SELECT COALESCE(SUM(best), 0) INTO n FROM (SELECT MAX(score) AS best FROM alphabet_game_scores WHERE user_id = p_user_id GROUP BY game, played_on) b;
      WHEN 'devoir_rendu' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id;
      WHEN 'devoir_corrige' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id AND statut = 'corrige';
      WHEN 'presence_marquee' THEN SELECT COUNT(*) INTO n FROM attendance_records WHERE user_id = p_user_id AND status IN ('present', 'late');
      WHEN 'priere_validee' THEN SELECT COUNT(*) INTO n FROM user_prayer_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'jeune_marque' THEN SELECT COUNT(*) INTO n FROM user_ramadan_fasting WHERE user_id = p_user_id AND COALESCE(has_fasted, is_fasting, false);
      WHEN 'quiz_reussi' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND quiz_completed;
      WHEN 'ramadan_jour_complete' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND is_completed;
      WHEN 'message_envoye' THEN SELECT COUNT(*) INTO n FROM user_messages WHERE sender_id = p_user_id AND deleted_at IS NULL;
      -- 🌟 99 Noms d'Allah : nom validé (2026-11-04, demande de Nadia)
      WHEN 'allah_nom_valide' THEN SELECT COUNT(*) INTO n FROM user_allah_name_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'vocabulaire_appris' THEN SELECT COUNT(*) INTO n FROM user_flashcard_learned WHERE user_id = p_user_id;
      -- Chemin de la semaine (2026-10-26) : trésor ouvert (+10) et diamant bonus (+5)
      WHEN 'tresor_ouvert' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'tresor';
      WHEN 'bonus_semaine' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'bonus';
      -- 🎉 Un an de plus (anniversaire, 2026-11-15) : une fois par an
      WHEN 'anniversaire' THEN SELECT COUNT(*) INTO n FROM anniversaires_fetes WHERE user_id = p_user_id;
      ELSE n := 0;
    END CASE;
    total := total + COALESCE(n, 0) * COALESCE(r.p, 0);
  END LOOP;

  INSERT INTO student_ranking (user_id, total_points, updated_at)
  VALUES (p_user_id, total, now())
  ON CONFLICT (user_id) DO UPDATE SET total_points = total, updated_at = now();

  UPDATE profiles SET points = total WHERE user_id = p_user_id;
END;
$function$;
