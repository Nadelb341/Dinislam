-- 2026-11-26 (Nadia : liens entre cartes + mises à jour de janvier et de juin)
-- Additif et rejouable sans risque (IF NOT EXISTS / ON CONFLICT DO NOTHING). Aucune donnée effacée.
-- À appliquer avec : supabase db query --linked -f supabase/migrations/20261126120000_liens_cartes_et_revue_semestre.sql
-- (JAMAIS supabase db push)

-- ───────────── L6 : Histoires des Prophètes → sourate liée ─────────────
alter table public.petits_fiches add column if not exists sourate_liee int;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'petits_fiches_sourate_liee_ok') then
    alter table public.petits_fiches add constraint petits_fiches_sourate_liee_ok check (sourate_liee is null or sourate_liee between 1 and 114);
  end if;
end $$;
comment on column public.petits_fiches.sourate_liee is 'Numéro de la sourate liée à l''histoire (bouton « 📖 La sourate »), facultatif — 2026-11-26';
-- Cas SÛRS seulement, et seulement si la case est encore vide (jamais écraser un choix de Nadia) :
-- L'armée de l'éléphant → sourate 105 Al-Fîl ; Youssouf → sourate 12 (aucune fiche Youssouf au 26/11 : ne fait rien)
update public.petits_fiches set sourate_liee = 105, updated_at = now()
  where rubrique = 'prophetes' and sourate_liee is null and titre = 'L''armée de l''éléphant';
update public.petits_fiches set sourate_liee = 12, updated_at = now()
  where rubrique = 'prophetes' and sourate_liee is null and titre ilike '%youssouf%';

-- ───────────── L17 : un message du carnet peut ouvrir une carte (« 🔗 Ouvrir la leçon ») ─────────────
alter table public.carnet_messages add column if not exists lien text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'carnet_messages_lien_interne') then
    -- seulement un chemin de l'appli (« /coran », « /module/hadiths »…), jamais une adresse extérieure
    alter table public.carnet_messages add constraint carnet_messages_lien_interne check (lien is null or lien ~ '^/[a-z0-9/_-]*$');
  end if;
end $$;
comment on column public.carnet_messages.lien is 'Carte de l''appli à ouvrir (« 🔗 Ouvrir la leçon »), chemin interne — 2026-11-26';

-- ───────────── M2 / M4 : liste « 🔄 À revoir chaque semestre » (enseignante seulement) ─────────────
create table if not exists public.revue_semestre (
  id uuid primary key default gen_random_uuid(),
  cle text not null unique,
  position int not null default 0,
  titre text not null,
  quoi text not null default '',
  source_nom text,
  source_url text,
  fichier text,
  verifie_le date,
  fait boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.revue_semestre enable row level security;
drop policy if exists revue_semestre_admin on public.revue_semestre;
create policy revue_semestre_admin on public.revue_semestre for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'revue_semestre') then
    alter publication supabase_realtime add table public.revue_semestre;
  end if;
end $$;

