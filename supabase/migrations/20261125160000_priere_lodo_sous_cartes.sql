-- 🕌 Prière (Nadia, 2026-11-25) : sous-cartes + carte « LODO » (canal Telegram de Nadia) + carte « Faire la prière »
-- dans les 3 niveaux (Petits, Jeunes, Adultes). Additif : aucune donnée existante touchée (la table était vide).

ALTER TABLE public.prayer_cards ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.prayer_cards(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS prayer_cards_parent_id_idx ON public.prayer_cards(parent_id);

DO $$
DECLARE
  g text;
  lodo uuid;
  sc uuid;
  cat_lodo constant uuid := 'e48966aa-3302-4e0e-a3dc-b9cac06a01f3'; -- Petites ablutions
  cat_priere constant uuid := '431996fd-f316-4f21-85bf-78e75951b2d7'; -- Prière Sobh
  s record;
BEGIN
  FOREACH g IN ARRAY ARRAY['petits', 'jeunes', 'adultes'] LOOP
    IF EXISTS (SELECT 1 FROM public.prayer_cards WHERE group_key = g AND title = 'LODO' AND parent_id IS NULL) THEN CONTINUE; END IF;

    INSERT INTO public.prayer_cards (category_id, group_key, title, title_french, title_arabic, display_order, image_url)
    VALUES (cat_lodo, g, 'LODO', 'LODO', 'الوضوء', 10, '/images/priere/lodo/carte-lodo.jpg') RETURNING id INTO lodo;

    INSERT INTO public.prayer_cards (category_id, group_key, title, title_french, title_arabic, display_order, image_url)
    VALUES (cat_priere, g, 'Faire la prière', 'Faire la prière', 'الصلاة', 20, '/images/priere/carte-faire-la-priere.jpg');

    FOR s IN
      SELECT * FROM (VALUES
        (10,  'Introduction',                              'introduction',          NULL::text,                   NULL::text),
        (20,  'Affaires à avoir',                          'affaires-fiche',        'affaires-fiche',             NULL),
        (30,  '1 - AVOIR L''INTENTION',                    'chiffre-1',             'fiche-01-intention',         '01-intention'),
        (40,  '2 - DIRE BISMILLAH',                        'chiffre-2',             'fiche-02-bismillah',         NULL),
        (50,  '3 - LAVER LES MAINS',                       'chiffre-3',             'fiche-03-mains',             '03-mains'),
        (60,  '4 - LAVER LA BOUCHE',                       'chiffre-4',             'fiche-04-bouche',            '04-bouche'),
        (70,  '5 - LAVER LE NEZ',                          'chiffre-5',             'fiche-05-nez',               '05-nez'),
        (80,  '6 - LAVER LE VISAGE',                       'chiffre-6',             'fiche-06-visage',            '06-visage'),
        (90,  '7 - LAVER LES AVANT-BRAS DROIT ET GAUCHE',  'chiffre-7',             'fiche-07-avant-bras',        '07-avant-bras'),
        (100, '8 - LAVER LES CHEVEUX ET LES OREILLES',     'chiffre-8',             'fiche-08-cheveux-oreilles',  '08-cheveux-oreilles'),
        (110, '9 - LAVER LES PIEDS',                       'chiffre-9',             'fiche-09-pieds',             '09-pieds'),
        (120, '10 - OUBLIER UNE PARTIE À LAVER',           'fiche-10-oubli',        'fiche-10-oubli',             '10-oubli'),
        (130, '11 - INVOCATION FIN LODO',                  'fiche-11-invocation-fin','fiche-11-invocation-fin',   '11-invocation-fin')
      ) AS t(ordre, titre, image, fiche, video)
    LOOP
      INSERT INTO public.prayer_cards (category_id, group_key, parent_id, title, title_french, title_arabic, display_order, image_url)
      VALUES (cat_lodo, g, lodo, s.titre, s.titre, '', s.ordre, '/images/priere/lodo/' || s.image || '.jpg') RETURNING id INTO sc;
      IF s.fiche IS NOT NULL THEN
        INSERT INTO public.zones_contenu (cible, kind, url, nom, position) VALUES ('priere:' || sc, 'image', '/images/priere/lodo/' || s.fiche || '.jpg', 'Fiche', 10);
      END IF;
      IF s.video IS NOT NULL THEN
        INSERT INTO public.zones_contenu (cible, kind, url, nom, position) VALUES ('priere:' || sc, 'video', '/videos/priere/lodo/' || s.video || '.mp4', 'Vidéo', 20);
      END IF;
    END LOOP;
  END LOOP;
END $$;
