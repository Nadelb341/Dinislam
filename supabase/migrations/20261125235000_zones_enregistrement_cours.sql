-- 🎥 « Ton enregistrement pendant le cours » (Nadia, 2026-11-25) : dans chaque sourate, une carte violette au-dessus de
-- « Envoyer ma récitation » où l'enseignante dépose une vidéo et/ou un document POUR UN ÉLÈVE (choix de Nadia : élève par élève).
-- Réutilise zones_contenu : cible 'cours-sourate:<numéro>' + eleve_id. Fichiers dans l'espace PRIVÉ devoirs-fichiers
-- (dossier <eleve_id>/…) → seuls l'élève et l'enseignante le voient.
alter table public.zones_contenu add column if not exists eleve_id uuid references auth.users(id) on delete cascade;
create index if not exists zones_contenu_eleve on public.zones_contenu (eleve_id, cible) where eleve_id is not null;

drop policy if exists "zones_contenu_lecture" on public.zones_contenu;
create policy "zones_contenu_lecture" on public.zones_contenu for select to authenticated using (
  eleve_id is null
  or eleve_id = auth.uid()
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);
