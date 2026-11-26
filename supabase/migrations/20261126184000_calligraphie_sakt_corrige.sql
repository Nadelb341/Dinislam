-- ✍️ 26/11 (choix 15 de Nadia) : le petit « س » = petite pause (sakt) sans reprendre son souffle, PAS un arrêt obligatoire.
-- Page corrigée dans les 2 PDF ; nouveaux noms de fichiers (la mémoire hors ligne des PDF garde l'ancienne adresse).
update coran_vocabulaire set pdf_url = replace(pdf_url, '06-signes-arret.pdf', '06-signes-arret-v2.pdf') where pdf_url like '%calligraphie/06-signes-arret.pdf';
update coran_vocabulaire set pdf_url = replace(pdf_url, 'calligraphie-du-coran.pdf', 'calligraphie-du-coran-v2.pdf') where pdf_url like '%calligraphie/calligraphie-du-coran.pdf';
select count(*) from coran_vocabulaire where pdf_url like '%-v2.pdf';
