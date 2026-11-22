-- 🧸 Tout-petits (Nadia, 2026-11-22, suite) :
-- 1. Qui a l'accueil des tout-petits + quelles cartes y sont ouvertes (réglages, fermées au départ)
-- 2. Lettres de l'onglet « Pour les tout-petits » ouvertes À LA MAIN (au départ : seulement ب pour tous)
-- 3. Quiz audio des histoires (questions + choix en images, ta voix ou celle de l'appareil)
-- 4. « Mes dou'as » devient « Mes invocations » (les 16 invocations de l'appli) : les 6 anciennes fiches vont à la corbeille

-- 1 ──────────────────────────────────────────────────────────────
insert into public.reglages_appli (cle, valeur) values
  ('petits_public', '{"moins6": false, "groupes": ["8ba81084-91b2-4972-ab6e-a751d32d658f"]}'::jsonb),
  ('petits_cartes', '{}'::jsonb)
on conflict (cle) do nothing;

-- 2 ──────────────────────────────────────────────────────────────
create table if not exists public.alphabet_petits_ouvertes (
  id uuid primary key default gen_random_uuid(),
  letter_id integer not null references public.alphabet_letters(id) on delete cascade,
  -- les deux vides = ouverte à tous ; sinon un groupe OU un élève
  group_id uuid references public.student_groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint alphabet_petits_ouvertes_un_seul check (not (group_id is not null and user_id is not null))
);
create unique index if not exists alphabet_petits_ouvertes_unique
  on public.alphabet_petits_ouvertes (letter_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid));
alter table public.alphabet_petits_ouvertes enable row level security;
drop policy if exists "petits_ouvertes_lecture" on public.alphabet_petits_ouvertes;
create policy "petits_ouvertes_lecture" on public.alphabet_petits_ouvertes for select to authenticated using (true);
drop policy if exists "petits_ouvertes_admin" on public.alphabet_petits_ouvertes;
create policy "petits_ouvertes_admin" on public.alphabet_petits_ouvertes for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role)) with check (public.has_role(auth.uid(), 'admin'::app_role));
-- ب ouverte à tous au départ (Nadia commence toujours par ب ; ا revient plus tard dans l'année)
insert into public.alphabet_petits_ouvertes (letter_id) select 2 where not exists (select 1 from public.alphabet_petits_ouvertes where letter_id = 2 and group_id is null and user_id is null);

-- 3 ──────────────────────────────────────────────────────────────
create table if not exists public.petits_quiz (
  id uuid primary key default gen_random_uuid(),
  fiche_id uuid not null references public.petits_fiches(id) on delete cascade,
  question text not null,
  audio_url text,
  -- [{ "texte": "Un bateau", "emoji": "🚢", "image_url": null, "audio_url": null, "juste": true }, …]
  choix jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists petits_quiz_fiche on public.petits_quiz (fiche_id, position);
alter table public.petits_quiz enable row level security;
drop policy if exists "petits_quiz_lecture" on public.petits_quiz;
create policy "petits_quiz_lecture" on public.petits_quiz for select to authenticated using (true);
drop policy if exists "petits_quiz_admin" on public.petits_quiz;
create policy "petits_quiz_admin" on public.petits_quiz for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role)) with check (public.has_role(auth.uid(), 'admin'::app_role));

do $$ begin
  begin alter publication supabase_realtime add table public.alphabet_petits_ouvertes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.petits_quiz; exception when duplicate_object then null; end;
end $$;

