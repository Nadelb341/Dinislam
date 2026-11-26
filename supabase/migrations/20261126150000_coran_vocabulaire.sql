-- 📖 Coran › onglet « Vocabulaire du Coran » (Nadia, 2026-11-26) : 3 sous-cartes tirées de ses PDF
-- (« 80 % des mots du Coran », « Calligraphie du Coran », « Lecture facile du Coran »), chacune découpée
-- en sous-sous-cartes (une partie du sommaire = un PDF dans public/pdf/coran/vocabulaire/…).
-- ADDITIF et IDEMPOTENT : une nouvelle table, rien d'existant n'est modifié. À appliquer avec
-- `supabase db query --linked -f` (JAMAIS `db push`).
--
-- « Afficher à » d'une sous-carte = même logique et mêmes colonnes que les onglets de l'Alphabet
-- (alphabet_onglets : mode tous / certains / personne + group_ids + user_ids), même fenêtre ChoixQuiVoit.
-- Une sous-sous-carte se voit seulement si TOUTES ses cartes parentes se voient.

create table if not exists public.coran_vocabulaire (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.coran_vocabulaire(id) on delete cascade,
  cle text unique,
  titre text not null,
  emoji text,
  couleur text,
  pdf_url text,
  page_debut integer,
  page_fin integer,
  position integer not null default 0,
  mode text not null default 'tous' check (mode in ('tous', 'certains', 'personne')),
  group_ids uuid[] not null default '{}',
  user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coran_vocabulaire_parent on public.coran_vocabulaire (parent_id, position);

-- Visible par la personne connectée ? (la carte ET toutes ses cartes parentes)
create or replace function public.coran_vocabulaire_visible(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with recursive chaine as (
    select c.id, c.parent_id, c.mode, c.group_ids, c.user_ids, 1 as n
    from public.coran_vocabulaire c where c.id = p_id
    union all
    select c.id, c.parent_id, c.mode, c.group_ids, c.user_ids, ch.n + 1
    from public.coran_vocabulaire c join chaine ch on c.id = ch.parent_id
    where ch.n < 20
  )
  select coalesce(bool_and(
    ch.mode = 'tous'
    or (ch.mode = 'certains' and (
      auth.uid() = any(ch.user_ids)
      or exists (select 1 from public.student_group_members m where m.user_id = auth.uid() and m.group_id = any(ch.group_ids))
    ))
  ), false)
  from chaine ch;
$$;
revoke all on function public.coran_vocabulaire_visible(uuid) from public;
grant execute on function public.coran_vocabulaire_visible(uuid) to authenticated;

alter table public.coran_vocabulaire enable row level security;
drop policy if exists "coran_vocabulaire_lecture" on public.coran_vocabulaire;
create policy "coran_vocabulaire_lecture" on public.coran_vocabulaire for select to authenticated using (
  public.has_role(auth.uid(), 'admin'::public.app_role) or public.coran_vocabulaire_visible(id)
);
drop policy if exists "coran_vocabulaire_admin" on public.coran_vocabulaire;
create policy "coran_vocabulaire_admin" on public.coran_vocabulaire for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- En direct (realtimeSync.ts : clé 'coran-vocabulaire')
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'coran_vocabulaire') then
    alter publication supabase_realtime add table public.coran_vocabulaire;
  end if;
end $$;

-- Contenu de départ : les 3 sous-cartes et leurs parties (pages = pages du PDF entier).
-- « 80 % des mots du Coran » : tout le monde ; les 2 autres : personne tant que Nadia ne l'ouvre pas.
insert into public.coran_vocabulaire (cle, titre, emoji, couleur, pdf_url, page_debut, page_fin, position, mode)
values ('80-mots', '80 % des mots du Coran', '🔤', 'emerald', '/pdf/coran/vocabulaire/80-mots/80-des-mots-du-coran.pdf', 1, 75, 10, 'tous')
on conflict (cle) do nothing;

insert into public.coran_vocabulaire (parent_id, cle, titre, pdf_url, page_debut, page_fin, position)
select (select id from public.coran_vocabulaire where cle = '80-mots'), v.cle, v.titre, v.pdf_url, v.debut, v.fin, v.pos
from (values
  ('80-mots/introduction', 'INTRODUCTION', '/pdf/coran/vocabulaire/80-mots/01-introduction.pdf', 3, 21, 10),
  ('80-mots/40-des-mots', '40% DES MOTS DU QOUR’ÂN', '/pdf/coran/vocabulaire/80-mots/02-40-des-mots.pdf', 22, 34, 20),
  ('80-mots/noms-divins', 'NOMS DIVINS ET AUTRES QUALIFICATIFS', '/pdf/coran/vocabulaire/80-mots/03-noms-divins.pdf', 35, 39, 30),
  ('80-mots/creation', 'CREATION D’ALLAH', '/pdf/coran/vocabulaire/80-mots/04-creation.pdf', 40, 43, 40),
  ('80-mots/religion-foi-actes', 'RELIGION, FOI ET ACTES', '/pdf/coran/vocabulaire/80-mots/05-religion-foi-actes.pdf', 44, 49, 50),
  ('80-mots/personnes', 'PERSONNES', '/pdf/coran/vocabulaire/80-mots/06-personnes.pdf', 50, 54, 60),
  ('80-mots/verbes-et-derives', 'LES VERBES ET DERIVES', '/pdf/coran/vocabulaire/80-mots/07-verbes-et-derives.pdf', 55, 75, 70)
) as v(cle, titre, pdf_url, debut, fin, pos)
on conflict (cle) do nothing;

insert into public.coran_vocabulaire (cle, titre, emoji, couleur, pdf_url, page_debut, page_fin, position, mode)
values ('calligraphie', 'Calligraphie du Coran', '✒️', 'violet', '/pdf/coran/vocabulaire/calligraphie/calligraphie-du-coran.pdf', 1, 24, 20, 'personne')
on conflict (cle) do nothing;

insert into public.coran_vocabulaire (parent_id, cle, titre, pdf_url, page_debut, page_fin, position)
select (select id from public.coran_vocabulaire where cle = 'calligraphie'), v.cle, v.titre, v.pdf_url, v.debut, v.fin, v.pos
from (values
  ('calligraphie/introduction', 'Introduction', '/pdf/coran/vocabulaire/calligraphie/01-introduction.pdf', 1, 1, 10),
  ('calligraphie/lettres-non-prononcees', 'Lettres qu’on ne prononce pas et prolongations', '/pdf/coran/vocabulaire/calligraphie/02-lettres-non-prononcees.pdf', 2, 5, 20),
  ('calligraphie/ya-ta-ha', 'Le yâ, le tâ et le hâ', '/pdf/coran/vocabulaire/calligraphie/03-ya-ta-ha.pdf', 6, 9, 30),
  ('calligraphie/mim-lam-hamza', 'Le mîm, le lâm et la hamza', '/pdf/coran/vocabulaire/calligraphie/04-mim-lam-hamza.pdf', 10, 13, 40),
  ('calligraphie/ta-marbouta-hizb-sajda', 'Tâ marbouta, hizb et prosternation', '/pdf/coran/vocabulaire/calligraphie/05-ta-marbouta-hizb-sajda.pdf', 14, 15, 50),
  ('calligraphie/signes-arret', 'Les signes d’arrêt', '/pdf/coran/vocabulaire/calligraphie/06-signes-arret.pdf', 16, 18, 60),
  ('calligraphie/autres-signes', 'Prolongations, lettres muettes et tanwîn', '/pdf/coran/vocabulaire/calligraphie/07-autres-signes.pdf', 19, 22, 70),
  ('calligraphie/conclusion', 'Conclusion', '/pdf/coran/vocabulaire/calligraphie/08-conclusion.pdf', 23, 24, 80)
) as v(cle, titre, pdf_url, debut, fin, pos)
on conflict (cle) do nothing;

insert into public.coran_vocabulaire (cle, titre, emoji, couleur, pdf_url, page_debut, page_fin, position, mode)
values ('lecture-facile', 'Lecture facile du Coran', '📖', 'sky', '/pdf/coran/vocabulaire/lecture-facile/lecture-facile-du-coran.pdf', 1, 178, 30, 'personne')
on conflict (cle) do nothing;

insert into public.coran_vocabulaire (parent_id, cle, titre, pdf_url, page_debut, page_fin, position)
select (select id from public.coran_vocabulaire where cle = 'lecture-facile'), v.cle, v.titre, v.pdf_url, v.debut, v.fin, v.pos
from (values
  ('lecture-facile/introduction', 'INTRODUCTION', '/pdf/coran/vocabulaire/lecture-facile/01-introduction.pdf', 10, 13, 10),
  ('lecture-facile/cours-01', 'COURS N°1 : LES LETTRES DE L’ALPHABET ARABE', '/pdf/coran/vocabulaire/lecture-facile/02-cours-01.pdf', 14, 17, 20),
  ('lecture-facile/cours-02', 'COURS N°2 : LA PRONONCIATION DES LETTRES ARABES', '/pdf/coran/vocabulaire/lecture-facile/03-cours-02.pdf', 18, 27, 30),
  ('lecture-facile/cours-03', 'COURS N°3 : LES DIFFERENTES FORMES DES LETTRES ARABES', '/pdf/coran/vocabulaire/lecture-facile/04-cours-03.pdf', 28, 31, 40),
  ('lecture-facile/cours-04', 'COURS N°4 : LES « HOUROUF AL-MOUQATTA’A »', '/pdf/coran/vocabulaire/lecture-facile/05-cours-04.pdf', 32, 35, 50),
  ('lecture-facile/cours-05', 'COURS N°5 : LA VOYELLE COURTE « FAT-HA »', '/pdf/coran/vocabulaire/lecture-facile/06-cours-05.pdf', 36, 39, 60),
  ('lecture-facile/cours-06', 'COURS N°6 : LA VOYELLE COURTE « KASSRA »', '/pdf/coran/vocabulaire/lecture-facile/07-cours-06.pdf', 40, 43, 70),
  ('lecture-facile/cours-07', 'COURS N°7 : LA VOYELLE COURTE « DHAMMA »', '/pdf/coran/vocabulaire/lecture-facile/08-cours-07.pdf', 44, 47, 80),
  ('lecture-facile/cours-08', 'COURS N°8 : LA VOYELLE LONGUE « ALIF MADDI »', '/pdf/coran/vocabulaire/lecture-facile/09-cours-08.pdf', 48, 55, 90),
  ('lecture-facile/cours-09', 'COURS N°9 : LA VOYELLE LONGUE « YA MADDI »', '/pdf/coran/vocabulaire/lecture-facile/10-cours-09.pdf', 56, 61, 100),
  ('lecture-facile/cours-10', 'COURS N°10 : LA VOYELLE LONGUE « WAW MADDI »', '/pdf/coran/vocabulaire/lecture-facile/11-cours-10.pdf', 62, 69, 110),
  ('lecture-facile/cours-11', 'COURS N°11 : LE « SOUKOUNE » OU L’ABSENCE DE VOYELLE', '/pdf/coran/vocabulaire/lecture-facile/12-cours-11.pdf', 70, 75, 120),
  ('lecture-facile/cours-12', 'COURS N°12 : LE « TASHDIDE » OU LE DOUBLEMENT DE LA CONSONNE', '/pdf/coran/vocabulaire/lecture-facile/13-cours-12.pdf', 76, 81, 130),
  ('lecture-facile/cours-13', 'COURS N°13 : LE « TANWINE »', '/pdf/coran/vocabulaire/lecture-facile/14-cours-13.pdf', 82, 87, 140),
  ('lecture-facile/cours-14', 'COURS N°14 : LE « MADD »', '/pdf/coran/vocabulaire/lecture-facile/15-cours-14.pdf', 88, 91, 150),
  ('lecture-facile/cours-15', 'COURS N°15 : LES LETTRES MUETTES (1)', '/pdf/coran/vocabulaire/lecture-facile/16-cours-15.pdf', 92, 97, 160),
  ('lecture-facile/cours-16', 'COURS N°16 : LES LETTRES MUETTES (2)', '/pdf/coran/vocabulaire/lecture-facile/17-cours-16.pdf', 98, 101, 170),
  ('lecture-facile/cours-17', 'COURS N°17 : LES LETTRES MUETTES (3)', '/pdf/coran/vocabulaire/lecture-facile/18-cours-17.pdf', 102, 109, 180),
  ('lecture-facile/cours-18', 'COURS N°18 : LES LETTRES MUETTES (4)', '/pdf/coran/vocabulaire/lecture-facile/19-cours-18.pdf', 110, 119, 190),
  ('lecture-facile/cours-19', 'COURS N°19 : LE « ISHBA’ » OU LA TRANSFORMATION D’UNE VOYELLE COURTE EN VOYELLE LONGUE', '/pdf/coran/vocabulaire/lecture-facile/20-cours-19.pdf', 120, 127, 200),
  ('lecture-facile/cours-20', 'COURS N°20 : LA RENCONTRE DE DEUX LETTRES SAKINE', '/pdf/coran/vocabulaire/lecture-facile/21-cours-20.pdf', 128, 133, 210),
  ('lecture-facile/cours-21', 'COURS N°21 : LA PRONONCIATION DU « ALIF AL-WASSL » EN DEBUT DE MOT', '/pdf/coran/vocabulaire/lecture-facile/22-cours-21.pdf', 134, 141, 220),
  ('lecture-facile/cours-22', 'COURS N°22 : LA REGLE DE L’ARRET', '/pdf/coran/vocabulaire/lecture-facile/23-cours-22.pdf', 142, 147, 230),
  ('lecture-facile/cours-23', 'COURS N°23 : LES SIGNES D’ARRET DANS LE CORAN', '/pdf/coran/vocabulaire/lecture-facile/24-cours-23.pdf', 148, 153, 240),
  ('lecture-facile/cours-24', 'COURS N°24 : L’« IQLAB »', '/pdf/coran/vocabulaire/lecture-facile/25-cours-24.pdf', 154, 157, 250),
  ('lecture-facile/cours-25', 'COURS N°25 : L’« IDGHAME »', '/pdf/coran/vocabulaire/lecture-facile/26-cours-25.pdf', 158, 163, 260),
  ('lecture-facile/cours-26', 'COURS N°26 : CONNAITRE DIVERS SIGNES PRESENTS DANS LE CORAN', '/pdf/coran/vocabulaire/lecture-facile/27-cours-26.pdf', 164, 169, 270),
  ('lecture-facile/entrainement-final', 'ENTRAINEMENT FINAL', '/pdf/coran/vocabulaire/lecture-facile/28-entrainement-final.pdf', 170, 171, 280),
  ('lecture-facile/appendice-recitations-priere', 'APPENDICE : LES RECITATIONS DE LA PRIERE', '/pdf/coran/vocabulaire/lecture-facile/29-appendice-recitations-priere.pdf', 172, 175, 290)
) as v(cle, titre, pdf_url, debut, fin, pos)
on conflict (cle) do nothing;
