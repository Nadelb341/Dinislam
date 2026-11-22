-- 🎯 Une vidéo = un quiz de 10 questions (Nadia, 22/11 : « fais en sorte que je n'ai pas à le redemander »)
-- 1. Lettres particulières : une question peut être un BROUILLON (préparée automatiquement), cachée aux élèves tant que Nadia ne l'a pas validée
alter table public.alphabet_quiz_questions add column if not exists valide boolean not null default true;

-- 2. Quiz d'une vidéo n'importe où dans l'appli (vidéo d'une histoire, du Ramadan des petits, zone de contenu…)
create table if not exists public.quiz_videos (
  id uuid primary key default gen_random_uuid(),
  cible text not null unique,
  questions jsonb not null default '[]'::jsonb,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'valide')),
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.quiz_videos enable row level security;
drop policy if exists "quiz_videos_lecture" on public.quiz_videos;
create policy "quiz_videos_lecture" on public.quiz_videos for select to authenticated
  using (statut = 'valide' or public.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "quiz_videos_admin" on public.quiz_videos;
create policy "quiz_videos_admin" on public.quiz_videos for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role)) with check (public.has_role(auth.uid(), 'admin'::app_role));
do $$ begin
  begin alter publication supabase_realtime add table public.quiz_videos; exception when duplicate_object then null; end;
end $$;

-- 3. Le quiz du tâ marbouta (rédigé par Claude, BROUILLON à valider par Nadia)