-- Quiz de départ : uniquement des faits du Coran (aucun détail inventé)
with q(titre, pos, question, choix) as (values
  ('Nouh et l''arche', 10, 'Qu''est-ce que Nouh a construit ?', '[{"texte":"Un bateau","emoji":"🚢","juste":true},{"texte":"Une maison","emoji":"🏠","juste":false},{"texte":"Une voiture","emoji":"🚗","juste":false}]'),
  ('Nouh et l''arche', 20, 'Qu''est-ce qui est tombé du ciel ?', '[{"texte":"La pluie","emoji":"🌧️","juste":true},{"texte":"La neige","emoji":"❄️","juste":false},{"texte":"Des pommes","emoji":"🍎","juste":false}]'),
  ('Nouh et l''arche', 30, 'Qui est monté dans le bateau avec Nouh ?', '[{"texte":"Les animaux, deux par deux","emoji":"🐑","juste":true},{"texte":"Des dinosaures","emoji":"🦖","juste":false},{"texte":"Des robots","emoji":"🤖","juste":false}]'),
  ('Younous et la baleine', 10, 'Où était Younous quand la tempête est arrivée ?', '[{"texte":"Sur un bateau","emoji":"🚢","juste":true},{"texte":"Dans un avion","emoji":"✈️","juste":false},{"texte":"Dans sa maison","emoji":"🏠","juste":false}]'),
  ('Younous et la baleine', 20, 'Qui a avalé Younous ?', '[{"texte":"Une baleine","emoji":"🐋","juste":true},{"texte":"Un lion","emoji":"🦁","juste":false},{"texte":"Un oiseau","emoji":"🐦","juste":false}]'),
  ('Younous et la baleine', 30, 'Qu''a fait Younous dans le ventre de la baleine ?', '[{"texte":"Il a fait une dou''a à Allah","emoji":"🤲","juste":true},{"texte":"Il a dormi","emoji":"😴","juste":false},{"texte":"Il a mangé","emoji":"🍽️","juste":false}]'),
  ('Ibrahim et le feu', 10, 'Qu''est-ce que le peuple d''Ibrahim adorait ?', '[{"texte":"Des statues","emoji":"🗿","juste":true},{"texte":"Des ballons","emoji":"⚽","juste":false},{"texte":"Des glaces","emoji":"🍦","juste":false}]'),
  ('Ibrahim et le feu', 20, 'Qu''est-ce qu''Allah a dit au feu ?', '[{"texte":"Sois fraîcheur et paix","emoji":"❄️","juste":true},{"texte":"Brûle très fort","emoji":"🔥","juste":false},{"texte":"Envole-toi","emoji":"💨","juste":false}]'),
  ('Ibrahim et le feu', 30, 'Qui a créé les étoiles, la lune et le soleil ?', '[{"texte":"Allah","emoji":"☝️","juste":true},{"texte":"Les statues","emoji":"🗿","juste":false},{"texte":"Le roi","emoji":"👑","juste":false}]'),
  ('Moussa et la mer', 10, 'Où la maman de Moussa a-t-elle posé son bébé ?', '[{"texte":"Dans un panier sur le fleuve","emoji":"🧺","juste":true},{"texte":"Dans un arbre","emoji":"🌳","juste":false},{"texte":"Dans une voiture","emoji":"🚗","juste":false}]'),
  ('Moussa et la mer', 20, 'Qui a gardé le bébé Moussa dans le palais ?', '[{"texte":"La femme de Pharaon","emoji":"👑","juste":true},{"texte":"Un crocodile","emoji":"🐊","juste":false},{"texte":"Un lion","emoji":"🦁","juste":false}]'),
  ('Moussa et la mer', 30, 'Qu''est-ce qui est arrivé à la mer ?', '[{"texte":"Elle s''est ouverte en deux","emoji":"🌊","juste":true},{"texte":"Elle a gelé","emoji":"🧊","juste":false},{"texte":"Elle a disparu","emoji":"💨","juste":false}]')
)
insert into public.petits_quiz (fiche_id, question, choix, position)
select f.id, q.question, q.choix::jsonb, q.pos
from q join public.petits_fiches f on f.rubrique = 'histoires' and f.titre = q.titre
where not exists (select 1 from public.petits_quiz x where x.fiche_id = f.id and x.question = q.question);

-- 4 ──────────────────────────────────────────────────────────────
-- Les 6 anciennes fiches « Mes petites dou'as » vont à la corbeille de Nadia (restaurables), puis sont retirées
insert into public.trash_items (user_id, item_type, original_id, label, item_data)
select r.user_id, 'petits_fiche', f.id::text, f.titre || ' (ancienne « Mes petites dou''as », remplacée par Mes invocations)', to_jsonb(f)
from public.petits_fiches f
cross join lateral (select user_id from public.user_roles where role = 'admin'::app_role order by user_id limit 1) r
where f.rubrique = 'douas';
delete from public.petits_fiches where rubrique = 'douas';
