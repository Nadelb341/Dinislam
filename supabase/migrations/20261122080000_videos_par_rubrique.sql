-- 🎬 Vidéos attachées à toute une carte des tout-petits (ex. « Ramadan et l'Aïd », Nadia 22/11), pas seulement à une histoire
alter table public.histoires_videos alter column fiche_id drop not null;
alter table public.histoires_videos add column if not exists rubrique text;
alter table public.histoires_videos drop constraint if exists histoires_videos_cible;
alter table public.histoires_videos add constraint histoires_videos_cible check ((fiche_id is not null) <> (rubrique is not null));
create index if not exists histoires_videos_rubrique on public.histoires_videos (rubrique, position);
