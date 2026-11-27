-- 📿 Nouvelle carte « Dhikr » (Nadia, 2026-11-27 : choix A, C, D, E, F, G, H, I, J + idées 1, 2, 3, 5, 6).
-- Tout le contenu religieux vit EN BASE (modifiable avec le ✏️ de l'enseignante) ; l'appli garde une copie de secours hors ligne
-- (src/data/dhikrContenu.ts, d'où les lignes de départ ci-dessous sont tirées : même texte au mot près).
-- 🕌 Règle n°1 : Coran, Al-Boukhârî, Mouslim seulement. Les 2 gestes du matin tirés d'Abou Dâwoud / At-Tirmidhî sont CACHÉS
-- (statut « a_confirmer ») ; 2 remplacements tirés d'Al-Boukhârî / Mouslim sont proposés, cachés aussi (statut « proposition »).
-- Additif uniquement : aucune table existante n'est vidée ; _points_detail est recopiée À L'IDENTIQUE + 2 lignes (dhikr_matin, dhikr_soir).

-- ─── 1. Bibliothèque des dhikr ──────────────────────────────────────────────
create table if not exists public.dhikr_items (
  id uuid primary key default gen_random_uuid(),
  cle text unique,
  titre text not null,
  arabe text,
  phonetique text,
  sens text,
  nombre int not null default 33 check (nombre between 1 and 10000),
  nombre_texte text,
  merite text,
  source text,
  moments text[] not null default '{}',
  statut text not null default 'ok' check (statut in ('ok', 'a_verifier', 'a_confirmer', 'proposition')),
  visible boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 2. Gestes des séries (matin, soir), du réveil et d'après la prière ─────
-- genre : intro (titre de la série + phrase) · geste · final (invocation de fin) · bonus
-- compteur : null = un geste qu'on coche ; sinon [{titre, arabe, phonetique, sens, nombre}] compté au chapelet
create table if not exists public.dhikr_gestes (
  id uuid primary key default gen_random_uuid(),
  cle text unique,
  serie text not null check (serie in ('matin', 'soir', 'reveil', 'apres_priere')),
  genre text not null default 'geste' check (genre in ('intro', 'geste', 'final', 'bonus')),
  titre text not null,
  consigne text,
  arabe text,
  phonetique text,
  sens text,
  compteur jsonb,
  merite text,
  source text,
  lien text,
  statut text not null default 'ok' check (statut in ('ok', 'a_verifier', 'a_confirmer', 'proposition')),
  visible boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 3. Quiz du mérite ──────────────────────────────────────────────────────
create table if not exists public.dhikr_quiz (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  choix text[] not null,
  bonne int not null default 0,
  explication text,
  source text,
  visible boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['dhikr_items', 'dhikr_gestes', 'dhikr_quiz'] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.update_updated_at_column()', t, t);
    execute format('alter table public.%I enable row level security', t);
    -- 🔐 Les élèves lisent seulement ce qui est visible ; l'enseignante (admin) lit et écrit tout
    execute format('drop policy if exists %I on public.%I', t || '_lecture', t);
    execute format('create policy %I on public.%I for select to authenticated using (visible or public.has_role(auth.uid(), ''admin''::public.app_role))', t || '_lecture', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.has_role(auth.uid(), ''admin''::public.app_role)) with check (public.has_role(auth.uid(), ''admin''::public.app_role))', t || '_admin', t);
  end loop;
end $$;

-- ─── 4. Séries terminées (une par jour) → points du barème ──────────────────
create table if not exists public.dhikr_series_faites (
  user_id uuid not null references auth.users(id) on delete cascade,
  serie text not null check (serie in ('matin', 'soir', 'reveil')),
  jour date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, serie, jour)
);
alter table public.dhikr_series_faites enable row level security;
drop policy if exists "dhikr_series_lecture" on public.dhikr_series_faites;
create policy "dhikr_series_lecture" on public.dhikr_series_faites for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
-- Écrite par l'élève lui-même (aussi au retour du réseau : jusqu'à 7 jours en arrière, jamais dans le futur lointain)
drop policy if exists "dhikr_series_ajout" on public.dhikr_series_faites;
create policy "dhikr_series_ajout" on public.dhikr_series_faites for insert to authenticated
  with check (user_id = auth.uid() and jour between current_date - 7 and current_date + 1);
drop policy if exists "dhikr_series_maj" on public.dhikr_series_faites;
create policy "dhikr_series_maj" on public.dhikr_series_faites for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and jour between current_date - 7 and current_date + 1);
drop policy if exists "dhikr_series_admin" on public.dhikr_series_faites;
create policy "dhikr_series_admin" on public.dhikr_series_faites for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ─── 5. Défi du groupe ───────────────────────────────────────────────────────
-- group_ids vide = tous les élèves. total = somme des participations, tenue à jour par la base (les élèves voient le total,
-- jamais ce que chaque autre élève a fait).
create table if not exists public.dhikr_defis (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  dhikr_cle text,
  dhikr_titre text,
  objectif int not null check (objectif between 1 and 10000000),
  group_ids uuid[] not null default '{}',
  debut date not null default current_date,
  fin date not null,
  total int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fin >= debut)
);
drop trigger if exists dhikr_defis_updated_at on public.dhikr_defis;
create trigger dhikr_defis_updated_at before update on public.dhikr_defis for each row execute function public.update_updated_at_column();
alter table public.dhikr_defis enable row level security;
drop policy if exists "dhikr_defis_lecture" on public.dhikr_defis;
create policy "dhikr_defis_lecture" on public.dhikr_defis for select to authenticated using (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  or cardinality(group_ids) = 0
  or exists (select 1 from public.student_group_members m where m.user_id = auth.uid() and m.group_id = any(group_ids))
);
drop policy if exists "dhikr_defis_admin" on public.dhikr_defis;
create policy "dhikr_defis_admin" on public.dhikr_defis for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create table if not exists public.dhikr_defi_participations (
  id uuid primary key default gen_random_uuid(),
  defi_id uuid not null references public.dhikr_defis(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre int not null check (nombre between 1 and 100000),
  created_at timestamptz not null default now()
);
create index if not exists dhikr_defi_participations_defi_idx on public.dhikr_defi_participations (defi_id);
alter table public.dhikr_defi_participations enable row level security;
-- L'élève ne lit que SES ajouts ; l'enseignante voit tout (qui a participé)
drop policy if exists "dhikr_participations_lecture" on public.dhikr_defi_participations;
create policy "dhikr_participations_lecture" on public.dhikr_defi_participations for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
drop policy if exists "dhikr_participations_ajout" on public.dhikr_defi_participations;
create policy "dhikr_participations_ajout" on public.dhikr_defi_participations for insert to authenticated with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.dhikr_defis d
    where d.id = defi_id and current_date between d.debut and d.fin + 2
      and (cardinality(d.group_ids) = 0
        or exists (select 1 from public.student_group_members m where m.user_id = auth.uid() and m.group_id = any(d.group_ids)))
  )
);
drop policy if exists "dhikr_participations_admin" on public.dhikr_defi_participations;
create policy "dhikr_participations_admin" on public.dhikr_defi_participations for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create or replace function public.dhikr_defi_total_maj()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare d uuid;
begin
  if tg_op = 'DELETE' then d := old.defi_id; else d := new.defi_id; end if;
  update public.dhikr_defis set total = (select coalesce(sum(p.nombre), 0) from public.dhikr_defi_participations p where p.defi_id = d) where id = d;
  if tg_op = 'UPDATE' and old.defi_id is distinct from new.defi_id then
    update public.dhikr_defis set total = (select coalesce(sum(p.nombre), 0) from public.dhikr_defi_participations p where p.defi_id = old.defi_id) where id = old.defi_id;
  end if;
  return null;
