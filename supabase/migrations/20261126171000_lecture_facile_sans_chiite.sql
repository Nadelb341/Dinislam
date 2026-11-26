-- 🕌 2026-11-26 (Nadia, règle n°1 « sunnite / malikite ») : « Lecture facile du Coran » est un manuel chiite.
-- On retire l'introduction (Ahl al-Bayt à la manière chiite, p. 10-13) et l'appendice (adhan « أشهد أن عليا ولي الله », p. 172-175),
-- et le « PDF entier » (il contenait ces pages). Fichiers retirés de public/ dans le même envoi.
delete from zones_contenu where cible in ('coran-vocab:4b705044-cf99-4719-b844-4e02b6a3fa48','coran-vocab:55900cb4-5408-4be3-835d-fa59cf79236b');
delete from coran_vocabulaire where id in ('4b705044-cf99-4719-b844-4e02b6a3fa48','55900cb4-5408-4be3-835d-fa59cf79236b');
update coran_vocabulaire set pdf_url = null, page_debut = null, page_fin = null where id = 'a9d5efae-8509-47ad-9864-78353e934e27';
select count(*) parties, (select pdf_url from coran_vocabulaire where id='a9d5efae-8509-47ad-9864-78353e934e27') pdf
from coran_vocabulaire where parent_id = 'a9d5efae-8509-47ad-9864-78353e934e27';