insert into public.alphabet_quiz_questions (particularite_id, question, arabe, choix, bonne, explication, position, valide) select p.id, 'Comment s''écrit le tâ marbouta, à la fin d''un mot ?', 'مَدْرَسَة', array['ة','ت','ط']::text[], 0, 'Le tâ marbouta ressemble à un hâ (ه) avec deux points dessus : ة (ou ـة attaché).', 10, false from public.alphabet_particularites p where p.titre = 'Le tâ marbouta' and not exists (select 1 from public.alphabet_quiz_questions x where x.particularite_id = p.id and x.question = 'Comment s''écrit le tâ marbouta, à la fin d''un mot ?');
insert into public.alphabet_quiz_questions (particularite_id, question, arabe, choix, bonne, explication, position, valide) select p.id, 'Où trouve-t-on le tâ marbouta dans un mot ?', null, array['À la fin du mot','Au début du mot','Au milieu du mot']::text[], 0, 'Le tâ marbouta est toujours à la FIN du mot.', 20, false from public.alphabet_particularites p where p.titre = 'Le tâ marbouta' and not exists (select 1 from public.alphabet_quiz_questions x where x.particularite_id = p.id and x.question = 'Où trouve-t-on le tâ marbouta dans un mot ?');
insert into public.alphabet_quiz_questions (particularite_id, question, arabe, choix, bonne, explication, position, valide) select p.id, 'Quand on S''ARRÊTE sur le tâ marbouta, comment le prononce-t-on ?', 'شَجَرَة', array['Comme un « h » léger','Comme un « t »','On ne le lit jamais']::text[], 0, 'À l''arrêt, le tâ marbouta se lit comme un « h » léger : chajarah.', 30, false from public.alphabet_particularites p where p.titre = 'Le tâ marbouta' and not exists (select 1 from public.alphabet_quiz_questions x where x.particularite_id = p.id and x.question = 'Quand on S''ARRÊTE sur le tâ marbouta, comment le prononce-t-on ?');
insert into public.alphabet_quiz_questions (particularite_id, question, arabe, choix, bonne, explication, position, valide) select p.id, 'Quand on CONTINUE à lire (il porte une voyelle), comment le prononce-t-on ?', 'شَجَرَةٌ', array['Comme un « t »','Comme un « h »','Comme un « m »']::text[], 0, 'Sans s''arrêter, il se lit « t » : chajaratoun.', 40, false from public.alphabet_particularites p where p.titre = 'Le tâ marbouta' and not exists (select 1 from public.alphabet_quiz_questions x where x.particularite_id = p.id and x.question = 'Quand on CONTINUE à lire (il porte une voyelle), comment le prononce-t-on ?');
insert into public.alphabet_quiz_questions (particularite_id, question, arabe, choix, bonne, explication, position, valide) select p.id, 'Quel mot se termine par un tâ marbouta ?', null, array['شَجَرَة','بَيْت','كِتَاب']::text[], 0, 'شَجَرَة (l''arbre) finit par ة ; بَيْت finit par un tâ ouvert ت.', 50, false from public.alphabet_particularites p where p.titre = 'Le tâ marbouta' and not exists (select 1 from public.alphabet_quiz_questions x where x.particularite_id = p.id and x.question = 'Quel mot se termine par un tâ marbouta ?');
insert into public.alphabet_quiz_questions (particularite_id, question, arabe, choix, bonne, explication, position, valide) select p.id, 'Le tâ marbouta ressemble à quelle lettre, avec deux points en plus ?', null, array['ه (hâ)','ب (bâ)','ن (noûn)']::text[], 0, 'C''est la forme du hâ (ه) avec les deux points du tâ : ة.', 60, false from public.alphabet_particularites p where p.titre = 'Le tâ marbouta' and not exists (select 1 from public.alphabet_quiz_questions x where x.particularite_id = p.id and x.question = 'Le tâ marbouta ressemble à quelle lettre, avec deux points en plus ?');
insert into public.alphabet_quiz_questions (particularite_id, question, arabe, choix, bonne, explication, position, valide) select p.id, 'Combien de points a le tâ marbouta ?', 'ة', array['2 points','1 point','3 points']::text[], 0, 'Comme le tâ ت, il a deux points au-dessus.', 70, false from public.alphabet_particularites p where p.titre = 'Le tâ marbouta' and not exists (select 1 from public.alphabet_quiz_questions x where x.particularite_id = p.id and x.question = 'Combien de points a le tâ marbouta ?');
insert into public.alphabet_quiz_questions (particularite_id, question, arabe, choix, bonne, explication, position, valide) select p.id, 'Lis sans t''arrêter : مَدْرَسَةٌ. À la fin, on entend…', 'مَدْرَسَةٌ', array['« -toun »','« -houn »','« -soun »']::text[], 0, 'Avec le tanouine, on lit madrasatoun : le tâ marbouta devient « t ».', 80, false from public.alphabet_particularites p where p.titre = 'Le tâ marbouta' and not exists (select 1 from public.alphabet_quiz_questions x where x.particularite_id = p.id and x.question = 'Lis sans t''arrêter : مَدْرَسَةٌ. À la fin, on entend…');
insert into public.alphabet_quiz_questions (particularite_id, question, arabe, choix, bonne, explication, position, valide) select p.id, 'Dans quel mot la fin est un tâ OUVERT (ت), et pas un tâ marbouta ?', null, array['بَيْت','جَنَّة','رَحْمَة']::text[], 0, 'بَيْت (la maison) finit par ت ; جَنَّة et رَحْمَة finissent par ة.', 90, false from public.alphabet_particularites p where p.titre = 'Le tâ marbouta' and not exists (select 1 from public.alphabet_quiz_questions x where x.particularite_id = p.id and x.question = 'Dans quel mot la fin est un tâ OUVERT (ت), et pas un tâ marbouta ?');
insert into public.alphabet_quiz_questions (particularite_id, question, arabe, choix, bonne, explication, position, valide) select p.id, 'Que veut dire « marbouta » ?', null, array['Attachée (fermée)','Ouverte','Longue']::text[], 0, 'Marbouta veut dire « attachée » : le tâ est fermé en rond, ة, alors que le tâ ouvert est ت.', 100, false from public.alphabet_particularites p where p.titre = 'Le tâ marbouta' and not exists (select 1 from public.alphabet_quiz_questions x where x.particularite_id = p.id and x.question = 'Que veut dire « marbouta » ?');

-- 4. Les élèves ne lisent que les questions validées (les brouillons restent à l'enseignante)
drop policy if exists "quiz_lecture" on public.alphabet_quiz_questions;
create policy "quiz_lecture" on public.alphabet_quiz_questions for select to authenticated
  using (valide or public.has_role(auth.uid(), 'admin'::app_role));
