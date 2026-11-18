-- 2026-11-18 (soir) — Choix de Nadia « Diamants et notifications » (1 ✅, 2 ✖️, 3 ⏳, 4 ✅) + précisions sur les points.
--
-- 💎 (1) Un devoir relié à une carte (cible_module) s'allume TOUT SEUL avec le travail fait dans la carte :
--   • Nourania : DORÉ quand l'élève a coché TOUTES les lignes du devoir (numéros lus dans le titre :
--     « Lire la leçon 6, ligne 4 », « lignes 3 à 5 », « lignes 3, 4 et 6 ») ; orange s'il en a coché une partie.
--     Devoir Nourania sans numéro de ligne : doré quand la leçon est validée, orange si la demande est en attente.
--   • Sourates : orange quand la récitation est envoyée (ou demande en attente) ; doré quand Nadia valide.
--   • Invocations : orange quand la récitation est envoyée ; doré quand Nadia valide.
--   • « Réviser … / Revoir … » : rien d'automatique, la révision reste à rendre dans le cahier.
-- ✖️ (2) Pas de rattrapage : seul le travail fait APRÈS la création du devoir l'allume (une demande encore en attente compte).
-- ⏳ (3) Pas de +5 « devoir rendu » pour ces devoirs : rien n'est écrit dans devoirs_rendus (calcul à la volée).
-- ✅ (4) Pas en double dans Corrections › Devoirs : même raison (aucune ligne devoirs_rendus créée).
--
-- 🏆 Points (« 3 » de Nadia) : on gagne les points d'une leçon / sourate ENTIÈRE validée par Nadia (10 / 15), jamais d'une ligne.
--   • La dernière ligne cochée d'une leçon Nourania envoie toute seule la demande de validation de la leçon.
--   • Un enfant (moins de 20 ans) qui « valide » une leçon que Nadia lui a ouverte (🔓) envoie maintenant une DEMANDE
--     (avant : validée tout seul, avec les points, sans passer par Nadia).
--   • (« 10 » de Nadia : « oui ») une leçon Nourania ouverte à la main par Nadia (🔓) compte comme validée pour les points,
--     comme les sourates débloquées (règle du 17/11). Chaque leçon ne compte qu'une fois.

-- 1) Numéros de lignes écrits dans le titre d'un devoir
create or replace function public.nourania_lignes_du_titre(p text)
returns int[] language plpgsql immutable set search_path = public as $$
declare m text; x text; a int; b int; res int[] := '{}'; mm text[];
begin
  m := substring(lower(coalesce(p, '')) from 'lignes?\s*(?:n°\s*)?([0-9][0-9 ,;/&+–\-àaet]*)');
  if m is null then return res; end if;
  m := regexp_replace(m, '\s*(à|a|–|-)\s*', '-', 'g');
  foreach x in array regexp_split_to_array(m, '\s*(,|;|/|&|\+|\met\M)\s*') loop
    mm := regexp_match(trim(x), '^([0-9]+)(?:-([0-9]+))?');
    if mm is null then continue; end if;
    a := mm[1]::int; b := coalesce(mm[2]::int, a);
    if b < a or b - a > 60 then b := a; end if;
    for i in a..b loop res := array_append(res, i); end loop;
  end loop;
  return (select coalesce(array_agg(distinct v order by v), '{}') from unnest(res) v);
end $$;