end;
$function$;
drop trigger if exists dhikr_defi_total on public.dhikr_defi_participations;
create trigger dhikr_defi_total after insert or update or delete on public.dhikr_defi_participations
  for each row execute function public.dhikr_defi_total_maj();

-- ⚡ En direct (le compteur du défi monte tout seul chez tout le monde ; contenu modifié par l'enseignante)
do $$ declare t text; begin
  foreach t in array array['dhikr_items', 'dhikr_gestes', 'dhikr_quiz', 'dhikr_defis', 'dhikr_defi_participations'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ─── 6. Rappels doux (idée 1) : interrupteur PERSONNEL (Paramètres › Notifications) + interrupteur de l'enseignante ───
alter table public.notification_preferences add column if not exists notif_dhikr_matin boolean default true;
alter table public.notification_preferences add column if not exists notif_dhikr_soir boolean default true;
alter table public.notification_preferences add column if not exists notif_dhikr_nuit boolean default true;
-- Interrupteurs « pour tout le monde » : ÉTEINTS au départ (Nadia les allume dans la carte Dhikr › ⚙️ Réglages)
insert into public.reglages_appli (cle, valeur)
values ('dhikr_rappels', '{"matin": false, "soir": false, "nuit": false, "heure_matin": 8, "heure_soir": 18, "heure_nuit": 21}'::jsonb)
on conflict (cle) do nothing;

-- ─── 7. Barème (idée 3) : 5 points par série du matin / du soir TERMINÉE (une fois par jour) ───
insert into public.point_settings (action_key, label, points, points_per_validation, is_active)
select 'dhikr_matin', '📿 Dhikr — série du matin terminée', 5, 5, true
where not exists (select 1 from public.point_settings where action_key = 'dhikr_matin');
insert into public.point_settings (action_key, label, points, points_per_validation, is_active)
select 'dhikr_soir', '📿 Dhikr — série du soir terminée', 5, 5, true
where not exists (select 1 from public.point_settings where action_key = 'dhikr_soir');

-- _points_detail : la fonction en base le 27/11 (relue avec pg_get_functiondef), recopiée À L'IDENTIQUE + les 2 lignes du Dhikr
CREATE OR REPLACE FUNCTION public._points_detail(p_user_id uuid)
 RETURNS TABLE(action_key text, nombre integer, points integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  n INTEGER;
  r RECORD;
BEGIN
  FOR r IN SELECT ps.action_key, CASE WHEN ps.is_active THEN ps.points ELSE 0 END AS p FROM point_settings ps LOOP
    n := 0;
    CASE r.action_key
      -- 📖 Sourate validée OU débloquée par l'enseignante (Nadia, 2026-11-17). Chaque sourate ne compte qu'UNE fois.
      WHEN 'sourate_validee' THEN SELECT COUNT(*) INTO n FROM (
        SELECT sourate_id FROM user_sourate_progress WHERE user_id = p_user_id AND is_validated
        UNION
        SELECT sourate_id FROM sourate_admin_unlocks WHERE user_id = p_user_id
      ) s;
      -- 🔤 Leçon Nourania validée OU ouverte à la main par l'enseignante (Nadia, 2026-11-18 : « oui »). Une fois par leçon.
      WHEN 'nourania_lecon_validee' THEN SELECT COUNT(*) INTO n FROM (
        SELECT lesson_id FROM user_nourania_progress WHERE user_id = p_user_id AND is_validated
        UNION
        SELECT lesson_id FROM nourania_admin_unlocks WHERE student_id = p_user_id
      ) l;
      WHEN 'invocation_vue' THEN SELECT COUNT(*) INTO n FROM user_invocation_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'alphabet_lettre_apprise' THEN SELECT COUNT(*) INTO n FROM user_alphabet_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'alphabet_bonne_reponse' THEN SELECT COALESCE(SUM(best), 0) INTO n FROM (SELECT MAX(score) AS best FROM alphabet_game_scores WHERE user_id = p_user_id GROUP BY game, played_on) b;
      WHEN 'devoir_rendu' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id;
      WHEN 'devoir_corrige' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id AND statut = 'corrige';
      WHEN 'presence_marquee' THEN SELECT COUNT(*) INTO n FROM attendance_records WHERE user_id = p_user_id AND status IN ('present', 'late');
      WHEN 'priere_validee' THEN SELECT COUNT(*) INTO n FROM user_prayer_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'jeune_marque' THEN SELECT COUNT(*) INTO n FROM user_ramadan_fasting WHERE user_id = p_user_id AND COALESCE(has_fasted, is_fasting, false);
      WHEN 'quiz_reussi' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND quiz_completed;
      WHEN 'ramadan_jour_complete' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND is_completed;
      WHEN 'message_envoye' THEN SELECT COUNT(*) INTO n FROM user_messages WHERE sender_id = p_user_id AND deleted_at IS NULL;
      WHEN 'allah_nom_valide' THEN SELECT COUNT(*) INTO n FROM user_allah_name_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'vocabulaire_appris' THEN SELECT COUNT(*) INTO n FROM user_flashcard_learned WHERE user_id = p_user_id;
      WHEN 'tresor_ouvert' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'tresor';
      WHEN 'bonus_semaine' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'bonus';
      WHEN 'anniversaire' THEN SELECT COUNT(*) INTO n FROM anniversaires_fetes WHERE user_id = p_user_id;
      -- 🕌 Journée des 5 prières cochées (Nadia, 2026-11-26, idée d) : 10 points par journée complète
      WHEN 'journee_5_prieres' THEN SELECT COUNT(*) INTO n FROM (
        SELECT date FROM user_daily_prayers WHERE user_id = p_user_id AND is_checked
          AND prayer_name IN ('sobh', 'dhuhr', 'asr', 'maghrib', 'isha')
        GROUP BY date HAVING COUNT(DISTINCT prayer_name) = 5
      ) j;
      -- 📿 Dhikr (Nadia, 2026-11-27, idée 3) : une série du matin / du soir TERMINÉE = une ligne par jour (clé primaire)
      WHEN 'dhikr_matin' THEN SELECT COUNT(*) INTO n FROM dhikr_series_faites WHERE user_id = p_user_id AND serie = 'matin';
      WHEN 'dhikr_soir' THEN SELECT COUNT(*) INTO n FROM dhikr_series_faites WHERE user_id = p_user_id AND serie = 'soir';
      ELSE n := 0;
    END CASE;
    action_key := r.action_key; nombre := COALESCE(n, 0); points := COALESCE(n, 0) * COALESCE(r.p, 0);
    RETURN NEXT;
  END LOOP;
END;
$function$;

drop trigger if exists recalculate_points on public.dhikr_series_faites;
create trigger recalculate_points after insert or update or delete on public.dhikr_series_faites
  for each row execute function public.trg_recalculate_points();

-- ─── 8. Contenu de départ (généré depuis src/data/dhikrContenu.ts) ───────────
-- 📚 Bibliothèque (seulement si la ligne n'existe pas encore : relancer ne crée aucun doublon et n'écrase rien)
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$reveil$q$, $q$Au réveil$q$, $q$الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ$q$, $q$Al-hamdou lillâhi-lladhî ahyânâ ba'da mâ amâtanâ wa ilayhi-n-nouchoûr$q$, $q$Louange à Allah qui nous a rendu la vie après nous avoir fait mourir (le sommeil), et c'est vers Lui que se fera la résurrection.$q$, 1, $q$1 fois en se réveillant$q$, $q$C'est ce que disait le Prophète ﷺ en se réveillant.$q$, $q$Boukhari 6312$q$, array[$q$reveil$q$]::text[], $q$ok$q$, true, 10)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$sayyid_istighfar$q$, $q$Sayyid al-istighfâr (le maître de la demande de pardon)$q$, $q$اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ$q$, $q$Allâhoumma anta rabbî, lâ ilâha illâ ant, khalaqtanî wa ana 'abdouk, wa ana 'alâ 'ahdika wa wa'dika mastata't, a'oûdhou bika min charri mâ sana't, aboû'ou laka bi ni'matika 'alayya, wa aboû'ou laka bi dhanbî, faghfir lî, fa innahou lâ yaghfirou-dh-dhounoûba illâ ant$q$, $q$Ô Allah, Tu es mon Seigneur, il n'y a de divinité que Toi. Tu m'as créé et je suis Ton serviteur. Je reste fidèle à mon engagement envers Toi et à Ta promesse, autant que je le peux. Je cherche refuge auprès de Toi contre le mal que j'ai fait. Je reconnais Tes bienfaits envers moi et je reconnais mon péché. Pardonne-moi, car nul ne pardonne les péchés à part Toi.$q$, 1, $q$1 fois le matin, 1 fois le soir$q$, $q$Celui qui le dit le jour avec conviction et meurt ce jour-là avant le soir fait partie des gens du Paradis ; et pareil s'il le dit la nuit et meurt avant le matin.$q$, $q$Boukhari 6306$q$, array[$q$matin$q$, $q$soir$q$, $q$pardon$q$]::text[], $q$ok$q$, true, 20)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$subhanallah_wabihamdihi$q$, $q$Soubhâna-llâhi wa bihamdihi$q$, $q$سُبْحَانَ اللَّهِ وَبِحَمْدِهِ$q$, $q$Soubhâna-llâhi wa bihamdihi$q$, $q$Gloire et louange à Allah$q$, 100, $q$100 fois dans la journée$q$, $q$Ses péchés sont effacés, même s'ils sont aussi nombreux que l'écume de la mer.$q$, $q$Boukhari 6405 ; Mouslim 2691$q$, array[$q$matin$q$, $q$soir$q$, $q$pardon$q$]::text[], $q$ok$q$, true, 30)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$tahlil_100$q$, $q$Lâ ilâha illa-llâh wahdahou… (100 fois)$q$, $q$لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ$q$, $q$Lâ ilâha illa-llâhou wahdahou lâ charîka lah, lahou-l-moulkou wa lahou-l-hamd, wa houwa 'alâ koulli chay'in qadîr$q$, $q$Il n'y a de divinité qu'Allah, Seul, sans associé. À Lui la royauté, à Lui la louange, et Il est capable de toute chose.$q$, 100, $q$100 fois dans la journée$q$, $q$C'est comme affranchir 10 esclaves ; 100 bonnes actions lui sont écrites, 100 péchés lui sont effacés, et il est protégé du Diable ce jour-là jusqu'au soir.$q$, $q$Boukhari 3293 ; Mouslim 2691$q$, array[$q$matin$q$]::text[], $q$ok$q$, true, 40)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$tahlil_10$q$, $q$Lâ ilâha illa-llâh wahdahou… (10 fois)$q$, $q$لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ$q$, $q$Lâ ilâha illa-llâhou wahdahou lâ charîka lah, lahou-l-moulkou wa lahou-l-hamd, wa houwa 'alâ koulli chay'in qadîr$q$, $q$Il n'y a de divinité qu'Allah, Seul, sans associé. À Lui la royauté, à Lui la louange, et Il est capable de toute chose.$q$, 10, $q$10 fois$q$, $q$C'est comme avoir affranchi quatre personnes parmi les descendants d'Ismâ'îl.$q$, $q$Boukhari 6404 ; Mouslim 2693$q$, array[$q$matin$q$, $q$soir$q$]::text[], $q$ok$q$, true, 50)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$juwayriya$q$, $q$Les 4 paroles de Jouwayriya$q$, $q$سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ$q$, $q$Soubhâna-llâhi wa bihamdihi, 'adada khalqihi, wa ridâ nafsihi, wa zinata 'archihi, wa midâda kalimâtihi$q$, $q$Gloire et louange à Allah, autant que le nombre de Ses créatures, autant qu'il Lui plaît, autant que le poids de Son Trône et autant que l'encre de Ses paroles.$q$, 3, $q$3 fois, le matin$q$, $q$Le Prophète ﷺ a dit à Jouwayriya, qui faisait le dhikr depuis la prière de l'aube : « J'ai dit après toi quatre paroles, trois fois ; si on les pesait avec tout ce que tu as dit depuis ce matin, elles l'emporteraient. »$q$, $q$Mouslim 2726$q$, array[$q$matin$q$]::text[], $q$ok$q$, true, 60)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$apres_priere$q$, $q$Le tasbih d'après la prière$q$, $q$سُبْحَانَ اللَّهِ · الْحَمْدُ لِلَّهِ · اللَّهُ أَكْبَرُ$q$, $q$Soubhâna-llâh · Al-hamdou lillâh · Allâhou akbar$q$, $q$Gloire à Allah · Louange à Allah · Allah est le plus Grand$q$, 100, $q$33 + 33 + 33, puis 1 fois « Lâ ilâha illa-llâh wahdahou… »$q$, $q$Celui qui le fait après chaque prière : ses péchés sont pardonnés, même s'ils étaient aussi nombreux que l'écume de la mer.$q$, $q$Mouslim 597$q$, array[$q$apres_priere$q$]::text[], $q$ok$q$, true, 70)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$istighfar_apres_priere$q$, $q$Juste après le salâm$q$, $q$أَسْتَغْفِرُ اللَّهَ (٣) ۝ اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ$q$, $q$Astaghfirou-llâh (3 fois), puis : Allâhoumma anta-s-salâm wa minka-s-salâm, tabârakta yâ dhâ-l-jalâli wa-l-ikrâm$q$, $q$Je demande pardon à Allah. Ô Allah, Tu es la Paix et la paix vient de Toi. Béni sois-Tu, ô Toi le Majestueux et le Généreux.$q$, 3, $q$3 fois, puis l'invocation$q$, $q$Quand le Prophète ﷺ finissait sa prière, il demandait pardon 3 fois, puis disait cette invocation.$q$, $q$Mouslim 591$q$, array[$q$apres_priere$q$, $q$pardon$q$]::text[], $q$ok$q$, true, 80)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$astaghfirullah$q$, $q$Astaghfirou-llâh$q$, $q$أَسْتَغْفِرُ اللَّهَ$q$, $q$Astaghfirou-llâh$q$, $q$Je demande pardon à Allah$q$, 100, $q$100 fois dans la journée$q$, $q$Le Prophète ﷺ a dit : « Repentez-vous à Allah, car moi je me repens à Lui cent fois par jour. » Et aussi : « Je demande pardon à Allah et je me repens à Lui plus de soixante-dix fois par jour. »$q$, $q$Mouslim 2702 ; Boukhari 6307$q$, array[$q$pardon$q$]::text[], $q$ok$q$, true, 90)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$subhanallah$q$, $q$Soubhâna-llâh$q$, $q$سُبْحَانَ اللَّهِ$q$, $q$Soubhâna-llâh$q$, $q$Gloire à Allah (Il est au-dessus de tout défaut)$q$, 33, $q$33 fois, ou autant que tu veux$q$, $q$Les quatre paroles les plus aimées d'Allah : Soubhâna-llâh, Al-hamdou lillâh, Lâ ilâha illa-llâh et Allâhou akbar.$q$, $q$Mouslim 2137$q$, '{}'::text[], $q$ok$q$, true, 100)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$alhamdulillah$q$, $q$Al-hamdou lillâh$q$, $q$الْحَمْدُ لِلَّهِ$q$, $q$Al-hamdou lillâh$q$, $q$Louange à Allah$q$, 33, $q$33 fois, ou autant que tu veux$q$, $q$« Al-hamdou lillâh » remplit la balance.$q$, $q$Mouslim 223$q$, '{}'::text[], $q$ok$q$, true, 110)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$allahuakbar$q$, $q$Allâhou akbar$q$, $q$اللَّهُ أَكْبَرُ$q$, $q$Allâhou akbar$q$, $q$Allah est le plus Grand$q$, 33, $q$33 fois, ou autant que tu veux$q$, $q$Les quatre paroles les plus aimées d'Allah : Soubhâna-llâh, Al-hamdou lillâh, Lâ ilâha illa-llâh et Allâhou akbar.$q$, $q$Mouslim 2137$q$, '{}'::text[], $q$ok$q$, true, 120)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$deux_paroles$q$, $q$Les deux paroles légères$q$, $q$سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ$q$, $q$Soubhâna-llâhi wa bihamdihi, Soubhâna-llâhi-l-'adhîm$q$, $q$Gloire et louange à Allah, gloire à Allah le Très-Grand$q$, 33, $q$Autant que tu veux$q$, $q$Deux paroles légères sur la langue, lourdes dans la balance, aimées du Tout Miséricordieux.$q$, $q$Boukhari 6406 ; Mouslim 2694$q$, '{}'::text[], $q$ok$q$, true, 130)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$hawqala$q$, $q$Lâ hawla wa lâ qouwwata illâ billâh$q$, $q$لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ$q$, $q$Lâ hawla wa lâ qouwwata illâ billâh$q$, $q$Il n'y a de force ni de puissance qu'en Allah$q$, 33, $q$Autant que tu veux$q$, $q$C'est un trésor parmi les trésors du Paradis.$q$, $q$Boukhari 6384 ; Mouslim 2704$q$, array[$q$force$q$]::text[], $q$ok$q$, true, 140)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$hasbunallah$q$, $q$Hasbouna-llâhou wa ni'ma-l-wakîl$q$, $q$حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ$q$, $q$Hasbouna-llâhou wa ni'ma-l-wakîl$q$, $q$Allah nous suffit, et quel excellent Protecteur !$q$, 7, $q$Quand tu as peur ou quand c'est difficile$q$, $q$C'est ce qu'a dit Ibrâhîm quand on l'a jeté dans le feu, et ce qu'a dit Mouhammad ﷺ quand on lui a annoncé que des gens s'étaient rassemblés contre eux.$q$, $q$Coran 3:173 ; Boukhari 4563$q$, array[$q$force$q$]::text[], $q$ok$q$, true, 150)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$doua_karb$q$, $q$Dans les moments difficiles$q$, $q$لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ$q$, $q$Lâ ilâha illa-llâhou-l-'adhîmou-l-halîm, lâ ilâha illa-llâhou rabbou-l-'archi-l-'adhîm, lâ ilâha illa-llâhou rabbou-s-samâwâti wa rabbou-l-ardi wa rabbou-l-'archi-l-karîm$q$, $q$Il n'y a de divinité qu'Allah, le Très-Grand, le Longanime. Il n'y a de divinité qu'Allah, le Seigneur du Trône immense. Il n'y a de divinité qu'Allah, le Seigneur des cieux, le Seigneur de la terre et le Seigneur du Trône généreux.$q$, 1, $q$Quand tu es triste ou inquiet$q$, $q$C'est ce que disait le Prophète ﷺ dans les moments difficiles.$q$, $q$Boukhari 6346 ; Mouslim 2730$q$, array[$q$force$q$]::text[], $q$ok$q$, true, 160)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$bismika$q$, $q$En se couchant$q$, $q$بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا$q$, $q$Bismika-llâhoumma amoûtou wa ahyâ$q$, $q$C'est en Ton nom, ô Allah, que je meurs et que je vis.$q$, 1, $q$1 fois en se couchant$q$, $q$C'est ce que disait le Prophète ﷺ en se couchant.$q$, $q$Boukhari 6324$q$, array[$q$soir$q$]::text[], $q$ok$q$, true, 170)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$bismillah_repas$q$, $q$Avant de manger$q$, $q$بِسْمِ اللَّهِ$q$, $q$Bismi-llâh$q$, $q$Au nom d'Allah$q$, 1, $q$Avant de manger$q$, $q$Le Prophète ﷺ a dit à un enfant : « Dis Bismi-llâh, mange de ta main droite et mange de ce qui est devant toi. »$q$, $q$Boukhari 5376 ; Mouslim 2022$q$, array[$q$repas$q$]::text[], $q$ok$q$, true, 180)
on conflict (cle) do nothing;
insert into public.dhikr_items (cle, titre, arabe, phonetique, sens, nombre, nombre_texte, merite, source, moments, statut, visible, position)
values ($q$hamdulillah_repas$q$, $q$Après avoir mangé$q$, $q$الْحَمْدُ لِلَّهِ$q$, $q$Al-hamdou lillâh$q$, $q$Louange à Allah$q$, 1, $q$Après avoir mangé ou bu$q$, $q$Allah est satisfait du serviteur qui mange un repas et Le loue pour cela, ou qui boit une boisson et Le loue pour cela.$q$, $q$Mouslim 2734$q$, array[$q$repas$q$]::text[], $q$a_verifier$q$, true, 190)
on conflict (cle) do nothing;

