-- 🔢 Ligne « يَزَّكَّى يَذَّكَّرُ » (bas de la page partagée par les leçons 13 p.3, 14 p.1 et 15 p.1) :
-- elle suit le titre de la leçon 15 (lu à droite en premier) → ligne 1 de la leçon 15, pâle dans les leçons 13 et 14.
update public.nourania_lesson_content set
  lignes = lignes || '[{"p":1,"t":83.1,"b":91.4,"s":"lecon"}]'::jsonb,
  lignes_auto = lignes_auto || '[{"p":1,"t":83.1,"b":91.4,"s":"lecon"}]'::jsonb
where id = 'aca92679-e97d-4da1-acfa-476e91fed35a' and not lignes @> '[{"p":1,"t":83.1}]'::jsonb;
update public.nourania_lesson_content set
  lignes = lignes || '[{"p":1,"t":83.1,"b":91.4,"s":"autre"}]'::jsonb,
  lignes_auto = lignes_auto || '[{"p":1,"t":83.1,"b":91.4,"s":"autre"}]'::jsonb
where id = '543b75b6-4b7a-479d-b1d9-64e8327a251e' and not lignes @> '[{"p":1,"t":83.1}]'::jsonb;
update public.nourania_lesson_content set
  lignes = lignes || '[{"p":3,"t":83.1,"b":91.4,"s":"autre"}]'::jsonb,
  lignes_auto = lignes_auto || '[{"p":3,"t":83.1,"b":91.4,"s":"autre"}]'::jsonb
where id = '0c6abbdf-0644-42fc-acfc-98b8223c1997' and not lignes @> '[{"p":3,"t":83.1}]'::jsonb;
