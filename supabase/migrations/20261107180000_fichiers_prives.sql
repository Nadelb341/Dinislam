-- 🔒 Audit TAZ/ZAT du 2026-11-07 — idée 4 : voix et photos des enfants PRIVÉES
-- Avant : 4 espaces publics → n'importe qui sur Internet pouvait lister et télécharger les récitations, audios et photos.
-- L'appli lit désormais ces fichiers par des liens signés (src/lib/fichiersPrives.ts, en ligne depuis d22aad0).

drop policy if exists "Public read recitations" on storage.objects;
drop policy if exists public_read_devoirs_audio on storage.objects;
drop policy if exists public_read_messages_audio on storage.objects;
drop policy if exists devoirs_fichiers_lecture on storage.objects;
drop policy if exists "Users can read own audio" on storage.objects;

-- Lecture (connecté seulement) : son propre dossier ; tout pour l'enseignante ;
-- les fichiers DU PROFESSEUR (dossiers « admin », « prof » ou au nom d'un compte admin) pour tous les élèves.
create policy fichiers_prives_lecture on storage.objects for select to authenticated using (
  bucket_id in ('recitations', 'messages-audio', 'devoirs-audios', 'devoirs-fichiers')
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.has_role(auth.uid(), 'admin'::app_role)
    or (storage.foldername(name))[1] in ('admin', 'prof')
    or exists (select 1 from public.user_roles r where r.role = 'admin' and r.user_id::text = (storage.foldername(name))[1])
  )
);

update storage.buckets set public = false where id in ('recitations', 'messages-audio', 'devoirs-audios', 'devoirs-fichiers');
