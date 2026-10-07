-- « Ma Présence » : ranger la vue de la classe par groupe (Groupe 0, 1, 2…) pour tous.
-- Un élève ne peut lire que les membres de SON groupe (politique de student_group_members) :
-- cette fonction donne seulement « quel élève est dans quel groupe », rien d'autre.
CREATE OR REPLACE FUNCTION public.attendance_student_groups()
 RETURNS TABLE(user_id uuid, group_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT m.user_id, m.group_id FROM student_group_members m
  JOIN profiles p ON p.user_id = m.user_id AND p.is_approved = true;
$function$;
REVOKE ALL ON FUNCTION public.attendance_student_groups() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.attendance_student_groups() TO authenticated;
