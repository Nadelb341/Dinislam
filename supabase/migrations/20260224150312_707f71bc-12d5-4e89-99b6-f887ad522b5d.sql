
-- Add admin INSERT policy on user_invocation_progress
CREATE POLICY "Admins can insert invocation progress"
ON public.user_invocation_progress
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add admin UPDATE policy on user_invocation_progress
CREATE POLICY "Admins can update invocation progress"
ON public.user_invocation_progress
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
