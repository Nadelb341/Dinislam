-- 27/11 (Nadia) : Hadith du jour n° 130 « Dis la vérité même si elle est amère » (Ibn Hibbân, degré non vérifié)
-- remplacé par un hadith d'Al-Boukhârî ET de Mouslim sur la véracité. L'ancien texte est gardé dans la corbeille.
insert into public.trash_items (user_id, item_type, item_data, original_id, label)
select r.user_id, 'hadith_du_jour', to_jsonb(h), h.id::text,
  'Hadith du jour n° 130 — « Dis la vérité même si elle est amère » (Ibn Hibbân), remplacé le 27/11'
from public.hadiths_du_jour h
cross join lateral (select user_id from public.user_roles where role = 'admin' order by user_id limit 1) r
where h.position = 130 and h.texte = 'Dis la vérité même si elle est amère.'
  and not exists (select 1 from public.trash_items t where t.item_type = 'hadith_du_jour' and t.original_id = h.id::text);

update public.hadiths_du_jour set
  texte = 'La véracité mène à la bonté, et la bonté mène au Paradis.',
  texte_arabe = 'إِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ، وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ',
  source = 'Sahih Al-Boukhârî 6094 et Mouslim 2607',
  degre = 'sahih', degre_divergence = null, updated_at = now()
where position = 130 and texte = 'Dis la vérité même si elle est amère.';
