-- 🕌 LODO (Nadia, 2026-11-25) : vidéos « Introduction » et « 2 - Bismilah » ajoutées (débloquées dans Telegram),
-- titre « 2 - DIRE BISMILAH » (orthographe choisie par Nadia). Additif, sans doublon si relancé.
UPDATE public.prayer_cards SET title = '2 - DIRE BISMILAH', title_french = '2 - DIRE BISMILAH'
WHERE title = '2 - DIRE BISMILLAH' AND parent_id IS NOT NULL;

INSERT INTO public.zones_contenu (cible, kind, url, nom, position)
SELECT 'priere:' || c.id, 'video', v.url, 'Vidéo', 20
FROM public.prayer_cards c
JOIN (VALUES ('Introduction', '/videos/priere/lodo/00-introduction.mp4'),
             ('2 - DIRE BISMILAH', '/videos/priere/lodo/02-bismillah.mp4')) AS v(titre, url) ON v.titre = c.title
JOIN public.prayer_cards p ON p.id = c.parent_id AND p.title = 'LODO'
WHERE NOT EXISTS (SELECT 1 FROM public.zones_contenu z WHERE z.cible = 'priere:' || c.id AND z.kind = 'video');