-- 2) État du travail relié à un devoir : 'fait' | 'attente' | null (+ date du travail fait)
create or replace function public.devoir_travail(p_user uuid, p_item text, out etat text, out fait_le timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare d record; lid uuid; sid uuid; lignes int[]; n int; t timestamptz;
begin
  select * into d from devoirs where id::text = p_item;
  if not found or d.cible_module is null or d.cible_id is null then return; end if;
  if d.titre ~* '^\s*(r[ée]viser|revoir)' then return; end if;

  if d.cible_module = 'nourania' then
    if d.cible_id !~* '^[0-9a-f-]{36}$' then return; end if;
    lid := d.cible_id::uuid;
    lignes := nourania_lignes_du_titre(d.titre);
    if cardinality(lignes) > 0 then
      select count(distinct f.ligne), max(f.created_at) into n, t from nourania_lignes_faites f
      where f.user_id = p_user and f.lesson_id = lid and f.ligne = any(lignes) and f.created_at >= d.created_at;
      if n >= cardinality(lignes) then etat := 'fait'; fait_le := t;
      elsif n > 0 then etat := 'attente'; end if;
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

-- 3) Les diamants lisent aussi ce travail
create or replace function public.program_item_done(p_user uuid, p_module text, p_item text)
 returns boolean language sql stable security definer set search_path to 'public' as $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN EXISTS (SELECT 1 FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut = 'corrige')
                    OR (devoir_travail(p_user, p_item)).etat = 'fait'
    WHEN 'nourania' THEN EXISTS (SELECT 1 FROM user_nourania_progress u WHERE u.user_id = p_user AND u.lesson_id::text = p_item AND u.is_validated)
    WHEN 'sourates' THEN EXISTS (SELECT 1 FROM user_sourate_progress u WHERE u.user_id = p_user AND u.sourate_id::text = p_item AND u.is_validated AND u.context = 'sourates')
    WHEN 'allah_names' THEN EXISTS (SELECT 1 FROM user_allah_name_progress u WHERE u.user_id = p_user AND u.name_id::text = p_item AND u.is_validated)
    WHEN 'alphabet' THEN EXISTS (SELECT 1 FROM user_alphabet_progress u WHERE u.user_id = p_user AND u.letter_id::text = p_item AND u.is_validated)
    WHEN 'invocations' THEN EXISTS (SELECT 1 FROM user_invocation_progress u WHERE u.user_id = p_user AND u.invocation_id::text = p_item AND u.is_validated)
    WHEN 'priere' THEN EXISTS (SELECT 1 FROM user_prayer_progress u WHERE u.user_id = p_user AND u.card_id::text = p_item AND u.is_validated)
    ELSE false END;
$function$;

create or replace function public.program_item_pending(p_user uuid, p_module text, p_item text)
 returns boolean language sql stable security definer set search_path to 'public' as $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN EXISTS (SELECT 1 FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut = 'rendu')
                    OR (devoir_travail(p_user, p_item)).etat = 'attente'
    ELSE false END;
$function$;

create or replace function public.program_item_done_at(p_user uuid, p_module text, p_item text)
 returns timestamp with time zone language sql stable security definer set search_path to 'public' as $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN COALESCE(
      (SELECT r.rendu_at FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut = 'corrige' LIMIT 1),
      (devoir_travail(p_user, p_item)).fait_le)
    ELSE NULL END;
$function$;

-- 4) Dernière ligne cochée d'une leçon Nourania → demande de validation de la leçon entière (sans doublon)
create or replace function public.nourania_derniere_ligne_demande() returns trigger
language plpgsql security definer set search_path = public as $$
declare total int; faites int;
begin
  if exists (select 1 from user_roles r where r.user_id = new.user_id and r.role = 'admin') then return new; end if;
  if exists (select 1 from user_nourania_progress u where u.user_id = new.user_id and u.lesson_id = new.lesson_id and u.is_validated) then return new; end if;
  select max((select count(*) from jsonb_array_elements(case when jsonb_typeof(c.lignes) = 'array' then c.lignes else '[]'::jsonb end) e where e->>'s' = 'lecon'))
    into total from nourania_lesson_content c where c.lesson_id = new.lesson_id;
  if coalesce(total, 0) = 0 then return new; end if;
  select count(distinct f.ligne) into faites from nourania_lignes_faites f
  where f.user_id = new.user_id and f.lesson_id = new.lesson_id and f.ligne between 1 and total;
  if faites >= total and not exists (select 1 from nourania_validation_requests r where r.user_id = new.user_id and r.lesson_id = new.lesson_id and r.status = 'pending') then
    insert into nourania_validation_requests (user_id, lesson_id) values (new.user_id, new.lesson_id);
  end if;
  return new;
end $$;
drop trigger if exists nourania_derniere_ligne_demande on public.nourania_lignes_faites;
create trigger nourania_derniere_ligne_demande after insert on public.nourania_lignes_faites
  for each row execute function public.nourania_derniere_ligne_demande();

-- 5) Enfant + leçon ouverte par Nadia (🔓) : « valider la leçon » = une DEMANDE, plus une validation toute seule
create or replace function public.garde_validation()
returns trigger language plpgsql security definer set search_path = public as $$
declare ok boolean; lid uuid;
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then return new; end if;
  if not coalesce(new.is_validated, false) then return new; end if;
  if tg_op = 'UPDATE' and coalesce(old.is_validated, false) then return new; end if;
  ok := public.est_adulte(auth.uid());
  if not ok and tg_table_name = 'user_nourania_progress' then
    lid := (to_jsonb(new) ->> 'lesson_id')::uuid;
    if exists (select 1 from nourania_admin_unlocks u where u.student_id = auth.uid() and u.lesson_id = lid) then
      if not exists (select 1 from nourania_validation_requests r where r.user_id = auth.uid() and r.lesson_id = lid and r.status = 'pending') then
        insert into nourania_validation_requests (user_id, lesson_id) values (auth.uid(), lid);
      end if;
      new.is_validated := false;
      return new;
    end if;
  end if;
  if not ok then
    raise exception 'Validation réservée à l''enseignante';
  end if;
  return new;
