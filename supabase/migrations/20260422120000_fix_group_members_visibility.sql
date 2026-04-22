-- Fix : un élève ne voyait que lui-même au classement par groupes
-- car la RLS du 18/03 limitait SELECT à "auth.uid() = user_id OR admin".
-- On autorise maintenant à voir tous les membres de ses propres groupes,
-- tout en gardant l'opacité sur les groupes auxquels on n'appartient pas.

-- Helper SECURITY DEFINER pour éviter la récursion RLS (on requête la même table)
CREATE OR REPLACE FUNCTION public.is_user_in_group(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_group_members
    WHERE group_id = _group_id AND user_id = _user_id
  );
$$;

-- Remplace la policy SELECT
DROP POLICY IF EXISTS "Users can view own group memberships" ON public.student_group_members;
DROP POLICY IF EXISTS "Users can view members of their own groups" ON public.student_group_members;

CREATE POLICY "Users can view members of their own groups"
ON public.student_group_members
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.is_user_in_group(group_id, auth.uid())
);
