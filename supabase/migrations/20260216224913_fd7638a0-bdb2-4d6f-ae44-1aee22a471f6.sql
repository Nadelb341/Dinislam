-- Allow admins to delete all user_ramadan_progress (for reset)
CREATE POLICY "Admins can delete all ramadan progress"
ON public.user_ramadan_progress
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete all quiz_responses (for reset)
CREATE POLICY "Admins can delete all quiz responses"
ON public.quiz_responses
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));