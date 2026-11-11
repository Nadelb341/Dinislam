-- 2026-11-11 — Demande de Nadia : le diamant « 99 noms » n'est plus ajouté d'office au chemin de la semaine.
-- Seuls les devoirs qu'elle donne font des diamants. On retire tout ce qui ne servait qu'à ce diamant automatique.
-- + chaque diamant de devoir porte sa matière (type, nom personnel) : l'élève voit juste le nom de la carte.

-- 1) Les diamants = les devoirs seulement (l'ancien diamant 99 noms gardé dans weekly_programs.items n'est plus lu)
create or replace function public.program_items(p_user uuid, p_week date, p_stored jsonb)
returns jsonb language sql stable security definer set search_path = public as $function$
  SELECT COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'module', 'devoir', 'item_id', d.id::text, 'label', d.titre,
          'detail', CASE d.type WHEN 'sourate' THEN 'Sourate' WHEN 'recitation' THEN 'Récitation' WHEN 'nourania' THEN 'Nourania' WHEN 'allah_names' THEN '99 noms' WHEN 'alphabet' THEN 'Alphabet' WHEN 'invocations' THEN 'Invocation' WHEN 'priere' THEN 'Prière' WHEN 'coran' THEN 'Coran' ELSE 'Devoir' END
                    || COALESCE(' · pour le ' || to_char(d.date_limite AT TIME ZONE 'Europe/Paris', 'DD/MM'), ''),
          'type', d.type,
          'matiere_label', d.matiere_label,
          'path', '/?open=devoirs#devoir-' || d.id::text,
          'emoji', COALESCE(NULLIF(d.matiere_emoji, ''), CASE d.type WHEN 'sourate' THEN '📖' WHEN 'recitation' THEN '🎙️' WHEN 'nourania' THEN '✨' WHEN 'allah_names' THEN '🌟' WHEN 'alphabet' THEN '🔤' WHEN 'invocations' THEN '🤲' WHEN 'priere' THEN '🕌' WHEN 'coran' THEN '📗' ELSE '📚' END),
          'steps_total', jsonb_array_length(d.etapes),
          'created_at', d.created_at,
          'due', d.date_limite
        ) ORDER BY d.created_at)
        FROM devoirs d
        WHERE (d.assigned_to = 'all' OR d.student_id = p_user
               OR (d.group_id IS NOT NULL AND d.group_id IN (SELECT g.group_id FROM student_group_members g WHERE g.user_id = p_user)))
          AND (d.visible_a IS NULL OR d.visible_a <= now())
          AND (
            (d.created_at >= p_week AND d.created_at < COALESCE((SELECT min(w2.week_start) FROM weekly_programs w2 WHERE w2.student_id = p_user AND w2.week_start > p_week), 'infinity'::date))
            OR (d.created_at < p_week AND d.created_at >= '2026-10-26'::date
                AND d.created_at >= COALESCE((SELECT pr.created_at FROM profiles pr WHERE pr.user_id = p_user), '-infinity'::timestamptz)
                AND NOT program_item_done(p_user, 'devoir', d.id::text)
                AND NOT EXISTS (SELECT 1 FROM devoir_decisions dd WHERE dd.devoir_id = d.id AND dd.student_id = p_user AND dd.decision = 'historique'))
            OR (d.created_at < p_week AND d.created_at < '2026-10-26'::date AND d.created_at >= p_week - 30
                AND (d.date_limite IS NULL OR d.date_limite >= p_week)
                AND NOT program_item_done(p_user, 'devoir', d.id::text))
          )
      ), '[]'::jsonb);
$function$;

-- 2) Les nouvelles semaines démarrent vides (plus de diamant 99 noms ajouté d'office)
create or replace function public.generate_weekly_programs(p_week date)
returns integer language plpgsql security definer set search_path = public as $function$
DECLARE s record; last_idx smallint; idx smallint; n integer := 0; excluded uuid[];
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Réservé à l''enseignante'; END IF;
  SELECT disabled_group_ids INTO excluded FROM weekly_program_settings WHERE id = 1;
  FOR s IN SELECT p.user_id FROM profiles p
    WHERE p.is_approved AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'admin')
      AND NOT EXISTS (SELECT 1 FROM student_group_members g WHERE g.user_id = p.user_id AND g.group_id = ANY(COALESCE(excluded, '{}')))
  LOOP
    SELECT w.message_index INTO last_idx FROM weekly_programs w WHERE w.student_id = s.user_id ORDER BY week_start DESC LIMIT 1;
    idx := floor(random() * 24)::smallint;
    IF idx = last_idx THEN idx := ((idx + 1) % 24)::smallint; END IF;
    INSERT INTO weekly_programs (student_id, week_start, items, message_index) VALUES (s.user_id, p_week, '[]'::jsonb, idx)
      ON CONFLICT (student_id, week_start) DO NOTHING;
    IF FOUND THEN n := n + 1; END IF;
  END LOOP;
  RETURN n;
END $function$;

-- 3) Ce qui ne servait qu'au diamant 99 noms : la fonction qui le choisissait, ses lignes dans les fonctions d'état, les anciennes copies
drop function if exists public.next_program_items(uuid);

create or replace function public.program_item_done_at(p_user uuid, p_module text, p_item text)
returns timestamptz language sql stable security definer set search_path = public as $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN (SELECT r.rendu_at FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut = 'corrige' LIMIT 1)
    ELSE NULL END;
$function$;

create or replace function public.program_item_pending(p_user uuid, p_module text, p_item text)
returns boolean language sql stable security definer set search_path = public as $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN EXISTS (SELECT 1 FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut = 'rendu')
    ELSE false END;
$function$;

update public.weekly_programs set items = '[]'::jsonb where items::text like '%allah_names%';
