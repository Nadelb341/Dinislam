-- Mots de passe des élèves visibles par l'enseignante (demande de Nadia 2026-10-06 : enfants de 6-8 ans,
-- elle veut pouvoir leur redonner leur mot de passe). Table à part, lisible UNIQUEMENT par l'admin ;
-- personne ne peut y écrire depuis l'appli : seules les fonctions serveur (remember-password,
-- update-user-password) l'alimentent, après avoir vérifié que le mot de passe est le bon.
CREATE TABLE IF NOT EXISTS public.student_passwords (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  password text NOT NULL,
  source text NOT NULL DEFAULT 'connexion' CHECK (source IN ('connexion', 'oubli', 'parametres', 'admin')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_passwords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_read_student_passwords ON public.student_passwords;
CREATE POLICY admin_read_student_passwords ON public.student_passwords FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin : état de connexion des comptes (e-mail confirmé ? dernière connexion ?)
CREATE OR REPLACE FUNCTION public.admin_students_auth_status()
 RETURNS TABLE(user_id uuid, email_confirmed boolean, last_sign_in_at timestamptz)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Réservé à l''admin';
  END IF;
  RETURN QUERY SELECT u.id, u.email_confirmed_at IS NOT NULL, u.last_sign_in_at FROM auth.users u;
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_students_auth_status() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_students_auth_status() TO authenticated;