-- 🌅🌙☀️🕌 Séries, réveil, après la prière
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$soir_intro$q$, $q$soir$q$, $q$intro$q$, $q$La série du soir$q$, $q$Avant de dormir, 5 gestes$q$, null, null, null, null, null, null, null, $q$ok$q$, true, 10)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$soir_cote_droit$q$, $q$soir$q$, $q$geste$q$, $q$Les ablutions et le côté droit$q$, $q$Fais tes ablutions comme pour la prière, couche-toi sur le côté droit, puis dis :$q$, $q$اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ$q$, $q$Allâhoumma aslamtou nafsî ilayk, wa wajjahtou wajhî ilayk, wa fawwadtou amrî ilayk, wa alja'tou dhahrî ilayk, raghbatan wa rahbatan ilayk, lâ malja'a wa lâ manjâ minka illâ ilayk, âmantou bi kitâbika-lladhî anzalt, wa bi nabiyyika-lladhî arsalt$q$, $q$Ô Allah, je me soumets à Toi, je tourne mon visage vers Toi, je Te confie mes affaires et je m'appuie sur Toi, par amour et par crainte de Toi. Il n'y a de refuge et de salut contre Toi qu'auprès de Toi. Je crois en Ton Livre que Tu as descendu et en Ton Prophète que Tu as envoyé.$q$, null, $q$Si tu meurs cette nuit, tu meurs dans la fitra (la pureté de la foi). Fais-en les dernières paroles que tu dis.$q$, $q$Boukhari 247 et 6313 ; Mouslim 2710$q$, null, $q$a_verifier$q$, true, 20)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$soir_ayat_kursi$q$, $q$soir$q$, $q$geste$q$, $q$Ayat al-Kursi$q$, $q$Récite le Verset du Trône.$q$, $q$اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ$q$, $q$Allâhou lâ ilâha illâ houwa-l-hayyou-l-qayyoûm, lâ ta'khoudhouhoû sinatoun wa lâ nawm, lahoû mâ fi-s-samâwâti wa mâ fi-l-ard, man dha-lladhî yachfa'ou 'indahoû illâ bi idhnih, ya'lamou mâ bayna aydîhim wa mâ khalfahoum, wa lâ youhîtoûna bi chay'in min 'ilmihî illâ bimâ châ', wasi'a koursiyyouhou-s-samâwâti wa-l-ard, wa lâ ya'oûdouhoû hifdhouhoumâ, wa houwa-l-'aliyyou-l-'adhîm$q$, $q$Allah ! Il n'y a de divinité que Lui, le Vivant, Celui qui subsiste par Lui-même. Ni somnolence ni sommeil ne Le saisissent. À Lui ce qui est dans les cieux et sur la terre. Qui peut intercéder auprès de Lui sans Sa permission ? Il sait ce qui est devant eux et derrière eux, et ils n'embrassent de Sa science que ce qu'Il veut. Son Kursî s'étend sur les cieux et la terre, dont la garde ne Lui coûte aucune peine. Il est le Très-Haut, le Très-Grand.$q$, null, $q$Celui qui le récite en se couchant : un gardien envoyé par Allah reste avec lui, et le Diable ne s'approche pas de lui jusqu'au matin.$q$, $q$Coran 2:255 ; Boukhari 2311$q$, $q$/coran?item=42$q$, $q$ok$q$, true, 30)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$soir_baqara$q$, $q$soir$q$, $q$geste$q$, $q$Les 2 derniers versets d'Al-Baqara$q$, $q$Récite les versets 285 et 286 de la sourate Al-Baqara.$q$, $q$آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ ﴿٢٨٥﴾ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ ﴿٢٨٦﴾$q$, $q$Âmana-r-rasoûlou bimâ ounzila ilayhi min rabbihî wa-l-mou'minoûn, koullun âmana billâhi wa malâ'ikatihî wa koutoubihî wa rousoulih, lâ noufarriqou bayna ahadin min rousoulih, wa qâloû sami'nâ wa ata'nâ, ghoufrânaka rabbanâ wa ilayka-l-masîr. Lâ youkallifou-llâhou nafsan illâ wous'ahâ, lahâ mâ kasabat wa 'alayhâ ma-ktasabat, rabbanâ lâ tou'âkhidhnâ in nasînâ aw akhta'nâ, rabbanâ wa lâ tahmil 'alaynâ isran kamâ hamaltahoû 'ala-lladhîna min qablinâ, rabbanâ wa lâ touhammilnâ mâ lâ tâqata lanâ bih, wa-'fou 'annâ wa-ghfir lanâ wa-rhamnâ, anta mawlânâ fa-nsournâ 'ala-l-qawmi-l-kâfirîn$q$, $q$Le Messager a cru en ce qu'on a fait descendre vers lui de la part de son Seigneur, et les croyants aussi… Allah n'impose à aucune âme plus qu'elle ne peut porter… Notre Seigneur, ne nous punis pas si nous oublions ou si nous nous trompons… Efface nos fautes, pardonne-nous et fais-nous miséricorde. Tu es notre Maître : donne-nous la victoire sur les gens mécréants.$q$, null, $q$Celui qui récite les deux derniers versets de la sourate Al-Baqara la nuit, ils lui suffisent.$q$, $q$Coran 2:285-286 ; Boukhari 5009 ; Mouslim 807$q$, $q$/coran?item=49$q$, $q$ok$q$, true, 40)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$soir_trois_qoul$q$, $q$soir$q$, $q$geste$q$, $q$Les 3 dernières sourates, soufflées dans les mains$q$, $q$Joins tes mains, souffle dedans en récitant Al-Ikhlâs, Al-Falaq et An-Nâs, puis passe tes mains sur tout ce que tu peux de ton corps, en commençant par la tête, le visage et le devant du corps. Fais-le 3 fois (le chapelet compte avec toi).$q$, $q$بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ
بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ
بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ$q$, $q$Qoul houwa-llâhou ahad. Allâhou-s-samad. Lam yalid wa lam yoûlad. Wa lam yakoun lahoû koufouwan ahad.
Qoul a'oûdhou bi rabbi-l-falaq. Min charri mâ khalaq. Wa min charri ghâsiqin idhâ waqab. Wa min charri-n-naffâthâti fi-l-'ouqad. Wa min charri hâsidin idhâ hasad.
Qoul a'oûdhou bi rabbi-n-nâs. Maliki-n-nâs. Ilâhi-n-nâs. Min charri-l-waswâsi-l-khannâs. Alladhî youwaswisou fî soudoûri-n-nâs. Mina-l-jinnati wa-n-nâs.$q$, $q$Al-Ikhlâs : « Dis : Il est Allah, l'Unique… » · Al-Falaq : « Dis : je cherche refuge auprès du Seigneur de l'aube naissante… » · An-Nâs : « Dis : je cherche refuge auprès du Seigneur des hommes… »$q$, $q$[{"titre":"Les 3 sourates + les mains","arabe":"قُلْ هُوَ اللَّهُ أَحَدٌ · قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ · قُلْ أَعُوذُ بِرَبِّ النَّاسِ","phonetique":"Qoul houwa-llâhou ahad · Qoul a'oûdhou bi rabbi-l-falaq · Qoul a'oûdhou bi rabbi-n-nâs","sens":"Souffle dans tes mains, puis passe-les sur ton corps","nombre":3}]$q$::jsonb, $q$Chaque soir, en se couchant, le Prophète ﷺ faisait ainsi, trois fois.$q$, $q$Boukhari 5017$q$, null, $q$ok$q$, true, 50)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$soir_tasbih$q$, $q$soir$q$, $q$geste$q$, $q$Le tasbih avant de dormir$q$, $q$Avec le chapelet : 33 fois Soubhâna-llâh, 33 fois Al-hamdou lillâh, 34 fois Allâhou akbar.$q$, null, null, null, $q$[{"titre":"Soubhâna-llâh","arabe":"سُبْحَانَ اللَّهِ","phonetique":"Soubhâna-llâh","sens":"Gloire à Allah","nombre":33},{"titre":"Al-hamdou lillâh","arabe":"الْحَمْدُ لِلَّهِ","phonetique":"Al-hamdou lillâh","sens":"Louange à Allah","nombre":33},{"titre":"Allâhou akbar","arabe":"اللَّهُ أَكْبَرُ","phonetique":"Allâhou akbar","sens":"Allah est le plus Grand","nombre":34}]$q$::jsonb, $q$Le Prophète ﷺ l'a appris à 'Alî et Fâtima : « C'est mieux pour vous qu'un serviteur. »$q$, $q$Boukhari 3113 ; Mouslim 2727$q$, null, $q$ok$q$, true, 60)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$soir_final$q$, $q$soir$q$, $q$final$q$, $q$Et pour finir, en fermant les yeux$q$, null, $q$بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا$q$, $q$Bismika-llâhoumma amoûtou wa ahyâ$q$, $q$C'est en Ton nom, ô Allah, que je meurs et que je vis.$q$, null, $q$C'est ce que disait le Prophète ﷺ en se couchant.$q$, $q$Boukhari 6324$q$, null, $q$ok$q$, true, 70)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$matin_intro$q$, $q$matin$q$, $q$intro$q$, $q$La série du matin$q$, $q$Pour bien commencer la journée$q$, null, null, null, null, null, null, null, $q$ok$q$, true, 80)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$matin_sayyid$q$, $q$matin$q$, $q$geste$q$, $q$Sayyid al-istighfâr$q$, $q$Le maître de la demande de pardon : dis-le avec conviction.$q$, $q$اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ$q$, $q$Allâhoumma anta rabbî, lâ ilâha illâ ant, khalaqtanî wa ana 'abdouk, wa ana 'alâ 'ahdika wa wa'dika mastata't, a'oûdhou bika min charri mâ sana't, aboû'ou laka bi ni'matika 'alayya, wa aboû'ou laka bi dhanbî, faghfir lî, fa innahou lâ yaghfirou-dh-dhounoûba illâ ant$q$, $q$Ô Allah, Tu es mon Seigneur, il n'y a de divinité que Toi. Tu m'as créé et je suis Ton serviteur. Je reste fidèle à mon engagement envers Toi et à Ta promesse, autant que je le peux. Je cherche refuge auprès de Toi contre le mal que j'ai fait. Je reconnais Tes bienfaits envers moi et je reconnais mon péché. Pardonne-moi, car nul ne pardonne les péchés à part Toi.$q$, null, $q$Celui qui le dit le jour avec conviction et meurt ce jour-là avant le soir fait partie des gens du Paradis ; et pareil s'il le dit la nuit et meurt avant le matin.$q$, $q$Boukhari 6306$q$, null, $q$ok$q$, true, 90)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$matin_wabihamdihi$q$, $q$matin$q$, $q$geste$q$, $q$Soubhâna-llâhi wa bihamdihi, 100 fois$q$, $q$Avec le chapelet.$q$, null, null, null, $q$[{"titre":"Soubhâna-llâhi wa bihamdihi","arabe":"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ","phonetique":"Soubhâna-llâhi wa bihamdihi","sens":"Gloire et louange à Allah","nombre":100}]$q$::jsonb, $q$Celui qui le dit 100 fois le matin et le soir : personne n'apportera au Jour de la Résurrection mieux que lui, sauf quelqu'un qui en a dit autant ou plus.$q$, $q$Mouslim 2692$q$, null, $q$ok$q$, true, 100)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$matin_trois_qoul$q$, $q$matin$q$, $q$geste$q$, $q$Al-Ikhlâs et les deux sourates de protection, 3 fois$q$, $q$Récite Al-Ikhlâs, Al-Falaq et An-Nâs, 3 fois.$q$, $q$بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ
بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ
بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ$q$, $q$Qoul houwa-llâhou ahad. Allâhou-s-samad. Lam yalid wa lam yoûlad. Wa lam yakoun lahoû koufouwan ahad.
Qoul a'oûdhou bi rabbi-l-falaq. Min charri mâ khalaq. Wa min charri ghâsiqin idhâ waqab. Wa min charri-n-naffâthâti fi-l-'ouqad. Wa min charri hâsidin idhâ hasad.
Qoul a'oûdhou bi rabbi-n-nâs. Maliki-n-nâs. Ilâhi-n-nâs. Min charri-l-waswâsi-l-khannâs. Alladhî youwaswisou fî soudoûri-n-nâs. Mina-l-jinnati wa-n-nâs.$q$, $q$Al-Ikhlâs : « Dis : Il est Allah, l'Unique… » · Al-Falaq : « Dis : je cherche refuge auprès du Seigneur de l'aube naissante… » · An-Nâs : « Dis : je cherche refuge auprès du Seigneur des hommes… »$q$, $q$[{"titre":"Les 3 sourates","arabe":"قُلْ هُوَ اللَّهُ أَحَدٌ · قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ · قُلْ أَعُوذُ بِرَبِّ النَّاسِ","phonetique":"Qoul houwa-llâhou ahad · Qoul a'oûdhou bi rabbi-l-falaq · Qoul a'oûdhou bi rabbi-n-nâs","sens":"Al-Ikhlâs, Al-Falaq, An-Nâs","nombre":3}]$q$::jsonb, $q$Elles te suffisent contre toute chose.$q$, $q$Abou Dâwoud 5082 ; At-Tirmidhî 3575$q$, null, $q$a_confirmer$q$, false, 110)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$matin_bismillah_ladhi$q$, $q$matin$q$, $q$geste$q$, $q$Bismi-llâhi-lladhî lâ yadourrou…, 3 fois$q$, $q$Dis-le 3 fois.$q$, $q$بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ$q$, $q$Bismi-llâhi-lladhî lâ yadourrou ma'a-smihî chay'oun fi-l-ardi wa lâ fi-s-samâ', wa houwa-s-samî'ou-l-'alîm$q$, $q$Au nom d'Allah, avec le nom de qui rien ne peut nuire, ni sur la terre ni dans le ciel, et Il est Celui qui entend tout, Celui qui sait tout.$q$, $q$[{"titre":"Bismi-llâhi-lladhî…","arabe":"بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ…","phonetique":"Bismi-llâhi-lladhî lâ yadourrou ma'a-smihî chay'oun…","sens":"Au nom d'Allah, avec le nom de qui rien ne peut nuire…","nombre":3}]$q$::jsonb, $q$Rien ne lui nuira.$q$, $q$Abou Dâwoud 5088 ; At-Tirmidhî 3388$q$, null, $q$a_confirmer$q$, false, 120)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$matin_juwayriya$q$, $q$matin$q$, $q$geste$q$, $q$Les 4 paroles de Jouwayriya, 3 fois$q$, $q$Avec le chapelet, après la prière de l'aube.$q$, $q$سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ$q$, $q$Soubhâna-llâhi wa bihamdihi, 'adada khalqihi, wa ridâ nafsihi, wa zinata 'archihi, wa midâda kalimâtihi$q$, $q$Gloire et louange à Allah, autant que le nombre de Ses créatures, autant qu'il Lui plaît, autant que le poids de Son Trône et autant que l'encre de Ses paroles.$q$, $q$[{"titre":"Soubhâna-llâhi wa bihamdihi, 'adada khalqihi…","arabe":"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ","phonetique":"Soubhâna-llâhi wa bihamdihi, 'adada khalqihi, wa ridâ nafsihi, wa zinata 'archihi, wa midâda kalimâtihi","sens":"Gloire et louange à Allah, autant que le nombre de Ses créatures, autant qu'il Lui plaît, autant que le poids de Son Trône et autant que l'encre de Ses paroles.","nombre":3}]$q$::jsonb, $q$Le Prophète ﷺ a dit à Jouwayriya : « J'ai dit après toi quatre paroles, trois fois ; si on les pesait avec tout ce que tu as dit depuis ce matin, elles l'emporteraient. »$q$, $q$Mouslim 2726$q$, null, $q$proposition$q$, false, 130)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$matin_tahlil_10$q$, $q$matin$q$, $q$geste$q$, $q$Lâ ilâha illa-llâh wahdahou…, 10 fois$q$, $q$Avec le chapelet.$q$, null, null, null, $q$[{"titre":"Lâ ilâha illa-llâh wahdahou…","arabe":"لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ","phonetique":"Lâ ilâha illa-llâhou wahdahou lâ charîka lah, lahou-l-moulkou wa lahou-l-hamd, wa houwa 'alâ koulli chay'in qadîr","sens":"Il n'y a de divinité qu'Allah, Seul, sans associé. À Lui la royauté, à Lui la louange, et Il est capable de toute chose.","nombre":10}]$q$::jsonb, $q$C'est comme avoir affranchi quatre personnes parmi les descendants d'Ismâ'îl.$q$, $q$Boukhari 6404 ; Mouslim 2693$q$, null, $q$proposition$q$, false, 140)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$matin_radi$q$, $q$matin$q$, $q$geste$q$, $q$Radîtou billâhi rabban…$q$, $q$Dis-le avec ton cœur.$q$, $q$رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ رَسُولًا$q$, $q$Radîtou billâhi rabban, wa bil-islâmi dînan, wa bi Mouhammadin rasoûlan$q$, $q$J'agrée Allah comme Seigneur, l'Islam comme religion et Mouhammad comme Messager.$q$, null, $q$Celui qui agrée Allah comme Seigneur, l'Islam comme religion et Mouhammad comme Messager, le Paradis lui devient obligatoire.$q$, $q$Mouslim 1884$q$, null, $q$a_verifier$q$, true, 150)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$matin_final$q$, $q$matin$q$, $q$final$q$, $q$Et pour finir, l'invocation du matin$q$, null, $q$أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ$q$, $q$Asbahnâ wa asbaha-l-moulkou lillâh, wa-l-hamdou lillâh, lâ ilâha illa-llâhou wahdahou lâ charîka lah, lahou-l-moulkou wa lahou-l-hamdou wa houwa 'alâ koulli chay'in qadîr. Rabbi as'alouka khayra mâ fî hâdha-l-yawmi wa khayra mâ ba'dah, wa a'oûdhou bika min charri mâ fî hâdha-l-yawmi wa charri mâ ba'dah. Rabbi a'oûdhou bika mina-l-kasali wa soû'i-l-kibar. Rabbi a'oûdhou bika min 'adhâbin fi-n-nâri wa 'adhâbin fi-l-qabr.$q$, $q$Nous voici au matin, et le royaume appartient à Allah. Louange à Allah. Il n'y a de divinité qu'Allah, Seul, sans associé ; à Lui la royauté, à Lui la louange, et Il est capable de toute chose. Seigneur, je Te demande le bien de ce jour et de ce qui le suit, et je cherche refuge auprès de Toi contre le mal de ce jour et de ce qui le suit. Seigneur, je cherche refuge auprès de Toi contre la paresse et les maux de la vieillesse. Seigneur, je cherche refuge auprès de Toi contre un châtiment dans le Feu et un châtiment dans la tombe.$q$, null, $q$Le Prophète ﷺ disait ces paroles chaque matin (et le soir : « Amsaynâ wa amsa-l-moulkou lillâh… »).$q$, $q$Mouslim 2723$q$, null, $q$a_verifier$q$, true, 160)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$reveil_intro$q$, $q$reveil$q$, $q$intro$q$, $q$Chaque matin, 3 gestes du réveil$q$, $q$Le Diable fait trois nœuds pendant que tu dors. En te réveillant : mentionne Allah, un nœud se défait ; fais tes ablutions, un 2e nœud se défait ; prie, et tous les nœuds se défont : tu commences la journée plein d'entrain, l'âme bonne.$q$, null, null, null, null, null, $q$Boukhari 1142 ; Mouslim 776$q$, null, $q$ok$q$, true, 170)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$reveil_dhikr$q$, $q$reveil$q$, $q$geste$q$, $q$Mentionner Allah$q$, $q$Dès que tu ouvres les yeux, dis :$q$, $q$الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ$q$, $q$Al-hamdou lillâhi-lladhî ahyânâ ba'da mâ amâtanâ wa ilayhi-n-nouchoûr$q$, $q$Louange à Allah qui nous a rendu la vie après nous avoir fait mourir (le sommeil), et c'est vers Lui que se fera la résurrection.$q$, null, $q$Un nœud se défait.$q$, $q$Boukhari 6312 ; Boukhari 1142$q$, null, $q$ok$q$, true, 180)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$reveil_ablutions$q$, $q$reveil$q$, $q$geste$q$, $q$Faire les ablutions$q$, $q$Lève-toi et fais tes ablutions.$q$, null, null, null, null, $q$Un 2e nœud se défait.$q$, $q$Boukhari 1142 ; Mouslim 776$q$, $q$/priere?carte=LODO$q$, $q$ok$q$, true, 190)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$reveil_priere$q$, $q$reveil$q$, $q$geste$q$, $q$Prier$q$, $q$Fais ta prière du Sobh (Fajr).$q$, null, null, null, null, $q$Tous les nœuds se défont : tu commences la journée plein d'entrain, l'âme bonne.$q$, $q$Boukhari 1142 ; Mouslim 776$q$, $q$/priere$q$, $q$ok$q$, true, 200)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$reveil_al_imran$q$, $q$reveil$q$, $q$bonus$q$, $q$Bonus : les 10 derniers versets d'Âl 'Imrân$q$, $q$Lis la fin de la sourate Âl 'Imrân, du verset 190 jusqu'au verset 200. Elle commence ainsi :$q$, $q$إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِأُولِي الْأَلْبَابِ$q$, $q$Inna fî khalqi-s-samâwâti wa-l-ardi wa-khtilâfi-l-layli wa-n-nahâri la âyâtin li oulî-l-albâb$q$, $q$Dans la création des cieux et de la terre, et dans l'alternance de la nuit et du jour, il y a des signes pour ceux qui réfléchissent.$q$, null, $q$En se réveillant la nuit, le Prophète ﷺ essuyait le sommeil de son visage, puis récitait les dix derniers versets de la sourate Âl 'Imrân.$q$, $q$Coran 3:190-200 ; Boukhari 183$q$, $q$/coran?item=75$q$, $q$ok$q$, true, 210)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$apres_intro$q$, $q$apres_priere$q$, $q$intro$q$, $q$Après la prière$q$, $q$33 + 33 + 33, puis 1 fois pour parfaire la centaine$q$, null, null, null, null, $q$Celui qui le fait après chaque prière : ses péchés sont pardonnés, même s'ils étaient aussi nombreux que l'écume de la mer.$q$, $q$Mouslim 597$q$, null, $q$ok$q$, true, 220)
on conflict (cle) do nothing;
insert into public.dhikr_gestes (cle, serie, genre, titre, consigne, arabe, phonetique, sens, compteur, merite, source, lien, statut, visible, position)
values ($q$apres_tasbih$q$, $q$apres_priere$q$, $q$geste$q$, $q$Le tasbih d'après la prière$q$, $q$Les étapes s'enchaînent toutes seules.$q$, null, null, null, $q$[{"titre":"Soubhâna-llâh","arabe":"سُبْحَانَ اللَّهِ","phonetique":"Soubhâna-llâh","sens":"Gloire à Allah","nombre":33},{"titre":"Al-hamdou lillâh","arabe":"الْحَمْدُ لِلَّهِ","phonetique":"Al-hamdou lillâh","sens":"Louange à Allah","nombre":33},{"titre":"Allâhou akbar","arabe":"اللَّهُ أَكْبَرُ","phonetique":"Allâhou akbar","sens":"Allah est le plus Grand","nombre":33},{"titre":"Lâ ilâha illa-llâh wahdahou…","arabe":"لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ","phonetique":"Lâ ilâha illa-llâhou wahdahou lâ charîka lah, lahou-l-moulkou wa lahou-l-hamd, wa houwa 'alâ koulli chay'in qadîr","sens":"Il n'y a de divinité qu'Allah, Seul, sans associé. À Lui la royauté, à Lui la louange, et Il est capable de toute chose.","nombre":1}]$q$::jsonb, $q$Ses péchés sont pardonnés, même s'ils étaient aussi nombreux que l'écume de la mer.$q$, $q$Mouslim 597$q$, null, $q$ok$q$, true, 230)
on conflict (cle) do nothing;