insert into public.revue_semestre (cle, position, titre, quoi, source_nom, source_url, fichier, verifie_le) values
 ('vacances-zone-c', 10, '🏖️ Vacances scolaires zone C', 'Dates des vacances de l''année en cours et de la suivante (Toussaint, Noël, hiver, printemps, été).', 'Calendrier scolaire (ministère de l''Éducation)', 'https://www.education.gouv.fr/calendrier-scolaire-100148', 'table school_holidays', '2026-11-26'),
 ('vacances-2028-2029', 20, '🏖️ Vacances 2028-2029 à ajouter dès parution au Journal officiel', 'Dès que l''arrêté est publié : ajouter toutes les dates 2028-2029 de la zone C.', 'Légifrance (Journal officiel)', 'https://www.legifrance.gouv.fr', 'table school_holidays', null),
 ('ramadan-aids', 30, '🌙 Dates du Ramadan et des deux Aïds', 'Vérifier le 1er jour du Ramadan, l''Aïd el-Fitr et l''Aïd el-Adha annoncés ; les écrire dans bouclier › Décorations saisons › 🌙 Ramadan si le calcul diffère.', 'Grande Mosquée de Paris', 'https://www.mosqueedeparis.net', 'src/lib/ramadanDates.ts + supabase/functions/_shared/ramadanDates.ts (à changer ensemble)', '2026-11-26'),
 ('calendrier-amces', 40, '🕌 Calendrier AMCES (Clermont-l''Hérault)', 'Comparer le nouveau calendrier de l''année avec le calcul de l''appli (Fajr 15°, Icha = Maghrib + 80 min) ; écart attendu ≤ 2 min.', 'AMCES (calendrier de la mosquée)', null, 'src/lib/horairesCalcul.ts (METHODE_AMCES), src/data/amcesCalendar2026.ts', '2026-11-16'),
 ('methodes-calcul', 50, '🧭 Méthodes de calcul des horaires', 'Bibliothèque adhan : nouvelle version ? méthodes MWL / UOIF / ISNA toujours justes ? Même calcul côté serveur (prayer-reminders).', 'adhan-js (GitHub)', 'https://github.com/batoulapps/adhan-js', 'src/lib/horairesCalcul.ts, supabase/functions/prayer-reminders', '2026-11-15'),
 ('villes-open-meteo', 60, '📍 Recherche des villes (Open-Meteo)', 'Le service de recherche de villes est-il toujours gratuit et sans clé ? Conditions d''utilisation inchangées ?', 'Open-Meteo Geocoding API', 'https://open-meteo.com/en/docs/geocoding-api', 'src/lib/ville.ts', '2026-11-15'),
 ('meteo', 70, '⛅ Météo des saisons (Open-Meteo)', 'Service météo toujours gratuit pour un usage non commercial ? Adresse de l''API inchangée ?', 'Open-Meteo (conditions)', 'https://open-meteo.com/en/terms', 'src/components/saisons/MeteoSaison.tsx', null),
 ('alquran-cloud', 80, '📖 Versets du Coran (alquran.cloud)', 'L''API répond toujours ? Gratuite ? Même format ?', 'alquran.cloud', 'https://alquran.cloud/api', 'src/hooks/useQuranVerses.ts', null),
 ('islamic-network', 90, '🎧 Récitations audio (islamic.network)', 'Les fichiers audio des sourates sont toujours servis à la même adresse ?', 'Islamic Network CDN', 'https://islamic.network', 'src/components/sourates/cdnAudio.ts', null),
 ('nospetitsmusulmans', 100, '🧒 Versets pour enfants (nospetitsmusulmans.com)', 'Le site répond toujours ? Les adresses des fichiers n''ont pas changé ?', 'nospetitsmusulmans.com', 'https://www.nospetitsmusulmans.com', 'src/components/sourates/npmVersets.ts', null),
 ('videos-youtube', 110, '🎬 Vidéos YouTube de l''appli', 'Chaque vidéo est toujours en ligne et publique (Houssary, histoires, invocations, Houroufs, Ramadan) ; remplacer celles qui ont disparu.', 'YouTube', 'https://www.youtube.com', 'src/data/houssaryVideos.ts, src/data/invocationsData.ts, src/lib/alphabetMedias.ts, table histoires_videos', null),
 ('modele-gemini', 120, '🤖 Modèle d''IA Gemini (quiz, mascotte, assistant, bilans)', 'Le modèle utilisé existe toujours ? Toujours gratuit (Google AI Studio) ? Sinon, changer le nom du modèle dans les 5 fonctions.', 'Google AI : modèles et tarifs', 'https://ai.google.dev/gemini-api/docs/models', 'supabase/functions : admin-assistant, mascot-chat, generate-flashcards, quiz-video, translate-bilan', null),
 ('notifications', 130, '🔔 Notifications iPhone et Android', 'Règles d''Apple et de Google pour les notifications d''une appli web (installation obligatoire sur iPhone, autorisations).', 'Apple : notifications des applis web', 'https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers', 'src/components/push/GuideInstallation.tsx, src/lib/installationAppli.ts', '2026-11-26'),
 ('node', 140, '🟢 Version de Node', 'La version 24 est-elle toujours suivie ? Même réglage dans package.json (engines) et dans Vercel.', 'Node.js : versions', 'https://nodejs.org/en/about/previous-releases', 'package.json (engines.node)', null),
 ('bibliotheques', 150, '📦 Bibliothèques de l''appli', 'npm outdated : mises à jour de sécurité ; grandes mises à jour (Vite, React, Tailwind, React Router) = chantier à part, demander avant.', 'npm', 'https://www.npmjs.com', 'package.json', null),
 ('forfait-supabase', 160, '🆓 Forfait gratuit Supabase', 'Limites du forfait gratuit (base, stockage 1 Go, transfert) toujours les mêmes ? Où en est l''appli ?', 'Supabase : tarifs', 'https://supabase.com/pricing', 'tableau de bord Supabase', null),
 ('forfait-vercel', 170, '🆓 Forfait gratuit Vercel (Hobby)', 'Limites du forfait Hobby toujours les mêmes ? Où en est l''appli ?', 'Vercel : tarifs', 'https://vercel.com/pricing', 'tableau de bord Vercel', null),
 ('sauvegarde', 180, '💾 Sauvegarde du dimanche', 'La sauvegarde automatique a bien tourné chaque semaine (journal) ; essayer d''en relire une.', 'Dépôt privé des sauvegardes (GitHub)', 'https://github.com/Nadelb341/dinislam-sauvegardes', '.github/workflows (dépôt dinislam-sauvegardes)', null)
on conflict (cle) do nothing;
