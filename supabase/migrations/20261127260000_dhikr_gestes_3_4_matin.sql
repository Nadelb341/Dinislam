-- 📿 Dhikr, série du matin : gestes 3 et 4 de Nadia MONTRÉS aux élèves avec leur pastille (Nadia, 27/11 soir : « 2 : oui »).
-- Degrés vérifiés le 27/11 (hadith-api) : Abou Dâwoud 5082 → Al-Albânî hasan, Chou'ayb Al-Arna'ût hasan sahih ; At-Tirmidhî 3575 → hasan.
-- Abou Dâwoud 5088 → Al-Albânî sahih, Zubair 'Alî Zaï sahih ; At-Tirmidhî 3388 → hasan sahih (Al-Albânî, Ahmad Châkir), Zubair 'Alî Zaï : chaîne hasan.
-- À appliquer avec `supabase db query --linked -f` (JAMAIS `db push`). Relancer = sans effet.
update public.dhikr_gestes set visible = true, statut = 'ok', degre = 'hasan',
  degre_divergence = $q$At-Tirmidhî : hasan sahîh. Al-Albânî : hasan (bon). Chou'ayb Al-Arna'ût : hasan sahîh.$q$
where cle = 'matin_trois_qoul';
update public.dhikr_gestes set visible = true, statut = 'ok', degre = 'sahih',
  degre_divergence = $q$Al-Albânî : sahîh. At-Tirmidhî : hasan sahîh. Zubair 'Alî Zaï : sahîh (Abou Dâwoud), chaîne hasan (At-Tirmidhî).$q$
where cle = 'matin_bismillah_ladhi';
select cle, visible, statut, degre from public.dhikr_gestes where cle in ('matin_trois_qoul', 'matin_bismillah_ladhi') order by cle;
