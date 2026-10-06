-- Bandeau « élèves qui n'arrivent pas à se connecter » (bouclier) : ajoute la date de la dernière demande
-- de « mot de passe oublié » à l'état des comptes.
DROP FUNCTION IF EXISTS public.admin_students_auth_status();
CREATE FUNCTION public.admin_students_auth_status()
 RETURNS TABLE(user_id uuid, email_confirmed boolean, last_sign_in_at timestamptz, recovery_sent_at timestamptz)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Réservé à l''admin';
  END IF;
  RETURN QUERY SELECT u.id, u.email_confirmed_at IS NOT NULL, u.last_sign_in_at, u.recovery_sent_at FROM auth.users u;
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_students_auth_status() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_students_auth_status() TO authenticated;