-- ❓ Quiz du mérite (seulement si le quiz est encore vide)
insert into public.dhikr_quiz (question, choix, bonne, explication, source, visible, position)
select v.* from (values
  ($q$Quel dhikr est « un trésor parmi les trésors du Paradis » ?$q$, array[$q$Lâ hawla wa lâ qouwwata illâ billâh$q$, $q$Astaghfirou-llâh$q$, $q$Allâhou akbar$q$]::text[], 0, $q$Le Prophète ﷺ l'a appelé « un trésor parmi les trésors du Paradis ».$q$, $q$Boukhari 6384 ; Mouslim 2704$q$, true, 10),
  ($q$Quelles sont « les deux paroles légères sur la langue, lourdes dans la balance » ?$q$, array[$q$Bismi-llâh et Al-hamdou lillâh$q$, $q$Soubhâna-llâhi wa bihamdihi, Soubhâna-llâhi-l-'adhîm$q$, $q$Allâhou akbar et Lâ ilâha illa-llâh$q$]::text[], 1, $q$Elles sont aussi aimées du Tout Miséricordieux.$q$, $q$Boukhari 6406 ; Mouslim 2694$q$, true, 20),
  ($q$Combien de fois par jour le Prophète ﷺ se repentait-il à Allah ?$q$, array[$q$10 fois$q$, $q$33 fois$q$, $q$100 fois$q$]::text[], 2, $q$« Repentez-vous à Allah, car moi je me repens à Lui cent fois par jour. »$q$, $q$Mouslim 2702$q$, true, 30),
  ($q$Après la prière, que dit-on pour parfaire la centaine, après 33 + 33 + 33 ?$q$, array[$q$Lâ ilâha illa-llâh wahdahou lâ charîka lah…$q$, $q$Astaghfirou-llâh$q$, $q$Bismi-llâh$q$]::text[], 0, $q$Ses péchés sont alors pardonnés, même s'ils étaient comme l'écume de la mer.$q$, $q$Mouslim 597$q$, true, 40),
  ($q$Avant de dormir, combien de fois dit-on « Allâhou akbar » dans le tasbih appris à 'Alî et Fâtima ?$q$, array[$q$33 fois$q$, $q$34 fois$q$, $q$10 fois$q$]::text[], 1, $q$33 Soubhâna-llâh, 33 Al-hamdou lillâh et 34 Allâhou akbar : « c'est mieux pour vous qu'un serviteur ».$q$, $q$Boukhari 3113 ; Mouslim 2727$q$, true, 50),
  ($q$Quel verset, lu en se couchant, protège du Diable jusqu'au matin ?$q$, array[$q$La sourate Al-Fâtiha$q$, $q$Ayat al-Kursi$q$, $q$Le dernier verset d'An-Nâs$q$]::text[], 1, $q$Un gardien envoyé par Allah reste avec lui jusqu'au matin.$q$, $q$Boukhari 2311$q$, true, 60),
  ($q$Celui qui dit 100 fois « Soubhâna-llâhi wa bihamdihi » dans la journée…$q$, array[$q$…gagne une maison au Paradis$q$, $q$…a ses péchés effacés, même comme l'écume de la mer$q$, $q$…n'a plus besoin de prier$q$]::text[], 1, $q$Ses péchés sont effacés, même s'ils sont aussi nombreux que l'écume de la mer.$q$, $q$Boukhari 6405 ; Mouslim 2691$q$, true, 70),
  ($q$Comment appelle-t-on « Allâhoumma anta rabbî, lâ ilâha illâ ant… » ?$q$, array[$q$Sayyid al-istighfâr$q$, $q$Ayat al-Kursi$q$, $q$Le tasbih$q$]::text[], 0, $q$Le maître de la demande de pardon : dit avec conviction, le jour ou la nuit, il mène au Paradis.$q$, $q$Boukhari 6306$q$, true, 80),
  ($q$Que se passe-t-il quand on mentionne Allah en se réveillant ?$q$, array[$q$Un des 3 nœuds du Diable se défait$q$, $q$On gagne 10 points$q$, $q$Rien de spécial$q$]::text[], 0, $q$Puis les ablutions défont le 2e nœud, et la prière les défait tous.$q$, $q$Boukhari 1142 ; Mouslim 776$q$, true, 90),
  ($q$Quelles sont les quatre paroles les plus aimées d'Allah ?$q$, array[$q$Bismi-llâh, Âmîn, In châ' Allah, Mâ châ' Allah$q$, $q$Soubhâna-llâh, Al-hamdou lillâh, Lâ ilâha illa-llâh, Allâhou akbar$q$, $q$Astaghfirou-llâh, Bismi-llâh, Al-hamdou lillâh, Âmîn$q$]::text[], 1, $q$Peu importe par laquelle tu commences.$q$, $q$Mouslim 2137$q$, true, 100),
  ($q$« Lâ ilâha illa-llâh wahdahou lâ charîka lah… » dit 100 fois dans la journée, c'est comme…$q$, array[$q$…affranchir 10 esclaves$q$, $q$…jeûner un mois$q$, $q$…lire tout le Coran$q$]::text[], 0, $q$En plus, 100 bonnes actions écrites, 100 péchés effacés, et une protection contre le Diable jusqu'au soir.$q$, $q$Boukhari 3293 ; Mouslim 2691$q$, true, 110),
  ($q$Que disait le Prophète ﷺ en se couchant ?$q$, array[$q$Bismika-llâhoumma amoûtou wa ahyâ$q$, $q$Allâhou akbar$q$, $q$As-salâmou 'alaykoum$q$]::text[], 0, $q$« C'est en Ton nom, ô Allah, que je meurs et que je vis. »$q$, $q$Boukhari 6324$q$, true, 120)
) as v(question, choix, bonne, explication, source, visible, position)
where not exists (select 1 from public.dhikr_quiz);
