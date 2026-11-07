-- 🔒 Audit TAZ/ZAT du 2026-11-07 — lot 1 (choix de Nadia : idées 1, 2, 8, 16)

-- (1) Messagerie : un élève n'écrit QUE dans sa propre boîte, en son nom (sender_type 'user'),
--     et ne peut modifier d'un message que « lu » / « supprimé ». Faux messages « du professeur » impossibles.
drop policy if exists students_can_insert_messages on public.user_messages;
create policy students_can_insert_messages on public.user_messages
  for insert to authenticated
  with check (user_id = auth.uid() and coalesce(sender_type, 'user') = 'user');

create or replace function public.garde_user_messages()
returns trigger language plpgsql security definer set search_path = public as $$
declare tmp public.user_messages;
begin
  -- tâches serveur (pas d'utilisateur) et admin : libres
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then return new; end if;
  if tg_op = 'INSERT' then
    if new.user_id is distinct from auth.uid()
       or coalesce(new.sender_type, 'user') <> 'user'
       or coalesce(new.message_type, 'text') not in ('text', 'audio')
       or (new.sender_id is not null and new.sender_id <> auth.uid())
       or new.receiver_id is not null then
      raise exception 'Message refusé : un élève ne peut écrire que dans sa propre conversation';
    end if;
    return new;
  end if;
  -- UPDATE : seuls is_read / read_at / deleted_at peuvent changer
  tmp := new;
  tmp.is_read := old.is_read; tmp.read_at := old.read_at; tmp.deleted_at := old.deleted_at;
  if tmp is distinct from old then
    raise exception 'Modification refusée : seul l''état « lu » ou « supprimé » peut changer';
  end if;
  return new;
end $$;
drop trigger if exists garde_user_messages on public.user_messages;
create trigger garde_user_messages before insert or update on public.user_messages
  for each row execute function public.garde_user_messages();

-- (2) Contenu des sourates : écriture réservée à l'admin (règle « Admins can manage sourate_content » déjà là),
--     et un contenu destiné à UN élève n'est plus visible par les autres.
drop policy if exists admins_can_insert_content on public.sourate_content;
drop policy if exists admins_can_update_content on public.sourate_content;
drop policy if exists admins_can_delete_content on public.sourate_content;
drop policy if exists "Anyone can view sourate_content" on public.sourate_content;
-- reste : students_see_their_content (target_user_id null ou = moi) + admin ALL

-- (8) Jeux de l'Alphabet : maximum réaliste (100 bonnes réponses par partie) et date imposée = aujourd'hui (Paris)
alter table public.alphabet_game_scores drop constraint if exists alphabet_scores_max_realiste;
alter table public.alphabet_game_scores add constraint alphabet_scores_max_realiste check (total <= 100);
create or replace function public.garde_alphabet_scores()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(), 'admin'::app_role) then
    new.played_on := (now() at time zone 'Europe/Paris')::date;
    new.created_at := now();
  end if;
  return new;
end $$;
drop trigger if exists garde_alphabet_scores on public.alphabet_game_scores;
create trigger garde_alphabet_scores before insert on public.alphabet_game_scores
  for each row execute function public.garde_alphabet_scores();

-- (16) Un seul rendu par devoir et par élève (le code met déjà à jour le rendu existant)
create unique index if not exists devoirs_rendus_un_par_eleve on public.devoirs_rendus (devoir_id, student_id);
