-- 🎯 Évaluation (quiz) des particularités de l'Alphabet (Nadia, 2026-11-21) : questions modifiables par l'enseignante.
-- Départ : 10 questions sur la chadda, écrites pour Dinislam (pas recopiées d'un autre site).
create table if not exists public.alphabet_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  particularite_id uuid not null references public.alphabet_particularites(id) on delete cascade,
  question text not null,
  arabe text,
  choix text[] not null,
  bonne int not null default 0,
  explication text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint quiz_choix_ok check (array_length(choix, 1) between 2 and 4 and bonne >= 0 and bonne < array_length(choix, 1))
);
create index if not exists alphabet_quiz_questions_part on public.alphabet_quiz_questions (particularite_id, position);
alter table public.alphabet_quiz_questions enable row level security;
drop policy if exists "quiz_lecture" on public.alphabet_quiz_questions;
create policy "quiz_lecture" on public.alphabet_quiz_questions for select to authenticated using (true);
drop policy if exists "quiz_admin" on public.alphabet_quiz_questions;
create policy "quiz_admin" on public.alphabet_quiz_questions for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alphabet_quiz_questions') then
    alter publication supabase_realtime add table public.alphabet_quiz_questions;
  end if;
end $$;

do $$
declare p uuid;
begin
  select id into p from public.alphabet_particularites where titre = 'La chadda' limit 1;
  if p is null or exists (select 1 from public.alphabet_quiz_questions where particularite_id = p) then return; end if;

  -- Un 2e texte d'explication (écrit pour Dinislam)
  if not exists (select 1 from public.alphabet_particularite_blocs where particularite_id = p and texte like 'Comment la lire%') then
    insert into public.alphabet_particularite_blocs (particularite_id, kind, texte, position) values (p, 'texte',
      'Comment la lire : la lettre avec chadda compte pour DEUX lettres. La 1re a un soukoune, la 2e porte la voyelle.' || chr(10) ||
      'رَبَّ = رَبْ + بَ (rab-ba)' || chr(10) || 'مُحَمَّد = مُحَمْ + مَد (Mou-ham-mad)' || chr(10) ||
      'La chadda ne vient jamais seule : elle est toujours avec une fatha, une kasra ou une damma (ou un tanouine).', 10);
  end if;

  insert into public.alphabet_quiz_questions (particularite_id, question, arabe, choix, bonne, explication, position) values
  (p, 'Comment s''appelle ce signe ?', 'ّ', array['La chadda','Le soukoune','Le tanouine','La fatha'], 0, 'C''est la chadda : un petit « w » posé sur la lettre.', 10),
  (p, 'À quoi sert la chadda ?', null, array['À doubler la lettre','À allonger le son','À ajouter un « n »','À arrêter la voix'], 0, 'La lettre est doublée : on appuie dessus deux fois.', 20),
  (p, 'Où se place la chadda ?', null, array['Au-dessus de la lettre','Sous la lettre','À côté de la lettre','Au début du mot'], 0, 'Toujours au-dessus de la lettre.', 30),
  (p, 'Comment lit-on ce mot ?', 'رَبّ', array['rabb','rab','raba','rib'], 0, 'Le ب est doublé : rabb.', 40),
  (p, 'Une lettre avec chadda compte pour…', null, array['2 lettres','1 lettre','3 lettres'], 0, 'La 1re avec soukoune, la 2e avec la voyelle.', 50),
  (p, 'Comment lit-on ce prénom ?', 'مُحَمَّد', array['Mouhammad','Mouhamad','Mahmoud','Hamid'], 0, 'Le م est doublé : Mou-ham-mad.', 60),
  (p, 'Quel mot contient une chadda ?', null, array['جَنَّة','كَتَبَ','قَلَم','بَاب'], 0, 'جَنَّة (janna) : le ن est doublé.', 70),
  (p, 'Comment se lit بَّ (chadda + fatha) ?', null, array['bba (b doublé)','ba','bâ (long)','bi'], 0, 'La chadda double le b, la fatha donne le son « a ».', 80),
  (p, 'Dans الشَّمْس, pourquoi le ش a-t-il une chadda ?', 'الشَّمْس', array['Le ش est une lettre solaire : le ل ne se prononce pas','Le ش est une lettre lunaire','C''est la fin du mot','À cause du tanouine'], 0, 'Lettre solaire : on lit ach-chams.', 90),
  (p, 'Comment lit-on ce mot ?', 'إِنَّ', array['inna','ina','inn','înâ'], 0, 'Le ن est doublé : in-na.', 100);
end $$;
