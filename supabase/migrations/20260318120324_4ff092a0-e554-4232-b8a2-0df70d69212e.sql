-- 1. Fix profiles: users can self-approve and grant admin
-- Drop the permissive update policy and create a restricted one
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile safely" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_admin = (SELECT p.is_admin FROM public.profiles p WHERE p.user_id = auth.uid())
    AND is_approved = (SELECT p.is_approved FROM public.profiles p WHERE p.user_id = auth.uid())
    AND points = (SELECT p.points FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- 2. Fix homework_assignments: restrict SELECT to own assignments
DROP POLICY IF EXISTS "Anyone can view homework" ON public.homework_assignments;
CREATE POLICY "Users can view own homework" ON public.homework_assignments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IS NULL
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 3. Fix student_ranking: leaderboard is intentional but remove duplicate policies
DROP POLICY IF EXISTS "Anyone can view ranking" ON public.student_ranking;
DROP POLICY IF EXISTS "Anyone can view rankings" ON public.student_ranking;
-- Keep the leaderboard public (this is a classement feature) but only expose via SELECT
CREATE POLICY "Authenticated can view rankings" ON public.student_ranking
  FOR SELECT TO authenticated
  USING (true);

-- 4. Fix student_group_members: restrict to own memberships + admin
DROP POLICY IF EXISTS "Anyone can view group members" ON public.student_group_members;
CREATE POLICY "Users can view own group memberships" ON public.student_group_members
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));