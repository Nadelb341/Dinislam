-- 🧸 Vidéos PUBLIQUES de la chaîne YouTube officielle « Le monde des Houroufs » (UC4sdrDo0pEC5_hqJmmq7AVA),
-- toutes intégrables (oEmbed 200 vérifié le 2026-11-21). Nadia peut les ranger / retirer avec ✏️ (corbeille).
insert into public.alphabet_petits_videos (letter_id, url, type, nom, position)
select l.id, 'https://www.youtube.com/embed/' || v.vid, 'youtube', v.nom, v.pos
from (values
  ('ا', 'lRDQDtaFsfM', 'Lis avec Alif le Calife', 10),
  ('ا', 'CZ0UVQdwFdk', 'Le monde des Houroufs (présentation)', 20),
  ('ب', 'BEnR45mfYd8', 'Monsieur Ba', 10),
  ('ت', 'WlMlyyljpKQ', 'Monsieur Ta', 10),
  ('ث', 'EXHGS7xQLkA', 'Monsieur Tha', 10),
  ('ج', 'kTRFwSRE4NQ', 'Madame Djim', 10),
  ('ح', 'eA82JaJseiQ', 'Madame Ha', 10),
  ('خ', 'mTw3UvmHvqo', 'Madame Kha', 10),
  ('د', 'TCEzSslS05o', 'Del le crocodile', 10),
  ('س', '4MfW7fDdM4w', 'Sine le serpent', 10),
  ('ع', 'AvlcFAyGavg', '''Ayne le monstre', 10)
) as v(lettre, vid, nom, pos)
join public.alphabet_letters l on l.letter_arabic = v.lettre
where not exists (select 1 from public.alphabet_petits_videos p where p.url = 'https://www.youtube.com/embed/' || v.vid);
