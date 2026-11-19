-- 2026-11-19 — Diamants en double chez Ilyes : les devoirs du 18/11 (créés le matin, à rendre au cours du 18/11)
-- et ceux donnés pour le 25/11 tombaient dans la même semaine (qui commence le mercredi 18/11).
CREATE OR REPLACE FUNCTION public.program_items(p_user uuid, p_week date, p_stored jsonb)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
            (d.created_at >= p_week AND d.created_at < COALESCE((SELECT min(w2.week_start) FROM weekly_programs w2 WHERE w2.student_id = p_user AND w2.week_start > p_week), 'infinity'::date)
             -- 2026-11-19 (Nadia, Ilyes en double) : un devoir à rendre le jour du cours qui OUVRE la semaine (ou avant)
             -- appartient à la semaine d'avant : il ne s'affiche plus à côté des devoirs donnés pour le cours suivant
             AND (d.date_limite IS NULL OR d.date_limite >= p_week + 1))
            -- 2026-11-19 (Nadia) : plus de rattrapage. Un devoir d'une semaine passée ne revient que s'il est à rendre
            -- APRÈS le premier jour de cette semaine (devoir sur plusieurs semaines) et pas encore fait.
            OR (d.created_at < p_week AND d.date_limite IS NOT NULL AND d.date_limite >= p_week + 1
                AND NOT program_item_done(p_user, 'devoir', d.id::text))
          )
      ), '[]'::jsonb);
$function$
;
