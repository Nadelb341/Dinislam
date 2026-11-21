-- 💬 (Nadia, 2026-11-21 : « oui ») Chaque élève ne voit que SES messages et les réponses de l'enseignante
-- (+ les messages que l'enseignante poste pour toute la classe). L'enseignante voit tout.
create or replace function public.auteur_commentaire(c uuid) returns uuid language sql stable security definer set search_path = public as $$
  select user_id from public.alphabet_commentaires where id = c
$$;
revoke all on function public.auteur_commentaire(uuid) from public, anon;
grant execute on function public.auteur_commentaire(uuid) to authenticated;

drop policy if exists "commentaires_lecture" on public.alphabet_commentaires;
create policy "commentaires_lecture" on public.alphabet_commentaires for select to authenticated using (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  or user_id = auth.uid()
  or (est_admin and (parent_id is null or public.auteur_commentaire(parent_id) = auth.uid()))
);
-- Répondre : seulement sous un message que l'on voit (le sien, ou un message de l'enseignante pour toute la classe)
drop policy if exists "commentaires_ecrire" on public.alphabet_commentaires;
create policy "commentaires_ecrire" on public.alphabet_commentaires for insert to authenticated with check (
  user_id = auth.uid() and (
    parent_id is null
    or public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.auteur_commentaire(parent_id) = auth.uid()
    or exists (select 1 from public.alphabet_commentaires p where p.id = parent_id and p.est_admin and p.parent_id is null)
  )
);
