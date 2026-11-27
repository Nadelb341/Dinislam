-- 🐛 27/11 (Nadia : la consigne audio d'un devoir libre affichait « Erreur » chez l'élève).
-- Cause : la règle de lecture des 4 espaces privés regardait si le dossier appartient à un admin avec
-- « EXISTS (SELECT … FROM user_roles …) » ; mais un élève ne peut pas lire user_roles (RLS) → toujours faux →
-- il ne pouvait lire AUCUN fichier rangé dans le dossier de l'enseignante (consignes audio, pièces jointes…).
-- Correction : même règle, mais le contrôle « dossier d'un admin » passe par has_role() (SECURITY DEFINER).
drop policy if exists "fichiers_prives_lecture" on storage.objects;
create policy "fichiers_prives_lecture" on storage.objects for select to authenticated using (
  bucket_id = any (array['recitations', 'messages-audio', 'devoirs-audios', 'devoirs-fichiers'])
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.has_role(auth.uid(), 'admin'::app_role)
    or (storage.foldername(name))[1] = any (array['admin', 'prof'])
    or (
      (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and public.has_role(((storage.foldername(name))[1])::uuid, 'admin'::app_role)
    )
  )
);
