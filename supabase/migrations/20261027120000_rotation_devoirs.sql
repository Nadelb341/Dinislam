-- 🔄 Rotation des devoirs à l'heure du cours (2026-10-27, choix de Nadia : onglets B + bande de semaines C + écriture D + « À rattraper » E)

-- Idée 2 : devoirs préparés à l'avance, visibles par les élèves seulement à partir de cette heure (null = tout de suite)
ALTER TABLE public.devoirs ADD COLUMN IF NOT EXISTS visible_a timestamptz;

-- Choix du professeur pour un devoir pas fait d'une semaine passée : « rattraper » (boîte en haut jusqu'à ce qu'il soit fait)
-- ou « historique » (rangé avec la mention « pas fait », retiré du chemin de diamants)
CREATE TABLE IF NOT EXISTS public.devoir_decisions (
  devoir_id uuid NOT NULL REFERENCES public.devoirs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('rattraper', 'historique')),
  decided_at timestamptz NOT NULL DEFAULT now(),
  decided_by uuid,
  PRIMARY KEY (devoir_id, student_id)
);
ALTER TABLE public.devoir_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_manage_devoir_decisions ON public.devoir_decisions;
CREATE POLICY admin_manage_devoir_decisions ON public.devoir_decisions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS student_read_own_devoir_decisions ON public.devoir_decisions;
CREATE POLICY student_read_own_devoir_decisions ON public.devoir_decisions FOR SELECT USING (student_id = auth.uid());

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'devoir_decisions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.devoir_decisions;
  END IF;
END $$;

-- Les élèves ne voient un devoir préparé à l'avance qu'à son heure
DROP POLICY IF EXISTS students_read_devoirs ON public.devoirs;
CREATE POLICY students_read_devoirs ON public.devoirs FOR SELECT USING (
  (visible_a IS NULL OR visible_a <= now())
  AND ((assigned_to = 'all') OR (student_id = auth.uid())
       OR (group_id IN (SELECT student_group_members.group_id FROM student_group_members WHERE student_group_members.user_id = auth.uid())))
);

-- Chemin de diamants : pas de devoir pas encore visible ; un devoir obligatoire rangé « historique » par le professeur quitte le chemin
CREATE OR REPLACE FUNCTION public.program_items(p_user uuid, p_week date, p_stored jsonb)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT jsonb_agg(it) FROM jsonb_array_elements(COALESCE(p_stored, '[]'::jsonb)) it WHERE it->>'module' = 'allah_names'), '[]'::jsonb)
      || COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'module', 'devoir', 'item_id', d.id::text, 'label', d.titre,
          'detail', CASE d.type WHEN 'sourate' THEN 'Sourate' WHEN 'recitation' THEN 'Récitation' WHEN 'nourania' THEN 'Nourania' WHEN 'allah_names' THEN '99 noms' WHEN 'alphabet' THEN 'Alphabet' WHEN 'invocations' THEN 'Invocation' WHEN 'priere' THEN 'Prière' WHEN 'coran' THEN 'Coran' ELSE 'Devoir' END
                    || COALESCE(' · pour le ' || to_char(d.date_limite AT TIME ZONE 'Europe/Paris', 'DD/MM'), ''),
          'path', '/?open=devoirs#devoir-' || d.id::text,
          'emoji', CASE d.type WHEN 'sourate' THEN '📖' WHEN 'recitation' THEN '🎙️' WHEN 'nourania' THEN '✨' WHEN 'allah_names' THEN '🌟' WHEN 'alphabet' THEN '🔤' WHEN 'invocations' THEN '🤲' WHEN 'priere' THEN '🕌' WHEN 'coran' THEN '📗' ELSE '📚' END,
          'steps_total', jsonb_array_length(d.etapes),
          'created_at', d.created_at,
          'due', d.date_limite
        ) ORDER BY d.created_at)
        FROM devoirs d
        WHERE (d.assigned_to = 'all' OR d.student_id = p_user
               OR (d.group_id IS NOT NULL AND d.group_id IN (SELECT g.group_id FROM student_group_members g WHERE g.user_id = p_user)))
          AND (d.visible_a IS NULL OR d.visible_a <= now())
          AND (
            -- la semaine dure jusqu'à la création de la suivante (vacances : pas de nouvelle semaine, les devoirs s'ajoutent quand même)
            (d.created_at >= p_week AND d.created_at < COALESCE((SELECT min(w2.week_start) FROM weekly_programs w2 WHERE w2.student_id = p_user AND w2.week_start > p_week), 'infinity'::date))
            -- Devoir obligatoire (2026-10-26) : donné à partir du 26/10/2026 et pas fait = il reste sur le chemin jusqu'à ce qu'il
            -- soit fait, même après sa date (seulement depuis l'arrivée de l'élève), sauf si le professeur l'a rangé dans l'historique (2026-10-27)
            OR (d.created_at < p_week AND d.created_at >= '2026-10-26'::date
                AND d.created_at >= COALESCE((SELECT pr.created_at FROM profiles pr WHERE pr.user_id = p_user), '-infinity'::timestamptz)
                AND NOT program_item_done(p_user, 'devoir', d.id::text)
                AND NOT EXISTS (SELECT 1 FROM devoir_decisions dd WHERE dd.devoir_id = d.id AND dd.student_id = p_user AND dd.decision = 'historique'))
            -- Devoirs plus anciens : règle d'avant (30 jours, pas expirés)
            OR (d.created_at < p_week AND d.created_at < '2026-10-26'::date AND d.created_at >= p_week - 30
                AND (d.date_limite IS NULL OR d.date_limite >= p_week)
                AND NOT program_item_done(p_user, 'devoir', d.id::text))
          )
      ), '[]'::jsonb);
$function$;