end $$;

-- 6) Points : leçon Nourania validée OU ouverte à la main par Nadia (une seule fois par leçon)
create or replace function public.recalculate_student_points(p_user_id uuid)
 returns void language plpgsql security definer set search_path to 'public' as $function$
DECLARE
  total INTEGER := 0;
  n INTEGER;
  r RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN RETURN; END IF; -- compte en cours de suppression
  FOR r IN SELECT action_key, CASE WHEN is_active THEN points ELSE 0 END AS p FROM point_settings LOOP
    n := 0;
    CASE r.action_key
      -- 📖 Sourate validée OU débloquée par l'enseignante (Nadia, 2026-11-17). Chaque sourate ne compte qu'UNE fois.
      WHEN 'sourate_validee' THEN SELECT COUNT(*) INTO n FROM (
        SELECT sourate_id FROM user_sourate_progress WHERE user_id = p_user_id AND is_validated
        UNION
        SELECT sourate_id FROM sourate_admin_unlocks WHERE user_id = p_user_id
      ) s;
      -- 🔤 Leçon Nourania validée OU ouverte à la main par l'enseignante (Nadia, 2026-11-18 : « oui »). Une fois par leçon.
      WHEN 'nourania_lecon_validee' THEN SELECT COUNT(*) INTO n FROM (
        SELECT lesson_id FROM user_nourania_progress WHERE user_id = p_user_id AND is_validated
        UNION
        SELECT lesson_id FROM nourania_admin_unlocks WHERE student_id = p_user_id
      ) l;
      WHEN 'invocation_vue' THEN SELECT COUNT(*) INTO n FROM user_invocation_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'alphabet_lettre_apprise' THEN SELECT COUNT(*) INTO n FROM user_alphabet_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'alphabet_bonne_reponse' THEN SELECT COALESCE(SUM(best), 0) INTO n FROM (SELECT MAX(score) AS best FROM alphabet_game_scores WHERE user_id = p_user_id GROUP BY game, played_on) b;
      WHEN 'devoir_rendu' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id;
      WHEN 'devoir_corrige' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id AND statut = 'corrige';
      WHEN 'presence_marquee' THEN SELECT COUNT(*) INTO n FROM attendance_records WHERE user_id = p_user_id AND status IN ('present', 'late');
      WHEN 'priere_validee' THEN SELECT COUNT(*) INTO n FROM user_prayer_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'jeune_marque' THEN SELECT COUNT(*) INTO n FROM user_ramadan_fasting WHERE user_id = p_user_id AND COALESCE(has_fasted, is_fasting, false);
      WHEN 'quiz_reussi' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND quiz_completed;
      WHEN 'ramadan_jour_complete' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND is_completed;
      WHEN 'message_envoye' THEN SELECT COUNT(*) INTO n FROM user_messages WHERE sender_id = p_user_id AND deleted_at IS NULL;
      WHEN 'allah_nom_valide' THEN SELECT COUNT(*) INTO n FROM user_allah_name_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'vocabulaire_appris' THEN SELECT COUNT(*) INTO n FROM user_flashcard_learned WHERE user_id = p_user_id;
      WHEN 'tresor_ouvert' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'tresor';
      WHEN 'bonus_semaine' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'bonus';
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

-- Points recalculés quand Nadia ouvre / referme une leçon à la main
create or replace function public.nourania_unlock_points() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.recalculate_student_points(coalesce(new.student_id, old.student_id));
  return null;
end $$;
drop trigger if exists nourania_unlock_points on public.nourania_admin_unlocks;
create trigger nourania_unlock_points after insert or delete on public.nourania_admin_unlocks
  for each row execute function public.nourania_unlock_points();

-- Rattrapage : tout le monde recalculé avec la règle d'aujourd'hui
do $$ declare u uuid; begin for u in select user_id from profiles loop perform public.recalculate_student_points(u); end loop; end $$;
